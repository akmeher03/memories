package com.auth.layer.repository;


import com.auth.layer.entity.RefreshToken;
import com.auth.layer.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUser(User user);
    List<RefreshToken> findAllByUserAndRevokedFalse(User user);
}
