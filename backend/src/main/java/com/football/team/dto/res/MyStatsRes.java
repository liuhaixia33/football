package com.football.team.dto.res;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data @Builder
public class MyStatsRes {
    // existing fields (unchanged)
    private int totalMatches;
    private int wins;
    private int draws;
    private int losses;

    // new fields
    private double attendanceRate;
    private int currentStreak;
    private int teamAttendanceRank;
    private int teamMemberCount;
    private List<MonthStatRes> monthlyStats;
}
