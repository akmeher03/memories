package com.auth.layer.DTOs.response;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RagStoreResponse {
    private String documentId;
    private boolean indexed;
}
