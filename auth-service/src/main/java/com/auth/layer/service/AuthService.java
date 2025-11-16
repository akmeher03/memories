package com.auth.layer.service;

import com.auth.layer.DTOs.request.LoginRequest;
import com.auth.layer.DTOs.request.RegisterRequest;
import com.auth.layer.DTOs.response.JwtResponse;
import com.auth.layer.entity.RefreshToken;
import com.auth.layer.entity.User;
import com.auth.layer.exception.EmailAlreadyExistsException;
import com.auth.layer.exception.InvalidCredentialsException;
import com.auth.layer.exception.InvalidTokenException;
import com.auth.layer.exception.TokenExpiredException;
import com.auth.layer.repository.RefreshTokenRepository;
import com.auth.layer.repository.UserRepository;
import com.auth.layer.security.JwtProvider;
import com.auth.layer.service.ServiceDAO.AuthServiceDAO;
import com.auth.layer.utils.JwtConfigurationProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService implements AuthServiceDAO {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final JwtConfigurationProperties jwtConfigurationProperties;

    // Register a new user
    @Transactional
    @Override
    public void registerUser(RegisterRequest request) {
        if (userRepository.existsByEmailAndDeletedFalse(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email already registered: " + request.getEmail());
        }

        log.info("Registering new user - firstName: {}, lastName: {}, email: {}",
                request.getFirstName(), request.getLastName(), request.getEmail());

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .build();

        userRepository.save(user);
        log.info("User registered successfully with email: {}", request.getEmail());
    }

    // Login user and generate JWT + refresh token
    @Transactional
    @Override
    public JwtResponse login(LoginRequest request) {
        User user = userRepository.findByEmailAndDeletedFalse(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        log.info("User logged in successfully: {}", request.getEmail());

        String accessToken = jwtProvider.generateAccessToken(user);
        RefreshToken refreshToken = createRefreshToken(user);

        return JwtResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .build();
    }

    // Refresh JWT using refresh token
    @Transactional(readOnly = true)
    @Override
    public JwtResponse refreshToken(String refreshTokenStr) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenStr)
                .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

        if (refreshToken.isRevoked()) {
            throw new InvalidTokenException("Refresh token has been revoked");
        }

        if (refreshToken.getExpiryDate().isBefore(Instant.now())) {
            throw new TokenExpiredException("Refresh token has expired");
        }

        log.info("Refreshing access token for user: {}", refreshToken.getUser().getEmail());

        String accessToken = jwtProvider.generateAccessToken(refreshToken.getUser());
        return JwtResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .build();
    }

    // Logout (revoke refresh token)
    @Transactional
    @Override
    public void logout(String refreshTokenStr) {
        RefreshToken token = refreshTokenRepository.findByToken(refreshTokenStr)
                .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

        token.setRevoked(true);
        refreshTokenRepository.save(token);
        log.info("User logged out successfully");
    }

    private RefreshToken createRefreshToken(User user) {
        long refreshTokenValiditySeconds = jwtConfigurationProperties.getRefreshTokenExpirationInSeconds();

        RefreshToken token = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusSeconds(refreshTokenValiditySeconds))
                .revoked(false)
                .build();

        return refreshTokenRepository.save(token);
    }
}
