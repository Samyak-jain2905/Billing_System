package com.billing.pos.controller;

import com.billing.pos.dto.SalesReturnDto;
import com.billing.pos.model.SalesReturn;
import com.billing.pos.service.SalesReturnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/returns/sales")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SalesReturnController {

    private final SalesReturnService salesReturnService;

    @PostMapping
    public ResponseEntity<?> createSalesReturn(@RequestBody SalesReturnDto dto) {
        try {
            SalesReturn saved = salesReturnService.createSalesReturn(dto);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
