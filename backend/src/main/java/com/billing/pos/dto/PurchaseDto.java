package com.billing.pos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class PurchaseDto {
    private Long id;
    private String purchaseInvoiceNumber;
    private Long supplierId;
    private List<PurchaseItemDto> items;
    private BigDecimal grandTotal;
    private BigDecimal amountPaid;
    private String paymentStatus;
}
