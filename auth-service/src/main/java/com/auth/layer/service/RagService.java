package com.auth.layer.service;
import com.auth.layer.DTOs.request.QueryRequest;
import com.auth.layer.DTOs.request.StoreInformationRequest;
import com.auth.layer.DTOs.response.RagQueryResponse;
import com.auth.layer.DTOs.response.RagStoreResponse;
import com.auth.layer.exception.RagServiceException;
import com.auth.layer.exception.UnauthorizedAccessException;
import com.auth.layer.service.ServiceDAO.RagServiceDAO;
import com.auth.layer.utils.RagConfigurationProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;
@Slf4j
@Service
@RequiredArgsConstructor
public class RagService implements RagServiceDAO {
    private final RestTemplate restTemplate;
    private final RagConfigurationProperties ragConfigurationProperties;
    /**
     * Validates that the authenticated user's email matches the email in the request
     * This prevents users from accessing other users' data
     *
     * @param authenticatedEmail Email from SecurityContext (already validated by JWT filter)
     * @param requestEmail       Email from request body
     * @throws UnauthorizedAccessException if emails don't match
     */
    public void validateEmailMatch(String authenticatedEmail, String requestEmail) {
        log.debug("Validating email match - Authenticated: {}, Request: {}", authenticatedEmail, requestEmail);
        if (!authenticatedEmail.equals(requestEmail)) {
            log.warn("Email mismatch - Authenticated: {}, Request: {}", authenticatedEmail, requestEmail);
            throw new UnauthorizedAccessException(
                "Access denied: Authenticated email does not match the request email"
            );
        }
        log.debug("Email validation successful for: {}", requestEmail);
    }
    /**
     * Store/Index a document in the RAG service
     *
     * @param request Store document request
     * @return RagStoreResponse from the Python RAG service
     * @throws RagServiceException if RAG service communication fails
     */
    public RagStoreResponse storeInformation(StoreInformationRequest request) {
        log.info("Storing document in RAG service - userId: {}, title: {}", 
                request.getUserId(), request.getTitle());
        try {
            String url = ragConfigurationProperties.getPathUrl() + "/rag/store";
            // Prepare request body for RAG service
            Map<String, Object> ragRequest = new HashMap<>();
            ragRequest.put("userId", request.getUserId().toString());
            ragRequest.put("title", request.getTitle());
            ragRequest.put("content", request.getContent());
            ragRequest.put("email", request.getEmail());
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(ragRequest, headers);
            log.debug("Sending request to RAG service: {}", url);
            ResponseEntity<RagStoreResponse> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                RagStoreResponse.class
            );
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.info("Document stored successfully in RAG service - documentId: {}", 
                        response.getBody().getDocumentId());
                return response.getBody();
            } else {
                throw new RagServiceException("RAG service returned empty response");
            }
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("RAG service HTTP error - Status: {}, Response: {}", 
                    e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new RagServiceException(
                "Failed to store document in RAG service: " + e.getMessage(), e
            );
        } catch (Exception e) {
            log.error("Unexpected error while communicating with RAG service", e);
            throw new RagServiceException(
                "RAG service is currently unavailable. Please try again later.", e
            );
        }
    }
    /**
     * Query the RAG service for relevant documents
     *
     * @param request Query request
     * @return RagQueryResponse with search results
     * @throws RagServiceException if RAG service communication fails
     */
    public RagQueryResponse queryRag(QueryRequest request) {
        log.info("Querying RAG service - userId: {}, query: {}", 
                request.getUserId(), request.getQuery());
        try {
            String url = ragConfigurationProperties.getPathUrl() + "/rag/query";
            // Prepare request body for RAG service
            Map<String, Object> ragRequest = new HashMap<>();
            ragRequest.put("userId", request.getUserId().toString());
            ragRequest.put("query", request.getQuery());
            ragRequest.put("email", request.getEmail());
            ragRequest.put("topK", request.getTopK() != null ? request.getTopK() : 5);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(ragRequest, headers);
            log.debug("Sending query request to RAG service: {}", url);
            ResponseEntity<RagQueryResponse> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                RagQueryResponse.class
            );
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.info("Query completed successfully - Answer score: {}",
                        response.getBody().getScore());
                return response.getBody();
            } else {
                throw new RagServiceException("RAG service returned empty response");
            }
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("RAG service HTTP error - Status: {}, Response: {}", 
                    e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new RagServiceException(
                "Failed to query RAG service: " + e.getMessage(), e
            );
        } catch (Exception e) {
            log.error("Unexpected error while communicating with RAG service", e);
            throw new RagServiceException(
                "RAG service is currently unavailable. Please try again later.", e
            );
        }
    }
}
