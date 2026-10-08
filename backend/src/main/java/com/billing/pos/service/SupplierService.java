package com.billing.pos.service;

import com.billing.pos.dto.SupplierDto;
import com.billing.pos.model.Supplier;
import com.billing.pos.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public List<SupplierDto> getAllSuppliers() {
        return supplierRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public SupplierDto createSupplier(SupplierDto dto) {
        Supplier supplier = new Supplier();
        supplier.setName(dto.getName());
        supplier.setCompany(dto.getCompany());
        supplier.setMobile(dto.getMobile());
        supplier.setEmail(dto.getEmail());
        supplier.setAddress(dto.getAddress());
        supplier.setGstin(dto.getGstin());
        supplier.setAmountPayable(BigDecimal.ZERO);
        return mapToDto(supplierRepository.save(supplier));
    }

    private SupplierDto mapToDto(Supplier s) {
        SupplierDto dto = new SupplierDto();
        dto.setId(s.getId());
        dto.setName(s.getName());
        dto.setCompany(s.getCompany());
        dto.setMobile(s.getMobile());
        dto.setEmail(s.getEmail());
        dto.setAddress(s.getAddress());
        dto.setGstin(s.getGstin());
        dto.setAmountPayable(s.getAmountPayable());
        return dto;
    }
}
