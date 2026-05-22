import * as THREE from 'three';
import { PLANETS_DATA } from './planets.js';

export function createOrbits(scene) {
    PLANETS_DATA.forEach((data) => {
        const points = [];
        const segments = 128;
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * data.distance;
            const z = Math.sin(angle) * data.distance;
            points.push(new THREE.Vector3(x, 0, z));
        }

        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({
            color: 0x446688,
            transparent: true,
            opacity: 0.2,
        });
        const line = new THREE.Line(geo, mat);
        scene.add(line);
    });
}
