package com.jasmeet.realtimechatapp.dtos;

import lombok.Data;

@Data
public class LoginRequestDTO {
    private String username;
    private String email;
    private String password;
}
