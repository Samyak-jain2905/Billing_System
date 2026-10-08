package com.billing.pos.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ReorderSuggestionDto {
    private Long productId;
    private String productName;
    private Integer currentStock;
    private Integer soldLast30Days;
    private Integer suggestedOrderQuantity;
    private String status; // CRITICAL, WARNING, GOOD
}
