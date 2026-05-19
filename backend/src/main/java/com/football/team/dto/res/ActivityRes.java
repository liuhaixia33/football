package com.football.team.dto.res;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder
public class ActivityRes {
    private Long id;
    private String type;
    private String title;
    private String opponent;
    private String location;
    private LocalDateTime startTime;
    private LocalDateTime deadline;
    private Integer maxPlayers;
    private long registeredCount;
    private String status;
    private String myStatus;
}
