package com.football.team.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "activity_group")
public class ActivityGroup {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long activityId;
    private int groupIndex;
    private String groupName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
