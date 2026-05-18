package com.football.team.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "user")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String openid;
    private String nickname;
    private String avatarUrl;
    private String phone;
    private LocalDateTime createdAt = LocalDateTime.now();
}
