# ECS 蓝绿部署故障排查报告

**日期**: 2026-05-21
**影响范围**: GitHub Actions → 阿里云 ECS 后端部署流水线
**持续时间**: 约 2 小时（多次迭代修复）
**最终状态**: ✅ 已解决，部署恢复正常

---

## 1. 事件概述

2026-05-21，GitHub Actions `Build & Deploy` workflow 在部署后端 JAR 到阿里云 ECS 时，持续以 `exit code 7` 失败。脚本在没有任何明确错误信息的情况下直接退出，导致部署卡死。

---

## 2. 问题现象

- Actions Run 在 `Deploy to ECS (blue-green)` 步骤失败
- 日志仅显示到 `ls -la backend/target/team-backend-1.0.0.jar`，随后直接报 `Error: Process completed with exit code 7`
- `||` 错误处理分支（如 `echo "❌ JAR 上传失败..."`）**完全没有执行**
- 服务器端两个 Java slot 均运行旧 JAR，新代码无法上线

---

## 3. 根因分析（核心问题）

### 3.1 根本原因：GitHub Actions 默认启用 `bash -e`（errexit）

GitHub Actions `run` 步骤默认使用 `bash -e {0}` 作为 shell。这意味着**任何命令返回非零退出码时，整个脚本立即终止**，即使该命令位于 `|| fallback` 结构中。

在本案例中：
- `scp`（新版 OpenSSH）在首次连接到陌生主机时，内部主机密钥缓存机制会返回一个非零 internal code
- `bash -e` 直接掐断脚本，不执行 `||` 错误处理
- 因此永远看不到真实错误日志，只能得到一个干巴巴的 `exit code 7`

### 3.2 次要原因：OpenSSH `scp` 的行为变更

OpenSSH 8.0+ 起，`scp` 默认使用 SFTP 协议而非传统 SCP 协议。SFTP 对 `-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null` 等选项的响应与 `ssh` 不一致，导致即使显式禁用主机密钥检查，仍然触发内部错误码。

### 3.3 历史遗留问题汇总

| 问题 | 影响 | 状态 |
|------|------|------|
| `curl` 健康检查无超时 | 后端线程死锁时 Actions 无限等待 | 已修复（加 `--max-time`） |
| `systemctl start` 不加载新 JAR | 若 slot 已在运行，`start` 是 no-op | 已修复（改为 `restart`） |
| `docker restart upball-nginx` | 断连接，非零停机 | 已修复（改为 `nginx -s reload`） |
| `sshpass` 在 headless 环境不稳定 | 密码注入方式与管道冲突 | 已弃用，改用 `ssh-agent` |

---

## 4. 排查时间线

### 第 1 轮：增加 curl 超时 + 健康检查端点替换
- **改动**: `curl` 加 `--max-time 10 --connect-timeout 5`；端点从 `POST /api/v1/auth/login` 改为 `GET /api/v1/activities/team/1`
- **结果**: ❌ 仍失败，`exit code 7` 不变
- **结论**: 问题不在健康检查，而在更早的上传阶段

### 第 2 轮：`systemctl start` → `restart`
- **改动**: 确保 inactive slot 必然加载新 JAR
- **结果**: ❌ 仍失败
- **结论**: 问题不在启动命令

### 第 3 轮：弃用 `scp`，改用 `cat|ssh` 管道
- **改动**: 怀疑 `scp` 的 `-o` 选项不兼容，改用 `cat file | ssh "cat > dest"`
- **结果**: ❌ 仍失败
- **结论**: 问题不在 `scp` 本身，而在 `sshpass` 与管道的 stdin 冲突

### 第 4 轮：`sshpass` 密码注入方式迭代
- **改动**: 先后尝试 `sshpass -p` → `sshpass -e`（环境变量）→ `sshpass -f`（临时文件）
- **结果**: ❌ 全部失败
- **结论**: `sshpass` 在 GitHub Actions 的 headless runner 上根本不稳定，应彻底弃用

### 第 5 轮：改用 `ssh-agent` + SSH 密钥认证
- **改动**: 使用 `webfactory/ssh-agent@v0.9.0` 加载私钥，移除所有 `sshpass` 代码
- **结果**: ❌ 仍失败（`scp` 返回 `exit code 7`）
- **结论**: `scp` 即使配合 `ssh-agent`，在 runner 上仍有内部兼容性问题

### 第 6 轮：关闭 `bash -e`（最终修复）
- **改动**: 显式设置 `shell: bash` + `set +e`，彻底关闭 errexit；同时弃用 `scp`，保留 `cat|ssh` 管道
- **结果**: ✅ **部署成功**
- **根因确认**: `bash -e` 掩盖了 `scp` 的内部非零码，导致脚本被提前掐断

---

## 5. 最终解决方案

### 5.1 认证方式：SSH 密钥 + `ssh-agent`

- 在 ECS 服务器生成 `ed25519` 部署专用密钥对
- 公钥追加到 `~/.ssh/authorized_keys`
- 私钥存储于 GitHub Secrets（`ECS_SSH_KEY`）
- Actions 中使用 `webfactory/ssh-agent@v0.9.0` 加载密钥

**优势**：彻底摆脱 `sshpass` 的 headless 兼容性问题，符合业界标准做法。

### 5.2 文件上传：`cat|ssh` 管道

