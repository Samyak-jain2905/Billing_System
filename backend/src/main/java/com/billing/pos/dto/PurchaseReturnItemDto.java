package com.billing.pos.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class PurchaseReturnItemDto {
    private Long purchaseItemId;
    private Integer returnedQuantity;
}
