import * as THREE from 'three';
import { createSphereGeo, loadColorTexture, TEXTURE_PATH } from './celestial.js';

export function createSun(scene, textureLoader) {
    // 太阳点光源 — 从原点向各方向照射
    const sunLight = new THREE.PointLight(0xffffff, 10000, 0, 2);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    const geo = createSphereGeo(16);
    const tex = loadColorTexture(textureLoader, TEXTURE_PATH + '2k_sun.jpg');
    const mat = new THREE.MeshBasicMaterial({ map: tex });
    const sun = new THREE.Mesh(geo, mat);
    scene.add(sun);

    const glowLayers = [
        { scale: 50, color: 0xffaa00, opacity: 0.5 },
        { scale: 80, color: 0xff6600, opacity: 0.25 },
        { scale: 130, color: 0xff4400, opacity: 0.08 },
    ];

    glowLayers.forEach((l) => {
        const glowMat = new THREE.SpriteMaterial({
            map: createGlowTexture(),
            color: l.color,
            transparent: true,
            opacity: l.opacity,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const sprite = new THREE.Sprite(glowMat);
        sprite.scale.set(l.scale, l.scale, 1);
        sun.add(sprite);
    });

    return sun;
}

function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0.0, 'rgba(255,255,255,1)');
    g.addColorStop(0.15, 'rgba(255,200,50,0.9)');
    g.addColorStop(0.4, 'rgba(255,100,0,0.3)');
    g.addColorStop(0.7, 'rgba(255,50,0,0.08)');
    g.addColorStop(1.0, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
}
