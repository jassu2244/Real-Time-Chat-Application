package com.jasmeet.realtimechatapp.service;

import com.jasmeet.realtimechatapp.dtos.LoginRequestDTO;
import com.jasmeet.realtimechatapp.dtos.LoginResponseDTO;
import com.jasmeet.realtimechatapp.dtos.RegisterRequestDTO;
import com.jasmeet.realtimechatapp.dtos.UserDTO;
import com.jasmeet.realtimechatapp.jwt.JwtService;
import com.jasmeet.realtimechatapp.miscellaneous.Role;
import com.jasmeet.realtimechatapp.model.User;
import com.jasmeet.realtimechatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager  authenticationManager;
    private final JwtService jwtService;

    public String register(RegisterRequestDTO registerRequestDTO) {
        if(userRepository.existsByUsername(registerRequestDTO.getUsername())) {
            throw new RuntimeException("Username is already in use");
        }
        if(userRepository.existsByEmail(registerRequestDTO.getEmail())) {
            throw new RuntimeException("Email is already in use");
        }
        User user = new User();
        user.setUsername(registerRequestDTO.getUsername());
        user.setEmail(registerRequestDTO.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequestDTO.getPassword()));
        user.setRole(Role.ROLE_USER);
        userRepository.save(user);

        return "User registered successfully";
    }

    public LoginResponseDTO login(LoginRequestDTO loginRequestDTO) {
        User user = userRepository.findByUsername(loginRequestDTO.getUsername())
                .orElseThrow(() -> new RuntimeException("Username not found"));

        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken
                (loginRequestDTO.getUsername(), loginRequestDTO.getPassword()));

        String jwtToken = jwtService.generateToken(user);

        return LoginResponseDTO.builder().token(jwtToken)
                .user(convertToDTO(user)).build();
    }

    public UserDTO convertToDTO(User user) {
        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId());
        userDTO.setUsername(user.getUsername());
        userDTO.setEmail(user.getEmail());
        return userDTO;
    }

    public ResponseEntity<String> logout() {
        ResponseCookie responseCookie = ResponseCookie.from("JWT", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .sameSite("Strict")
                .build();

        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, responseCookie.toString())
                .body("Logged Out Successfully");
    }
}
