package com.auth.layer.service.ServiceDAO;

import com.auth.layer.DTOs.request.LoginRequest;
import com.auth.layer.DTOs.request.RegisterRequest;
import com.auth.layer.DTOs.response.JwtResponse;

public interface AuthServiceDAO {
    void registerUser(RegisterRequest request);
    JwtResponse login(LoginRequest request);
    JwtResponse refreshToken(String refreshTokenStr);
    void logout(String refreshTokenStr);
}
