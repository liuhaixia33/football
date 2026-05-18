package com.football.team.service;

import com.football.team.dto.req.CreateFinanceRecordReq;
import com.football.team.dto.req.MarkFeeReq;
import com.football.team.dto.req.SetMemberFeeReq;
import com.football.team.dto.res.FinanceSummaryRes;
import com.football.team.dto.res.MemberFeeRes;
import com.football.team.entity.FinanceRecord;
import com.football.team.entity.MemberFee;
import com.football.team.entity.User;
import com.football.team.enums.FinanceType;
import com.football.team.enums.MemberStatus;
import com.football.team.exception.BusinessException;
import com.football.team.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service @RequiredArgsConstructor @Transactional
public class FinanceService {

    private final FinanceRecordRepository financeRecordRepository;
    private final MemberFeeRepository memberFeeRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;

    public FinanceRecord createRecord(Long teamId, Long creatorId, CreateFinanceRecordReq req) {
        FinanceRecord record = new FinanceRecord();
        record.setTeamId(teamId);
        record.setCreatedBy(creatorId);
        record.setType(req.getType());
        record.setAmount(req.getAmount());
        record.setCategory(req.getCategory());
        record.setDescription(req.getDescription() != null ? req.getDescription() : "");
        record.setRecordDate(req.getRecordDate());
        return financeRecordRepository.save(record);
    }

    @Transactional(readOnly = true)
    public FinanceSummaryRes getSummary(Long teamId, LocalDate from, LocalDate to) {
        List<FinanceRecord> records = (from != null && to != null)
            ? financeRecordRepository.findByTeamIdAndRecordDateBetweenOrderByRecordDateDesc(teamId, from, to)
            : financeRecordRepository.findByTeamIdOrderByRecordDateDesc(teamId);

        BigDecimal income = records.stream()
            .filter(r -> r.getType() == FinanceType.INCOME)
            .map(FinanceRecord::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal expense = records.stream()
            .filter(r -> r.getType() == FinanceType.EXPENSE)
            .map(FinanceRecord::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        return FinanceSummaryRes.builder()
            .totalIncome(income).totalExpense(expense)
            .balance(income.subtract(expense)).records(records).build();
    }

    public void setMemberFee(Long teamId, SetMemberFeeReq req) {
        teamMemberRepository.findByTeamIdAndStatus(teamId, MemberStatus.ACTIVE)
            .forEach(m -> {
                MemberFee fee = memberFeeRepository
                    .findByTeamIdAndUserIdAndSeason(teamId, m.getUserId(), req.getSeason())
                    .orElse(new MemberFee());
                fee.setTeamId(teamId);
                fee.setUserId(m.getUserId());
                fee.setSeason(req.getSeason());
                fee.setAmountDue(req.getAmountDue());
                memberFeeRepository.save(fee);
            });
    }

    public void markFee(Long teamId, MarkFeeReq req) {
        MemberFee fee = memberFeeRepository
            .findByTeamIdAndUserIdAndSeason(teamId, req.getUserId(), req.getSeason())
            .orElseThrow(() -> BusinessException.notFound("队费记录不存在"));
        fee.setAmountPaid(req.getAmountPaid());
        fee.setPaid(req.getAmountPaid().compareTo(fee.getAmountDue()) >= 0);
        memberFeeRepository.save(fee);
    }

    @Transactional(readOnly = true)
    public List<MemberFeeRes> getMemberFees(Long teamId, short season) {
        return memberFeeRepository.findByTeamIdAndSeason(teamId, season).stream()
            .map(f -> {
                User u = userRepository.findById(f.getUserId()).orElseThrow();
                return MemberFeeRes.builder()
                    .userId(u.getId()).nickname(u.getNickname())
                    .amountDue(f.getAmountDue()).amountPaid(f.getAmountPaid())
                    .isPaid(f.isPaid()).build();
            }).toList();
    }
}
