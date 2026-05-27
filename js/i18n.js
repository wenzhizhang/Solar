// 中英双语翻译模块

const translations = {
    zh: {
        speed: '速度',
        pause: '⏸ 暂停',
        resume: '▶ 继续',
        reset: '⟲ 重置',
        langBtn: 'EN',
        showLabels: '显示标签',
        hideLabels: '隐藏标签',
        loading: '加载太阳系',
        loadingJs: '正在加载 Three.js ...',
        loadingTex: '正在加载纹理 ...',
        loadingFail: '加载失败',
        loadingTimeout: '加载超时',
        loadingHint: '打开 F12 → Console 看错误详情，或运行 solarDiag()',
        textureFail: '部分纹理加载失败',
        nameLabel: '名称',
        diameter: '直径',
        distance: '距太阳',
        rotation: '自转',
        localServer: '请通过本地服务器运行',
        localServerHint: '终端执行: python3 -m http.server 8080<br>然后打开 http://localhost:8080',
    },
    en: {
        speed: 'Speed',
        pause: '⏸ Pause',
        resume: '▶ Resume',
        reset: '⟲ Reset',
        langBtn: '中',
        showLabels: 'Show Labels',
        hideLabels: 'Hide Labels',
        loading: 'Loading Solar System',
        loadingJs: 'Loading Three.js ...',
        loadingTex: 'Loading textures ...',
        loadingFail: 'Load failed',
        loadingTimeout: 'Loading timed out',
        loadingHint: 'Open F12 → Console for error details, or run solarDiag()',
        textureFail: 'Some textures failed to load',
        nameLabel: 'Name',
        diameter: 'Diameter',
        distance: 'Dist from Sun',
        rotation: 'Day length',
        localServer: 'Please run a local server',
        localServerHint: 'Run: python3 -m http.server 8080<br>Then open http://localhost:8080',
    },
};

let currentLang = (() => {
    try { return localStorage.getItem('solar_lang') || 'zh'; }
    catch { return 'zh'; }
})();

export function t(key) {
    return translations[currentLang][key] || key;
}

export function planetName(planet) {
    return currentLang === 'zh' ? planet.name : planet.nameEn;
}

export function translateDayLength(dayLength) {
    if (!dayLength || currentLang !== 'en') return dayLength;
    return dayLength
        .replace(' 天', ' days')
        .replace(' 小时', ' hours');
}

export function toggleLang() {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    try { localStorage.setItem('solar_lang', currentLang); } catch {}
    return currentLang;
}
