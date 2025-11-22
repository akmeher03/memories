package com.auth.layer.security;

import java.io.IOException;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.auth.layer.entity.User;
import com.auth.layer.repository.UserRepository;
import com.auth.layer.utils.JwtConfigurationProperties;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;
    private final JwtConfigurationProperties jwtConfigurationProperties;

    @PostConstruct
    public void init() {
        System.out.println("✅ JwtAuthFilter bean initialized successfully!");
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        String skipPaths = jwtConfigurationProperties.getFilterSkipUrls();

        // Split the skip paths and check if current path matches any
        if (skipPaths != null && !skipPaths.isEmpty()) {
            for (String skipPath : skipPaths.split(",")) {
                if (path.startsWith(skipPath.trim())) {
                    return true;
                }
            }
        }
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        logger.info("🔍 JwtAuthFilter triggered for URI:");

        String header = request.getHeader("Authorization");
        String token = null;
        String email = null;

        if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7);
            try {
                if (jwtProvider.validateToken(token)) {
                    email = jwtProvider.getEmailFromToken(token);
                }
            } catch (Exception e) {
                logger.warn("Invalid JWT token: {}");
            }
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            User user = userRepository.findByEmailAndDeletedFalse(email)
                    .orElse(null);

            if (user != null) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                user.getEmail(),
                                null,
                                null // No roles yet, can add later
                        );

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
