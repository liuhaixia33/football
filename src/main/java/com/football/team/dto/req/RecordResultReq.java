package com.football.team.dto.req;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RecordResultReq {
    @NotNull private Integer ourScore;
    @NotNull private Integer oppScore;
    private String notes;
}
