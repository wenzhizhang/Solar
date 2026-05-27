import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { t, planetName, translateDayLength, toggleLang } from './i18n.js';

/**
 * 初始化所有 UI 元素
 * @returns {{ labelRenderer: CSS2DRenderer, showInfo: Function }}
 */
export function initUI(scene, camera, renderer, controls, planets, animationCtrl, onFocusPlanet) {
    // ===== CSS2D 标签渲染器 =====
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'fixed';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    labelRenderer.domElement.style.zIndex = '10';
    document.body.appendChild(labelRenderer.domElement);

    // ===== 行星名称标签 =====
    const labelDivs = [];
    planets.forEach((p) => {
        const div = document.createElement('div');
        div.style.color = '#fff';
        div.style.fontSize = '13px';
        div.style.fontWeight = '600';
        div.style.textShadow = '0 0 10px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.7)';
        div.style.background = 'rgba(0,0,0,0.35)';
        div.style.padding = '2px 8px';
        div.style.borderRadius = '10px';
        div.style.border = '1px solid rgba(255,255,255,0.12)';
        div.style.backdropFilter = 'blur(2px)';
        div.style.pointerEvents = 'none';

        const label = new CSS2DObject(div);
        label.position.set(0, p.data.size + 2, 0);
        p.mesh.add(label);

        labelDivs.push({ div, label, planet: p });
    });

    // ===== 右上方控制面板 =====
    const panel = document.createElement('div');
    panel.id = 'control-panel';
    Object.assign(panel.style, {
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: '20',
        background: 'rgba(10,10,30,0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '16px 20px',
        color: 'rgba(255,255,255,0.85)',
        fontSize: '14px',
        minWidth: '340px',
        userSelect: 'none',
    });

    // 速度行
    const speedRow = document.createElement('div');
    Object.assign(speedRow.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '12px',
    });

    const speedLabel = document.createElement('span');
    speedLabel.style.fontSize = '13px';
    speedLabel.style.opacity = '0.7';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '5';
    slider.step = '0.1';
    slider.value = '1';
    Object.assign(slider.style, {
        flex: '1',
        accentColor: '#ffaa00',
        cursor: 'pointer',
        height: '4px',
    });

    const speedValue = document.createElement('span');
    speedValue.textContent = '1.0×';
    Object.assign(speedValue.style, {
        fontSize: '13px',
        fontWeight: 'bold',
        minWidth: '38px',
        textAlign: 'right',
    });

    slider.addEventListener('input', () => {
        const val = parseFloat(slider.value);
        speedValue.textContent = val.toFixed(1) + '×';
        animationCtrl.setSpeed(val);
    });

    speedRow.appendChild(speedLabel);
    speedRow.appendChild(slider);
    speedRow.appendChild(speedValue);

    // 按钮行
    const btnRow = document.createElement('div');
    Object.assign(btnRow.style, { display: 'flex', gap: '8px' });

    const pauseBtn = document.createElement('button');
    let paused = false;
    pauseBtn.style.cssText = btnBaseStyle();
    pauseBtn.addEventListener('click', () => {
        paused = animationCtrl.togglePause();
        pauseBtn.textContent = paused ? t('resume') : t('pause');
    });

    const resetBtn = document.createElement('button');
    resetBtn.style.cssText = btnBaseStyle();
    resetBtn.addEventListener('click', () => {
        animationCtrl.resetView(camera, controls);
    });

    const langBtn = document.createElement('button');
    langBtn.style.cssText = btnBaseStyle();
    langBtn.addEventListener('click', () => {
        toggleLang();
        refreshLang();
    });

    let labelsVisible = true;
    const labelToggleBtn = document.createElement('button');
    labelToggleBtn.style.cssText = btnBaseStyle();
    labelToggleBtn.addEventListener('click', () => {
        labelsVisible = !labelsVisible;
        labelDivs.forEach(({ label }) => { label.visible = labelsVisible; });
        labelToggleBtn.textContent = labelsVisible ? t('hideLabels') : t('showLabels');
    });

    btnRow.appendChild(pauseBtn);
    btnRow.appendChild(resetBtn);
    btnRow.appendChild(labelToggleBtn);
    btnRow.appendChild(langBtn);
    panel.appendChild(speedRow);
    panel.appendChild(btnRow);
    document.body.appendChild(panel);

    // ===== 底部信息面板 =====
    const infoPanel = document.createElement('div');
    infoPanel.id = 'info-panel';
    Object.assign(infoPanel.style, {
        position: 'fixed',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '20',
        background: 'rgba(10,10,30,0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '12px 24px',
        color: 'rgba(255,255,255,0.85)',
        fontSize: '14px',
        opacity: '0',
        transition: 'opacity 0.3s',
        pointerEvents: 'none',
        textAlign: 'center',
        minWidth: '200px',
    });
    document.body.appendChild(infoPanel);

    let currentPlanetData = null;

    function showInfo(data) {
        currentPlanetData = data;
        if (!data) {
            infoPanel.style.opacity = '0';
            return;
        }
        const info = data.info || {};
        const primaryName = planetName({ name: data.name, nameEn: data.nameEn });
        const secondaryName = primaryName === data.name ? data.nameEn : data.name;
        infoPanel.innerHTML = `
            <div style="font-size:18px;font-weight:bold;margin-bottom:2px;">${primaryName}</div>
            <div style="opacity:0.5;font-size:12px;margin-bottom:6px;">${secondaryName}</div>
            <div style="display:flex;gap:16px;justify-content:center;opacity:0.8;">
                <span>${t('diameter')} ${info.diameter || '—'}</span>
                <span>${t('distance')} ${data.a || '—'} AU</span>
                <span>${t('rotation')} ${translateDayLength(info.dayLength) || '—'}</span>
            </div>
        `;
        infoPanel.style.opacity = '1';
    }

    // ===== 语言切换刷新 =====
    function refreshLang() {
        // 更新行星标签
        labelDivs.forEach(({ div, planet }) => {
            div.textContent = planetName({ name: planet.name, nameEn: planet.data.nameEn });
        });

        // 更新控制面板
        speedLabel.textContent = t('speed');
        pauseBtn.textContent = paused ? t('resume') : t('pause');
        resetBtn.textContent = t('reset');
        langBtn.textContent = t('langBtn');
        labelToggleBtn.textContent = labelsVisible ? t('hideLabels') : t('showLabels');

        // 更新信息面板
        showInfo(currentPlanetData);
    }

    // 初始化文字
    refreshLang();

    // ===== 点击交互（Raycaster）=====
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    renderer.domElement.style.cursor = 'pointer';

    renderer.domElement.addEventListener('pointerdown', (event) => {
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);

        const meshes = planets.map((p) => p.mesh);
        const intersects = raycaster.intersectObjects(meshes, true);

        if (intersects.length > 0) {
            let hit = intersects[0].object;
            let planet = null;
            while (hit) {
                planet = planets.find((p) => p.mesh === hit);
                if (planet) break;
                hit = hit.parent;
            }
            if (planet) {
                showInfo(planet.data);
                onFocusPlanet?.(planet);
                return;
            }
        }
        showInfo(null);
        onFocusPlanet?.(null);
    });

    // 窗口自适应
    window.addEventListener('resize', () => {
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
    });

    return { labelRenderer, showInfo };
}

function btnBaseStyle() {
    return [
        'flex:1',
        'padding:6px 10px',
        'border:1px solid rgba(255,255,255,0.15)',
        'border-radius:8px',
        'background:rgba(255,255,255,0.05)',
        'color:rgba(255,255,255,0.8)',
        'font-size:12px',
        'cursor:pointer',
        'white-space:nowrap',
        'transition:background 0.15s',
    ].join(';');
}
