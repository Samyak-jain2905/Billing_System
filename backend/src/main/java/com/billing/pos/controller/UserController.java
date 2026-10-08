package com.billing.pos.controller;

import com.billing.pos.model.User;
import com.billing.pos.model.Role;
import com.billing.pos.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody UserRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.valueOf(request.getRole()));
        user.setMobile(request.getMobile());

        return ResponseEntity.ok(userRepository.save(user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable Long id, @RequestBody RoleUpdateRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getUsername().equals("admin")) {
            throw new RuntimeException("Cannot change role of root admin");
        }
        user.setRole(Role.valueOf(request.getRole()));
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/{id}/mobile")
    public ResponseEntity<User> updateUserMobile(@PathVariable Long id, @RequestBody MobileUpdateRequest request) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setMobile(request.getMobile());
        return ResponseEntity.ok(userRepository.save(user));
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(java.security.Principal principal, @RequestBody ChangePasswordRequest request) {
        String username = principal.getName();
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Incorrect current password");
        }
        
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.ok().build();
    }

    @Data
    public static class ChangePasswordRequest {
        private String currentPassword;
        private String newPassword;
    }

    @Data
    public static class RoleUpdateRequest {
        private String role;
    }

    @Data
    public static class MobileUpdateRequest {
        private String mobile;
    }

    @Data
    public static class UserRequest {
        private String username;
        private String password;
        private String role;
        private String mobile;
    }
}
