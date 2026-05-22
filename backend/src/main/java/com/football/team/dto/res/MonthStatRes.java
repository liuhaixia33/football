package com.football.team.dto.res;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MonthStatRes {
    private String month; // "2026-05"
    private int count;
}
