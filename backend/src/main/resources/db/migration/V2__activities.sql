CREATE TABLE `activity` (
  `id`           BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `team_id`      BIGINT       NOT NULL,
  `type`         VARCHAR(16)  NOT NULL,
  `title`        VARCHAR(128) NOT NULL,
  `opponent`     VARCHAR(64)           DEFAULT NULL,
  `location`     VARCHAR(128) NOT NULL DEFAULT '',
  `start_time`   DATETIME     NOT NULL,
  `deadline`     DATETIME              DEFAULT NULL,
  `max_players`  INT                   DEFAULT NULL,
  `status`       VARCHAR(16)  NOT NULL DEFAULT 'OPEN',
  `created_by`   BIGINT       NOT NULL,
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_team_start` (`team_id`, `start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `activity_registration` (
  `id`          BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `activity_id` BIGINT      NOT NULL,
  `user_id`     BIGINT      NOT NULL,
  `status`      VARCHAR(16) NOT NULL DEFAULT 'JOINED',
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_activity_user` (`activity_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `match_result` (
  `id`           BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `activity_id`  BIGINT      NOT NULL UNIQUE,
  `our_score`    INT         NOT NULL DEFAULT 0,
  `opp_score`    INT         NOT NULL DEFAULT 0,
  `outcome`      VARCHAR(8)  NOT NULL,
  `notes`        VARCHAR(255)         DEFAULT NULL,
  `created_at`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
