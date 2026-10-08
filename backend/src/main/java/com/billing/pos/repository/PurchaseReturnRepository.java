package com.billing.pos.repository;

import com.billing.pos.model.PurchaseReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PurchaseReturnRepository extends JpaRepository<PurchaseReturn, Long> {
}
