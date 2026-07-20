package com.jasmeet.realtimechatapp.service;

import com.jasmeet.realtimechatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public boolean userExists(String username) {
        return userRepository.existsByUsername(username);
    }

    public void setUserOnlineStatus(String username, boolean isOnline) {
        userRepository.updateUserOnlineStatus(username, isOnline);
    }
}