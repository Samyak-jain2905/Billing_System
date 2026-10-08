package com.billing.pos.dto;

import lombok.Data;

@Data
public class ShopSettingsDto {
    private String shopName;
    private String address;
    private String phone;
    private String email;
    private String gstin;
    private String invoicePrefix;
    private String footerMessage;
}
