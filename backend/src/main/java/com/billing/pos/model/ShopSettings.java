package com.billing.pos.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class ShopSettings {
    @Id
    private Long id = 1L; // Singleton pattern for shop settings

    private String shopName;
    private String address;
    private String phone;
    private String email;
    private String gstin;
    
    private String invoicePrefix;
    private String footerMessage;
}
