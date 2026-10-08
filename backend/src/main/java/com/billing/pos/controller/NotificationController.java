package com.billing.pos.controller;

import com.billing.pos.dto.NotificationDto;
import com.billing.pos.dto.ReorderSuggestionDto;
import com.billing.pos.model.Customer;
import com.billing.pos.model.Supplier;
import com.billing.pos.repository.CustomerRepository;
import com.billing.pos.repository.SupplierRepository;
import com.billing.pos.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final ReportService reportService;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getNotifications() {
        List<NotificationDto> notifications = new ArrayList<>();

        // 1. Stock Alerts
        List<ReorderSuggestionDto> suggestions = reportService.getReorderSuggestions();
        for (ReorderSuggestionDto s : suggestions) {
            if ("OUT_OF_STOCK".equals(s.getStatus())) {
                NotificationDto n = new NotificationDto();
                n.setId(UUID.randomUUID().toString());
                n.setType("CRITICAL");
                n.setTitle("Out of Stock");
                n.setMessage(s.getProductName() + " has run out completely!");
                n.setActionLink("/reports");
                notifications.add(n);
            } else if ("CRITICAL".equals(s.getStatus())) {
                NotificationDto n = new NotificationDto();
                n.setId(UUID.randomUUID().toString());
                n.setType("WARNING");
                n.setTitle("Low Stock Alert");
                n.setMessage(s.getProductName() + " is running critically low.");
                n.setActionLink("/reports");
                notifications.add(n);
            }
        }

        // 2. Customer Overdues (Total Due > 0)
        List<Customer> customers = customerRepository.findAll();
        int overdueCustomers = 0;
        BigDecimal totalUdhaar = BigDecimal.ZERO;
        for (Customer c : customers) {
            if (c.getTotalDue() != null && c.getTotalDue().compareTo(BigDecimal.ZERO) > 0) {
                overdueCustomers++;
                totalUdhaar = totalUdhaar.add(c.getTotalDue());
            }
        }
        if (overdueCustomers > 0) {
            NotificationDto n = new NotificationDto();
            n.setId(UUID.randomUUID().toString());
            n.setType("WARNING");
            n.setTitle("Customer Payments Due");
            n.setMessage(overdueCustomers + " customers have pending Udhaar (Total: ₹" + totalUdhaar + ").");
            n.setActionLink("/customers");
            notifications.add(n);
        }

        // 3. Supplier Payables (Total Payable > 0)
        List<Supplier> suppliers = supplierRepository.findAll();
        int pendingSuppliers = 0;
        BigDecimal totalSupplierPayable = BigDecimal.ZERO;
        for (Supplier s : suppliers) {
            if (s.getAmountPayable() != null && s.getAmountPayable().compareTo(BigDecimal.ZERO) > 0) {
                pendingSuppliers++;
                totalSupplierPayable = totalSupplierPayable.add(s.getAmountPayable());
            }
        }
        if (pendingSuppliers > 0) {
            NotificationDto n = new NotificationDto();
            n.setId(UUID.randomUUID().toString());
            n.setType("WARNING");
            n.setTitle("Supplier Payment Due");
            n.setMessage("You owe ₹" + totalSupplierPayable + " across " + pendingSuppliers + " suppliers.");
            n.setActionLink("/suppliers");
            notifications.add(n);
        }

        // 4. Backup Status (Mock for now)
        NotificationDto nSync = new NotificationDto();
        nSync.setId(UUID.randomUUID().toString());
        nSync.setType("SUCCESS");
        nSync.setTitle("Backup Completed");
        nSync.setMessage("Database successfully synced to local storage.");
        notifications.add(nSync);

        return ResponseEntity.ok(notifications);
    }
}
