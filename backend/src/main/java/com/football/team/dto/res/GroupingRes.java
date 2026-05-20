package com.football.team.dto.res;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class GroupingRes {
    private List<GroupDto> groups;
    private List<MemberDto> ungrouped;

    @Data @Builder
    public static class GroupDto {
        private Long id;
        private int index;
        private String name;
        private List<MemberDto> members;
    }

    @Data @Builder
    public static class MemberDto {
        private Long userId;
        private String nickname;
        private String avatarUrl;
    }
}
