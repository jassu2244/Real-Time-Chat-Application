package com.jasmeet.realtimechatapp.repository;

import com.jasmeet.realtimechatapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User,Long> {
    boolean existsByUsername(String username);
    @Transactional
    @Modifying
    @Query("UPDATE User u SET u.isOnline= :isOnline WHERE u.username= :username")
    void updateUserOnlineStatus(@Param("username") String username, @Param("isOnline") boolean isOnline);

    boolean existsByEmail(String email);
    Optional<User> findByUsername(String username);

    List<User> findByIsOnlineTrue();

    @Query("SELECT u FROM User u WHERE u.isOnline = true")
    List<User> findAllOnlineUsers();
}
