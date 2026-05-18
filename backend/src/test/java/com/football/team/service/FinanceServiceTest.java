package com.football.team.service;

import com.football.team.dto.req.MarkFeeReq;
import com.football.team.dto.res.FinanceSummaryRes;
import com.football.team.entity.FinanceRecord;
import com.football.team.entity.MemberFee;
import com.football.team.enums.FinanceType;
import com.football.team.exception.BusinessException;
import com.football.team.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FinanceServiceTest {

    @Mock FinanceRecordRepository financeRecordRepository;
    @Mock MemberFeeRepository memberFeeRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock UserRepository userRepository;
    @InjectMocks FinanceService financeService;

    @Test
    void getSummary_calculatesBalanceCorrectly() {
        FinanceRecord income = new FinanceRecord();
        income.setType(FinanceType.INCOME); income.setAmount(new BigDecimal("500"));
        FinanceRecord expense = new FinanceRecord();
        expense.setType(FinanceType.EXPENSE); expense.setAmount(new BigDecimal("200"));
        when(financeRecordRepository.findByTeamIdOrderByRecordDateDesc(1L))
            .thenReturn(List.of(income, expense));

        FinanceSummaryRes res = financeService.getSummary(1L, null, null);
        assertEquals(new BigDecimal("300"), res.getBalance());
    }

    @Test
    void markFee_fullPayment_setsPaidTrue() {
        MemberFee fee = new MemberFee();
        fee.setAmountDue(new BigDecimal("200"));
        when(memberFeeRepository.findByTeamIdAndUserIdAndSeason(1L, 2L, (short) 2026))
            .thenReturn(Optional.of(fee));

        MarkFeeReq req = new MarkFeeReq();
        req.setUserId(2L); req.setSeason((short) 2026);
        req.setAmountPaid(new BigDecimal("200"));
        financeService.markFee(1L, req);

        verify(memberFeeRepository).save(argThat(MemberFee::isPaid));
    }
}
