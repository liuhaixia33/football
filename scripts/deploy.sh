#!/bin/bash
set -e

# ============================================================
# Football Team 小程序 — 构建/部署脚本（蓝绿部署）
# ============================================================
# 用法:
#   ./scripts/deploy.sh backend   构建并蓝绿部署后端（零停机）
#   ./scripts/deploy.sh frontend  构建前端(微信小程序)
#   ./scripts/deploy.sh all       构建前后端并部署后端
#
# 环境变量:
#   ECS_HOST    服务器地址 (默认: 8.152.193.56)
#   ECS_USER    服务器用户 (默认: root)
#   ECS_PASS    服务器密码
# ============================================================

ECS_HOST="${ECS_HOST:-8.152.193.56}"
ECS_USER="${ECS_USER:-root}"
ECS_PASS="${ECS_PASS:-930304@ecs}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}   $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

ssh_run() {
  local passfile rc
  passfile=$(mktemp)
  echo "$ECS_PASS" > "$passfile"
  chmod 600 "$passfile"
  sshpass -f "$passfile" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -o ServerAliveInterval=30 -o ServerAliveCountMax=10 -o ConnectTimeout=10 "$ECS_USER@$ECS_HOST" "$1"
  rc=$?
  rm -f "$passfile"
  return $rc
}

# 检查依赖
check_deps() {
  if ! command -v sshpass &> /dev/null; then
    log_error "缺少 sshpass，请安装: brew install sshpass (macOS) 或 apt install sshpass (Linux)"
    exit 1
  fi
}

# 构建后端
build_backend() {
  log_info "构建后端 (Maven)..."
  cd "$PROJECT_ROOT/backend"
  mvn clean package -DskipTests
  log_ok "后端构建完成"
  ls -lh target/team-backend-1.0.0.jar
}

# 检测当前活跃 slot（blue 或 green）
detect_active_slot() {
  local status
  status=$(ssh_run "systemctl is-active football-team-blue 2>/dev/null" || true)
  if [ "$status" = "active" ]; then
    echo "blue"
  else
    echo "green"
  fi
}

# 等待新实例健康（任意 HTTP 响应即视为就绪）
wait_healthy() {
  local port=$1
  local max=30
  for i in $(seq 1 $max); do
    local code
    code=$(ssh_run "curl -s --max-time 10 --connect-timeout 5 -o /dev/null -w '%{http_code}' \
      http://127.0.0.1:$port/api/v1/activities/team/1")
    if [ "$code" != "000" ] && [ -n "$code" ]; then
      return 0
    fi
    log_info "等待服务就绪... ($i/$max)"
    sleep 2
  done
  return 1
}

# 部署后端（蓝绿切换，零停机）
deploy_backend() {
  local local_jar="$PROJECT_ROOT/backend/target/team-backend-1.0.0.jar"
  if [ ! -f "$local_jar" ]; then
    log_error "JAR 文件不存在: $local_jar，请先执行: ./scripts/deploy.sh backend"
    exit 1
  fi

  # 1. 检测当前活跃 slot
  log_info "检测活跃 slot..."
  local active inactive inactive_port
  active=$(detect_active_slot)
  if [ "$active" = "blue" ]; then
    inactive="green"; inactive_port=8081
  else
    inactive="blue";  inactive_port=8080
  fi
  log_info "当前: $active → 部署到: $inactive (port $inactive_port)"

  # 2. 上传新 JAR（运行中的 JVM 不受影响；弃用 scp，改用 cat|ssh 管道）
  log_info "上传 JAR..."
  cat "$local_jar" | ssh_run "cat > /opt/football-team/football-team.jar.tmp && mv /opt/football-team/football-team.jar.tmp /opt/football-team/football-team.jar" \
    || { log_error "JAR 上传失败，退出码 $?"; exit 1; }
  log_ok "上传完成"

  # 3. 重启 inactive slot（确保加载新 JAR）
  log_info "重启 football-team-$inactive..."
  ssh_run "systemctl restart football-team-$inactive"

  # 4. 健康检查
  log_info "健康检查 (port $inactive_port)..."
  if ! wait_healthy "$inactive_port"; then
    log_error "健康检查超时，回滚：停止 football-team-$inactive"
    ssh_run "systemctl stop football-team-$inactive"
    exit 1
  fi
  log_ok "新实例健康"

  # 5. 切换 Nginx upstream（零停机 reload）
  log_info "切换 Nginx 流量 → port $inactive_port..."
  ssh_run "sed -i 's|server 172.17.0.1:[0-9]*;|server 172.17.0.1:$inactive_port;|' \
    /root/upball-project/upball/docker/nginx/nginx.conf && \
    docker exec upball-nginx nginx -s reload"
  log_ok "Nginx 已切流到 $inactive"

  # 6. 停止旧 slot（等 2s 让 Nginx 完成在途请求转发）
  sleep 2
  log_info "停止旧 slot: football-team-$active..."
  ssh_run "systemctl stop football-team-$active"
  log_ok "部署完成 ✓  活跃 slot: $inactive (port $inactive_port)"
}

# 构建前端
build_frontend() {
  log_info "构建前端 (微信小程序)..."
  cd "$PROJECT_ROOT/frontend"
  npm run build:weapp
  log_ok "前端构建完成"
  log_warn "请使用微信开发者工具打开 frontend/dist 目录并上传"
}

# 主逻辑
main() {
  case "${1:-}" in
    backend)
      check_deps
      build_backend
      deploy_backend
      ;;
    frontend)
      build_frontend
      ;;
    all)
      check_deps
      build_frontend
      build_backend
      deploy_backend
      ;;
    *)
      echo "用法: $0 {backend|frontend|all}"
      echo ""
      echo "命令:"
      echo "  backend   构建并蓝绿部署后端（零停机）"
      echo "  frontend  构建前端(微信小程序 dist)"
      echo "  all       构建前后端并部署后端"
      echo ""
      echo "首次使用请先运行: ./scripts/setup-bluegreen.sh"
      echo ""
      echo "环境变量:"
      echo "  ECS_HOST    服务器地址 (默认: $ECS_HOST)"
      echo "  ECS_USER    服务器用户 (默认: $ECS_USER)"
      echo "  ECS_PASS    服务器密码"
      exit 1
      ;;
  esac
}

main "$@"
