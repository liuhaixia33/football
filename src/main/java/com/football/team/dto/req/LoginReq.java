package com.football.team.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginReq {
    @NotBlank private String code;
    private String nickname;
    private String avatarUrl;
}
