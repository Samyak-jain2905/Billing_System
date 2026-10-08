package com.billing.pos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class InvoiceDto {
    private Long id;
    private String invoiceNumber;
    private String customerName;
    private String customerMobile;
    
    private List<InvoiceItemDto> items;
    
    private String paymentMethod;
    private BigDecimal amountPaid;
    private BigDecimal billGstRate; // Optional flat GST rate for the whole bill
    
    // Read-only values (calculated by backend)
    private BigDecimal subtotal;
    private BigDecimal totalDiscount;
    private BigDecimal totalGst;
    private BigDecimal grandTotal;
    private String paymentStatus;
    private String invoiceDate; // Formatted date string
}
