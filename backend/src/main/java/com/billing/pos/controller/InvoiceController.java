package com.billing.pos.controller;

import com.billing.pos.dto.InvoiceDto;
import com.billing.pos.model.Invoice;
import com.billing.pos.service.InvoiceService;
import com.billing.pos.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InvoiceController {
    
    private final InvoiceService invoiceService;
    private final PdfService pdfService;

    @PostMapping
    public ResponseEntity<InvoiceDto> createInvoice(@RequestBody InvoiceDto dto) {
        return ResponseEntity.ok(invoiceService.createInvoice(dto));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> getInvoicePdf(@PathVariable Long id) {
        Invoice invoice = invoiceService.getInvoiceEntity(id);
        byte[] pdfBytes = pdfService.generateThermalReceipt(invoice);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("filename", invoice.getInvoiceNumber() + ".pdf");
        
        return ResponseEntity.ok()
            .headers(headers)
            .body(pdfBytes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceDto> getInvoice(@PathVariable Long id) {
        Invoice invoice = invoiceService.getInvoiceEntity(id);
        
        InvoiceDto dto = new InvoiceDto();
        dto.setId(invoice.getId());
        dto.setInvoiceNumber(invoice.getInvoiceNumber());
        if (invoice.getCustomer() != null) {
            dto.setCustomerName(invoice.getCustomer().getName());
            dto.setCustomerMobile(invoice.getCustomer().getMobile());
        }
        dto.setPaymentMethod(invoice.getPaymentMethod());
        dto.setAmountPaid(invoice.getAmountPaid());
        dto.setSubtotal(invoice.getSubtotal());
        dto.setTotalDiscount(invoice.getTotalDiscount());
        dto.setTotalGst(invoice.getTotalGst());
        dto.setGrandTotal(invoice.getGrandTotal());
        dto.setPaymentStatus(invoice.getPaymentStatus());
        if (invoice.getInvoiceDate() != null) {
            dto.setInvoiceDate(invoice.getInvoiceDate().toString());
        }

        java.util.List<com.billing.pos.dto.InvoiceItemDto> items = new java.util.ArrayList<>();
        for (com.billing.pos.model.InvoiceItem item : invoice.getItems()) {
            com.billing.pos.dto.InvoiceItemDto itemDto = new com.billing.pos.dto.InvoiceItemDto();
            itemDto.setId(item.getId());
            itemDto.setProductId(item.getProduct().getId());
            itemDto.setProductName(item.getProduct().getName());
            itemDto.setQuantity(item.getQuantity());
            itemDto.setRate(item.getRate());
            items.add(itemDto);
        }
        dto.setItems(items);

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/search")
    public ResponseEntity<InvoiceDto> searchInvoiceByNumber(@RequestParam String number) {
        Invoice invoice = invoiceService.getInvoiceEntityByNumber(number);
        
        InvoiceDto dto = new InvoiceDto();
        dto.setId(invoice.getId());
        dto.setInvoiceNumber(invoice.getInvoiceNumber());
        if (invoice.getCustomer() != null) {
            dto.setCustomerName(invoice.getCustomer().getName());
            dto.setCustomerMobile(invoice.getCustomer().getMobile());
        }
        dto.setPaymentMethod(invoice.getPaymentMethod());
        dto.setAmountPaid(invoice.getAmountPaid());
        dto.setSubtotal(invoice.getSubtotal());
        dto.setTotalDiscount(invoice.getTotalDiscount());
        dto.setTotalGst(invoice.getTotalGst());
        dto.setGrandTotal(invoice.getGrandTotal());
        dto.setPaymentStatus(invoice.getPaymentStatus());
        if (invoice.getInvoiceDate() != null) {
            dto.setInvoiceDate(invoice.getInvoiceDate().toString());
        }

        java.util.List<com.billing.pos.dto.InvoiceItemDto> items = new java.util.ArrayList<>();
        for (com.billing.pos.model.InvoiceItem item : invoice.getItems()) {
            com.billing.pos.dto.InvoiceItemDto itemDto = new com.billing.pos.dto.InvoiceItemDto();
            itemDto.setId(item.getId());
            itemDto.setProductId(item.getProduct().getId());
            itemDto.setProductName(item.getProduct().getName());
            itemDto.setQuantity(item.getQuantity());
            itemDto.setRate(item.getRate());
            items.add(itemDto);
        }
        dto.setItems(items);

        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}/mark-paid")
    public ResponseEntity<Void> markAsPaid(@PathVariable Long id) {
        invoiceService.markInvoiceAsPaid(id);
        return ResponseEntity.ok().build();
    }
}
