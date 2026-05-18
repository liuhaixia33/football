package com.football.team.dto.res;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder
public class MemberRes {
    private Long memberId;
    private Long userId;
    private String nickname;
    private String avatarUrl;
    private String role;
    private String status;
    private LocalDateTime joinedAt;
}