```bash
cat backend/target/team-backend-1.0.0.jar | \
  $SSH "cat > /opt/football-team/football-team.jar.tmp && \
         mv /opt/football-team/football-team.jar.tmp /opt/football-team/football-team.jar"
```

**优势**：完全绕过 `scp`，使用已验证可用的原生 `ssh` 命令，stdin 行为可预测。

### 5.3 Shell 行为：显式关闭 `errexit`

```yaml
- name: Deploy to ECS (blue-green)
  shell: bash          # 覆盖默认的 bash -e
  run: |
    set +e              # 双重保险，关闭 errexit
    # ... 部署脚本 ...
```

**优势**：错误处理完全由 `||` 和 `if` 显式控制，不再被 `bash -e` 意外掐断。

### 5.4 健康检查：带超时的 GET 端点

```bash
curl -s --max-time 10 --connect-timeout 5 \
  -o /dev/null -w '%{http_code}' \
  http://127.0.0.1:$PORT/api/v1/activities/team/1
```

**优势**：只读端点，即使后端有异常也不会 hang 死；curl 超时可控。

### 5.5 Nginx 切换：`nginx -s reload`（零停机）

```bash
sed -i 's|server 172.17.0.1:[0-9]*;|server 172.17.0.1:$INACTIVE_PORT;|' \
  /root/upball-project/upball/docker/nginx/nginx.conf && \
  docker exec upball-nginx nginx -s reload
```

**优势**：不中断现有连接，实现真正的零停机切换。

---

## 6. 修改的文件清单

| 文件 | 修改内容 |
|------|----------|
| `.github/workflows/deploy.yml` | 全面重写部署脚本：改用 `webfactory/ssh-agent`、弃用 `sshpass`、弃用 `scp`、关闭 `bash -e`、优化健康检查 |
| `scripts/deploy.sh` | 同步改进 `ssh_run` 和上传逻辑，增强健壮性 |
| `docs/deploy-incident-report-2026-05-21.md` | 本文档 |

---

## 7. 经验教训

1. **GitHub Actions 默认 `bash -e` 是隐形陷阱**
   - `run` 步骤默认使用 `bash -e {0}`，很多开发者不知道
   - `cmd || fallback` 在 `set -e` 下理论上能工作，但**管道命令**（`cat | ssh`）或**复合命令**的行为可能出人意料
   - **建议**：复杂部署脚本始终显式声明 `shell: bash`（不带 `-e`）或 `set +e`

2. **`sshpass` 在 CI 环境中不可靠**
   - `sshpass` 依赖 TTY/stdin 状态，在 headless runner 上行为不可预测
   - **建议**：CI/CD 场景统一使用 SSH 密钥 + `ssh-agent`，彻底弃用密码认证

3. **`scp` 在现代 OpenSSH 中已非首选**
   - OpenSSH 8.0+ 默认使用 SFTP 协议，`-o` 选项兼容性下降
   - `rsync` 或 `cat|ssh` 管道是更可靠的选择

4. **错误日志被屏蔽会极大延长排障时间**
   - `LogLevel=ERROR` + `bash -e` 的组合导致错误信息完全不可见
   - **建议**：排障阶段先去掉日志屏蔽，看到真实错误后再清理噪声

5. **蓝绿部署需确保 `restart` 而非 `start`**
   - 若服务器重启后两个 slot 均处于 `active`，`systemctl start` 是 no-op，不会加载新 JAR
   - **建议**：部署脚本始终使用 `systemctl restart`

---

## 8. 后续建议

| 优先级 | 事项 | 说明 |
|--------|------|------|
| P1 | 安全轮换部署密钥 | 私钥曾在对话中暴露，建议重新生成并更新 `ECS_SSH_KEY` Secret |
| P2 | 清理 `Warning: Permanently added` 噪声 | 可在 Actions 中预创建 `~/.ssh/known_hosts` 或加 `-o LogLevel=QUIET` |
| P3 | 为 `scripts/deploy.sh` 增加 SSH 密钥支持 | 本地脚本目前仍依赖 `sshpass`，可统一为密钥方式 |
| P4 | 添加部署成功通知 | 在 Actions 中集成企业微信/钉钉机器人，推送部署结果 |
| P5 | 考虑服务器本地构建方案 | 若 JAR 持续增大，可改为 runner 发触发命令 → ECS 本地拉代码构建，避免网络传输 |

---

## 9. 附录：当前线上部署架构

```
GitHub Actions (Ubuntu Runner)
  ├── Build: mvn clean package
  ├── Upload Artifact (可选)
  └── Deploy:
       ├── webfactory/ssh-agent 加载私钥
       ├── ssh 检测活跃 slot (blue/green)
       ├── cat JAR | ssh 上传到 inactive slot
       ├── ssh systemctl restart inactive
       ├── ssh curl 健康检查 (最多 60s)
       ├── ssh sed + docker exec nginx -s reload
       └── ssh systemctl stop 旧 slot

ECS 服务器
  ├── Docker Nginx (upball-nginx)
  │   └── upstream football_team_server → 172.17.0.1:8080/8081
  ├── systemd football-team-blue  (port 8080)
  └── systemd football-team-green (port 8081)
```

---

*报告撰写: 2026-05-21*
*相关 Commit: `fceb02a` 及此前 8 个部署修复 commit*
