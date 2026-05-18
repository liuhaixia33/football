package com.football.team.dto.req;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RecordResultReq {
    @NotNull @Min(0) private Integer ourScore;
    @NotNull @Min(0) private Integer oppScore;
    private String notes;
}
