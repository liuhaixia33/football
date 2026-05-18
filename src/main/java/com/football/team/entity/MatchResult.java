package com.football.team.entity;
import com.football.team.enums.MatchOutcome;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "match_result")
public class MatchResult {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long activityId;
    private int ourScore;
    private int oppScore;
    @Enumerated(EnumType.STRING)
    private MatchOutcome outcome;
    private String notes;
    private LocalDateTime createdAt = LocalDateTime.now();
}
