package com.billing.pos.service;

import com.billing.pos.dto.InvoiceDto;
import com.billing.pos.dto.InvoiceItemDto;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceService {
    private final InvoiceRepository invoiceRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final ShopSettingsRepository shopSettingsRepository;

    @Transactional
    public InvoiceDto createInvoice(InvoiceDto dto) {
        Invoice invoice = new Invoice();
        invoice.setPaymentMethod(dto.getPaymentMethod());
        invoice.setAmountPaid(dto.getAmountPaid() != null ? dto.getAmountPaid() : BigDecimal.ZERO);
        invoice.setInvoiceDate(LocalDateTime.now());
        
        // Handle Customer (Optional for POS)
        if (dto.getCustomerMobile() != null && !dto.getCustomerMobile().isEmpty()) {
            Customer customer = customerRepository.findByMobile(dto.getCustomerMobile())
                .orElseGet(() -> {
                    Customer newCustomer = new Customer();
                    newCustomer.setMobile(dto.getCustomerMobile());
                    newCustomer.setName(dto.getCustomerName() != null ? dto.getCustomerName() : "Walk-in Customer");
                    newCustomer.setTotalPurchases(BigDecimal.ZERO);
                    newCustomer.setTotalDue(BigDecimal.ZERO);
                    return customerRepository.save(newCustomer);
                });
            invoice.setCustomer(customer);
        }

        // Generate Invoice Number
        ShopSettings settings = shopSettingsRepository.findById(1L).orElse(new ShopSettings());
        String prefix = settings.getInvoicePrefix() != null ? settings.getInvoicePrefix() : "INV";
        
        String invNumber = prefix + "-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMM")) + "-" + System.currentTimeMillis();
        invoice.setInvoiceNumber(invNumber);

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalGst = BigDecimal.ZERO;
        List<InvoiceItem> items = new ArrayList<>();

        // Process Items
        for (InvoiceItemDto itemDto : dto.getItems()) {
            if (itemDto.getQuantity() <= 0) {
                throw new RuntimeException("Quantity must be greater than 0");
            }

            Product product = productRepository.findById(itemDto.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found: " + itemDto.getProductId()));
            
            InvoiceItem item = new InvoiceItem();
            item.setInvoice(invoice);
            item.setProduct(product);
            item.setQuantity(itemDto.getQuantity());
            item.setRate(product.getSellingPrice());
            item.setPurchasePrice(product.getPurchasePrice() != null ? product.getPurchasePrice() : BigDecimal.ZERO);
            item.setDiscount(BigDecimal.ZERO); // Extend to support item discounts later
            
            BigDecimal effectiveGst = dto.getBillGstRate() != null ? dto.getBillGstRate() : (product.getGstRate() != null ? product.getGstRate() : BigDecimal.ZERO);
            item.setGstRate(effectiveGst);
            item.setReturnedQuantity(0);

            BigDecimal itemTotalAmount = item.getRate().multiply(BigDecimal.valueOf(item.getQuantity()));
            BigDecimal itemGst = itemTotalAmount.multiply(item.getGstRate()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            
            item.setGstAmount(itemGst);
            item.setTotalAmount(itemTotalAmount.add(itemGst));

            subtotal = subtotal.add(itemTotalAmount);
            totalGst = totalGst.add(itemGst);
            items.add(item);

            // Update Inventory
            int newStock = product.getCurrentStock() - item.getQuantity();
            if (newStock < 0) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName());
            }
            product.setCurrentStock(newStock);
            productRepository.save(product);

            // Record Inventory Transaction
            InventoryTransaction tx = new InventoryTransaction();
            tx.setProduct(product);
            tx.setTransactionType("SALE");
            tx.setQuantityChange(-item.getQuantity());
            tx.setStockAfterTransaction(newStock);
            tx.setReferenceType("INVOICE");
            // Reference ID set after invoice save
            inventoryTransactionRepository.save(tx);
        }

        invoice.setItems(items);
        invoice.setSubtotal(subtotal);
        invoice.setTotalDiscount(BigDecimal.ZERO);
        invoice.setTotalGst(totalGst);
        
        BigDecimal grandTotal = subtotal.add(totalGst);
        invoice.setGrandTotal(grandTotal);

        // Payment status logic
        if (invoice.getAmountPaid().compareTo(grandTotal) >= 0) {
            invoice.setPaymentStatus("PAID");
        } else if (invoice.getAmountPaid().compareTo(BigDecimal.ZERO) > 0) {
            invoice.setPaymentStatus("PARTIAL");
        } else {
            invoice.setPaymentStatus("DUE");
        }

        Invoice savedInvoice = invoiceRepository.save(invoice);
        
        // Update Customer Totals
        if (savedInvoice.getCustomer() != null) {
            Customer c = savedInvoice.getCustomer();
            c.setTotalPurchases(c.getTotalPurchases().add(grandTotal));
            c.setTotalDue(c.getTotalDue().add(grandTotal.subtract(invoice.getAmountPaid())));
            customerRepository.save(c);
        }

        // Map back to DTO
        InvoiceDto response = new InvoiceDto();
        response.setId(savedInvoice.getId());
        response.setInvoiceNumber(savedInvoice.getInvoiceNumber());
        response.setGrandTotal(savedInvoice.getGrandTotal());
        response.setSubtotal(savedInvoice.getSubtotal());
        response.setTotalGst(savedInvoice.getTotalGst());
        response.setPaymentStatus(savedInvoice.getPaymentStatus());
        if (savedInvoice.getCustomer() != null) {
            response.setCustomerMobile(savedInvoice.getCustomer().getMobile());
            response.setCustomerName(savedInvoice.getCustomer().getName());
        }

        return response;
    }
    
    public Invoice getInvoiceEntity(Long id) {
        return invoiceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Invoice not found"));
    }

    public Invoice getInvoiceEntityByNumber(String invoiceNumber) {
        return invoiceRepository.findByInvoiceNumber(invoiceNumber)
            .orElseThrow(() -> new RuntimeException("Invoice not found"));
    }

    public List<InvoiceDto> getInvoicesByCustomer(Long customerId) {
        return invoiceRepository.findByCustomerIdOrderByInvoiceDateDesc(customerId)
            .stream()
            .map(inv -> {
                InvoiceDto dto = new InvoiceDto();
                dto.setId(inv.getId());
                dto.setInvoiceNumber(inv.getInvoiceNumber());
                dto.setGrandTotal(inv.getGrandTotal());
                dto.setPaymentMethod(inv.getPaymentMethod());
                dto.setPaymentStatus(inv.getPaymentStatus());
                if (inv.getInvoiceDate() != null) {
                    dto.setInvoiceDate(inv.getInvoiceDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy")));
                }
                return dto;
            })
            .collect(Collectors.toList());
    }

    public void markInvoiceAsPaid(Long id) {
        Invoice invoice = getInvoiceEntity(id);
        if ("UDHAAR".equals(invoice.getPaymentMethod()) && "DUE".equals(invoice.getPaymentStatus())) {
            invoice.setPaymentStatus("PAID");
            invoice.setPaymentDate(java.time.LocalDateTime.now());
            invoice.setAmountPaid(invoice.getGrandTotal());
            
            if (invoice.getCustomer() != null) {
                com.billing.pos.model.Customer c = invoice.getCustomer();
                java.math.BigDecimal pending = c.getTotalDue();
                if (pending != null) {
                    c.setTotalDue(pending.subtract(invoice.getGrandTotal()));
                    customerRepository.save(c);
                }
            }
            
            invoiceRepository.save(invoice);
        }
    }
}
