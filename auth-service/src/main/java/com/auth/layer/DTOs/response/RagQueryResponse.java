package com.auth.layer.DTOs.response;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RagQueryResponse {
    private List<RagDocument> results;
    private int total;
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RagDocument {
        private String title;
        private String content;
        private Double score;
    }
}
