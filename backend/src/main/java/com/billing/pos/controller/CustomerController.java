package com.billing.pos.controller;

import com.billing.pos.dto.CustomerDto;
import com.billing.pos.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import com.billing.pos.service.InvoiceService;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CustomerController {
    
    private final CustomerService customerService;
    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<List<CustomerDto>> getAllCustomers() {
        return ResponseEntity.ok(customerService.getAllCustomers());
    }

    @PostMapping
    public ResponseEntity<CustomerDto> createCustomer(@RequestBody CustomerDto dto) {
        return ResponseEntity.ok(customerService.createOrUpdateCustomer(dto));
    }

    @PostMapping("/{id}/payment")
    public ResponseEntity<CustomerDto> recordPayment(@PathVariable Long id, @RequestBody Map<String, BigDecimal> payload) {
        BigDecimal amount = payload.get("amount");
        return ResponseEntity.ok(customerService.recordPayment(id, amount));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<com.billing.pos.dto.InvoiceDto>> getCustomerHistory(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.getInvoicesByCustomer(id));
    }
}
