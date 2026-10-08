package com.billing.pos.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class SupplierDto {
    private Long id;
    private String name;
    private String company;
    private String mobile;
    private String email;
    private String address;
    private String gstin;
    private BigDecimal amountPayable;
}
