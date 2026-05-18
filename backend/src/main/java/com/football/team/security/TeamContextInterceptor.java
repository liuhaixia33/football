package com.football.team.security;

import com.football.team.entity.TeamMember;
import com.football.team.entity.User;
import com.football.team.enums.MemberStatus;
import com.football.team.exception.BusinessException;
import com.football.team.repository.TeamMemberRepository;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class TeamContextInterceptor implements HandlerInterceptor {

    private final TeamMemberRepository teamMemberRepository;

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) {
        if (!(handler instanceof HandlerMethod method)) return true;

        User user = (User) req.getAttribute("currentUser");
        if (user == null) throw BusinessException.unauthorized("请先登录");

        String teamIdHeader = req.getHeader("X-Team-Id");
        RequireRole requireRole = method.getMethodAnnotation(RequireRole.class);

        if (requireRole == null && teamIdHeader == null) return true;

        if (teamIdHeader == null) throw BusinessException.badRequest("缺少 X-Team-Id 请求头");

        Long teamId = Long.parseLong(teamIdHeader);
        req.setAttribute("currentTeamId", teamId);

        TeamMember member = teamMemberRepository
            .findByTeamIdAndUserId(teamId, user.getId())
            .orElseThrow(() -> BusinessException.forbidden("您不是该球队成员"));

        if (member.getStatus() != MemberStatus.ACTIVE)
            throw BusinessException.forbidden("您的成员资格尚未激活");

        TeamContextHolder.set(member.getRole());

        if (requireRole != null && !TeamContextHolder.isAtLeast(requireRole.value()))
            throw BusinessException.forbidden("权限不足");

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest req, HttpServletResponse res,
                                Object handler, Exception ex) {
        TeamContextHolder.clear();
    }
}
