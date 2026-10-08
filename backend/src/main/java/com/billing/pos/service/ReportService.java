package com.billing.pos.service;

import com.billing.pos.dto.FinancialReportDto;
import com.billing.pos.dto.InventoryReportDto;
import com.billing.pos.model.Invoice;
import com.billing.pos.model.Product;
import com.billing.pos.model.SalesReturn;
import com.billing.pos.repository.InvoiceRepository;
import com.billing.pos.repository.ProductRepository;
import com.billing.pos.repository.SalesReturnRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final InvoiceRepository invoiceRepository;
    private final ProductRepository productRepository;
    private final SalesReturnRepository salesReturnRepository;

    public FinancialReportDto getFinancialReport() {
        FinancialReportDto dto = new FinancialReportDto();
        
        List<Invoice> invoices = invoiceRepository.findAll();
        List<SalesReturn> returns = salesReturnRepository.findAll();

        BigDecimal grossSales = BigDecimal.ZERO;
        BigDecimal totalGst = BigDecimal.ZERO;
        BigDecimal totalDiscounts = BigDecimal.ZERO;
        BigDecimal totalUdhaar = BigDecimal.ZERO;
        BigDecimal grossProfit = BigDecimal.ZERO;

        for (Invoice inv : invoices) {
            grossSales = grossSales.add(inv.getGrandTotal());
            if (inv.getTotalGst() != null) totalGst = totalGst.add(inv.getTotalGst());
            if (inv.getTotalDiscount() != null) totalDiscounts = totalDiscounts.add(inv.getTotalDiscount());
            if ("UDHAAR".equals(inv.getPaymentMethod()) && "DUE".equals(inv.getPaymentStatus())) {
                totalUdhaar = totalUdhaar.add(inv.getGrandTotal());
            }

            // Calculate profit
            BigDecimal invProfit = inv.getItems().stream()
                .map(item -> {
                    BigDecimal rate = item.getRate() != null ? item.getRate() : BigDecimal.ZERO;
                    BigDecimal purchasePrice = item.getPurchasePrice() != null ? item.getPurchasePrice() : BigDecimal.ZERO;
                    return (rate.subtract(purchasePrice)).multiply(BigDecimal.valueOf(item.getQuantity()));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            grossProfit = grossProfit.add(invProfit);
        }

        BigDecimal totalReturns = BigDecimal.ZERO;
        for (SalesReturn r : returns) {
            if (r.getTotalRefundAmount() != null) {
                totalReturns = totalReturns.add(r.getTotalRefundAmount());
            }
        }

        BigDecimal netSales = grossSales.subtract(totalReturns);

        dto.setGrossSales(grossSales);
        dto.setTotalGst(totalGst);
        dto.setTotalDiscounts(totalDiscounts);
        dto.setTotalUdhaar(totalUdhaar);
        dto.setGrossProfit(grossProfit);
        dto.setTotalReturns(totalReturns);
        dto.setNetSales(netSales);

        return dto;
    }

    public InventoryReportDto getInventoryReport() {
        // ... existing code ...
        InventoryReportDto dto = new InventoryReportDto();
        List<Product> products = productRepository.findAll();

        long outOfStock = 0;
        long lowStock = 0;
        BigDecimal valuation = BigDecimal.ZERO;

        for (Product p : products) {
            if (p.getCurrentStock() <= 0) {
                outOfStock++;
            } else if (p.getMinimumStock() != null && p.getCurrentStock() <= p.getMinimumStock()) {
                lowStock++;
            } else if (p.getMinimumStock() == null && p.getCurrentStock() <= 10) {
                lowStock++;
            }

            if (p.getCurrentStock() > 0 && p.getPurchasePrice() != null) {
                valuation = valuation.add(p.getPurchasePrice().multiply(BigDecimal.valueOf(p.getCurrentStock())));
            }
        }

        dto.setTotalProducts(products.size());
        dto.setOutOfStock(outOfStock);
        dto.setLowStock(lowStock);
        dto.setStockValuation(valuation);

        return dto;
    }

    public List<com.billing.pos.dto.ReorderSuggestionDto> getReorderSuggestions() {
        java.time.LocalDateTime thirtyDaysAgo = java.time.LocalDateTime.now().minusDays(30);
        List<Invoice> recentInvoices = invoiceRepository.findAll().stream()
            .filter(i -> i.getInvoiceDate() != null && i.getInvoiceDate().isAfter(thirtyDaysAgo))
            .collect(java.util.stream.Collectors.toList());

        java.util.Map<Long, Integer> salesVolume = new java.util.HashMap<>();
        for (Invoice inv : recentInvoices) {
            for (com.billing.pos.model.InvoiceItem item : inv.getItems()) {
                salesVolume.put(item.getProduct().getId(), 
                    salesVolume.getOrDefault(item.getProduct().getId(), 0) + item.getQuantity());
            }
        }

        List<com.billing.pos.dto.ReorderSuggestionDto> suggestions = new java.util.ArrayList<>();
        List<Product> products = productRepository.findAll();

        for (Product p : products) {
            int sold = salesVolume.getOrDefault(p.getId(), 0);
            
            // Basic logic: If we sell X in 30 days, we want to keep at least X in stock.
            // If currentStock < sold, we need to order (sold - currentStock) + buffer.
            if (sold > 0 || p.getCurrentStock() <= (p.getMinimumStock() != null ? p.getMinimumStock() : 10)) {
                int targetStock = Math.max(sold, p.getMinimumStock() != null ? p.getMinimumStock() * 2 : 20);
                
                if (p.getCurrentStock() < targetStock) {
                    com.billing.pos.dto.ReorderSuggestionDto dto = new com.billing.pos.dto.ReorderSuggestionDto();
                    dto.setProductId(p.getId());
                    dto.setProductName(p.getName());
                    dto.setCurrentStock(p.getCurrentStock());
                    dto.setSoldLast30Days(sold);
                    dto.setSuggestedOrderQuantity(targetStock - p.getCurrentStock());
                    
                    if (p.getCurrentStock() <= 0) dto.setStatus("OUT_OF_STOCK");
                    else if (p.getCurrentStock() <= (p.getMinimumStock() != null ? p.getMinimumStock() : 10)) dto.setStatus("CRITICAL");
                    else dto.setStatus("WARNING");
                    
                    suggestions.add(dto);
                }
            }
        }

        suggestions.sort((a, b) -> b.getSoldLast30Days() - a.getSoldLast30Days()); // Highest velocity first
        return suggestions;
    }
}
