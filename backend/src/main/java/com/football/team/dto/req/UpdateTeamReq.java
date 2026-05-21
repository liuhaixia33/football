package com.football.team.dto.req;

import lombok.Data;

@Data
public class UpdateTeamReq {
    private String name;
    private String description;
    private String logoUrl;
}
