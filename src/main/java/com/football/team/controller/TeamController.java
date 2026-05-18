package com.football.team.controller;

import com.football.team.dto.req.*;
import com.football.team.dto.res.ApiResponse;
import com.football.team.dto.res.MemberRes;
import com.football.team.entity.Team;
import com.football.team.entity.User;
import com.football.team.enums.MemberRole;
import com.football.team.security.RequireRole;
import com.football.team.service.TeamService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @PostMapping
    public ApiResponse<Team> create(HttpServletRequest req,
                                    @RequestBody @Valid CreateTeamReq body) {
        User user = (User) req.getAttribute("currentUser");
        return ApiResponse.ok(teamService.createTeam(user.getId(), body));
    }

    @PostMapping("/join")
    public ApiResponse<Void> join(HttpServletRequest req,
                                  @RequestBody @Valid ApplyJoinReq body) {
        User user = (User) req.getAttribute("currentUser");
        teamService.applyJoin(user.getId(), body);
        return ApiResponse.ok(null);
    }

    @GetMapping("/{teamId}/members")
    @RequireRole(MemberRole.PLAYER)
    public ApiResponse<List<MemberRes>> members(@PathVariable Long teamId) {
        return ApiResponse.ok(teamService.listMembers(teamId));
    }

    @PostMapping("/{teamId}/members/review")
    @RequireRole(MemberRole.ADMIN)
    public ApiResponse<Void> review(@PathVariable Long teamId,
                                    @RequestBody @Valid ReviewApplyReq body) {
        teamService.reviewApply(teamId, body);
        return ApiResponse.ok(null);
    }

    @PutMapping("/{teamId}/members/role")
    @RequireRole(MemberRole.CAPTAIN)
    public ApiResponse<Void> setRole(@PathVariable Long teamId,
                                     @RequestBody @Valid SetRoleReq body) {
        teamService.setRole(teamId, body);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/{teamId}/members/{userId}")
    @RequireRole(MemberRole.CAPTAIN)
    public ApiResponse<Void> remove(@PathVariable Long teamId, @PathVariable Long userId) {
        teamService.removeMember(teamId, userId);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/{teamId}/leave")
    public ApiResponse<Void> leave(HttpServletRequest req, @PathVariable Long teamId) {
        User user = (User) req.getAttribute("currentUser");
        teamService.leaveTeam(teamId, user.getId());
        return ApiResponse.ok(null);
    }
}
