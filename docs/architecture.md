# Football Team 项目架构与部署文档

## 1. 架构

```
微信小程序 (Taro/React)
    │  HTTPS
    ▼
Docker: upball-nginx (nginx:1.25-alpine)   ← Let's Encrypt / certbot
    │  http://172.17.0.1:8080 或 :8081     （Docker bridge 网关访问宿主机）
    ▼
systemd: football-team-blue (port 8080)
      或 football-team-green (port 8081)   ← 蓝绿部署，交替活跃
    ├── 阿里云 RDS MySQL
    ├── 阿里云 Redis
    └── 阿里云 OSS (图片存储)
```

**前端**：Taro 3.6 + React + TypeScript + Zustand，编译产物为微信小程序代码（`dist/`），通过微信开发者工具上传。

**后端**：Spring Boot 3.2.5 + Java 17，JPA（Hibernate）+ Flyway 管理数据库 Schema，JWT 鉴权，自定义 `@RequireRole` 注解做权限控制。

**安全层**：`JwtAuthFilter` 过滤器链 + `TeamContextInterceptor`（从请求头解析当前 team 上下文）。

---

## 2. 主要业务模块

| 模块 | 功能 |
|---|---|
| **Auth** | 微信 openid 换 JWT token，注册/登录 |
| **Team** | 创建球队、邀请码加入、审核成员、设置角色（ADMIN/PLAYER） |
| **Activity** | 创建训练/比赛活动，报名/退名，记录比赛结果，定时自动关闭过期活动（`ActivityScheduler`） |
| **Grouping** | 活动内随机分组，保存分组方案，生成分组海报 |
| **Finance** | 团队财务收支记录，会员费管理（按赛季），收支汇总 |
| **User** | 个人资料，个人数据统计（参赛次数、胜负场次等） |
| **Upload** | 头像/Logo 上传到阿里云 OSS |

**数据库表**（7 个迁移版本）：`user`、`team`、`team_member`、`activity`、`activity_registration`、`match_result`、`finance_record`、`member_fee`、`activity_group`、`activity_group_member`

---

## 3. 服务器关键路径速查

| 内容 | 路径 |
|---|---|
| JAR 文件 | `/opt/football-team/football-team.jar` |
| 环境变量 | `/opt/football-team/env`（权限 600） |
| blue 日志 | `/var/log/football-team/blue.log` / `blue-error.log` |
| green 日志 | `/var/log/football-team/green.log` / `green-error.log` |
| Nginx 主配置 | `/root/upball-project/upball/docker/nginx/nginx.conf` |
| SSL 证书（ball域名） | `/etc/ssl/ball/fullchain.pem` + `/etc/ssl/ball/privkey.key` |
| systemd blue | `/etc/systemd/system/football-team-blue.service` |
| systemd green | `/etc/systemd/system/football-team-green.service` |

### 关键说明

- **Nginx 跑在 Docker 容器 `upball-nginx` 里**，不是宿主机 systemd，`systemctl restart nginx` 无效
- **Nginx 访问后端用 `172.17.0.1`（Docker bridge 网关）**，不是 `127.0.0.1`
- **SSL 证书在 `/etc/ssl/ball/`**，通过 bind mount 挂载进 Nginx 容器
- **数据库/Redis 配置在 `application-dev.yml`** 里已硬编码，`/opt/football-team/env` 只存 JWT/微信/OSS 密钥
- 同一台 ECS 上还跑着另一个项目（`upball-server`，端口不冲突），共用同一个 Nginx 容器

---

## 4. 部署方式

### 蓝绿部署（零停机）

两个 systemd 服务交替充当活跃实例，切流通过修改 Nginx upstream 端口 + `docker exec` reload 实现：

```
旧实例 (active)  ──────────────────────── stop
                               ↑ 2s 排水
Nginx upstream  → :8080  →→→→→  → :8081
                               ↑ nginx -s reload（平滑，不断现有连接）
新实例 (inactive)        start ─────────────────
                         ↑ 健康检查通过才切流
```

### 触发方式

**推送 main 分支 → GitHub Actions 自动执行**（`.github/workflows/deploy.yml`）

也可本地手动执行：
```bash
./scripts/deploy.sh backend   # 构建 + 蓝绿部署
./scripts/deploy.sh frontend  # 仅构建前端
./scripts/deploy.sh all       # 前后端都构建并部署后端
```

### 切换 Nginx 流量的实际命令

```bash
# 将流量切到 green (port 8081)
ssh root@8.152.193.56 "
  sed -i 's|server 172.17.0.1:[0-9]*;|server 172.17.0.1:8081;|' \
    /root/upball-project/upball/docker/nginx/nginx.conf && \
  docker exec upball-nginx nginx -s reload
"
```

---

## 5. 常用运维命令

```bash
# 查看当前活跃 slot
ssh root@8.152.193.56 "systemctl is-active football-team-blue && echo blue || echo green"

# 查看服务状态
ssh root@8.152.193.56 "systemctl status football-team-blue"
ssh root@8.152.193.56 "systemctl status football-team-green"

# 查看日志
ssh root@8.152.193.56 "tail -f /var/log/football-team/blue.log"

# 重启当前活跃服务（非蓝绿，有短暂停机）
ssh root@8.152.193.56 "systemctl restart football-team-blue"

# 查看 Nginx 当前转发端口
ssh root@8.152.193.56 "grep 'server 172.17' /root/upball-project/upball/docker/nginx/nginx.conf"

# 重载 Docker Nginx（平滑，不停服）
ssh root@8.152.193.56 "docker exec upball-nginx nginx -s reload"

# 查看 Docker 容器状态
ssh root@8.152.193.56 "docker ps"
```

---

## 6. 首次初始化（新机器或重置）

```bash
# 1. 在本机执行，自动配置服务器
./scripts/setup-bluegreen.sh

# 2. 检查 env 文件是否完整（模板已上传，需确认真实值）
ssh root@8.152.193.56 "cat /opt/football-team/env"

# 3. 重启 blue 服务使配置生效
ssh root@8.152.193.56 "systemctl restart football-team-blue"
```

### systemd 服务文件格式

blue 和 green 结构相同，仅端口不同，配置模板在 `deploy/` 目录：

```ini
[Service]
ExecStart=/usr/bin/java -Xms512m -Xmx1024m -Dspring.profiles.active=dev \
          -jar /opt/football-team/football-team.jar --server.port=8080
EnvironmentFile=/opt/football-team/env   # 存放 JWT/微信/OSS 密钥
```

### env 文件内容（`/opt/football-team/env`）

```
JWT_SECRET=...
WECHAT_APP_ID=...
WECHAT_APP_SECRET=...
OSS_KEY_ID=...
OSS_KEY_SECRET=...
OSS_ENDPOINT=https://oss-cn-beijing.aliyuncs.com
OSS_BUCKET=ball-mini
OSS_BASE_URL=https://ball-mini.oss-cn-beijing.aliyuncs.com
```

> 数据库和 Redis 连接配置已在 `application-dev.yml` 中硬编码，无需在 env 中重复配置。

---

## 7. 前端部署

前端是微信小程序，**不需要服务器部署**，走微信开发者工具发布流程：

```bash
cd frontend && npm run build:weapp
# 产物: frontend/dist/
# 用微信开发者工具打开 frontend/dist → 上传 → 微信公众平台发布
```

生产环境 API 地址在 `frontend/.env.production`：
```
TARO_APP_API_BASE=https://ball.xiyanziran.top
```
