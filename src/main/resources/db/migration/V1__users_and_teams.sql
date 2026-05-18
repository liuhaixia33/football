CREATE TABLE `user` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `openid`      VARCHAR(64)  NOT NULL UNIQUE,
  `nickname`    VARCHAR(64)  NOT NULL DEFAULT '',
  `avatar_url`  VARCHAR(512) NOT NULL DEFAULT '',
  `phone`       VARCHAR(20)           DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `team` (
  `id`           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name`         VARCHAR(64)  NOT NULL,
  `logo_url`     VARCHAR(512) NOT NULL DEFAULT '',
  `description`  VARCHAR(255) NOT NULL DEFAULT '',
  `invite_code`  VARCHAR(16)  NOT NULL UNIQUE,
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `team_member` (
  `id`         BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `team_id`    BIGINT      NOT NULL,
  `user_id`    BIGINT      NOT NULL,
  `role`       VARCHAR(16) NOT NULL DEFAULT 'PLAYER',
  `status`     VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  `joined_at`  DATETIME             DEFAULT NULL,
  UNIQUE KEY `uk_team_user` (`team_id`, `user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
