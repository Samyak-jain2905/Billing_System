package com.billing.pos.service;

import com.billing.pos.dto.CustomerDto;
import com.billing.pos.model.Customer;
import com.billing.pos.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {
    
    private final CustomerRepository customerRepository;

    public List<CustomerDto> getAllCustomers() {
        return customerRepository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public CustomerDto createOrUpdateCustomer(CustomerDto dto) {
        Customer customer = null;
        if (dto.getId() != null) {
            customer = customerRepository.findById(dto.getId()).orElse(new Customer());
        } else {
            customer = customerRepository.findByMobile(dto.getMobile()).orElse(new Customer());
        }

        customer.setName(dto.getName());
        customer.setMobile(dto.getMobile());
        customer.setAddress(dto.getAddress());
        
        if (customer.getId() == null) {
            customer.setTotalPurchases(BigDecimal.ZERO);
            customer.setTotalDue(BigDecimal.ZERO);
        }

        Customer saved = customerRepository.save(customer);
        return mapToDto(saved);
    }

    public CustomerDto recordPayment(Long customerId, BigDecimal amount) {
        Customer customer = customerRepository.findById(customerId)
            .orElseThrow(() -> new RuntimeException("Customer not found"));
            
        // Reduce the due amount
        BigDecimal currentDue = customer.getTotalDue();
        BigDecimal newDue = currentDue.subtract(amount);
        
        // Prevent negative due for now, assume they don't overpay (or if they do, keep as advance)
        customer.setTotalDue(newDue);
        
        Customer saved = customerRepository.save(customer);
        return mapToDto(saved);
    }

    private CustomerDto mapToDto(Customer c) {
        CustomerDto dto = new CustomerDto();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setMobile(c.getMobile());
        dto.setAddress(c.getAddress());
        dto.setTotalPurchases(c.getTotalPurchases());
        dto.setTotalDue(c.getTotalDue());
        return dto;
    }
}
