package com.auth.layer.controller;


import com.auth.layer.DTOs.request.QueryRequest;
import com.auth.layer.DTOs.request.StoreInformationRequest;
import com.auth.layer.DTOs.response.ApiResponse;
import com.auth.layer.DTOs.response.RagQueryResponse;
import com.auth.layer.DTOs.response.RagStoreResponse;
import com.auth.layer.service.RagService;
import com.auth.layer.service.ServiceDAO.RagServiceDAO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/rag")
@RequiredArgsConstructor
@Tag(name = "RAG Service", description = "RAG service endpoints for storing and querying documents")
@SecurityRequirement(name = "bearerAuth")
public class RagController {

    private final RagServiceDAO ragServiceDAO;

    /**
     * Store/Index a document in the RAG service
     * This endpoint validates that the authenticated user's email matches the request email
     */
    @PostMapping("/store")
    @Operation(
        summary = "Store information in RAG",
        description = "Store a document (title + content) in the RAG service for future retrieval. " +
                     "Requires authentication and email in request must match authenticated user's email."
    )
    public ResponseEntity<ApiResponse<RagStoreResponse>> storeDocument(
            @Valid @RequestBody StoreInformationRequest request) {

        log.info("Store document request received - userId: {}, email: {}, title: {}",
                request.getUserId(), request.getEmail(), request.getTitle());

        // Get authenticated user's email from SecurityContext (already validated by JWT filter)
        String authenticatedEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        log.info("Authenticated email from SecurityContext: {}", authenticatedEmail);

        // Validate that authenticated email matches request email
        ragServiceDAO.validateEmailMatch(authenticatedEmail, request.getEmail());

        // Forward request to RAG service
        RagStoreResponse ragResponse = ragServiceDAO.storeInformation(request);

        log.info("Document stored successfully for userId: {}", request.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Document stored successfully in RAG service", ragResponse));
    }

    /**
     * Query the RAG service for relevant documents
     * This endpoint validates that the authenticated user's email matches the request email
     */
    @PostMapping("/query")
    @Operation(
        summary = "Query RAG",
        description = "Query the RAG service to find relevant documents based on a question. " +
                     "Requires authentication and email in request must match authenticated user's email."
    )
    public ResponseEntity<ApiResponse<RagQueryResponse>> queryRag(
            @Valid @RequestBody QueryRequest request) {

        log.info("Query RAG request received - userId: {}, email: {}, query: {}",
                request.getUserId(), request.getEmail(), request.getQuery());

        // Get authenticated user's email from SecurityContext (already validated by JWT filter)
        String authenticatedEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        // Validate that authenticated email matches request email
        ragServiceDAO.validateEmailMatch(authenticatedEmail, request.getEmail());

        // Forward request to RAG service
        RagQueryResponse ragResponse = ragServiceDAO.queryRag(request);

        log.info("Query completed successfully for userId: {} - Results: {}",
                request.getUserId(), ragResponse.getTotal());
        return ResponseEntity.ok(
                ApiResponse.success("Query completed successfully", ragResponse)
        );
    }
}


