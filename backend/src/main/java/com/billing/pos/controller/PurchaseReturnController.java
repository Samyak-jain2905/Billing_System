package com.billing.pos.controller;

import com.billing.pos.dto.PurchaseReturnDto;
import com.billing.pos.model.PurchaseReturn;
import com.billing.pos.service.PurchaseReturnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchase-returns")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PurchaseReturnController {

    private final PurchaseReturnService purchaseReturnService;

    @PostMapping
    public ResponseEntity<PurchaseReturn> processReturn(@RequestBody PurchaseReturnDto dto) {
        return ResponseEntity.ok(purchaseReturnService.processReturn(dto));
    }
}
