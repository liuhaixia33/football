package com.football.team.repository;
import com.football.team.entity.MemberFee;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MemberFeeRepository extends JpaRepository<MemberFee, Long> {
    List<MemberFee> findByTeamIdAndSeason(Long teamId, short season);
    Optional<MemberFee> findByTeamIdAndUserIdAndSeason(Long teamId, Long userId, short season);
}
