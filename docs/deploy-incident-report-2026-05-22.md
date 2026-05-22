# ECS 单台部署故障排查报告（同根问题复现）

**日期**: 2026-05-22
**影响范围**: GitHub Actions → 阿里云 ECS 后端部署流水线
**持续时间**: 约 0.5 小时
**最终状态**: ✅ 已解决

---

## 1. 事件概述

2026-05-22，昨日（05-21）将蓝绿部署重构为单台部署后，GitHub Actions 部署再次以 `exit code 7` 失败。现象与昨日完全一致：JAR 上传成功、服务重启触发成功，但随即脚本被掐断。

---

## 2. 问题现象

```
✅ JAR 上传成功
Warning: Permanently added '***' (ED25519) to the list of known hosts.
✅ 服务重启中...
Warning: Permanently added '***' (ED25519) to the list of known hosts.
Error: Process completed with exit code 7.
```

- `systemctl restart football-team` 执行成功（`✅ 服务重启中...` 打印正常）
- 健康检查循环**第一次迭代**就导致脚本终止，重试逻辑完全没有执行
- exit code 7 与昨日蓝绿部署时的故障码完全相同

---

## 3. 根因分析

### 3.1 昨日修复不完整：`set +e` 未迁移

昨日（05-21）修复蓝绿部署脚本时，最终结论之一是：

> GitHub Actions 的 `shell: bash` 实际执行 `bash -e -o pipefail {0}`，**`-e`（errexit）仍然生效**，必须在 run 块中显式写 `set +e`。

但在将蓝绿部署重构为单台部署时，新写的 Deploy 步骤只保留了 `shell: bash`，**遗漏了 `set +e`**。

### 3.2 exit code 7 的传播链

```
curl 连接失败（服务刚重启，端口未就绪）
  → curl exit code 7（CURLE_COULDNT_CONNECT）
    → SSH 将远程命令退出码透传回 runner
      → CODE=$($SSH "curl ...") 的命令替换退出码 = 7
        → bash -e 触发，脚本立即退出（不走 continue / sleep 重试）
```

### 3.3 为什么 `||` 写法也无济于事

即使健康检查写成 `CODE=$(...) || true`，也只解决了赋值行本身。在 `bash -e` + `pipefail` 下，命令替换内部的失败仍可能提前终止——与昨日结论一致。根本解法是在脚本顶部关闭 errexit。

---

## 4. 修复方案

### 4.1 在 Deploy 步骤 run 块首行加 `set +e`

```yaml
- name: Deploy to ECS
  shell: bash
  run: |
    set +e   # shell: bash 仍启用 -e，显式关闭
    SSH="ssh -o StrictHostKeyChecking=no ..."
    ...
```

### 4.2 同步添加 `LogLevel=ERROR` 消除 SSH 警告噪声

将 `-o LogLevel=ERROR` 加入 SSH 选项，消除每次连接的
`Warning: Permanently added '***' (ED25519) to the list of known hosts.` 噪声，使日志更干净。

---

## 5. 修改的文件清单

| 文件 | 修改内容 |
|------|----------|
| `.github/workflows/deploy.yml` | Deploy 步骤 run 块首行加 `set +e`；SSH 选项加 `-o LogLevel=ERROR` |
| `docs/deploy-incident-report-2026-05-22.md` | 本文档 |

---

## 6. 经验教训

### 核心教训（继承昨日）

**GitHub Actions 的 `shell: bash` ≠ 普通 bash**

| 写法 | 实际执行 | `-e` 是否生效 |
|------|----------|-------------|
| 不写 `shell` | `bash -e {0}` | ✅ 生效 |
| `shell: bash` | `bash -e -o pipefail {0}` | ✅ 生效 |
| `shell: bash` + `set +e` | `bash -e -o pipefail {0}` + 脚本内关闭 | ❌ 关闭 |

**结论**：在 GitHub Actions 里，只要 run 块有**任何可能返回非零但应当继续执行**的命令（如健康检查循环、条件判断、带重试的 curl），必须写 `set +e`。

### 新增教训：重构时不要遗漏「元规则」

蓝绿 → 单台 的重构属于架构简化，但底层的 CI 环境约束（bash -e 行为）不变。重构部署脚本时，需将以下「元规则」整体迁移：

1. `set +e` 必须保留
2. 所有错误分支用显式 `|| { echo ...; exit 1; }` 处理，不依赖 errexit
3. `systemctl restart` 而非 `systemctl start`
4. JAR 上传用 `cat|ssh` 管道，不用 `scp`

---

## 7. 后续建议

| 优先级 | 事项 | 说明 |
|--------|------|------|
| P0 | 将以上「元规则」写入 `AGENTS.md` 的部署注意事项 | 防止下次重构再次遗漏 |
| P1 | 安全轮换部署密钥 | 私钥曾在对话中暴露（继承昨日 P1） |
| P2 | 为 `scripts/deploy.sh` 添加单台部署模式 | 本地脚本目前仍是蓝绿逻辑，与线上不一致 |

---

## 8. 当前线上部署架构（单台模式）

```
GitHub Actions (Ubuntu Runner)
  ├── Build: mvn clean package
  └── Deploy:
       ├── webfactory/ssh-agent 加载私钥
       ├── cat JAR | ssh 上传到 /opt/football-team/football-team.jar
       ├── ssh systemctl restart football-team
       └── ssh curl 健康检查（最多 60s，set +e 保证重试循环正常执行）

ECS 服务器
  └── systemd football-team（单实例，port 8080）
```

---

*报告撰写: 2026-05-22*
*相关修复 Commit: 本次变更*
*关联报告: [deploy-incident-report-2026-05-21.md](deploy-incident-report-2026-05-21.md)*
