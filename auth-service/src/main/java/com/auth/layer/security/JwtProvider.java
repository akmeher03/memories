package com.auth.layer.security;
import com.auth.layer.entity.User;
import com.auth.layer.utils.JwtConfigurationProperties;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import lombok.RequiredArgsConstructor;
// import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

// import javax.crypto.SecretKey;
import java.util.Date;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtProvider {

    private final JwtConfigurationProperties jwtConfigurationProperties;

    public String generateAccessToken(User user) {
        return Jwts.builder()
                .setSubject(user.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtConfigurationProperties.getTokenExpirationInMs()))
                .signWith(SignatureAlgorithm.HS256, jwtConfigurationProperties.getJwtSecretKey())
                // .signWith(jwtSecret)
                .compact();
    }

    public String getEmailFromToken(String token) {
        return Jwts.parser()
        // Jwts.parserBuilder()
                .setSigningKey(jwtConfigurationProperties.getJwtSecretKey())
                // .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(jwtConfigurationProperties.getJwtSecretKey()).parseClaimsJws(token);
            // Jwts.parserBuilder()
            //         .setSigningKey(jwtSecret)
            //         .build()
            //         .parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
            log.info("JWT token Expired or invalid ----> {}", e.getMessage());
            return false;
        }
    }
}
