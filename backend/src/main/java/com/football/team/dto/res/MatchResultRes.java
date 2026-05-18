package com.football.team.dto.res;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class MatchResultRes {
    private int ourScore;
    private int oppScore;
    private String outcome;
    private String notes;
}
