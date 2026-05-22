-- ============================================================
-- Test data: 5 teams × 20 members × 10 activities + registrations
-- ============================================================
DROP PROCEDURE IF EXISTS seed_football_data;

DELIMITER $$

CREATE PROCEDURE seed_football_data()
BEGIN
  DECLARE v_i          INT     DEFAULT 1;
  DECLARE v_j          INT     DEFAULT 1;
  DECLARE v_k          INT     DEFAULT 1;
  DECLARE v_team_id    BIGINT;
  DECLARE v_user_id    BIGINT;
  DECLARE v_act_id     BIGINT;
  DECLARE v_captain_id BIGINT;
  DECLARE v_act_type   VARCHAR(16);
  DECLARE v_act_status VARCHAR(16);
  DECLARE v_days       INT;
  DECLARE v_reg_count  INT;
  DECLARE v_hour       INT;

  SET v_i = 1;
  team_loop: WHILE v_i <= 5 DO

    /* ---------- 1. 创建球队 ---------- */
    INSERT INTO team (name, logo_url, description, invite_code) VALUES (
      CASE v_i
        WHEN 1 THEN '朝阳野狼FC'
        WHEN 2 THEN '海淀星际FC'
        WHEN 3 THEN '丰台龙腾队'
        WHEN 4 THEN '石景山雄鹰'
        WHEN 5 THEN '通州铁甲FC'
      END,
      '',
      CASE v_i
        WHEN 1 THEN '驰骋朝阳，永不言败，野狼精神！'
        WHEN 2 THEN '星际战士，逐鹿绿茵，勇者无畏！'
        WHEN 3 THEN '龙腾丰台，热血飞扬，锐不可当！'
        WHEN 4 THEN '雄鹰展翅，傲视群雄，永争第一！'
        WHEN 5 THEN '铁甲铮铮，通州无敌，攻无不克！'
      END,
      CASE v_i
        WHEN 1 THEN 'CYYY0001'
        WHEN 2 THEN 'HDXJ0002'
        WHEN 3 THEN 'FTLT0003'
        WHEN 4 THEN 'SJSY0004'
        WHEN 5 THEN 'TZTJ0005'
      END
    );
    SET v_team_id = LAST_INSERT_ID();

    /* ---------- 2. 创建 20 名成员 ----------
       j=1: 队长   j=2: 管理员   j=3-18: 普通球员(ACTIVE)   j=19-20: 待审核(PENDING)
    */
    SET v_j = 1;
    member_loop: WHILE v_j <= 20 DO
      INSERT INTO user (openid, nickname, avatar_url) VALUES (
        CONCAT('mock_t', v_i, '_u', v_j, '_', SUBSTRING(MD5(RAND()), 1, 10)),
        CONCAT(
          CASE v_j
            WHEN 1  THEN '张伟'   WHEN 2  THEN '王芳'  WHEN 3  THEN '李明'
            WHEN 4  THEN '刘洋'   WHEN 5  THEN '陈超'  WHEN 6  THEN '周鑫'
            WHEN 7  THEN '赵磊'   WHEN 8  THEN '吴涛'  WHEN 9  THEN '孙浩'
            WHEN 10 THEN '朱杰'   WHEN 11 THEN '胡斌'  WHEN 12 THEN '郭强'
            WHEN 13 THEN '何平'   WHEN 14 THEN '林峰'  WHEN 15 THEN '宋飞'
            WHEN 16 THEN '许建'   WHEN 17 THEN '邓刚'  WHEN 18 THEN '曹勇'
            WHEN 19 THEN '彭辉'   WHEN 20 THEN '梁天'
            ELSE CONCAT('队员', v_j)
          END,
          v_i   -- 用 teamIndex 区分同名成员
        ),
        ''
      );
      SET v_user_id = LAST_INSERT_ID();

      IF v_j = 1 THEN
        SET v_captain_id = v_user_id;
        INSERT INTO team_member (team_id, user_id, role, status, joined_at)
          VALUES (v_team_id, v_user_id, 'CAPTAIN', 'ACTIVE',
                  NOW() - INTERVAL (30 + v_i * 7) DAY);
      ELSEIF v_j = 2 THEN
        INSERT INTO team_member (team_id, user_id, role, status, joined_at)
          VALUES (v_team_id, v_user_id, 'ADMIN', 'ACTIVE',
                  NOW() - INTERVAL (25 + v_i * 5) DAY);
      ELSEIF v_j <= 18 THEN
        INSERT INTO team_member (team_id, user_id, role, status, joined_at)
          VALUES (v_team_id, v_user_id, 'PLAYER', 'ACTIVE',
                  NOW() - INTERVAL (3 + FLOOR(RAND() * 22)) DAY);
      ELSE
        INSERT INTO team_member (team_id, user_id, role, status, joined_at)
          VALUES (v_team_id, v_user_id, 'PLAYER', 'PENDING', NULL);
      END IF;

      SET v_j = v_j + 1;
    END WHILE member_loop;

    /* ---------- 3. 创建 10 个活动 ----------
       k  type      status    days   reg_count  start_hour
       1  TRAINING  OPEN      +14    8          9
       2  TRAINING  OPEN      +7     12         19
       3  MATCH     OPEN      +3     14         14
       4  TRAINING  OPEN      +45    3          10
       5  TRAINING  CLOSED    -1     16         9
       6  MATCH     CLOSED    -4     18         14
       7  TRAINING  FINISHED  -7     10         9
       8  MATCH     FINISHED  -14    14         14  WIN
       9  MATCH     FINISHED  -21    12         14  LOSE
       10 TRAINING  FINISHED  -30    15         10
    */
    SET v_k = 1;
    act_loop: WHILE v_k <= 10 DO

      SET v_act_type = CASE v_k
        WHEN 3 THEN 'MATCH' WHEN 6 THEN 'MATCH'
        WHEN 8 THEN 'MATCH' WHEN 9 THEN 'MATCH'
        ELSE 'TRAINING'
      END;

      SET v_act_status = CASE
        WHEN v_k <= 4 THEN 'OPEN'
        WHEN v_k <= 6 THEN 'CLOSED'
        ELSE 'FINISHED'
      END;

      SET v_days = CASE v_k
        WHEN 1 THEN 14  WHEN 2 THEN 7   WHEN 3 THEN 3
        WHEN 4 THEN 45  WHEN 5 THEN -1  WHEN 6 THEN -4
        WHEN 7 THEN -7  WHEN 8 THEN -14 WHEN 9 THEN -21
        WHEN 10 THEN -30 ELSE 0
      END;

      SET v_reg_count = CASE v_k
        WHEN 1 THEN 8  WHEN 2 THEN 12 WHEN 3 THEN 14
        WHEN 4 THEN 3  WHEN 5 THEN 16 WHEN 6 THEN 18
        WHEN 7 THEN 10 WHEN 8 THEN 14 WHEN 9 THEN 12
        WHEN 10 THEN 15 ELSE 5
      END;

      SET v_hour = CASE v_k
        WHEN 2 THEN 19 WHEN 3 THEN 14 WHEN 6 THEN 14
        WHEN 8 THEN 14 WHEN 9 THEN 14 WHEN 10 THEN 10
        ELSE 9
      END;

      INSERT INTO activity
        (team_id, type, title, opponent, location, start_time, deadline, max_players, status, created_by)
      VALUES (
        v_team_id,
        v_act_type,
        CASE v_k
          WHEN 1 THEN CONCAT('周训 第', (v_i * 10 + 1), '期')
          WHEN 2 THEN CONCAT('夜间专项训练 #', v_i)
          WHEN 3 THEN CONCAT('城市联赛 第', (v_i * 3 + 1), '轮')
          WHEN 4 THEN CONCAT('夏季集训营 第', v_i, '期')
          WHEN 5 THEN CONCAT('赛前热身训练')
          WHEN 6 THEN CONCAT('挑战赛 VS 飞虎队', v_i)
          WHEN 7 THEN CONCAT('日常技术训练')
          WHEN 8 THEN CONCAT('联赛第', (v_i + 8), '轮')
          WHEN 9 THEN CONCAT('邀请赛半决赛')
          WHEN 10 THEN CONCAT('月度总结训练')
          ELSE '日常训练'
        END,
        IF(v_act_type = 'MATCH', CONCAT('飞虎FC', v_i * v_k), NULL),
        CASE (v_i % 5)
          WHEN 1 THEN '朝阳公园足球场'
          WHEN 2 THEN '海淀体育中心5号场'
          WHEN 3 THEN '丰台体育馆外场A'
          WHEN 4 THEN '石景山综合体育场'
          WHEN 0 THEN '通州运河体育公园'
        END,
        NOW() + INTERVAL v_days DAY + INTERVAL v_hour HOUR,
        /* deadline: 仅对未来活动设置截止日 */
        CASE
          WHEN v_days > 1 THEN NOW() + INTERVAL (v_days - 1) DAY
          ELSE NULL
        END,
        20,
        v_act_status,
        v_captain_id
      );
      SET v_act_id = LAST_INSERT_ID();

      /* ---- 比赛结果（FINISHED MATCH）---- */
      IF v_act_type = 'MATCH' AND v_act_status = 'FINISHED' THEN
        INSERT INTO match_result (activity_id, our_score, opp_score, outcome, notes) VALUES (
          v_act_id,
          CASE v_k WHEN 8 THEN 3 WHEN 9 THEN 1 ELSE 2 END,
          CASE v_k WHEN 8 THEN 1 WHEN 9 THEN 3 ELSE 2 END,
          CASE v_k WHEN 8 THEN 'WIN' WHEN 9 THEN 'LOSE' ELSE 'DRAW' END,
          CASE v_k
            WHEN 8 THEN '全队配合出色，中场控球率高，3-1大胜！'
            WHEN 9 THEN '上半场落后，全力追赶，点球大战惜败'
            ELSE '双方势均力敌，2-2平局收场'
          END
        );
      END IF;

      /* ---- 报名记录：取前 v_reg_count 名 ACTIVE 成员 ---- */
      INSERT INTO activity_registration (activity_id, user_id, status, created_at)
      SELECT
        v_act_id,
        tm.user_id,
        CASE
          WHEN ROW_NUMBER() OVER (ORDER BY tm.joined_at) <= GREATEST(v_reg_count - 2, 1)
            THEN 'JOINED'
          ELSE 'TENTATIVE'
        END,
        NOW() - INTERVAL FLOOR(RAND() * 4) DAY
      FROM team_member tm
      WHERE tm.team_id = v_team_id AND tm.status = 'ACTIVE'
      ORDER BY tm.joined_at
      LIMIT v_reg_count;

      SET v_k = v_k + 1;
    END WHILE act_loop;

    SET v_i = v_i + 1;
  END WHILE team_loop;

  SELECT '完成：5 支球队 / 100 名成员 / 50 个活动 / 报名记录已插入' AS result;
END$$

DELIMITER ;

CALL seed_football_data();
DROP PROCEDURE IF EXISTS seed_football_data;
