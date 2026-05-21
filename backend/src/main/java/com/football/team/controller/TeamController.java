package com.football.team.controller;

import com.football.team.dto.req.*;
import com.football.team.dto.res.ApiResponse;
import com.football.team.dto.res.MemberRes;
import com.football.team.dto.res.PosterRes;
import com.football.team.dto.res.TeamPublicRes;
import com.football.team.entity.Team;
import com.football.team.entity.User;
import com.football.team.enums.MemberRole;
import com.football.team.exception.BusinessException;
import com.football.team.security.RequireRole;
import com.football.team.service.PosterService;
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
    private final PosterService posterService;

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

    @GetMapping("/by-invite/{inviteCode}")
    public ApiResponse<Team> getByInviteCode(HttpServletRequest req,
                                              @PathVariable String inviteCode) {
        User user = (User) req.getAttribute("currentUser");
        if (user == null) throw BusinessException.unauthorized("请先登录");
        return ApiResponse.ok(teamService.getTeamByInviteCode(inviteCode));
    }

    @DeleteMapping("/{teamId}/leave")
    public ApiResponse<Void> leave(HttpServletRequest req, @PathVariable Long teamId) {
        User user = (User) req.getAttribute("currentUser");
        teamService.leaveTeam(teamId, user.getId());
        return ApiResponse.ok(null);
    }

    /** 公开接口：无需登录，用于扫码后展示球队信息 */
    @GetMapping("/{teamId}/public")
    public ApiResponse<TeamPublicRes> getPublicInfo(@PathVariable Long teamId) {
        return ApiResponse.ok(teamService.getPublicInfo(teamId));
    }

    /** 扫码申请加入（需登录，不需要已是成员） */
    @PostMapping("/{teamId}/apply")
    public ApiResponse<Void> applyByTeamId(HttpServletRequest req,
                                            @PathVariable Long teamId) {
        User user = (User) req.getAttribute("currentUser");
        if (user == null) throw BusinessException.unauthorized("请先登录");
        teamService.applyJoinByTeamId(user.getId(), teamId);
        return ApiResponse.ok(null);
    }

    /** 生成球队名片（仅 ADMIN 及以上） */
    @GetMapping("/{teamId}/poster")
    @RequireRole(MemberRole.ADMIN)
    public ApiResponse<PosterRes> getPoster(@PathVariable Long teamId) {
        String url = posterService.generatePoster(teamId);
        return ApiResponse.ok(new PosterRes(url));
    }
}
