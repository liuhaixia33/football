package com.football.team.service;

import com.football.team.enums.ActivityStatus;
import com.football.team.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ActivityScheduler {

    private static final Logger log = LoggerFactory.getLogger(ActivityScheduler.class);

    private final ActivityRepository activityRepository;

    // 每分钟执行一次：把开始时间已过且仍处于 OPEN/CLOSED 的活动流转为 FINISHED
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void finishExpiredActivities() {
        int count = activityRepository.bulkUpdateStatusByStartTimeBefore(
            ActivityStatus.FINISHED,
            List.of(ActivityStatus.OPEN, ActivityStatus.CLOSED),
            LocalDateTime.now()
        );
        if (count > 0) {
            log.info("自动关闭过期活动 {} 场", count);
        }
    }
}
