import * as THREE from 'three';

export function createStars(scene) {
    const count = 8000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
        const radius = 800 + Math.random() * 2000;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.cos(phi);
        positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

        // 按色温随机颜色
        const temp = Math.random();
        if (temp < 0.15) {
            // 蓝色星
            colors[i * 3] = 0.6 + Math.random() * 0.4;
            colors[i * 3 + 1] = 0.7 + Math.random() * 0.3;
            colors[i * 3 + 2] = 1.0;
        } else if (temp < 0.35) {
            // 红色星
            colors[i * 3] = 1.0;
            colors[i * 3 + 1] = 0.4 + Math.random() * 0.3;
            colors[i * 3 + 2] = 0.2 + Math.random() * 0.2;
        } else {
            // 白/黄色星
            const c = 0.7 + Math.random() * 0.3;
            colors[i * 3] = c;
            colors[i * 3 + 1] = c * 0.95;
            colors[i * 3 + 2] = c * 0.85;
        }

        sizes[i] = 0.5 + Math.random() * 1.5;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const mat = new THREE.PointsMaterial({
        size: 1.0,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });

    const stars = new THREE.Points(geo, mat);
    scene.add(stars);
    return stars;
}
