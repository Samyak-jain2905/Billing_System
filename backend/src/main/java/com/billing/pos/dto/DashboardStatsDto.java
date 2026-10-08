package com.billing.pos.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class DashboardStatsDto {
    private BigDecimal totalSales;
    private BigDecimal totalProfit;
    private long totalBills;
    private BigDecimal pendingPayments;
    private long lowStockCount;
    
    // For the chart: last 7 days revenue
    private List<DailySalesDto> salesTrend;
    
    @Data
    public static class DailySalesDto {
        private String date;
        private BigDecimal totalSales;
        
        public DailySalesDto(String date, BigDecimal totalSales) {
            this.date = date;
            this.totalSales = totalSales;
        }
    }
}
