package com.football.team.dto.req;

import com.football.team.enums.ActivityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CreateActivityReq {
    @NotNull  private ActivityType type;
    @NotBlank private String title;
    private String opponent;
    @NotBlank private String location;
    @NotNull  private LocalDateTime startTime;
    private LocalDateTime deadline;
    private Integer maxPlayers;
}
