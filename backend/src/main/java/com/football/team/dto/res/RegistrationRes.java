package com.football.team.dto.res;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class RegistrationRes {
    private Long userId;
    private String nickname;
    private String avatarUrl;
    private String status;
}
