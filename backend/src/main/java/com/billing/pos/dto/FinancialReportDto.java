package com.billing.pos.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class FinancialReportDto {
    private BigDecimal grossSales = BigDecimal.ZERO;
    private BigDecimal totalDiscounts = BigDecimal.ZERO;
    private BigDecimal totalGst = BigDecimal.ZERO;
    private BigDecimal totalReturns = BigDecimal.ZERO;
    private BigDecimal netSales = BigDecimal.ZERO;
    private BigDecimal totalUdhaar = BigDecimal.ZERO;
    private BigDecimal grossProfit = BigDecimal.ZERO;
}
