package com.billing.pos.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Data
public class PurchaseReturnItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "purchase_return_id")
    private PurchaseReturn purchaseReturn;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    private Integer returnedQuantity;
    private BigDecimal refundRate; // The unit price refunded by supplier
}
