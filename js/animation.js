import * as THREE from 'three';
import { getPlanetPosition } from './planets.js';

export class AnimationController {
    constructor() {
        this.planets = [];
        this.sun = null;
        this.moonData = null;
        this.asteroids = null;
        this.speed = 1;
        this.paused = false;
        this.simulationTime = 0;
        this._vec3 = new THREE.Vector3();
    }

    addPlanets(planets) {
        this.planets = planets;
    }

    addSun(sun) {
        this.sun = sun;
    }

    addMoon(moonData) {
        this.moonData = moonData;
    }

    addAsteroidBelt(asteroids) {
        this.asteroids = asteroids;
    }

    setSpeed(speed) {
        this.speed = Math.max(0, speed);
    }

    togglePause() {
        this.paused = !this.paused;
        return this.paused;
    }

    resetView(camera, controls) {
        camera.position.set(0, 150, 350);
        controls.target.set(0, 0, 0);
        controls.update();
    }

    update() {
        if (this.paused) return;

        const factor = this.speed; // 整体速度倍率

        // 1. 太阳自转（保持不变）
        if (this.sun) {
            this.sun.rotation.y += 0.001 * factor;
        }

        // 2. 行星运动（核心改造部分）
        // 增加模拟时间（数字越小，宇宙时间流逝越慢）
        this.simulationTime += 0.002 * factor; 

        this.planets.forEach((p) => {
            // 【新逻辑】不再旋转容器，而是直接计算并设置真实坐标
            // 注意：你需要确保在主文件中能访问到 getPlanetPosition 这个函数
            const pos = getPlanetPosition(p.data, this.simulationTime); 
            p.mesh.position.set(pos.x, 0, pos.z); 

            // 行星自转（保持不变）
            p.mesh.rotation.y += (p.rotSpeed || 0.005) * factor;

            // 云层自转（略快于地表，保持不变）
            if (p.clouds) {
                p.clouds.rotation.y += 0.008 * factor;
            }

            // 【重点修复】更新地球 Shader 中的太阳方向
            // 因为地球现在是通过 position.set 实时移动的，所以可以直接获取它的坐标
            if (p.isEarth) {
                const earthPos = p.mesh.position; // 直接拿地球当前的位置
                // 假设太阳在 (0,0,0)，那么从地球指向太阳的方向就是 -earthPos
                const dir = new THREE.Vector3().copy(earthPos).negate().normalize();
                p.mesh.material.uniforms.sunDirection.value.copy(dir);
            }
        });

        // 3. 月球公转
        // 月球的 container 是地球的子对象，地球移动时月球跟着走
        // 通过旋转 container 让月球绕地球公转
        if (this.moonData) {
            this.moonData.container.rotation.y += this.moonData.speed * factor;
        }

        // 4. 小行星带缓慢旋转（如果是整体旋转背景，可以保持不变）
        if (this.asteroids) {
            this.asteroids.rotation.y += 0.0003 * factor;
        }
    }
}
