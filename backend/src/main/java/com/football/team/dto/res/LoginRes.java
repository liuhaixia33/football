package com.football.team.dto.res;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class LoginRes {
    private String token;
    private Long userId;
    private String nickname;
    private String avatarUrl;
    private List<TeamBriefRes> teams;
}
