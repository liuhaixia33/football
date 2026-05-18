package com.football.team.dto.req;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ApplyJoinReq {
    @NotBlank private String inviteCode;
}
