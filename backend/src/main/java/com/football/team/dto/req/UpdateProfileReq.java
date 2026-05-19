package com.football.team.dto.req;

import lombok.Data;

@Data
public class UpdateProfileReq {
    private String nickname;
    private String avatarUrl;
}
