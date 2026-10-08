package com.billing.pos.service;

import com.billing.pos.dto.ProductDto;
import com.billing.pos.model.Product;
import com.billing.pos.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;

    public ProductDto createProduct(ProductDto dto) {
        Product product = mapToEntity(dto);
        Product saved = productRepository.save(product);
        return mapToDto(saved);
    }

    public List<ProductDto> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ProductDto getProductById(Long id) {
        return productRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public ProductDto getProductByBarcode(String barcode) {
        return productRepository.findByBarcode(barcode)
                .map(this::mapToDto)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public List<ProductDto> searchProducts(String query) {
        return productRepository.searchProducts(query).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ProductDto updateProduct(Long id, ProductDto dto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        product.setName(dto.getName());
        product.setBarcode(dto.getBarcode());
        product.setSku(dto.getSku());
        product.setCategory(dto.getCategory());
        product.setBrand(dto.getBrand());
        product.setPurchasePrice(dto.getPurchasePrice());
        product.setSellingPrice(dto.getSellingPrice());
        product.setMrp(dto.getMrp());
        product.setGstRate(dto.getGstRate());
        product.setHsnCode(dto.getHsnCode());
        product.setUnit(dto.getUnit());
        product.setCurrentStock(dto.getCurrentStock() != null ? dto.getCurrentStock() : 0);
        product.setMinimumStock(dto.getMinimumStock() != null ? dto.getMinimumStock() : 0);

        Product updated = productRepository.save(product);
        return mapToDto(updated);
    }

    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found");
        }
        productRepository.deleteById(id);
    }

    private Product mapToEntity(ProductDto dto) {
        return Product.builder()
                .name(dto.getName())
                .barcode(dto.getBarcode())
                .sku(dto.getSku())
                .category(dto.getCategory())
                .brand(dto.getBrand())
                .purchasePrice(dto.getPurchasePrice())
                .sellingPrice(dto.getSellingPrice())
                .mrp(dto.getMrp())
                .gstRate(dto.getGstRate())
                .hsnCode(dto.getHsnCode())
                .unit(dto.getUnit())
                .currentStock(dto.getCurrentStock() != null ? dto.getCurrentStock() : 0)
                .minimumStock(dto.getMinimumStock() != null ? dto.getMinimumStock() : 0)
                .build();
    }

    private ProductDto mapToDto(Product product) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setName(product.getName());
        dto.setBarcode(product.getBarcode());
        dto.setSku(product.getSku());
        dto.setCategory(product.getCategory());
        dto.setBrand(product.getBrand());
        dto.setPurchasePrice(product.getPurchasePrice());
        dto.setSellingPrice(product.getSellingPrice());
        dto.setMrp(product.getMrp());
        dto.setGstRate(product.getGstRate());
        dto.setHsnCode(product.getHsnCode());
        dto.setUnit(product.getUnit());
        dto.setCurrentStock(product.getCurrentStock());
        dto.setMinimumStock(product.getMinimumStock());
        return dto;
    }
}
