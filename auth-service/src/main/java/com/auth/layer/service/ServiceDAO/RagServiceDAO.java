package com.auth.layer.service.ServiceDAO;

import com.auth.layer.DTOs.request.QueryRequest;
import com.auth.layer.DTOs.request.StoreInformationRequest;
import com.auth.layer.DTOs.response.RagQueryResponse;
import com.auth.layer.DTOs.response.RagStoreResponse;

public interface RagServiceDAO {
    void validateEmailMatch(String authenticatedEmail, String requestEmail);
    RagStoreResponse storeInformation(StoreInformationRequest request);
    RagQueryResponse queryRag(QueryRequest request);
}
