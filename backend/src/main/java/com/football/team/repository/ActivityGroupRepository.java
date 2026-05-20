package com.football.team.repository;

import com.football.team.entity.ActivityGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ActivityGroupRepository extends JpaRepository<ActivityGroup, Long> {
    List<ActivityGroup> findByActivityIdOrderByGroupIndex(Long activityId);
    void deleteByActivityId(Long activityId);
}
