package com.ledgerflow.user;

import com.ledgerflow.common.response.ApiResponse;
import com.ledgerflow.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder,
                         AuthenticationManager authenticationManager, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.findByUsername(request.username()).isPresent()) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User(request.username(), request.email(), passwordEncoder.encode(request.password()), UserRole.USER);
        User saved = userRepository.save(user);

        String token = jwtService.generateToken(saved.getUsername(), saved.getRole().name());
        return ResponseEntity.ok(ApiResponse.success("User registered", Map.of(
            "userId", saved.getId(),
            "username", saved.getUsername(),
            "role", saved.getRole().name(),
            "token", token
        )));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@Valid @RequestBody LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );
        User user = userRepository.findByUsername(request.username()).orElseThrow();
        String token = jwtService.generateToken(user.getUsername(), user.getRole().name());
        return ResponseEntity.ok(ApiResponse.success("Login successful", Map.of(
            "userId", user.getId(),
            "username", user.getUsername(),
            "role", user.getRole().name(),
            "token", token
        )));
    }

    public record RegisterRequest(String username, String email, String password) {}
    public record LoginRequest(String username, String password) {}
}
