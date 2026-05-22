#!/bin/bash
set -euo pipefail

VERSION_FILE="VERSION"

if [ ! -f "$VERSION_FILE" ]; then
    echo "错误: VERSION 文件不存在，请先执行 ./build.sh"
    exit 1
fi

VERSION=$(cat "$VERSION_FILE")

if [ -z "${TENCENT_ACCOUNT:-}" ] || [ -z "${TENCENT_PASSWORD:-}" ]; then
    echo "错误: 请设置环境变量 TENCENT_ACCOUNT 和 TENCENT_PASSWORD"
    echo "用法: export TENCENT_ACCOUNT=your_account  TENCENT_PASSWORD=your_password"
    exit 1
fi

REGISTRY="ccr.ccs.tencentyun.com"
NAMESPACE="solar-system"
IMAGE_NAME="solar"

FULL_IMAGE="${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:${VERSION}"

if ! docker image inspect "${FULL_IMAGE}" > /dev/null 2>&1; then
    echo "错误: 镜像 ${FULL_IMAGE} 不存在，请先执行 ./build.sh"
    exit 1
fi

echo "==> 登录 CCR: ${REGISTRY}"
echo "${TENCENT_PASSWORD}" | docker login "${REGISTRY}" --username "${TENCENT_ACCOUNT}" --password-stdin

echo "==> 推送镜像: ${FULL_IMAGE}"
docker push "${FULL_IMAGE}"
docker push "${REGISTRY}/${NAMESPACE}/${IMAGE_NAME}:latest"

echo "==> 推送完成"
