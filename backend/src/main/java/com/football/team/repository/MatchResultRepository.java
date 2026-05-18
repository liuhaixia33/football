package com.football.team.repository;
import com.football.team.entity.MatchResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MatchResultRepository extends JpaRepository<MatchResult, Long> {
    Optional<MatchResult> findByActivityId(Long activityId);
    List<MatchResult> findByActivityIdIn(List<Long> activityIds);
}
