package com.football.team.dto.req;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReviewApplyReq {
    @NotNull private Long memberId;
    @NotNull private Boolean approve;
}
