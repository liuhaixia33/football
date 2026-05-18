package com.football.team.security;

import com.football.team.enums.MemberRole;

public class TeamContextHolder {
    private static final ThreadLocal<MemberRole> ROLE = new ThreadLocal<>();

    public static void set(MemberRole role) { ROLE.set(role); }
    public static MemberRole get() { return ROLE.get(); }
    public static void clear() { ROLE.remove(); }

    public static boolean isAtLeast(MemberRole required) {
        MemberRole current = get();
        if (current == null) return false;
        // ordinal: CAPTAIN=0, ADMIN=1, PLAYER=2 — lower ordinal = higher privilege
        return current.ordinal() <= required.ordinal();
    }
}
