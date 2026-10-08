package com.billing.pos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class SalesReturnDto {
    private Long invoiceId;
    private String refundMethod; // CASH, UDHAAR_ADJUSTMENT
    private List<SalesReturnItemDto> items;

    @Data
    public static class SalesReturnItemDto {
        private Long invoiceItemId;
        private Integer returnQuantity;
    }
}
