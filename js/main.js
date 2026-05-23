import * as THREE from 'three';
import { initCore } from './core.js';
import { createTextureLoader, TEXTURE_PATH } from './celestial.js';
import { createSun } from './sun.js';
import { createPlanets } from './planets.js';
import { createMoon } from './moon.js';
import { createAsteroidBelt } from './asteroid-belt.js';
import { createOrbits } from './orbits.js';
import { createStars } from './stars.js';
import { AnimationController } from './animation.js';
import { initUI } from './ui.js';

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
createOrbits(scene);
createStars(scene);

// 动画控制
const animCtrl = new AnimationController();
animCtrl.addSun(sun);
animCtrl.addPlanets(planets);
animCtrl.addMoon(moonData);
animCtrl.addAsteroidBelt(asteroidBelt);

// UI
const { labelRenderer } = initUI(scene, camera, renderer, controls, planets, animCtrl);

// 纹理加载进度
loadingManager.onProgress = (url, loaded, total) => {
    const hint = document.querySelector('#loading .hint');
    if (hint) {
        const pct = Math.round(loaded / total * 100);
        hint.textContent = '加载纹理 ' + pct + '% (' + loaded + '/' + total + ')';
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
    if (hint) hint.textContent = '部分纹理加载失败';
};

// 超时回退：15秒后强制显示错误（正常情况下纹理 <3s 加载完）
setTimeout(() => {
    const el = document.getElementById('loading');
    if (el && !el.classList.contains('hidden')) {
        el.className = 'error';
        el.innerHTML =
            '<div style="font-size:36px;margin-bottom:8px;">⏳</div>' +
            '加载超时' +
            '<div class="hint" style="opacity:0.7;">' +
            '打开 F12 → Console 看错误详情，或运行 solarDiag()' +
            '</div>';
    }
}, 15000);

// 主动画循环
function animate() {
    requestAnimationFrame(animate);
    animCtrl.update();
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

animate();
