package com.football.team.dto.req;

import com.football.team.enums.RegStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegisterReq {
    @NotNull
    private RegStatus status;
}
