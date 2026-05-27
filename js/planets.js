import * as THREE from 'three';
import { createSphereGeo, loadColorTexture, TEXTURE_PATH } from './celestial.js';

// 真实天文参数：a(半长轴/AU), e(偏心率), period(公转周期/年)
// 为了视觉效果，设定 1 AU = 50 个场景单位
const AU_SCALE = 50; 

export const PLANETS_DATA = [
    { name: '水星', nameEn: 'Mercury', size: 2, a: 0.387, e: 0.206, period: 0.241, rotSpeed: 0.003, tex: '2k_mercury.jpg',  color: 0x8c8c8c, info: { diameter: '4,879 km', dayLength: '58.6 天' } },
    { name: '金星', nameEn: 'Venus', size: 3.5, a: 0.723, e: 0.007, period: 0.615, rotSpeed: -0.002, tex: '2k_venus_surface.jpg', color: 0xe6c87a, atmTex: '2k_venus_atmosphere.jpg', info: { diameter: '12,104 km', dayLength: '243 天' } },
    { name: '地球', nameEn: 'Earth', size: 3.6, a: 1.000, e: 0.017, period: 1.000, rotSpeed: 0.02, tex: '2k_earth_daymap.jpg', cloudsTex: '2k_earth_clouds.jpg', nightTex: '2k_earth_nightmap.jpg', info: { diameter: '12,756 km', dayLength: '24 小时' } },
    { name: '火星', nameEn: 'Mars', size: 2.5, a: 1.524, e: 0.093, period: 1.881, rotSpeed: 0.019, tex: '2k_mars.jpg', color: 0xc0713b, info: { diameter: '6,792 km', dayLength: '24.6 小时' } },
    { name: '木星', nameEn: 'Jupiter', size: 10, a: 5.203, e: 0.048, period: 11.86, rotSpeed: 0.04, tex: '2k_jupiter.jpg', color: 0xd4a06a, info: { diameter: '142,984 km', dayLength: '9.9 小时' } },
    { name: '土星', nameEn: 'Saturn', size: 8.5, a: 9.537, e: 0.054, period: 29.46, rotSpeed: 0.038, tex: '2k_saturn.jpg', color: 0xe8d5a3, ringTex: '2k_saturn_ring_alpha.png', info: { diameter: '120,536 km', dayLength: '10.7 小时' } },
    { name: '天王星', nameEn: 'Uranus', size: 6, a: 19.19, e: 0.047, period: 84.01, rotSpeed: -0.03, tex: '2k_uranus.jpg', color: 0x88ccdd, info: { diameter: '51,118 km', dayLength: '17.2 小时' } },
    { name: '海王星', nameEn: 'Neptune', size: 5.8, a: 30.07, e: 0.009, period: 164.8, rotSpeed: 0.032, tex: '2k_neptune.jpg', color: 0x3355aa, info: { diameter: '49,528 km', dayLength: '16.1 小时' } },
];

// --- 核心物理引擎：开普勒轨道计算 ---

// 1. 牛顿迭代法求解开普勒方程 M = E - e*sin(E)
function solveKeplerEquation(M, e, tolerance = 1e-6) {
    let E = M; // 初始猜测值
    for (let i = 0; i < 10; i++) { // 迭代10次足够收敛
        const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
        E -= dE;
        if (Math.abs(dE) < tolerance) break;
    }
    return E;
}

// 2. 根据模拟时间计算行星的真实三维坐标
export function getPlanetPosition(planetData, timeInYears) {
    const { a, e, period } = planetData;
    
    // 平近点角 M (随时间线性增加)
    const M = (2 * Math.PI * timeInYears) / period;
    
    // 求解偏近点角 E
    const E = solveKeplerEquation(M, e);
    
    // 真近点角 nu (行星相对于近日点的实际角度)
    const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    
    // 当前行星到太阳的距离 r
    const r = a * (1 - e * Math.cos(E));
    
    // 转换为场景中的笛卡尔坐标 (x, z)
    const x = r * Math.cos(nu) * AU_SCALE;
    const z = r * Math.sin(nu) * AU_SCALE;
    
    return { x, z };
}

