package com.football.team.dto.req;

import com.football.team.enums.FinanceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateFinanceRecordReq {
    @NotNull private FinanceType type;
    @NotNull @Positive private BigDecimal amount;
    @NotBlank private String category;
    private String description;
    @NotNull private LocalDate recordDate;
}
