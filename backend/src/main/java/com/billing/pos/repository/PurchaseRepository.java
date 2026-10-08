package com.billing.pos.repository;

import com.billing.pos.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    Optional<Purchase> findByPurchaseInvoiceNumber(String purchaseInvoiceNumber);
}
