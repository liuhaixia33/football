package com.football.team.entity;
import com.football.team.enums.FinanceType;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "finance_record")
public class FinanceRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long teamId;
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(16)")
    private FinanceType type;
    private BigDecimal amount;
    private String category;
    private String description;
    private LocalDate recordDate;
    private Long createdBy;
    private LocalDateTime createdAt = LocalDateTime.now();
}
