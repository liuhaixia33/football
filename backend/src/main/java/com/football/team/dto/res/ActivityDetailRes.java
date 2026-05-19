package com.football.team.dto.res;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class ActivityDetailRes {
    private ActivityRes activity;
    private List<RegistrationRes> registrations;
    private MatchResultRes result;
}
