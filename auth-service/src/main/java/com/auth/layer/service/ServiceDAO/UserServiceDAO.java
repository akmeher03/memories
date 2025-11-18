package com.auth.layer.service.ServiceDAO;

import com.auth.layer.DTOs.request.UpdateUserRequest;
import com.auth.layer.DTOs.response.UserResponse;

import java.util.UUID;

public interface UserServiceDAO {
    UserResponse getUserById(UUID id);
    UserResponse getCurrentUser();
    UserResponse updateUser(UUID id, UpdateUserRequest updateUserRequest);
}
