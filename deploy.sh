#!/bin/bash
set -euo pipefail

REGISTRY="ccr.ccs.tencentyun.com"
NAMESPACE="solar-system"
IMAGE_NAME="solar"
CONTAINER_NAME="solar-system"

# ---------- 版本号 ----------
if [ $# -ge 1 ]; then
    VERSION="$1"
elif [ -f VERSION ]; then
    VERSION=$(cat VERSION)
else
    VERSION="latest"
fi

FULL_IMAGE="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${VERSION}"


echo "==> 拉取镜像: ${FULL_IMAGE}"
docker pull "${FULL_IMAGE}"
docker pull "${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:latest"

# ---------- 停止旧容器 ----------
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "==> 停止并移除旧容器: ${CONTAINER_NAME}"
    docker stop "${CONTAINER_NAME}" > /dev/null 2>&1
    docker rm "${CONTAINER_NAME}" > /dev/null 2>&1
fi

# ---------- 启动新容器 ----------
echo "==> 启动新容器: ${CONTAINER_NAME}"

NETWORK_ARG=""
if [ -n "${DOCKER_NETWORK:-}" ]; then
    NETWORK_ARG="--network ${DOCKER_NETWORK}"
fi

PORT_ARG="-p 8080:80"

docker run -d \
    --name "${CONTAINER_NAME}" \
    ${NETWORK_ARG} \
    ${PORT_ARG} \
    --restart unless-stopped \
    "${FULL_IMAGE}"

echo "==> 部署完成"
docker ps --filter "name=${CONTAINER_NAME}" --format "    容器: {{.Names}}  状态: {{.Status}}"
echo "    版本: ${VERSION}"
