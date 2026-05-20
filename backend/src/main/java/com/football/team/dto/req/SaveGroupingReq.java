package com.football.team.dto.req;

import lombok.Data;
import java.util.List;

@Data
public class SaveGroupingReq {
    private int groupCount;
    private List<GroupDto> groups;

    @Data
    public static class GroupDto {
        private int index;
        private String name;
        private List<Long> memberIds;
    }
}
