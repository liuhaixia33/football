package com.football.team.dto.req;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class SetMemberFeeReq {
    @NotNull private Short season;
    @NotNull @Positive private BigDecimal amountDue;
}
