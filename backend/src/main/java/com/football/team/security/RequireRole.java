package com.football.team.security;

import com.football.team.enums.MemberRole;
import java.lang.annotation.*;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireRole {
    MemberRole value() default MemberRole.PLAYER;
}
