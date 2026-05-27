import * as THREE from 'three';
import { initCore } from './core.js';
import { createTextureLoader, TEXTURE_PATH } from './celestial.js';
import { createSun } from './sun.js';
import { createPlanets } from './planets.js';
import { createMoon } from './moon.js';
import { createAsteroidBelt } from './asteroid-belt.js';
import { createStars } from './stars.js';
import { AnimationController } from './animation.js';
import { initUI } from './ui.js';
import { t } from './i18n.js';

// 更新初始 loading 文字
const loadingSpan = document.querySelector('#loading span');
if (loadingSpan) loadingSpan.textContent = t('loading');
const loadingHint = document.querySelector('#loading .hint');
if (loadingHint) loadingHint.textContent = t('loadingJs');

// 纹理加载管理器（追踪所有纹理加载）
const loadingManager = new THREE.LoadingManager();
const textureLoader = createTextureLoader(loadingManager);

// 核心
const { scene, camera, renderer, controls } = initCore();

// 星空背景（必须设置，否则场景全黑）
const bgTex = textureLoader.load(TEXTURE_PATH + '2k_stars_milky_way.jpg');
scene.background = bgTex;

// 创建天体
const sun = createSun(scene, textureLoader);
const { planets, earthMesh } = createPlanets(scene, textureLoader);
const moonData = createMoon(textureLoader, earthMesh);
const asteroidBelt = createAsteroidBelt(scene);
createStars(scene);

// 动画控制
const animCtrl = new AnimationController();
animCtrl.addSun(sun);
animCtrl.addPlanets(planets);
animCtrl.addMoon(moonData);
animCtrl.addAsteroidBelt(asteroidBelt);

// 聚焦状态：点击行星后相机跟随其轨道
let focusedPlanet = null;

// UI
const { labelRenderer } = initUI(scene, camera, renderer, controls, planets, animCtrl, (planet) => {
    focusedPlanet = planet;
    if (planet) {
        // 将镜头拉近到行星附近
        const pos = planet.mesh.position;
        const size = planet.data.size || 5;
        const dist = size * 5 + 10;
        camera.position.set(pos.x + dist, pos.y + dist * 0.3, pos.z + dist);
        controls.target.copy(pos);
        controls.update();
    }
});

// 纹理加载进度
loadingManager.onProgress = (url, loaded, total) => {
    const hint = document.querySelector('#loading .hint');
    if (hint) {
        const pct = Math.round(loaded / total * 100);
        hint.textContent = t('loadingTex') + ' ' + pct + '% (' + loaded + '/' + total + ')';
    }
};

// 纹理加载完成
loadingManager.onLoad = () => {
    const el = document.getElementById('loading');
    if (el) el.classList.add('hidden');
};

// 纹理加载失败
loadingManager.onError = (url) => {
    console.warn('[纹理] 加载失败:', url);
    const hint = document.querySelector('#loading .hint');
    if (hint) hint.textContent = t('textureFail');
};

// 超时回退：15秒后强制显示错误（正常情况下纹理 <3s 加载完）
setTimeout(() => {
    const el = document.getElementById('loading');
    if (el && !el.classList.contains('hidden')) {
        el.className = 'error';
        el.innerHTML =
            '<div style="font-size:36px;margin-bottom:8px;">⏳</div>' +
            t('loadingTimeout') +
            '<div class="hint" style="opacity:0.7;">' +
            t('loadingHint') +
            '</div>';
    }
}, 15000);

// 预渲染第一帧（确保即使动画崩溃也能看到初始状态）
try {
    renderer.render(scene, camera);
} catch (e) {
    console.warn('[渲染] 预渲染失败:', e);
}

// 主动画循环
function animate() {
    requestAnimationFrame(animate);
    try {
        animCtrl.update();
        // 跟踪聚焦行星的轨道运动
        if (focusedPlanet) {
            const p = focusedPlanet.mesh.position;
            controls.target.lerp(p, 0.05);
        }
    } catch (e) {
        console.error('[动画] update 出错:', e);
    }
    controls.update();
    try {
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
    } catch (e) {
        console.warn('[渲染] 渲染出错:', e);
    }
}

animate();
