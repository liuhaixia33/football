package com.football.team.repository;
import com.football.team.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {
    Optional<Team> findByInviteCode(String inviteCode);
}
