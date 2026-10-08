package com.billing.pos.controller;

import com.billing.pos.dto.InvoiceListDto;
import com.billing.pos.model.Invoice;
import com.billing.pos.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

import com.billing.pos.dto.FinancialReportDto;
import com.billing.pos.dto.InventoryReportDto;
import com.billing.pos.service.ReportService;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReportController {

    private final InvoiceRepository invoiceRepository;
    private final ReportService reportService;

    @GetMapping("/sales")
    public ResponseEntity<List<InvoiceListDto>> getRecentSales() {
        List<InvoiceListDto> list = invoiceRepository.findAll().stream().map(inv -> {
            InvoiceListDto dto = new InvoiceListDto();
            dto.setId(inv.getId());
            dto.setInvoiceNumber(inv.getInvoiceNumber());
            dto.setInvoiceDate(inv.getInvoiceDate());
            dto.setCustomerName(inv.getCustomer() != null ? inv.getCustomer().getName() : "Walk-in");
            dto.setGrandTotal(inv.getGrandTotal());
            dto.setPaymentMethod(inv.getPaymentMethod());
            dto.setPaymentStatus(inv.getPaymentStatus());
            
            boolean hasReturn = inv.getItems().stream()
                .anyMatch(item -> item.getReturnedQuantity() != null && item.getReturnedQuantity() > 0);
            dto.setHasReturn(hasReturn);

            if (inv.getPaymentDate() != null) {
                dto.setPaymentDate(inv.getPaymentDate().toString());
            }
            
            return dto;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(list);
    }

    @GetMapping("/financial")
    public ResponseEntity<FinancialReportDto> getFinancialReport() {
        return ResponseEntity.ok(reportService.getFinancialReport());
    }

    @GetMapping("/inventory")
    public ResponseEntity<InventoryReportDto> getInventoryReport() {
        return ResponseEntity.ok(reportService.getInventoryReport());
    }

    @GetMapping("/reorder-suggestions")
    public ResponseEntity<List<com.billing.pos.dto.ReorderSuggestionDto>> getReorderSuggestions() {
        return ResponseEntity.ok(reportService.getReorderSuggestions());
    }

    @GetMapping("/export/csv")
    public ResponseEntity<String> exportSalesCsv() {
        List<Invoice> invoices = invoiceRepository.findAll();
        StringBuilder csv = new StringBuilder();
        csv.append("Invoice Number,Date,Customer,Payment Method,Status,Subtotal,Discount,GST,Grand Total\n");
        
        for (Invoice inv : invoices) {
            csv.append(inv.getInvoiceNumber()).append(",")
               .append(inv.getInvoiceDate() != null ? inv.getInvoiceDate().toString() : "").append(",")
               .append(inv.getCustomer() != null ? inv.getCustomer().getName() : "Walk-in").append(",")
               .append(inv.getPaymentMethod()).append(",")
               .append(inv.getPaymentStatus()).append(",")
               .append(inv.getSubtotal()).append(",")
               .append(inv.getTotalDiscount()).append(",")
               .append(inv.getTotalGst()).append(",")
               .append(inv.getGrandTotal()).append("\n");
        }
        
        return ResponseEntity.ok()
            .header("Content-Disposition", "attachment; filename=sales_report.csv")
            .header("Content-Type", "text/csv")
            .body(csv.toString());
    }
}
