package com.football.team.dto.req;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class MarkFeeReq {
    @NotNull private Long userId;
    @NotNull private Short season;
    @NotNull private BigDecimal amountPaid;
}
