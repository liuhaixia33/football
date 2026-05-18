package com.football.team.controller;

import com.football.team.dto.req.CreateFinanceRecordReq;
import com.football.team.dto.req.MarkFeeReq;
import com.football.team.dto.req.SetMemberFeeReq;
import com.football.team.dto.res.ApiResponse;
import com.football.team.dto.res.FinanceSummaryRes;
import com.football.team.dto.res.MemberFeeRes;
import com.football.team.entity.FinanceRecord;
import com.football.team.entity.User;
import com.football.team.enums.MemberRole;
import com.football.team.security.RequireRole;
import com.football.team.service.FinanceService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/finance")
@RequiredArgsConstructor
public class FinanceController {

    private final FinanceService financeService;

    @GetMapping("/team/{teamId}/summary")
    @RequireRole(MemberRole.ADMIN)
    public ApiResponse<FinanceSummaryRes> summary(
            @PathVariable Long teamId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.ok(financeService.getSummary(teamId, from, to));
    }

    @PostMapping("/team/{teamId}/records")
    @RequireRole(MemberRole.ADMIN)
    public ApiResponse<FinanceRecord> create(HttpServletRequest req,
                                             @PathVariable Long teamId,
                                             @RequestBody @Valid CreateFinanceRecordReq body) {
        User user = (User) req.getAttribute("currentUser");
        return ApiResponse.ok(financeService.createRecord(teamId, user.getId(), body));
    }

    @PostMapping("/team/{teamId}/fees/set")
    @RequireRole(MemberRole.CAPTAIN)
    public ApiResponse<Void> setFee(@PathVariable Long teamId,
                                    @RequestBody @Valid SetMemberFeeReq body) {
        financeService.setMemberFee(teamId, body);
        return ApiResponse.ok(null);
    }

    @PutMapping("/team/{teamId}/fees/mark")
    @RequireRole(MemberRole.ADMIN)
    public ApiResponse<Void> markFee(@PathVariable Long teamId,
                                     @RequestBody @Valid MarkFeeReq body) {
        financeService.markFee(teamId, body);
        return ApiResponse.ok(null);
    }

    @GetMapping("/team/{teamId}/fees")
    @RequireRole(MemberRole.ADMIN)
    public ApiResponse<List<MemberFeeRes>> memberFees(@PathVariable Long teamId,
                                                      @RequestParam short season) {
        return ApiResponse.ok(financeService.getMemberFees(teamId, season));
    }
}
