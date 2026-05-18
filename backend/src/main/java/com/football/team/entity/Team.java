package com.football.team.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "team")
public class Team {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String logoUrl;
    private String description;
    @Column(unique = true, nullable = false)
    private String inviteCode;
    private LocalDateTime createdAt = LocalDateTime.now();
}
