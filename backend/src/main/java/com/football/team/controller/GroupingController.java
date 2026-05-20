package com.football.team.controller;

import com.football.team.dto.req.RandomGroupingReq;
import com.football.team.dto.req.SaveGroupingReq;
import com.football.team.dto.res.ApiResponse;
import com.football.team.dto.res.GroupingRes;
import com.football.team.enums.MemberRole;
import com.football.team.security.RequireRole;
import com.football.team.service.GroupingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
public class GroupingController {

    private final GroupingService groupingService;

    @GetMapping("/{activityId}/grouping")
    @RequireRole(MemberRole.PLAYER)
    public ApiResponse<GroupingRes> getGrouping(HttpServletRequest req,
                                                @PathVariable Long activityId) {
        Long teamId = (Long) req.getAttribute("currentTeamId");
        return ApiResponse.ok(groupingService.getGrouping(activityId, teamId));
    }

    @PutMapping("/{activityId}/grouping")
    @RequireRole(MemberRole.ADMIN)
    public ApiResponse<GroupingRes> saveGrouping(HttpServletRequest req,
                                                  @PathVariable Long activityId,
                                                  @RequestBody @Valid SaveGroupingReq body) {
        Long teamId = (Long) req.getAttribute("currentTeamId");
        return ApiResponse.ok(groupingService.saveGrouping(activityId, teamId, body));
    }

    @PostMapping("/{activityId}/grouping/random")
    @RequireRole(MemberRole.ADMIN)
    public ApiResponse<GroupingRes> randomGrouping(HttpServletRequest req,
                                                    @PathVariable Long activityId,
                                                    @RequestBody @Valid RandomGroupingReq body) {
        Long teamId = (Long) req.getAttribute("currentTeamId");
        return ApiResponse.ok(groupingService.randomGrouping(activityId, teamId, body));
    }
}
