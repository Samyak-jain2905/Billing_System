package com.billing.pos.dto;

import lombok.Data;

@Data
public class InvoiceItemDto {
    private Long id;
    private Long productId;
    private Integer quantity;
    private String productName; // Returned for convenience
    private java.math.BigDecimal rate;
}
