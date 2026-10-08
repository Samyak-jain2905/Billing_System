package com.billing.pos.service;

import com.billing.pos.dto.PurchaseReturnDto;
import com.billing.pos.dto.PurchaseReturnItemDto;
import com.billing.pos.model.*;
import com.billing.pos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PurchaseReturnService {

    private final PurchaseRepository purchaseRepository;
    private final PurchaseItemRepository purchaseItemRepository;
    private final PurchaseReturnRepository purchaseReturnRepository;
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;

    @Transactional
    public PurchaseReturn processReturn(PurchaseReturnDto dto) {
        Purchase purchase = purchaseRepository.findByPurchaseInvoiceNumber(dto.getPurchaseInvoiceNumber())
            .orElseThrow(() -> new RuntimeException("Purchase Invoice not found"));

        PurchaseReturn pr = new PurchaseReturn();
        pr.setPurchase(purchase);
        pr.setRefundMethod(dto.getRefundMethod());
        
        pr.setReturnNumber("PR-" + System.currentTimeMillis());

        BigDecimal totalRefund = BigDecimal.ZERO;

        for (PurchaseReturnItemDto itemDto : dto.getReturnItems()) {
            if (itemDto.getReturnedQuantity() <= 0) {
                throw new RuntimeException("Return quantity must be greater than 0");
            }

            PurchaseItem pItem = purchaseItemRepository.findById(itemDto.getPurchaseItemId())
                .orElseThrow(() -> new RuntimeException("Purchase Item not found"));

            int availableToReturn = pItem.getQuantity() - pItem.getReturnedQuantity();
            if (itemDto.getReturnedQuantity() > availableToReturn) {
                throw new RuntimeException("Cannot return more than purchased. Available to return: " + availableToReturn);
            }

            // Update State
            pItem.setReturnedQuantity(pItem.getReturnedQuantity() + itemDto.getReturnedQuantity());

            Product product = pItem.getProduct();
            
            // Decrease Stock
            int newStock = product.getCurrentStock() - itemDto.getReturnedQuantity();
            product.setCurrentStock(Math.max(newStock, 0));
            productRepository.save(product);

            // Record Tx
            InventoryTransaction tx = new InventoryTransaction();
            tx.setProduct(product);
            tx.setTransactionType("PURCHASE_RETURN");
            tx.setQuantityChange(-itemDto.getReturnedQuantity());
            tx.setStockAfterTransaction(product.getCurrentStock());
            tx.setReferenceType("PURCHASE_RETURN");
            inventoryTransactionRepository.save(tx);

            // Build Return Item
            PurchaseReturnItem returnItem = new PurchaseReturnItem();
            returnItem.setPurchaseReturn(pr);
            returnItem.setProduct(product);
            returnItem.setReturnedQuantity(itemDto.getReturnedQuantity());
            returnItem.setRefundRate(pItem.getPurchasePrice());
            
            pr.getItems().add(returnItem);
            
            BigDecimal refundAmt = pItem.getPurchasePrice().multiply(BigDecimal.valueOf(itemDto.getReturnedQuantity()));
            totalRefund = totalRefund.add(refundAmt);
        }

        pr.setTotalRefundAmount(totalRefund);

        if ("UDHAAR_ADJUSTMENT".equals(dto.getRefundMethod()) && purchase.getSupplier() != null) {
            Supplier s = purchase.getSupplier();
            if (s.getAmountPayable() != null) {
                // If we return items, we owe the supplier less money.
                BigDecimal newPayable = s.getAmountPayable().subtract(totalRefund);
                s.setAmountPayable(newPayable.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : newPayable);
                supplierRepository.save(s);
            }
        }

        return purchaseReturnRepository.save(pr);
    }
}
