package com.football.team.dto.res;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class TeamBriefRes {
    private Long teamId;
    private String teamName;
    private String logoUrl;
    private String role;
}
