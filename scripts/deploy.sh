#!/bin/bash
set -e

# ============================================================
# Football Team 小程序 — 构建/部署脚本
# ============================================================
# 用法:
#   ./scripts/deploy.sh backend   构建并部署后端
#   ./scripts/deploy.sh frontend  构建前端(微信小程序)
#   ./scripts/deploy.sh all       构建前后端并部署后端
#
# 环境变量:
#   ECS_HOST       服务器地址 (默认: 8.152.193.56)
#   ECS_USER       服务器用户 (默认: root)
#   ECS_PASS       服务器密码 (默认: 930304@ecs)
#   ECS_JAR_PATH   服务器JAR路径 (默认: /opt/football-team/football-team.jar)
# ============================================================

ECS_HOST="${ECS_HOST:-8.152.193.56}"
ECS_USER="${ECS_USER:-root}"
ECS_PASS="${ECS_PASS:-930304@ecs}"
ECS_JAR_PATH="${ECS_JAR_PATH:-/opt/football-team/football-team.jar}"

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

# 部署后端
deploy_backend() {
  local local_jar="$PROJECT_ROOT/backend/target/team-backend-1.0.0.jar"
  if [ ! -f "$local_jar" ]; then
    log_error "JAR 文件不存在: $local_jar"
    log_info "先执行: ./scripts/deploy.sh backend"
    exit 1
  fi

  log_info "上传 JAR 到服务器 ($ECS_USER@$ECS_HOST)..."
  sshpass -p "$ECS_PASS" scp -o StrictHostKeyChecking=no \
    "$local_jar" "$ECS_USER@$ECS_HOST:$ECS_JAR_PATH"
  log_ok "上传完成"

  log_info "重启 systemd 服务 (football-team)..."
  sshpass -p "$ECS_PASS" ssh -o StrictHostKeyChecking=no "$ECS_USER@$ECS_HOST" \
    "systemctl restart football-team && sleep 2 && systemctl is-active football-team"
  log_ok "服务已重启并运行正常"

  log_info "验证接口..."
  sleep 2
  if curl -s -o /dev/null -w "%{http_code}" "https://ball.xiyanziran.top/api/v1/upload/avatar" -X POST -F "file=@/etc/hosts" | grep -q "200"; then
    log_ok "接口验证通过 (200)"
  else
    log_warn "接口验证未通过，请手动检查"
  fi
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
      echo "  backend   构建并部署后端到 ECS"
      echo "  frontend  构建前端(微信小程序 dist)"
      echo "  all       构建前后端并部署后端"
      echo ""
      echo "环境变量:"
      echo "  ECS_HOST       服务器地址 (默认: $ECS_HOST)"
      echo "  ECS_USER       服务器用户 (默认: $ECS_USER)"
      echo "  ECS_PASS       服务器密码"
      echo "  ECS_JAR_PATH   服务器JAR路径 (默认: $ECS_JAR_PATH)"
      exit 1
      ;;
  esac
}

main "$@"
