package com.football.team.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data @Entity @Table(name = "activity_group_member")
public class ActivityGroupMember {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long groupId;
    private Long userId;
}
