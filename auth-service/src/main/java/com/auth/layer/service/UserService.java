package com.auth.layer.service;

import com.auth.layer.DTOs.mapper.UserMapper;
import com.auth.layer.DTOs.response.UserResponse;
import com.auth.layer.entity.User;
import com.auth.layer.exception.UserNotFoundException;
import com.auth.layer.repository.UserRepository;
import com.auth.layer.service.ServiceDAO.UserServiceDAO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService implements UserServiceDAO {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    // Get user by ID
    @Transactional(readOnly = true)
    @Override
    public UserResponse getUserById(UUID id) {
        log.debug("Fetching user by ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + id));
        return userMapper.toResponse(user);
    }

    // Get currently authenticated user
    @Transactional(readOnly = true)
    @Override
    public UserResponse getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        log.debug("Fetching current authenticated user: {}", email);
        User user = userRepository.findByEmailAndDeletedFalse(email)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));
        return userMapper.toResponse(user);
    }
}
