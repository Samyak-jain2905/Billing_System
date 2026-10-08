package com.billing.pos.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CustomerDto {
    private Long id;
    private String name;
    private String mobile;
    private String address;
    private BigDecimal totalPurchases;
    private BigDecimal totalDue;
}
