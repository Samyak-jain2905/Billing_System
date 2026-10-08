package com.billing.pos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class PurchaseReturnDto {
    private String purchaseInvoiceNumber;
    private String refundMethod; // CASH, UDHAAR_ADJUSTMENT
    private List<PurchaseReturnItemDto> returnItems;
}
