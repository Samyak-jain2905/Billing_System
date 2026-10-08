package com.billing.pos.repository;

import com.billing.pos.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    @Query(value = "SELECT COUNT(i) FROM Invoice i")
    long countInvoices();

    @Query("SELECT COALESCE(SUM(i.grandTotal), 0) FROM Invoice i WHERE i.invoiceDate >= :startOfDay AND i.invoiceDate <= :endOfDay")
    java.math.BigDecimal sumGrandTotalBetween(@org.springframework.data.repository.query.Param("startOfDay") java.time.LocalDateTime startOfDay, @org.springframework.data.repository.query.Param("endOfDay") java.time.LocalDateTime endOfDay);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.invoiceDate >= :startOfDay AND i.invoiceDate <= :endOfDay")
    long countInvoicesBetween(@org.springframework.data.repository.query.Param("startOfDay") java.time.LocalDateTime startOfDay, @org.springframework.data.repository.query.Param("endOfDay") java.time.LocalDateTime endOfDay);

    @Query("SELECT COALESCE(SUM((item.rate - item.purchasePrice) * item.quantity), 0) FROM Invoice i JOIN i.items item WHERE i.invoiceDate >= :startOfDay AND i.invoiceDate <= :endOfDay")
    java.math.BigDecimal sumProfitBetween(@org.springframework.data.repository.query.Param("startOfDay") java.time.LocalDateTime startOfDay, @org.springframework.data.repository.query.Param("endOfDay") java.time.LocalDateTime endOfDay);
    
    @Query("SELECT COALESCE(SUM(i.grandTotal), 0) FROM Invoice i")
    java.math.BigDecimal sumTotalSales();

    @Query("SELECT COALESCE(SUM((item.rate - item.purchasePrice) * item.quantity), 0) FROM Invoice i JOIN i.items item")
    java.math.BigDecimal sumTotalProfit();

    java.util.List<Invoice> findByCustomerIdOrderByInvoiceDateDesc(Long customerId);
}
