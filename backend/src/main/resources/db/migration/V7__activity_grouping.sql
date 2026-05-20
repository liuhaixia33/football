CREATE TABLE `activity_group` (
  `id`           BIGINT      NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `activity_id`  BIGINT      NOT NULL,
  `group_index`  INT         NOT NULL,
  `group_name`   VARCHAR(50) NOT NULL,
  `created_at`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_activity` (`activity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `activity_group_member` (
  `id`        BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `group_id`  BIGINT NOT NULL,
  `user_id`   BIGINT NOT NULL,
  KEY `idx_group` (`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
