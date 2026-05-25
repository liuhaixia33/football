package com.football.team.dto.req;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SetMemberTagReq {
    @Size(max = 6, message = "标签最长6个字符")
    private String tag;
}
