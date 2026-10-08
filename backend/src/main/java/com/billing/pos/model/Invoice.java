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
@Table(name = "invoices")
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String invoiceNumber;

    private LocalDateTime invoiceDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InvoiceItem> items = new ArrayList<>();

    @Column(precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalDiscount;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalGst;

    @Column(precision = 12, scale = 2)
    private BigDecimal grandTotal;

    @Column(precision = 12, scale = 2)
    private BigDecimal amountPaid;

    private String paymentMethod; // CASH, UPI, CARD, MIXED, CREDIT
    private String paymentStatus; // PAID, PARTIAL, DUE

    private LocalDateTime paymentDate; // When the Udhaar was marked as paid

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cashier_id")
    private User cashier;

    @PrePersist
    protected void onCreate() {
        if (invoiceDate == null) {
            invoiceDate = LocalDateTime.now();
        }
    }
}
