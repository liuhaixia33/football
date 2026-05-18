package com.football.team.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
    "jwt.secret=test-secret-key-at-least-32-characters!!",
    "jwt.expire-hours=1",
    "wechat.app-id=test",
    "wechat.app-secret=test",
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.flyway.enabled=false"
})
class JwtUtilTest {

    @Autowired JwtUtil jwtUtil;

    @Test
    void generateAndParse_returnsCorrectUserId() {
        String token = jwtUtil.generate(42L);
        assertEquals(42L, jwtUtil.parseUserId(token));
    }

    @Test
    void parseUserId_invalidToken_returnsNull() {
        assertNull(jwtUtil.parseUserId("invalid.token.here"));
    }
}
