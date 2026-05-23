/*
 * 诊断工具：在控制台打印加载状态
 * 在浏览器 F12 Console 中执行：
 *   solarDiag()
 */
window.solarDiag = function() {
    const results = [];

    // 检查容器的 nginx
    fetch('./textures/2k_moon.jpg', { method: 'HEAD' })
        .then(r => results.push(`纹理 2k_moon.jpg: HTTP ${r.status} (${(r.headers.get('content-length')||0)/1024|0}KB)`))
        .catch(e => results.push(`纹理 2k_moon.jpg: 请求失败 - ${e.message}`))
        .finally(() => results.forEach(s => console.log('[Diag]', s)));

    fetch('./js/main.js', { method: 'HEAD' })
        .then(r => results.push(`JS main.js: HTTP ${r.status}`))
        .catch(e => results.push(`JS main.js: 请求失败 - ${e.message}`))
        .finally(() => results.forEach(s => console.log('[Diag]', s)));

    // Three.js 状态
    if (typeof THREE !== 'undefined') {
        console.log('[Diag] Three.js 已加载, 版本:', THREE.REVISION);
        console.log('[Diag] WebGL 支持:', !!THREE.WebGLRenderer);
    } else {
        console.warn('[Diag] Three.js 未加载 — CDN 可能不可达');
        console.warn('  尝试在浏览器直接打开:',
            'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
    }

    // 纹理加载器状态
    if (window.loadingManager) {
        console.log('[Diag] loadingManager 已初始化');
    }
};
