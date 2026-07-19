package com.jasmeet.realtimechatapp.dtos;

import lombok.Data;

@Data
public class RegisterRequestDTO {
    private String username;
    private String password;
    private String email;
}
