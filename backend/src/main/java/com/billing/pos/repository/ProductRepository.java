package com.billing.pos.repository;

import com.billing.pos.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findByBarcode(String barcode);

    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR p.barcode = :query")
    List<Product> searchProducts(@Param("query") String query);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.currentStock <= p.minimumStock")
    long countLowStockProducts();
}
