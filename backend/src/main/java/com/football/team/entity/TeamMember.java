package com.football.team.entity;
import com.football.team.enums.MemberRole;
import com.football.team.enums.MemberStatus;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Entity @Table(name = "team_member")
public class TeamMember {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long teamId;
    private Long userId;
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(16)")
    private MemberRole role = MemberRole.PLAYER;
    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(16)")
    private MemberStatus status = MemberStatus.PENDING;
    private LocalDateTime joinedAt;
}
