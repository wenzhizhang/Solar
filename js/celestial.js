import * as THREE from 'three';

export const TEXTURE_PATH = './textures/';

export function createTextureLoader(manager) {
    return new THREE.TextureLoader(manager);
}

export function loadColorTexture(loader, path) {
    const tex = loader.load(path);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

export function createSphereGeo(radius, widthSegments = 64, heightSegments = 64) {
    return new THREE.SphereGeometry(radius, widthSegments, heightSegments);
}
