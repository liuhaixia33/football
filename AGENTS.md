# Football Team 项目 — Agent 指南

## 项目结构

```
backend/          Spring Boot 3.2.5 + Java 17
frontend/         Taro v3.6.34 + React (微信小程序)
docs/             设计文档
scripts/          构建/部署脚本
```


## 构建

### 后端
```bash
cd backend && mvn clean package -DskipTests
# 输出: backend/target/team-backend-1.0.0.jar
```

### 前端
```bash
cd frontend && npm run build:weapp
# 输出: frontend/dist/
# 然后使用微信开发者工具打开 frontend/dist 并上传
```

## 部署

### 服务器信息
- **ECS**: `root@8.152.193.56`
- **密码**: `930304@ecs`
- **域名**: `https://ball.xiyanziran.top`
- **部署方式**: systemd service
- **JAR 路径**: `/opt/football-team/football-team.jar`
- **服务名**: `football-team`
- **日志**: `/var/log/football-team/app.log`, `/var/log/football-team/error.log`

### 一键部署脚本
```bash
# 仅部署后端
./scripts/deploy.sh backend

# 仅构建前端
./scripts/deploy.sh frontend

# 前后端全部构建并部署后端
./scripts/deploy.sh all

# 自定义服务器
ECS_HOST=1.2.3.4 ECS_PASS=xxx ./scripts/deploy.sh backend
```

### 手动操作
```bash
# 上传 JAR
scp backend/target/team-backend-1.0.0.jar root@8.152.193.56:/opt/football-team/football-team.jar

# 重启服务
ssh root@8.152.193.56 "systemctl restart football-team"

# 查看状态
ssh root@8.152.193.56 "systemctl status football-team"

# 查看日志
ssh root@8.152.193.56 "tail -f /var/log/football-team/app.log"
```

## 环境变量 (systemd)

服务文件: `/etc/systemd/system/football-team.service`

关键环境变量:
- `JWT_SECRET`
- `WECHAT_APP_ID` / `WECHAT_APP_SECRET`
- `OSS_KEY_ID` / `OSS_KEY_SECRET`
- `OSS_ENDPOINT` / `OSS_BUCKET` / `OSS_BASE_URL`

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Taro 3.6, React, TypeScript, Zustand |
| 后端 | Spring Boot 3.2, Java 17, JPA, Flyway |
| 数据库 | MySQL (RDS), Redis (阿里云) |
| 存储 | 阿里云 OSS (bucket: ball-mini) |
| 部署 | systemd + Nginx (Docker) |
| SSL | Let's Encrypt (acme.sh) |
