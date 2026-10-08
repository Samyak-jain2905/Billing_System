package com.billing.pos.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class PurchaseItemDto {
    private Long productId;
    private Integer quantity;
    private BigDecimal purchasePrice;
}
