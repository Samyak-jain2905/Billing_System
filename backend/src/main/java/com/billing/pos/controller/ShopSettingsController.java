package com.billing.pos.controller;

import com.billing.pos.dto.ShopSettingsDto;
import com.billing.pos.service.ShopSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ShopSettingsController {

    private final ShopSettingsService settingsService;

    @GetMapping
    public ResponseEntity<ShopSettingsDto> getSettings() {
        return ResponseEntity.ok(settingsService.getSettings());
    }

    @PutMapping
    public ResponseEntity<ShopSettingsDto> updateSettings(@RequestBody ShopSettingsDto dto) {
        return ResponseEntity.ok(settingsService.updateSettings(dto));
    }
}
