package com.football.team.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "member_fee")
public class MemberFee {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long teamId;
    private Long userId;
    private short season;
    private BigDecimal amountDue = BigDecimal.ZERO;
    private BigDecimal amountPaid = BigDecimal.ZERO;
    private boolean isPaid = false;
    private LocalDateTime updatedAt;
}
