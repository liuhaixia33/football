package com.football.team.dto.res;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class TeamPublicRes {
    private Long teamId;
    private String name;
    private String logoUrl;
    private String description;
    private int memberCount;
}
