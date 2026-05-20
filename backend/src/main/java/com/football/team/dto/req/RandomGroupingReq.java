package com.football.team.dto.req;

import lombok.Data;
import java.util.List;

@Data
public class RandomGroupingReq {
    private int groupCount;
    private List<String> groupNames;
}
