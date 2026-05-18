package com.football.team.repository;
import com.football.team.entity.TeamMember;
import com.football.team.enums.MemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    Optional<TeamMember> findByTeamIdAndUserId(Long teamId, Long userId);
    List<TeamMember> findByUserIdAndStatus(Long userId, MemberStatus status);
    List<TeamMember> findByTeamIdAndStatus(Long teamId, MemberStatus status);
    List<TeamMember> findByTeamIdAndStatusIn(Long teamId, List<MemberStatus> statuses);
}
