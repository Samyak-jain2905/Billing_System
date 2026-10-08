package com.billing.pos.repository;

import com.billing.pos.model.SalesReturn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SalesReturnRepository extends JpaRepository<SalesReturn, Long> {
    @Query(value = "SELECT COUNT(s) FROM SalesReturn s")
    long countReturns();

    @Query("SELECT COALESCE(SUM(s.totalRefundAmount), 0) FROM SalesReturn s")
    java.math.BigDecimal sumTotalReturns();
    
    @Query("SELECT COALESCE(SUM(s.totalRefundAmount), 0) FROM SalesReturn s WHERE s.returnDate >= :startOfDay AND s.returnDate <= :endOfDay")
    java.math.BigDecimal sumReturnsBetween(@org.springframework.data.repository.query.Param("startOfDay") java.time.LocalDateTime startOfDay, @org.springframework.data.repository.query.Param("endOfDay") java.time.LocalDateTime endOfDay);
}
