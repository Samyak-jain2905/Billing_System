package com.billing.pos.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
public class PurchaseReturn {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "purchase_id")
    private Purchase purchase;

    private String returnNumber;
    private LocalDateTime returnDate;

    @OneToMany(mappedBy = "purchaseReturn", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PurchaseReturnItem> items = new ArrayList<>();

    private BigDecimal totalRefundAmount;
    private String refundMethod; // CASH, UDHAAR_ADJUSTMENT

    @PrePersist
    protected void onCreate() {
        returnDate = LocalDateTime.now();
        if (returnNumber == null) {
            returnNumber = "PR-" + System.currentTimeMillis();
        }
    }
}
