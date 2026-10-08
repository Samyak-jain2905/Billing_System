package com.billing.pos.repository;

import com.billing.pos.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByMobile(String mobile);

    @Query("SELECT c FROM Customer c WHERE c.mobile LIKE CONCAT('%', :query, '%') OR LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Customer> searchCustomers(@Param("query") String query);

    @Query("SELECT COALESCE(SUM(c.totalDue), 0) FROM Customer c")
    java.math.BigDecimal sumTotalDue();
}
