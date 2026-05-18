package com.football.team.dto.req;
import com.football.team.enums.MemberRole;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SetRoleReq {
    @NotNull private Long userId;
    @NotNull private MemberRole role;
}
