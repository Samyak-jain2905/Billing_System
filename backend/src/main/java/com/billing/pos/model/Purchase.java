package com.billing.pos.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "purchases")
public class Purchase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String purchaseInvoiceNumber;

    private LocalDateTime purchaseDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @OneToMany(mappedBy = "purchase", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseItem> items = new ArrayList<>();

    @Column(precision = 12, scale = 2)
    private BigDecimal grandTotal;

    @Column(precision = 12, scale = 2)
    private BigDecimal amountPaid;

    private String paymentStatus; // PAID, PARTIAL, DUE

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (purchaseDate == null) {
            purchaseDate = LocalDateTime.now();
        }
        createdAt = LocalDateTime.now();
    }
}
