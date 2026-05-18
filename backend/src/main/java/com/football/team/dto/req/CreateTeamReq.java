package com.football.team.dto.req;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateTeamReq {
    @NotBlank private String name;
    private String description;
    private String logoUrl;
}
