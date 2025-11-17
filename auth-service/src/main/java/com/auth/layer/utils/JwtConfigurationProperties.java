package com.auth.layer.utils;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "auth.layer.jwt")
@Data
public class JwtConfigurationProperties {
    private String jwtSecretKey;
    private long tokenExpirationInMs;
    private long refreshTokenExpirationInSeconds;
    private String filterSkipUrls;
}
