import * as THREE from 'three';
import { createSphereGeo, loadColorTexture, TEXTURE_PATH } from './celestial.js';

export const PLANETS_DATA = [
    { name: '水星', nameEn: 'Mercury', size: 2, distance: 30, speed: 0.02, rotSpeed: 0.003, tex: '8k_mercury.jpg', info: { diameter: '4,879 km', dayLength: '58.6 天' } },
    { name: '金星', nameEn: 'Venus', size: 3.5, distance: 45, speed: 0.015, rotSpeed: -0.002, tex: '8k_venus_surface.jpg', atmTex: '4k_venus_atmosphere.jpg', info: { diameter: '12,104 km', dayLength: '243 天' } },
    { name: '地球', nameEn: 'Earth', size: 3.6, distance: 65, speed: 0.01, rotSpeed: 0.02, tex: '8k_earth_daymap.jpg', cloudsTex: '8k_earth_clouds.jpg', nightTex: '8k_earth_nightmap.jpg', info: { diameter: '12,756 km', dayLength: '24 小时' } },
    { name: '火星', nameEn: 'Mars', size: 2.5, distance: 85, speed: 0.008, rotSpeed: 0.019, tex: '8k_mars.jpg', info: { diameter: '6,792 km', dayLength: '24.6 小时' } },
    { name: '木星', nameEn: 'Jupiter', size: 10, distance: 130, speed: 0.004, rotSpeed: 0.04, tex: '8k_jupiter.jpg', info: { diameter: '142,984 km', dayLength: '9.9 小时' } },
    { name: '土星', nameEn: 'Saturn', size: 8.5, distance: 180, speed: 0.003, rotSpeed: 0.038, tex: '8k_saturn.jpg', ringTex: '8k_saturn_ring_alpha.png', info: { diameter: '120,536 km', dayLength: '10.7 小时' } },
    { name: '天王星', nameEn: 'Uranus', size: 6, distance: 230, speed: 0.002, rotSpeed: -0.03, tex: '2k_uranus.jpg', info: { diameter: '51,118 km', dayLength: '17.2 小时' } },
    { name: '海王星', nameEn: 'Neptune', size: 5.8, distance: 270, speed: 0.001, rotSpeed: 0.032, tex: '2k_neptune.jpg', info: { diameter: '49,528 km', dayLength: '16.1 小时' } },
];

export function createPlanets(scene, textureLoader) {
    const planets = [];
    let earthMesh = null;

    PLANETS_DATA.forEach((data) => {
        const orbitContainer = new THREE.Object3D();
        scene.add(orbitContainer);

        const geo = createSphereGeo(data.size);
        const dayTex = loadColorTexture(textureLoader, TEXTURE_PATH + data.tex);

        let material;
        let isEarth = false;

        if (data.nightTex) {
            // 地球：Shader 实现日夜交替 + 大气辉光
            isEarth = true;
            const nightTex = loadColorTexture(textureLoader, TEXTURE_PATH + data.nightTex);

            material = new THREE.ShaderMaterial({
                uniforms: {
                    dayTexture: { value: dayTex },
                    nightTexture: { value: nightTex },
                    sunDirection: { value: new THREE.Vector3(1, 0, 0) },
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
                        vec3 dayColor = texture2D(dayTexture, vUv).rgb;
                        vec3 nightColor = texture2D(nightTexture, vUv).rgb;
                        float mixVal = smoothstep(-0.15, 0.25, intensity);
                        vec3 color = mix(nightColor, dayColor, mixVal);
                        float rim = 1.0 - abs(intensity);
                        color += vec3(0.2, 0.4, 1.0) * pow(rim, 4.0) * 0.3;
                        gl_FragColor = vec4(color, 1.0);
                    }
                `,
            });
        } else {
            material = new THREE.MeshPhongMaterial({
                map: dayTex,
                shininess: 5,
                specular: new THREE.Color(0x222222),
            });
        }

        const mesh = new THREE.Mesh(geo, material);
        mesh.position.x = data.distance;
        orbitContainer.add(mesh);

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
            container: orbitContainer,
            speed: data.speed,
            rotSpeed: data.rotSpeed || 0.005,
            name: data.name,
            data,
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
