package com.auth.layer.security;
import com.auth.layer.entity.User;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
// import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

// import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtProvider {

    private final String jwtSecret = "38eabc5f6eb0a20b85d7b567ae6f0fc38aca0e4e3e2056df3a3abc3e2a52fea6cf68728a5dc7baf35b1a1c803e552ad81da32efab85029bbeefd760a7f4ab9e8";
    // private final SecretKey jwtSecret = Keys.hmacShaKeyFor("38eabc5f6eb0a20b85d7b567ae6f0fc38aca0e4e3e2056df3a3abc3e2a52fea6cf68728a5dc7baf35b1a1c803e552ad81da32efab85029bbeefd760a7f4ab9e8".getBytes());

    private final long jwtExpirationMs = 15 * 60 * 1000; // 15 minutes

    public String generateAccessToken(User user) {
        return Jwts.builder()
                .setSubject(user.getEmail())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(SignatureAlgorithm.HS256, jwtSecret)
                // .signWith(jwtSecret)
                .compact();
    }

    public String getEmailFromToken(String token) {
        return Jwts.parser()
        // Jwts.parserBuilder()
                .setSigningKey(jwtSecret)
                // .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            // Jwts.parserBuilder()
            //         .setSigningKey(jwtSecret)
            //         .build()
            //         .parseClaimsJws(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
}
