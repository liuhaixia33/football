package com.football.team.repository;
import com.football.team.entity.Activity;
import com.football.team.enums.ActivityStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByTeamIdOrderByStartTimeDesc(Long teamId);

    @Modifying
    @Query("UPDATE Activity a SET a.status = :newStatus WHERE a.status IN :statuses AND a.startTime <= :now")
    int bulkUpdateStatusByStartTimeBefore(ActivityStatus newStatus, List<ActivityStatus> statuses, LocalDateTime now);
}
