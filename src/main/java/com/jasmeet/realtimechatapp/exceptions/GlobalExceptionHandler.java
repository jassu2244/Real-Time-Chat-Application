package com.jasmeet.realtimechatapp.exceptions;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleUserNotFound(UserNotFoundException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "USER_NOT_FOUND");
        response.put("message", ex.getMessage() != null ? ex.getMessage() : "User not exists. Please check your username or sign up.");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(org.springframework.security.core.userdetails.UsernameNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleSpringUsernameNotFound(org.springframework.security.core.userdetails.UsernameNotFoundException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "USER_NOT_FOUND");
        response.put("message", "User not exists. Please check your username or sign up.");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(InvalidUsernameException.class)
    public ResponseEntity<Map<String, String>> handleInvalidUsername(InvalidUsernameException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "INVALID_USERNAME");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "BAD_CREDENTIALS");
        String msg = ex.getMessage();
        if (msg == null || msg.equalsIgnoreCase("Bad credentials")) {
            msg = "Wrong password. Please try again.";
        }
        response.put("message", msg);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler({DataAccessException.class, SQLException.class})
    public ResponseEntity<Map<String, String>> handleDatabaseExceptions(Exception ex) {
        log.error("db instance not working / database connection error: ", ex);
        Map<String, String> response = new HashMap<>();
        response.put("error", "DATABASE_UNAVAILABLE");
        response.put("message", "Database instance not working or unreachable. Please check database service.");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "RUNTIME_EXCEPTION");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneralException(Exception ex) {
        log.error("Unhandled exception occurred: ", ex);
        Map<String, String> response = new HashMap<>();
        response.put("error", "INTERNAL_ERROR");
        response.put("message", ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred.");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
