CREATE TABLE `finance_record` (
  `id`          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `team_id`     BIGINT       NOT NULL,
  `type`        VARCHAR(16)  NOT NULL,
  `amount`      DECIMAL(10,2) NOT NULL,
  `category`    VARCHAR(32)  NOT NULL,
  `description` VARCHAR(255) NOT NULL DEFAULT '',
  `record_date` DATE         NOT NULL,
  `created_by`  BIGINT       NOT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_team_date` (`team_id`, `record_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `member_fee` (
  `id`           BIGINT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `team_id`      BIGINT         NOT NULL,
  `user_id`      BIGINT         NOT NULL,
  `season`       SMALLINT       NOT NULL,
  `amount_due`   DECIMAL(10,2)  NOT NULL DEFAULT 0,
  `amount_paid`  DECIMAL(10,2)  NOT NULL DEFAULT 0,
  `is_paid`      TINYINT(1)     NOT NULL DEFAULT 0,
  `updated_at`   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_team_user_season` (`team_id`, `user_id`, `season`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
