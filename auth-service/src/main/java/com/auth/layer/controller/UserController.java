package com.auth.layer.controller;

import java.util.UUID;

import com.auth.layer.DTOs.mapper.UserMapper;
import com.auth.layer.DTOs.response.ApiResponse;
import com.auth.layer.DTOs.response.UserResponse;
import com.auth.layer.entity.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.auth.layer.service.UserService;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "User profile and management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID", description = "Retrieves user information by user ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable UUID id) {
        log.info("Fetching user by ID: {}", id);
        UserResponse userResponse = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(userResponse));
    }

    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Simple health check endpoint")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Retrieves information of the currently authenticated user")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        log.info("Fetching current authenticated user");
        UserResponse userResponse = userService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(userResponse));
    }
}
