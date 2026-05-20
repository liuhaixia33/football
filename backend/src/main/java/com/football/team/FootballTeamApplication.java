package com.football.team;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FootballTeamApplication {
    public static void main(String[] args) {
        SpringApplication.run(FootballTeamApplication.class, args);
    }
}
