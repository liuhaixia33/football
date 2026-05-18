package com.football.team.entity;
import com.football.team.enums.RegStatus;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "activity_registration")
public class ActivityRegistration {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long activityId;
    private Long userId;
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(16)")
    private RegStatus status = RegStatus.JOINED;
    private LocalDateTime createdAt = LocalDateTime.now();
}
