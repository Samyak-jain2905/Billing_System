package com.billing.pos.service;

import com.billing.pos.dto.PurchaseDto;
import com.billing.pos.dto.PurchaseItemDto;
import com.billing.pos.model.*;
import com.billing.pos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;

    @Transactional
    public PurchaseDto createPurchase(PurchaseDto dto) {
        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
            .orElseThrow(() -> new RuntimeException("Supplier not found"));

        Purchase purchase = new Purchase();
        
        String invNumber = dto.getPurchaseInvoiceNumber();
        if (invNumber == null || invNumber.trim().isEmpty()) {
            invNumber = "PUR-" + System.currentTimeMillis();
        }
        purchase.setPurchaseInvoiceNumber(invNumber);
        
        purchase.setSupplier(supplier);
        purchase.setAmountPaid(dto.getAmountPaid() != null ? dto.getAmountPaid() : BigDecimal.ZERO);

        BigDecimal grandTotal = BigDecimal.ZERO;
        List<PurchaseItem> items = new ArrayList<>();

        for (PurchaseItemDto itemDto : dto.getItems()) {
            if (itemDto.getQuantity() <= 0) {
                throw new RuntimeException("Quantity must be greater than 0");
            }

            Product product = productRepository.findById(itemDto.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

            PurchaseItem item = new PurchaseItem();
            item.setPurchase(purchase);
            item.setProduct(product);
            item.setQuantity(itemDto.getQuantity());
            item.setPurchasePrice(itemDto.getPurchasePrice());
            item.setReturnedQuantity(0);
            
            BigDecimal totalAmt = item.getPurchasePrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            item.setTotalAmount(totalAmt);
            grandTotal = grandTotal.add(totalAmt);
            items.add(item);

            // Increase Inventory
            int newStock = product.getCurrentStock() + item.getQuantity();
            product.setCurrentStock(newStock);
            // Optionally update purchasePrice on the product
            product.setPurchasePrice(itemDto.getPurchasePrice());
            productRepository.save(product);

            // Record Inventory Transaction
            InventoryTransaction tx = new InventoryTransaction();
            tx.setProduct(product);
            tx.setTransactionType("PURCHASE");
            tx.setQuantityChange(item.getQuantity());
            tx.setStockAfterTransaction(newStock);
            tx.setReferenceType("PURCHASE");
            inventoryTransactionRepository.save(tx);
        }

        purchase.setItems(items);
        purchase.setGrandTotal(grandTotal);

        if (purchase.getAmountPaid().compareTo(grandTotal) >= 0) {
            purchase.setPaymentStatus("PAID");
        } else if (purchase.getAmountPaid().compareTo(BigDecimal.ZERO) > 0) {
            purchase.setPaymentStatus("PARTIAL");
        } else {
            purchase.setPaymentStatus("DUE");
        }

        // Update Supplier payable
        BigDecimal pending = grandTotal.subtract(purchase.getAmountPaid());
        if (pending.compareTo(BigDecimal.ZERO) > 0) {
            supplier.setAmountPayable(supplier.getAmountPayable().add(pending));
            supplierRepository.save(supplier);
        }

        Purchase saved = purchaseRepository.save(purchase);
        dto.setId(saved.getId());
        return dto;
    }

    public Optional<Purchase> findByPurchaseInvoiceNumber(String number) {
        return purchaseRepository.findByPurchaseInvoiceNumber(number);
    }
}