export function createPlanets(scene, textureLoader) {
    const planets = [];
    let earthMesh = null;

    PLANETS_DATA.forEach((data) => {
        // 注意：不再需要 orbitContainer，行星将直接添加到场景中
        // const orbitContainer = new THREE.Object3D();
        // scene.add(orbitContainer);

        const geo = createSphereGeo(data.size);

        let material;
        let isEarth = false;

        if (data.nightTex) {
            // 地球：Shader 实现日夜交替 + 大气辉光
            isEarth = true;
            const dayTex = loadColorTexture(textureLoader, TEXTURE_PATH + data.tex);
            const nightTex = loadColorTexture(textureLoader, TEXTURE_PATH + data.nightTex);

            material = new THREE.ShaderMaterial({
                uniforms: {
                    dayTexture: { value: dayTex },
                    nightTexture: { value: nightTex },
                    sunDirection: { value: new THREE.Vector3(-1, 0, 0) },
                },
                vertexShader: `
                    varying vec2 vUv;
                    varying vec3 vNormal;
                    varying vec3 vWorldPosition;
                    void main() {
                        vUv = uv;
                        vec4 worldPos = modelMatrix * vec4(position, 1.0);
                        vWorldPosition = worldPos.xyz;
                        vNormal = normalize(mat3(modelMatrix) * normal);
                        gl_Position = projectionMatrix * viewMatrix * worldPos;
                    }
                `,
                fragmentShader: `
                    uniform sampler2D dayTexture;
                    uniform sampler2D nightTexture;
                    uniform vec3 sunDirection;
                    varying vec2 vUv;
                    varying vec3 vNormal;
                    void main() {
                        float intensity = dot(normalize(vNormal), normalize(sunDirection));
                        vec3 dayColor = texture2D(dayTexture, vUv).rgb * 1.6;
                        vec3 nightColor = texture2D(nightTexture, vUv).rgb * 3.0;
                        float mixVal = smoothstep(-0.1, 0.2, intensity);
                        vec3 color = mix(nightColor, dayColor, mixVal);
                        float rim = 1.0 - abs(intensity);
                        color += vec3(0.2, 0.4, 1.0) * pow(rim, 4.0) * 0.4;
                        gl_FragColor = vec4(color, 1.0);
                    }
                `,
            });
        } else {
            material = new THREE.MeshPhongMaterial({
                color: data.color || 0x888888,
                shininess: 5,
                specular: new THREE.Color(0x222222),
            });
            // 用 load 回调参数加载纹理（比 texture.onLoad 可靠，即使缓存也触发）
            const tex = textureLoader.load(TEXTURE_PATH + data.tex, (loadedTex) => {
                material.map = loadedTex;
                material.color.setHex(0xffffff);
                material.needsUpdate = true;
            });
            tex.colorSpace = THREE.SRGBColorSpace;
        }

        const mesh = new THREE.Mesh(geo, material);
        // 初始化位置（后续会在动画循环中实时更新）
        const initialPos = getPlanetPosition(data, 0); 
        mesh.position.set(initialPos.x, 0, initialPos.z);
        
        scene.add(mesh); // 直接添加到场景

        // --- 绘制真实的椭圆轨道轨迹线 ---
        const orbitPoints = [];
        for (let i = 0; i <= 360; i++) {
            const angle = (i * Math.PI) / 180;
            // 椭圆极坐标公式 r = a(1-e^2) / (1 + e*cos(theta))
            const r = (data.a * (1 - data.e * data.e)) / (1 + data.e * Math.cos(angle));
            const x = r * Math.cos(angle) * AU_SCALE;
            const z = r * Math.sin(angle) * AU_SCALE;
            orbitPoints.push(new THREE.Vector3(x, 0, z));
        }
        const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
        const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
        const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
        scene.add(orbitLine);

        // 地球云层
        let cloudsMesh = null;
        if (data.cloudsTex) {
            const cloudGeo = createSphereGeo(data.size + 0.05);
            const cloudTex = loadColorTexture(textureLoader, TEXTURE_PATH + data.cloudsTex);
            const cloudMat = new THREE.MeshPhongMaterial({
                map: cloudTex,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide,
                depthWrite: false,
            });
            cloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
            mesh.add(cloudsMesh);
        }

        // 金星大气层
        if (data.atmTex) {
            const atmGeo = createSphereGeo(data.size + 0.4);
            const atmTex = loadColorTexture(textureLoader, TEXTURE_PATH + data.atmTex);
            const atmMat = new THREE.MeshPhongMaterial({
                map: atmTex,
                transparent: true,
                opacity: 0.35,
                side: THREE.BackSide,
                depthWrite: false,
            });
            const atmMesh = new THREE.Mesh(atmGeo, atmMat);
            mesh.add(atmMesh);
        }

        // 土星环
        if (data.ringTex) {
            const innerR = data.size * 1.4;
            const outerR = data.size * 2.2;
            const ringGeo = new THREE.RingGeometry(innerR, outerR, 128);
            const ringTex = loadColorTexture(textureLoader, TEXTURE_PATH + data.ringTex);

            const pos = ringGeo.attributes.position;
            const uv = ringGeo.attributes.uv;
            const v3 = new THREE.Vector3();
            for (let i = 0; i < pos.count; i++) {
                v3.fromBufferAttribute(pos, i);
                const len = v3.length();
                const u = (len - innerR) / (outerR - innerR);
                uv.setXY(i, u, 0.5);
            }

            const ringMat = new THREE.MeshBasicMaterial({
                map: ringTex,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.85,
                depthWrite: false,
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2 + 0.3;
            mesh.add(ring);
        }

        const planetObj = {
            mesh,
            // container: orbitContainer, // 已移除
            speed: data.speed, // 保留此字段以防主程序其他地方有引用，但在开普勒模式下动画循环不再使用它
            rotSpeed: data.rotSpeed || 0.005,
            name: data.name,
            data, // 保存原始数据用于物理计算
            clouds: cloudsMesh,
            isEarth,
        };

        planets.push(planetObj);

        if (data.name === '地球') {
            earthMesh = mesh;
        }
    });

    return { planets, earthMesh };
}