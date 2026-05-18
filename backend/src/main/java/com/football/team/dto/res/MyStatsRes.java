package com.football.team.dto.res;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class MyStatsRes {
    private int totalMatches;
    private int wins;
    private int draws;
    private int losses;
}
