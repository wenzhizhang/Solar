import * as THREE from 'three';
import { createSphereGeo, loadColorTexture, TEXTURE_PATH } from './celestial.js';

export function createMoon(textureLoader, earthMesh) {
    const moonContainer = new THREE.Object3D();
    earthMesh.add(moonContainer);

    const geo = createSphereGeo(1.2);
    const tex = loadColorTexture(textureLoader, TEXTURE_PATH + '2k_moon.jpg');
    const mat = new THREE.MeshPhongMaterial({ map: tex, shininess: 2 });
    const moon = new THREE.Mesh(geo, mat);
    moon.position.x = 10;
    moonContainer.add(moon);

    return { moon, container: moonContainer, speed: 0.04 };
}
