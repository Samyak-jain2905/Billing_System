package com.billing.pos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "invoice_items")
public class InvoiceItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    private Integer quantity;

    @Column(precision = 10, scale = 2)
    private BigDecimal rate; // Selling price at the time of sale

    @Column(precision = 10, scale = 2)
    private BigDecimal purchasePrice; // Purchase price at the time of sale (for profit calculation)

    @Column(precision = 10, scale = 2)
    private BigDecimal discount;

    @Column(precision = 5, scale = 2)
    private BigDecimal gstRate;

    @Column(precision = 10, scale = 2)
    private BigDecimal gstAmount;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private Integer returnedQuantity = 0;
}
