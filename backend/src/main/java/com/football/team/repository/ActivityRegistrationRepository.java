package com.football.team.repository;
import com.football.team.entity.ActivityRegistration;
import com.football.team.enums.RegStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ActivityRegistrationRepository extends JpaRepository<ActivityRegistration, Long> {
    Optional<ActivityRegistration> findByActivityIdAndUserId(Long activityId, Long userId);
    List<ActivityRegistration> findByActivityIdAndStatus(Long activityId, RegStatus status);
    List<ActivityRegistration> findByActivityIdAndStatusIn(Long activityId, Collection<RegStatus> statuses);
    long countByActivityIdAndStatus(Long activityId, RegStatus status);
    List<ActivityRegistration> findByUserIdAndStatus(Long userId, RegStatus status);
}
