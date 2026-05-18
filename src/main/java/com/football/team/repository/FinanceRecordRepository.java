package com.football.team.repository;
import com.football.team.entity.FinanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface FinanceRecordRepository extends JpaRepository<FinanceRecord, Long> {
    List<FinanceRecord> findByTeamIdOrderByRecordDateDesc(Long teamId);
    List<FinanceRecord> findByTeamIdAndRecordDateBetweenOrderByRecordDateDesc(
        Long teamId, LocalDate from, LocalDate to);
}
