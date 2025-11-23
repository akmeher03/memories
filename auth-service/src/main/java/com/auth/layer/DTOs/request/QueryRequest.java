package com.auth.layer.DTOs.request;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueryRequest {
    @NotNull(message = "User ID is required")
    private Long userId;
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
    @NotBlank(message = "Query is required")
    @Size(min = 1, max = 1000, message = "Query must be between 1 and 1000 characters")
    private String query;
    @Builder.Default
    private Integer topK = 5; // Default value
}
