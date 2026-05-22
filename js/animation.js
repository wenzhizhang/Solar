import * as THREE from 'three';

export class AnimationController {
    constructor() {
        this.planets = [];
        this.sun = null;
        this.moonData = null;
        this.asteroids = null;
        this.speed = 1;
        this.paused = false;
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

        const factor = this.speed;

        // 太阳自转
        if (this.sun) {
            this.sun.rotation.y += 0.001 * factor;
        }

        // 行星公转 & 自转
        this.planets.forEach((p) => {
            p.container.rotation.y += p.speed * factor;
            p.mesh.rotation.y += (p.rotSpeed || 0.005) * factor;

            // 云层自转（略快于地表）
            if (p.clouds) {
                p.clouds.rotation.y += 0.008 * factor;
            }

            // 更新地球 Shader 中的太阳方向
            if (p.isEarth) {
                const sunPos = new THREE.Vector3(0, 0, 0);
                const earthPos = this._vec3;
                p.mesh.getWorldPosition(earthPos);
                const dir = new THREE.Vector3().subVectors(sunPos, earthPos).normalize();
                p.mesh.material.uniforms.sunDirection.value.copy(dir);
            }
        });

        // 月球公转
        if (this.moonData) {
            this.moonData.container.rotation.y += this.moonData.speed * factor;
        }

        // 小行星带缓慢旋转
        if (this.asteroids) {
            this.asteroids.rotation.y += 0.0003 * factor;
        }
    }
}
