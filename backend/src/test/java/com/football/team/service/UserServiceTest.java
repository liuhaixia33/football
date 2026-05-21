package com.football.team.service;

import com.football.team.dto.req.UpdateProfileReq;
import com.football.team.entity.User;
import com.football.team.exception.BusinessException;
import com.football.team.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock TeamRepository teamRepository;
    @Mock ActivityRegistrationRepository regRepository;
    @Mock ActivityRepository activityRepository;
    @Mock MatchResultRepository matchResultRepository;
    @Mock ContentSafetyService contentSafetyService;
    @InjectMocks UserService userService;

    @Test
    void updateProfile_updatesNicknameAndAvatar() {
        User user = new User();
        user.setId(1L);
        user.setNickname("old");
        user.setAvatarUrl("old-url");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UpdateProfileReq req = new UpdateProfileReq();
        req.setNickname("new");
        req.setAvatarUrl("https://oss.example.com/avatars/1_123.jpg");

        userService.updateProfile(1L, req);

        assertThat(user.getNickname()).isEqualTo("new");
        assertThat(user.getAvatarUrl()).isEqualTo("https://oss.example.com/avatars/1_123.jpg");
        verify(userRepository).save(user);
    }

    @Test
    void updateProfile_nullFields_notUpdated() {
        User user = new User();
        user.setId(1L);
        user.setNickname("old");
        user.setAvatarUrl("old-url");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UpdateProfileReq req = new UpdateProfileReq();
        req.setNickname("new-name");

        userService.updateProfile(1L, req);

        assertThat(user.getNickname()).isEqualTo("new-name");
        assertThat(user.getAvatarUrl()).isEqualTo("old-url");
        verify(userRepository).save(user);
    }

    @Test
    void updateProfile_userNotFound_throwsNotFound() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        UpdateProfileReq req = new UpdateProfileReq();
        req.setNickname("name");

        assertThrows(BusinessException.class, () -> userService.updateProfile(99L, req));
    }
}
