-- ============================================================
-- 测试数据：冠军队 + 多队员 + 最新活动报名数据
-- 执行前请确认 team.id / activity.id 不与现有数据冲突
-- ============================================================

-- ── 1. 插入测试用户（openid 用 test_ 前缀，不影响正式数据）──
INSERT IGNORE INTO `user` (openid, nickname, avatar_url, created_at) VALUES
('test_u01', '张伟锋',   '', NOW()),
('test_u02', '李建国',   '', NOW()),
('test_u03', '王磊磊',   '', NOW()),
('test_u04', '陈志远',   '', NOW()),
('test_u05', '刘小虎',   '', NOW()),
('test_u06', '赵鹏飞',   '', NOW()),
('test_u07', '孙浩然',   '', NOW()),
('test_u08', '周大海',   '', NOW()),
('test_u09', '吴天宇',   '', NOW()),
('test_u10', '郑锐锋',   '', NOW()),
('test_u11', '冯旭东',   '', NOW()),
('test_u12', '蒋思博',   '', NOW()),
('test_u13', '韩子龙',   '', NOW()),
('test_u14', '杨帆远',   '', NOW()),
('test_u15', '许明亮',   '', NOW()),
('test_u16', '曹一鸣',   '', NOW()),
('test_u17', '邓晨曦',   '', NOW()),
('test_u18', '薛宇航',   '', NOW()),
('test_u19', '谢凌云',   '', NOW()),
('test_u20', '林志豪',   '', NOW()),
-- 待审批加入的人员
('test_u21', '何天翔',   '', NOW()),
('test_u22', '马俊峰',   '', NOW()),
('test_u23', '罗宇博',   '', NOW());

-- ── 2. 插入冠军队 ──
INSERT IGNORE INTO `team` (name, logo_url, description, invite_code, created_at) VALUES
('冠军队', '', '屡获冠军的传奇球队', 'CHAMP2024', NOW());

-- ── 3. 把用户加入冠军队（通过 openid 查 id）──
-- 用变量拿 team_id
SET @team_id = (SELECT id FROM team WHERE invite_code = 'CHAMP2024');

-- 队长
INSERT IGNORE INTO team_member (team_id, user_id, role, status, joined_at)
SELECT @team_id, id, 'CAPTAIN', 'ACTIVE', NOW() FROM `user` WHERE openid = 'test_u01';

-- 管理员
INSERT IGNORE INTO team_member (team_id, user_id, role, status, joined_at)
SELECT @team_id, id, 'ADMIN', 'ACTIVE', NOW() FROM `user` WHERE openid = 'test_u02';

-- 正式球员 (u03 ~ u20)
INSERT IGNORE INTO team_member (team_id, user_id, role, status, joined_at)
SELECT @team_id, id, 'PLAYER', 'ACTIVE', NOW() FROM `user`
WHERE openid IN ('test_u03','test_u04','test_u05','test_u06','test_u07','test_u08',
                 'test_u09','test_u10','test_u11','test_u12','test_u13','test_u14',
                 'test_u15','test_u16','test_u17','test_u18','test_u19','test_u20');

-- 申请加入但未审批的人员（PENDING）
INSERT IGNORE INTO team_member (team_id, user_id, role, status, joined_at)
SELECT @team_id, id, 'PLAYER', 'PENDING', NULL FROM `user`
WHERE openid IN ('test_u21','test_u22','test_u23');

-- ── 4. 为冠军队创建最新活动 ──
INSERT IGNORE INTO `activity` (team_id, type, title, opponent, location, start_time, deadline, max_players, status, created_by, created_at)
SELECT
  @team_id,
  'MATCH',
  '周末联赛 - 冠军争夺战',
  '猎豹队',
  '市体育中心5号球场',
  DATE_ADD(NOW(), INTERVAL 3 DAY),
  DATE_ADD(NOW(), INTERVAL 1 DAY),
  20,
  'OPEN',
  (SELECT id FROM `user` WHERE openid = 'test_u01'),
  NOW();

SET @act_id = (SELECT id FROM activity WHERE team_id = @team_id ORDER BY created_at DESC LIMIT 1);

-- ── 5. 活动报名数据 ──

-- 已报名 JOINED（10人）
INSERT IGNORE INTO activity_registration (activity_id, user_id, status, created_at)
SELECT @act_id, id, 'JOINED', NOW() FROM `user`
WHERE openid IN ('test_u01','test_u02','test_u03','test_u04','test_u05',
                 'test_u06','test_u07','test_u08','test_u09','test_u10');

-- 待定 TENTATIVE（5人）
INSERT IGNORE INTO activity_registration (activity_id, user_id, status, created_at)
SELECT @act_id, id, 'TENTATIVE', NOW() FROM `user`
WHERE openid IN ('test_u11','test_u12','test_u13','test_u14','test_u15');

-- 请假 ABSENT（3人）
INSERT IGNORE INTO activity_registration (activity_id, user_id, status, created_at)
SELECT @act_id, id, 'ABSENT', NOW() FROM `user`
WHERE openid IN ('test_u16','test_u17','test_u18');

-- ── 完成：查看结果 ──
SELECT '=== 冠军队信息 ===' AS info;
SELECT id, name, invite_code FROM team WHERE invite_code = 'CHAMP2024';

SELECT '=== 队员统计 ===' AS info;
SELECT tm.status, tm.role, COUNT(*) as cnt
FROM team_member tm WHERE tm.team_id = @team_id
GROUP BY tm.status, tm.role;

SELECT '=== 活动报名统计 ===' AS info;
SELECT ar.status, COUNT(*) as cnt
FROM activity_registration ar WHERE ar.activity_id = @act_id
GROUP BY ar.status;
