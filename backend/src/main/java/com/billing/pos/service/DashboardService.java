package com.billing.pos.service;

import com.billing.pos.dto.DashboardStatsDto;
import com.billing.pos.repository.CustomerRepository;
import com.billing.pos.repository.InvoiceRepository;
import com.billing.pos.repository.ProductRepository;
import com.billing.pos.repository.SalesReturnRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {
    
    private final InvoiceRepository invoiceRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final SalesReturnRepository salesReturnRepository;

    public DashboardStatsDto getDashboardStats() {
        DashboardStatsDto stats = new DashboardStatsDto();

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime endOfToday = LocalDate.now().plusDays(1).atStartOfDay().minusNanos(1);

        BigDecimal totalSales = invoiceRepository.sumTotalSales();
        BigDecimal totalReturns = salesReturnRepository.sumTotalReturns();
        
        stats.setTotalSales(totalSales.subtract(totalReturns));
        stats.setTotalProfit(invoiceRepository.sumTotalProfit());
        stats.setTotalBills(invoiceRepository.countInvoices());
        stats.setPendingPayments(customerRepository.sumTotalDue());
        stats.setLowStockCount(productRepository.countLowStockProducts());

        // Trend calculation for the last 7 days
        List<DashboardStatsDto.DailySalesDto> trend = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");

        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.plusDays(1).atStartOfDay().minusNanos(1);
            
            BigDecimal daySales = invoiceRepository.sumGrandTotalBetween(start, end);
            BigDecimal dayReturns = salesReturnRepository.sumReturnsBetween(start, end);
            
            trend.add(new DashboardStatsDto.DailySalesDto(date.format(formatter), daySales.subtract(dayReturns)));
        }
        stats.setSalesTrend(trend);

        return stats;
    }
}
