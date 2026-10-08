package com.billing.pos.service;

import com.billing.pos.dto.ShopSettingsDto;
import com.billing.pos.model.ShopSettings;
import com.billing.pos.repository.ShopSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ShopSettingsService {

    private final ShopSettingsRepository settingsRepository;

    public ShopSettingsDto getSettings() {
        ShopSettings settings = settingsRepository.findById(1L).orElseGet(this::createDefaultSettings);
        return mapToDto(settings);
    }

    public ShopSettingsDto updateSettings(ShopSettingsDto dto) {
        ShopSettings settings = settingsRepository.findById(1L).orElseGet(ShopSettings::new);
        settings.setId(1L);
        settings.setShopName(dto.getShopName());
        settings.setAddress(dto.getAddress());
        settings.setPhone(dto.getPhone());
        settings.setEmail(dto.getEmail());
        settings.setGstin(dto.getGstin());
        settings.setInvoicePrefix(dto.getInvoicePrefix());
        settings.setFooterMessage(dto.getFooterMessage());
        
        return mapToDto(settingsRepository.save(settings));
    }

    private ShopSettings createDefaultSettings() {
        ShopSettings settings = new ShopSettings();
        settings.setId(1L);
        settings.setShopName("My Supermart");
        settings.setAddress("123 Market Street, City");
        settings.setPhone("9876543210");
        settings.setEmail("contact@mysupermart.com");
        settings.setGstin("22AAAAA0000A1Z5");
        settings.setInvoicePrefix("INV");
        settings.setFooterMessage("Thank You! Visit Again.");
        return settingsRepository.save(settings);
    }

    private ShopSettingsDto mapToDto(ShopSettings s) {
        ShopSettingsDto dto = new ShopSettingsDto();
        dto.setShopName(s.getShopName());
        dto.setAddress(s.getAddress());
        dto.setPhone(s.getPhone());
        dto.setEmail(s.getEmail());
        dto.setGstin(s.getGstin());
        dto.setInvoicePrefix(s.getInvoicePrefix());
        dto.setFooterMessage(s.getFooterMessage());
        return dto;
    }
}
