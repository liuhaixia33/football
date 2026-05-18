package com.football.team.service;

import com.football.team.dto.req.LoginReq;
import com.football.team.dto.res.LoginRes;
import com.football.team.dto.res.TeamBriefRes;
import com.football.team.entity.Team;
import com.football.team.entity.User;
import com.football.team.enums.MemberStatus;
import com.football.team.repository.TeamMemberRepository;
import com.football.team.repository.TeamRepository;
import com.football.team.repository.UserRepository;
import com.football.team.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final WechatService wechatService;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final JwtUtil jwtUtil;

    public LoginRes login(LoginReq req) {
        String openid = wechatService.getOpenid(req.getCode());

        Optional<User> existing = userRepository.findByOpenid(openid);
        User user;
        if (existing.isPresent()) {
            user = existing.get();
            if (req.getNickname() != null) {
                user.setNickname(req.getNickname());
                user.setAvatarUrl(req.getAvatarUrl() != null ? req.getAvatarUrl() : "");
                userRepository.save(user);
            }
        } else {
            user = new User();
            user.setOpenid(openid);
            user.setNickname(req.getNickname() != null ? req.getNickname() : "球员");
            user.setAvatarUrl(req.getAvatarUrl() != null ? req.getAvatarUrl() : "");
            user = userRepository.save(user);
        }

        List<TeamBriefRes> teams = teamMemberRepository
            .findByUserIdAndStatus(user.getId(), MemberStatus.ACTIVE)
            .stream()
            .map(m -> {
                Team t = teamRepository.findById(m.getTeamId()).orElseThrow();
                return TeamBriefRes.builder()
                    .teamId(t.getId()).teamName(t.getName())
                    .logoUrl(t.getLogoUrl()).role(m.getRole().name())
                    .build();
            }).toList();

        return LoginRes.builder()
            .token(jwtUtil.generate(user.getId()))
            .userId(user.getId())
            .nickname(user.getNickname())
            .teams(teams)
            .build();
    }
}
