package com.projectmanager.common.client;

import com.projectmanager.common.dto.UserResponse;
import com.projectmanager.common.util.HashUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class AuthUserClient {

    private final RestTemplate restTemplate;

    @Value("${app.auth.base-url:http://localhost:8080}")
    private String authBaseUrl;

    @Value("${app.auth.api-key:ak_D2tDO7EycE-VwYJjhhmlm-KzlJJ1Cdq3yC1BTRccuEU2fT_H}")
    private String apiKey;

    public List<UserResponse> searchUsers(String query) {
        try {
            String timestamp = String.valueOf(Instant.now().getEpochSecond());
            String body = ""; // GET request has no body
            String signature = HashUtils.sha256(apiKey + timestamp + body);

            HttpHeaders headers = new HttpHeaders();
            headers.set("x-api-key", apiKey);
            headers.set("x-timestamp", timestamp);
            headers.set("x-signature", signature);

            HttpEntity<?> entity = new HttpEntity<>(headers);
            String url = authBaseUrl + "/api/v1/users?search=" + query + "&size=10";

            log.info("Searching users at Auth service (SECURED): url={}, timestamp={}", url, timestamp);
            
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, new ParameterizedTypeReference<Map<String, Object>>() {});

            if (response.getBody() != null) {
                Object content = response.getBody().get("content");
                if (content instanceof List) {
                    List<Map<String, Object>> list = (List<Map<String, Object>>) content;
                    return list.stream().map(m -> UserResponse.builder()
                            .id(UUID.fromString((String) m.get("id")))
                            .username((String) m.get("username"))
                            .email((String) m.get("email"))
                            .firstName((String) m.get("firstName"))
                            .lastName((String) m.get("lastName"))
                            .build()).collect(Collectors.toList());
                }
            }
            
            log.warn("Auth service returned empty or unexpected response for query: {}", query);
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to fetch users from Auth service. Error: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
