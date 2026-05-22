#!/bin/bash
set -e

# ============================================================
# 蓝绿部署 — 服务器一次性初始化脚本
# 在本机执行，通过 SSH 操作远端 ECS
#
# 用法: ./scripts/setup-bluegreen.sh
# ============================================================

ECS_HOST="${ECS_HOST:-8.152.193.56}"
ECS_USER="${ECS_USER:-root}"
ECS_PASS="${ECS_PASS:-930304@ecs}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}   $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

ssh_run() { sshpass -p "$ECS_PASS" ssh -o StrictHostKeyChecking=no "$ECS_USER@$ECS_HOST" "$1"; }
scp_put() { sshpass -p "$ECS_PASS" scp -o StrictHostKeyChecking=no "$1" "$ECS_USER@$ECS_HOST:$2"; }

if ! command -v sshpass &>/dev/null; then
    log_error "缺少 sshpass: brew install sshpass"
    exit 1
fi

log_info "=== 开始蓝绿部署初始化 ==="

# 1. 创建目录和日志目录
log_info "创建服务器目录..."
ssh_run "mkdir -p /opt/football-team /var/log/football-team /etc/ssl/football-team"

# 2. 上传 env 文件（若不存在则上传模板，提示填写）
if ssh_run "[ -f /opt/football-team/env ] && echo exists" | grep -q exists; then
    log_warn "/opt/football-team/env 已存在，跳过（保留原有配置）"
else
    log_info "上传 env 模板..."
    scp_put "$PROJECT_ROOT/deploy/env.template" "/opt/football-team/env"
    ssh_run "chmod 600 /opt/football-team/env"
    log_warn "请登录服务器填写真实配置: vi /opt/football-team/env"
fi

# 3. 上传 systemd 服务文件
log_info "上传 systemd 服务文件..."
scp_put "$PROJECT_ROOT/deploy/football-team-blue.service"  "/etc/systemd/system/football-team-blue.service"
scp_put "$PROJECT_ROOT/deploy/football-team-green.service" "/etc/systemd/system/football-team-green.service"
ssh_run "systemctl daemon-reload"
log_ok "systemd 服务文件已更新"

# 4. 验证 Docker Nginx 配置文件可访问
log_info "验证 Docker Nginx 配置..."
NGINX_CONF="/root/upball-project/upball/docker/nginx/nginx.conf"
if ssh_run "[ -f $NGINX_CONF ] && echo exists" | grep -q exists; then
    log_ok "Docker Nginx 配置文件存在: $NGINX_CONF"
else
    log_error "找不到 Docker Nginx 配置: $NGINX_CONF"
    exit 1
fi

# 5. 迁移旧服务：停止 football-team，启动 football-team-blue
log_info "迁移旧服务..."
if ssh_run "systemctl is-active football-team 2>/dev/null" | grep -q "^active"; then
    log_info "停止旧服务 football-team..."
    ssh_run "systemctl stop football-team && systemctl disable football-team" || true
fi

# 检查 JAR 是否存在
if ssh_run "[ -f /opt/football-team/football-team.jar ] && echo exists" | grep -q exists; then
    log_info "启动 football-team-blue (port 8080)..."
    ssh_run "systemctl enable football-team-blue && systemctl start football-team-blue"
    log_ok "football-team-blue 已启动"
else
    log_warn "JAR 不存在，请先执行: ./scripts/deploy.sh backend"
fi

log_ok "=== 初始化完成 ==="
echo ""
echo "  当前活跃 slot : blue (port 8080)"
echo "  下次部署执行  : ./scripts/deploy.sh backend"
echo ""
echo "  若 env 文件未填写，请先登录服务器完成配置："
echo "  ssh root@$ECS_HOST"
echo "  vi /opt/football-team/env"
echo "  systemctl restart football-team-blue"
