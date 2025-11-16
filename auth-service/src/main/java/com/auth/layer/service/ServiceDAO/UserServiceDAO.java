package com.auth.layer.service.ServiceDAO;

import com.auth.layer.DTOs.response.UserResponse;
import com.auth.layer.entity.User;

import java.util.UUID;

public interface UserServiceDAO {
    UserResponse getUserById(UUID id);
    UserResponse getCurrentUser();
}
