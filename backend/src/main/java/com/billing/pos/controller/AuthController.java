package com.billing.pos.controller;

import com.billing.pos.dto.AuthRequest;
import com.billing.pos.dto.AuthResponse;
import com.billing.pos.model.User;
import com.billing.pos.repository.UserRepository;
import com.billing.pos.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow();
        String role = user.getRole() != null ? user.getRole().name() : "STAFF";
        
        String token = jwtService.generateToken(userDetails);
        
        return ResponseEntity.ok(new AuthResponse(token, userDetails.getUsername(), role));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody com.billing.pos.dto.RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username already exists");
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setName(request.getName());
        user.setRole(com.billing.pos.model.Role.valueOf(request.getRole() != null && !request.getRole().isEmpty() ? request.getRole() : "STAFF"));
        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully");
    }
}
