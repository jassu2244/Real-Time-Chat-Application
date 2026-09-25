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
import com.jasmeet.realtimechatapp.exceptions.InvalidUsernameException;
import com.jasmeet.realtimechatapp.exceptions.UserNotFoundException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager  authenticationManager;
    private final JwtService jwtService;

    public String register(RegisterRequestDTO registerRequestDTO) {
        String username = registerRequestDTO.getUsername() != null ? registerRequestDTO.getUsername().trim() : "";
        if (username.contains("@")) {
            throw new InvalidUsernameException("Username cannot contain '@'. Please choose a valid username.");
        }
        if(userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username is already in use");
        }
        if(userRepository.existsByEmail(registerRequestDTO.getEmail())) {
            throw new RuntimeException("Email is already in use");
        }
        User user = new User();
        user.setUsername(username);
        user.setEmail(registerRequestDTO.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequestDTO.getPassword()));
        user.setRole(Role.ROLE_USER);
        userRepository.save(user);

        return "User registered successfully";
    }

    public LoginResponseDTO login(LoginRequestDTO loginRequestDTO) {
        String username = loginRequestDTO.getUsername() != null ? loginRequestDTO.getUsername().trim() : "";
        String password = loginRequestDTO.getPassword();

        // 1. If user entered an email address instead of username
        if (username.contains("@")) {
            if (userRepository.existsByEmail(username)) {
                throw new InvalidUsernameException("Please enter your valid username rather than your email address.");
            } else {
                throw new UserNotFoundException("User not exists. Please check your username or sign up.");
            }
        }

        // 2. Check if username exists in database
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not exists. Please check your username or sign up."));

        // 3. Authenticate password
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(username, password));
        } catch (BadCredentialsException ex) {
            throw new BadCredentialsException("Wrong password. Please try again.");
        }

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
