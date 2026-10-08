package com.billing.pos.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class InventoryReportDto {
    private long totalProducts;
    private long outOfStock;
    private long lowStock;
    private BigDecimal stockValuation = BigDecimal.ZERO;
}
