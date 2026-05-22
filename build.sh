#!/bin/bash
set -euo pipefail

REGISTRY="ccr.ccs.tencentyun.com"
NAMESPACE="solar-system"
IMAGE_NAME="solar"
CONTAINER_NAME="solar-system"
LOCAL_TAG="${IMAGE_NAME}:latest"

VERSION_FILE="VERSION"

# ---------- 辅助函数 ----------

push_image() {
    local tag="$1"
    local full="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${tag}"

    echo "==> 构建镜像: ${full}"
    docker build -t "${full}" .
    docker tag "${full}" "${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:latest"

    echo "==> 推送至腾讯云 CCR"
    if [ -z "${TENCENT_ACCOUNT:-}" ] || [ -z "${TENCENT_PASSWORD:-}" ]; then
        echo "错误: 请设置环境变量 TENCENT_ACCOUNT 和 TENCENT_PASSWORD"
        echo "用法: export TENCENT_ACCOUNT=your_account  TENCENT_PASSWORD=your_password"
        exit 1
    fi

    echo "    登录 ${REGISTRY}"
    echo "${TENCENT_PASSWORD}" | docker login "${REGISTRY}" --username "${TENCENT_ACCOUNT}" --password-stdin

    echo "    推送 ${full}"
    docker push "${full}"
    docker push "${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:latest"
    echo "    推送完成"
}

# ---------- 主流程 ----------

MODE="${1:-}"
case "$MODE" in
    up)
        echo "==> 本地构建: ${LOCAL_TAG}"
        docker build -t "${LOCAL_TAG}" .

        echo "==> 启动容器"
        if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            echo "    停止并移除旧容器: ${CONTAINER_NAME}"
            docker stop "${CONTAINER_NAME}" > /dev/null 2>&1
            docker rm "${CONTAINER_NAME}" > /dev/null 2>&1
        fi
        docker run -d --name "${CONTAINER_NAME}" -p 8080:80 "${LOCAL_TAG}"
        echo "    容器已启动 → http://localhost:8080"
        docker ps --filter "name=${CONTAINER_NAME}" --format "    状态: {{.Status}}"
        ;;

    push)
        # 版本文件不存在则初始化
        if [ ! -f "$VERSION_FILE" ]; then
            echo "v0.0.0" > "$VERSION_FILE"
        fi

        VERSION=$(cat "$VERSION_FILE")
        echo "==> 构建并推送版本: ${VERSION}"

        push_image "${VERSION}"

        # 递增版本号
        echo "==> 自动递增版本号"
        BASE="${VERSION#v}"
        IFS='.' read -r MAJOR MINOR PATCH <<< "$BASE"
        NEW_PATCH=$((PATCH + 1))
        NEW_VERSION="v${MAJOR}.${MINOR}.${NEW_PATCH}"
        echo "$NEW_VERSION" > "$VERSION_FILE"
        echo "    ${VERSION} → ${NEW_VERSION}"
        ;;

    *)
        echo "用法: $0 {up|push}"
        echo ""
        echo "  up    本地构建 latest 镜像并启动容器 (端口 8080 → 80)"
        echo "  push  构建带版本号的镜像并推送至 ${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}"
        exit 1
        ;;
esac
