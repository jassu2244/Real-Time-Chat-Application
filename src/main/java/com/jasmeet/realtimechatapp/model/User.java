package com.jasmeet.realtimechatapp.model;

import com.jasmeet.realtimechatapp.miscellaneous.Role;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@Data
@Table(name = "users")
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false,  unique = true)
    private String username;
    @Column(nullable = false)
    private String password;
    @Column(nullable = false,   unique = true)
    private String email;
    @Column(nullable = false,   name = "is_online")
    private boolean isOnline;
    @Enumerated(EnumType.STRING)
    private Role role;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return java.util.List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }
}
