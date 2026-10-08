package com.billing.pos.service;

import com.billing.pos.dto.SalesReturnDto;
import com.billing.pos.model.*;
import com.billing.pos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SalesReturnService {

    private final SalesReturnRepository salesReturnRepository;
    private final InvoiceRepository invoiceRepository;
    private final ProductRepository productRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final CustomerRepository customerRepository;

    @Transactional
    public SalesReturn createSalesReturn(SalesReturnDto dto) {
        Invoice invoice = invoiceRepository.findById(dto.getInvoiceId())
            .orElseThrow(() -> new RuntimeException("Invoice not found"));

        SalesReturn salesReturn = new SalesReturn();
        salesReturn.setInvoice(invoice);
        salesReturn.setRefundMethod(dto.getRefundMethod());
        
        String retNumber = "RET-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM")) + "-" + System.currentTimeMillis();
        salesReturn.setReturnNumber(retNumber);
        
        List<SalesReturnItem> returnItems = new ArrayList<>();
        BigDecimal totalRefund = BigDecimal.ZERO;

        for (SalesReturnDto.SalesReturnItemDto itemDto : dto.getItems()) {
            if (itemDto.getReturnQuantity() <= 0) {
                throw new RuntimeException("Return quantity must be greater than 0");
            }

            // Find invoice item
            InvoiceItem invoiceItem = invoice.getItems().stream()
                .filter(i -> i.getId().equals(itemDto.getInvoiceItemId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Invoice Item not found"));

            int availableToReturn = invoiceItem.getQuantity() - invoiceItem.getReturnedQuantity();
            if (itemDto.getReturnQuantity() > availableToReturn) {
                throw new RuntimeException("Cannot return more than purchased. Available to return: " + availableToReturn);
            }

            // Update state
            invoiceItem.setReturnedQuantity(invoiceItem.getReturnedQuantity() + itemDto.getReturnQuantity());

            SalesReturnItem returnItem = new SalesReturnItem();
            returnItem.setSalesReturn(salesReturn);
            returnItem.setInvoiceItem(invoiceItem);
            returnItem.setReturnQuantity(itemDto.getReturnQuantity());

            // Calculate refund amount: rate * qty + gst
            BigDecimal rate = invoiceItem.getRate();
            BigDecimal taxable = rate.multiply(BigDecimal.valueOf(itemDto.getReturnQuantity()));
            BigDecimal gstAmount = taxable.multiply(invoiceItem.getGstRate()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal itemRefund = taxable.add(gstAmount);

            returnItem.setRefundAmount(itemRefund);
            totalRefund = totalRefund.add(itemRefund);
            returnItems.add(returnItem);

            // Add stock back
            Product product = invoiceItem.getProduct();
            int newStock = product.getCurrentStock() + itemDto.getReturnQuantity();
            product.setCurrentStock(newStock);
            productRepository.save(product);

            // Record inventory transaction
            InventoryTransaction tx = new InventoryTransaction();
            tx.setProduct(product);
            tx.setTransactionType("SALES_RETURN");
            tx.setQuantityChange(itemDto.getReturnQuantity());
            tx.setStockAfterTransaction(newStock);
            tx.setReferenceType("RETURN");
            inventoryTransactionRepository.save(tx);
        }

        salesReturn.setItems(returnItems);
        salesReturn.setTotalRefundAmount(totalRefund);

        // Adjust Udhaar if needed
        if ("UDHAAR_ADJUSTMENT".equals(dto.getRefundMethod()) && invoice.getCustomer() != null) {
            Customer c = invoice.getCustomer();
            c.setTotalDue(c.getTotalDue().subtract(totalRefund));
            // Ensure total due doesn't go below 0 inappropriately, or keep it as negative (credit)
            customerRepository.save(c);
        }

        return salesReturnRepository.save(salesReturn);
    }
}
