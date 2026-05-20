package com.football.team.service;

import com.football.team.dto.req.RandomGroupingReq;
import com.football.team.dto.req.SaveGroupingReq;
import com.football.team.dto.res.GroupingRes;
import com.football.team.entity.*;
import com.football.team.enums.ActivityStatus;
import com.football.team.enums.ActivityType;
import com.football.team.enums.RegStatus;
import com.football.team.exception.BusinessException;
import com.football.team.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Collection;

@Service
@RequiredArgsConstructor
@Transactional
public class GroupingService {

    private final ActivityRepository activityRepository;
    private final ActivityRegistrationRepository regRepository;
    private final ActivityGroupRepository groupRepository;
    private final ActivityGroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public GroupingRes getGrouping(Long activityId, Long teamId) {
        findAndVerify(activityId, teamId);

        List<ActivityGroup> groups = groupRepository.findByActivityIdOrderByGroupIndex(activityId);

        Map<Long, List<ActivityGroupMember>> membersByGroup = groups.stream()
            .collect(Collectors.toMap(
                ActivityGroup::getId,
                g -> groupMemberRepository.findByGroupId(g.getId())
            ));

        Set<Long> groupedUserIds = membersByGroup.values().stream()
            .flatMap(Collection::stream)
            .map(ActivityGroupMember::getUserId)
            .collect(Collectors.toSet());

        List<Long> joinedUserIds = regRepository.findByActivityIdAndStatus(activityId, RegStatus.JOINED)
            .stream().map(ActivityRegistration::getUserId).toList();

        List<GroupingRes.GroupDto> groupDtos = groups.stream().map(g -> {
            List<GroupingRes.MemberDto> members = membersByGroup.getOrDefault(g.getId(), List.of())
                .stream().map(m -> toMemberDto(m.getUserId())).toList();
            return GroupingRes.GroupDto.builder()
                .id(g.getId()).index(g.getGroupIndex()).name(g.getGroupName())
                .members(members).build();
        }).toList();

        List<GroupingRes.MemberDto> ungrouped = joinedUserIds.stream()
            .filter(id -> !groupedUserIds.contains(id))
            .map(this::toMemberDto).toList();

        return GroupingRes.builder().groups(groupDtos).ungrouped(ungrouped).build();
    }

    public GroupingRes saveGrouping(Long activityId, Long teamId, SaveGroupingReq req) {
        Activity a = findAndVerify(activityId, teamId);
        if (a.getType() != ActivityType.TRAINING)
            throw BusinessException.badRequest("仅训练活动支持分组");
        if (a.getStatus() != ActivityStatus.OPEN)
            throw BusinessException.forbidden("活动已结束，无法修改分组");

        deleteExistingGrouping(activityId);

        LocalDateTime now = LocalDateTime.now();
        List<GroupingRes.GroupDto> groupDtos = new ArrayList<>();

        for (SaveGroupingReq.GroupDto groupReq : req.getGroups()) {
            ActivityGroup group = new ActivityGroup();
            group.setActivityId(activityId);
            group.setGroupIndex(groupReq.getIndex());
            group.setGroupName(groupReq.getName());
            group.setCreatedAt(now);
            group.setUpdatedAt(now);
            ActivityGroup saved = groupRepository.save(group);

            List<GroupingRes.MemberDto> memberDtos = new ArrayList<>();
            for (Long userId : groupReq.getMemberIds()) {
                ActivityGroupMember m = new ActivityGroupMember();
                m.setGroupId(saved.getId());
                m.setUserId(userId);
                groupMemberRepository.save(m);
                memberDtos.add(toMemberDto(userId));
            }

            groupDtos.add(GroupingRes.GroupDto.builder()
                .id(saved.getId()).index(saved.getGroupIndex()).name(saved.getGroupName())
                .members(memberDtos).build());
        }

        Set<Long> groupedIds = req.getGroups().stream()
            .flatMap(g -> g.getMemberIds().stream()).collect(Collectors.toSet());

        List<GroupingRes.MemberDto> ungrouped = regRepository
            .findByActivityIdAndStatus(activityId, RegStatus.JOINED).stream()
            .filter(r -> !groupedIds.contains(r.getUserId()))
            .map(r -> toMemberDto(r.getUserId())).toList();

        return GroupingRes.builder().groups(groupDtos).ungrouped(ungrouped).build();
    }

    public GroupingRes randomGrouping(Long activityId, Long teamId, RandomGroupingReq req) {
        Activity a = findAndVerify(activityId, teamId);
        if (a.getType() != ActivityType.TRAINING)
            throw BusinessException.badRequest("仅训练活动支持分组");
        if (a.getStatus() != ActivityStatus.OPEN)
            throw BusinessException.forbidden("活动已结束，无法修改分组");

        List<Long> joinedIds = regRepository.findByActivityIdAndStatus(activityId, RegStatus.JOINED)
            .stream().map(ActivityRegistration::getUserId).collect(Collectors.toCollection(ArrayList::new));

        if (joinedIds.isEmpty())
            throw BusinessException.badRequest("暂无可分配队员");

        Collections.shuffle(joinedIds);
        int k = req.getGroupCount();
        int base = joinedIds.size() / k;
        int extra = joinedIds.size() % k;

        List<SaveGroupingReq.GroupDto> groupDtos = new ArrayList<>();
        int offset = 0;
        for (int i = 0; i < k; i++) {
            int size = base + (i < extra ? 1 : 0);
            SaveGroupingReq.GroupDto g = new SaveGroupingReq.GroupDto();
            g.setIndex(i);
            g.setName(req.getGroupNames().get(i));
            g.setMemberIds(new ArrayList<>(joinedIds.subList(offset, offset + size)));
            groupDtos.add(g);
            offset += size;
        }

        SaveGroupingReq saveReq = new SaveGroupingReq();
        saveReq.setGroupCount(k);
        saveReq.setGroups(groupDtos);
        return saveGrouping(activityId, teamId, saveReq);
    }

    private void deleteExistingGrouping(Long activityId) {
        List<ActivityGroup> existing = groupRepository.findByActivityIdOrderByGroupIndex(activityId);
        if (!existing.isEmpty()) {
            List<Long> groupIds = existing.stream().map(ActivityGroup::getId).toList();
            groupMemberRepository.deleteByGroupIdIn(groupIds);
            groupRepository.deleteAll(existing);
        }
    }

    private Activity findAndVerify(Long activityId, Long teamId) {
        Activity a = activityRepository.findById(activityId)
            .orElseThrow(() -> BusinessException.notFound("活动不存在"));
        if (!a.getTeamId().equals(teamId))
            throw BusinessException.notFound("活动不存在");
        return a;
    }

    private GroupingRes.MemberDto toMemberDto(Long userId) {
        User u = userRepository.findById(userId)
            .orElseThrow(() -> BusinessException.notFound("用户不存在: " + userId));
        return GroupingRes.MemberDto.builder()
            .userId(u.getId()).nickname(u.getNickname()).avatarUrl(u.getAvatarUrl())
            .build();
    }
}
