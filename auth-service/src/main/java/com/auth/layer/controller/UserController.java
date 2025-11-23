package com.auth.layer.controller;

import java.util.UUID;

import com.auth.layer.DTOs.request.UpdateUserRequest;
import com.auth.layer.DTOs.response.ApiResponse;
import com.auth.layer.DTOs.response.UserResponse;
import com.auth.layer.service.ServiceDAO.UserServiceDAO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
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

    private final UserServiceDAO userServiceDAO;

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID", description = "Retrieves user information by user ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable UUID id) {
        log.info("Fetching user by ID: {}", id);
        UserResponse userResponse = userServiceDAO.getUserById(id);
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
        UserResponse userResponse = userServiceDAO.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(userResponse));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user by ID", description = "Updates user details (firstName, lastName, email, password) by user ID. All fields are optional.")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest updateUserRequest) {
        log.info("Updating user with ID: {}", id);
        UserResponse userResponse = userServiceDAO.updateUser(id, updateUserRequest);
        return ResponseEntity.ok(ApiResponse.success(userResponse));
    }
}
