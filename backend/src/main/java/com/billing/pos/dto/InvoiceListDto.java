package com.billing.pos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class InvoiceListDto {
    private Long id;
    private String invoiceNumber;
    private LocalDateTime invoiceDate;
    private String customerName;
    private BigDecimal grandTotal;
    private String paymentMethod;
    private String paymentStatus;
    private boolean hasReturn;
    private String paymentDate;
}
