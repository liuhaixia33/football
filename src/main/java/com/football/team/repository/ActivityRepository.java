package com.football.team.repository;
import com.football.team.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByTeamIdOrderByStartTimeDesc(Long teamId);
}
