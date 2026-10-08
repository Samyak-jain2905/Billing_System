package com.billing.pos.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductDto {
    private Long id;
    private String name;
    private String barcode;
    private String sku;
    private String category;
    private String brand;
    private BigDecimal purchasePrice;
    private BigDecimal sellingPrice;
    private BigDecimal mrp;
    private BigDecimal gstRate;
    private String hsnCode;
    private String unit;
    private Integer currentStock;
    private Integer minimumStock;
}
