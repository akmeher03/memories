package com.auth.layer.service;

import com.auth.layer.DTOs.mapper.UserMapper;
import com.auth.layer.DTOs.request.UpdateUserRequest;
import com.auth.layer.DTOs.response.UserResponse;
import com.auth.layer.entity.User;
import com.auth.layer.exception.EmailAlreadyExistsException;
import com.auth.layer.exception.UserNotFoundException;
import com.auth.layer.repository.UserRepository;
import com.auth.layer.service.ServiceDAO.UserServiceDAO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService implements UserServiceDAO {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

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

    // Update user by ID
    @Transactional
    @Override
    public UserResponse updateUser(UUID id, UpdateUserRequest updateUserRequest) {
        log.debug("Updating user with ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with ID: " + id));

        // Update only non-null fields
        if (updateUserRequest.getFirstName() != null) {
            user.setFirstName(updateUserRequest.getFirstName());
        }
        if (updateUserRequest.getLastName() != null) {
            user.setLastName(updateUserRequest.getLastName());
        }

        // Handle email update with uniqueness validation
        if (updateUserRequest.getEmail() != null && !updateUserRequest.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmailAndDeletedFalse(updateUserRequest.getEmail())) {
                throw new EmailAlreadyExistsException("Email already exists: " + updateUserRequest.getEmail());
            }
            user.setEmail(updateUserRequest.getEmail());
            log.info("Email updated for user ID: {}", id);
        }

        // Handle password update with encryption
        if (updateUserRequest.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(updateUserRequest.getPassword()));
            log.info("Password updated for user ID: {}", id);
        }

        User updatedUser = userRepository.save(user);
        log.info("Successfully updated user with ID: {}", id);
        return userMapper.toResponse(updatedUser);
    }
}
