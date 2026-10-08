package com.billing.pos.controller;

import com.billing.pos.dto.PurchaseDto;
import com.billing.pos.service.PurchaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchases")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PurchaseController {

    private final PurchaseService purchaseService;

    @PostMapping
    public ResponseEntity<PurchaseDto> createPurchase(@RequestBody PurchaseDto dto) {
        return ResponseEntity.ok(purchaseService.createPurchase(dto));
    }

    @GetMapping("/search")
    public ResponseEntity<com.billing.pos.model.Purchase> getPurchaseByInvoiceNumber(@RequestParam String number) {
        return purchaseService.findByPurchaseInvoiceNumber(number)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
