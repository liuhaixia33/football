package com.football.team.entity;
import com.football.team.enums.ActivityStatus;
import com.football.team.enums.ActivityType;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "activity")
public class Activity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long teamId;
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(16)")
    private ActivityType type;
    private String title;
    private String opponent;
    private String location;
    private LocalDateTime startTime;
    private LocalDateTime deadline;
    private Integer maxPlayers;
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(16)")
    private ActivityStatus status = ActivityStatus.OPEN;
    private Long createdBy;
    private LocalDateTime createdAt = LocalDateTime.now();
}
