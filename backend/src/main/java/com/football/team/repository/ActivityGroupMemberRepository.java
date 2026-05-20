package com.football.team.repository;

import com.football.team.entity.ActivityGroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ActivityGroupMemberRepository extends JpaRepository<ActivityGroupMember, Long> {
    List<ActivityGroupMember> findByGroupId(Long groupId);
    void deleteByGroupId(Long groupId);
    void deleteByGroupIdIn(List<Long> groupIds);
}
