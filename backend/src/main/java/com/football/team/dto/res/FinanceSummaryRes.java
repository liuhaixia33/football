package com.football.team.dto.res;

import com.football.team.entity.FinanceRecord;
import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data @Builder
public class FinanceSummaryRes {
    private BigDecimal totalIncome;
    private BigDecimal totalExpense;
    private BigDecimal balance;
    private List<FinanceRecord> records;
}
