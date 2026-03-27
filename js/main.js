// Use global THREE and other libs from window (loaded from CDN)
const THREE = window.THREE;
const OrbitControls = window.OrbitControls;
const EffectComposer = window.EffectComposer;
const RenderPass = window.RenderPass;
const UnrealBloomPass = window.UnrealBloomPass;

// Planet Data Configuration
const PLANET_DATA = {
    mercury: {
        name: 'Mercury',
        description: 'Mercury is the smallest planet in our solar system and the closest to the Sun. Its surface is heavily cratered and similar in appearance to the Moon.',
        distance: '57.9 million km',
        distanceValue: 57.9,
        period: '88 days',
        periodValue: 88,
        diameter: '4,879 km',
        diameterValue: 4879,
        color: '#8c7853',
        size: 0.4,
        orbitRadius: 10,
        orbitSpeed: 0.04,
        rotationSpeed: 0.01,
        texture: 'mercury'
    },
    venus: {
        name: 'Venus',
        description: 'Venus is the second planet from the Sun and Earth\'s closest planetary neighbor. It\'s the hottest planet in our solar system with a thick toxic atmosphere.',
        distance: '108.2 million km',
        distanceValue: 108.2,
        period: '225 days',
        periodValue: 225,
        diameter: '12,104 km',
        diameterValue: 12104,
        color: '#e6c87a',
        size: 0.9,
        orbitRadius: 15,
        orbitSpeed: 0.03,
        rotationSpeed: 0.005,
        texture: 'venus'
    },
    earth: {
        name: 'Earth',
        description: 'Earth is the third planet from the Sun and the only astronomical object known to harbor life. About 71% of its surface is covered with water.',
        distance: '149.6 million km',
        distanceValue: 149.6,
        period: '365.25 days',
        periodValue: 365.25,
        diameter: '12,742 km',
        diameterValue: 12742,
        color: '#4a90d9',
        size: 1,
        orbitRadius: 20,
        orbitSpeed: 0.025,
        rotationSpeed: 0.02,
        texture: 'earth',
        hasMoon: true
    },
    mars: {
        name: 'Mars',
        description: 'Mars is the fourth planet from the Sun and is often called the "Red Planet" due to iron oxide on its surface. It has the largest volcano in the solar system.',
        distance: '227.9 million km',
        distanceValue: 227.9,
        period: '687 days',
        periodValue: 687,
        diameter: '6,779 km',
        diameterValue: 6779,
        color: '#c1440e',
        size: 0.53,
        orbitRadius: 25,
        orbitSpeed: 0.02,
        rotationSpeed: 0.018,
        texture: 'mars'
    },
    jupiter: {
        name: 'Jupiter',
        description: 'Jupiter is the largest planet in our solar system and a gas giant. Its Great Red Spot is a storm that has been raging for hundreds of years.',
        distance: '778.5 million km',
        distanceValue: 778.5,
        period: '4,333 days',
        periodValue: 4333,
        diameter: '139,820 km',
        diameterValue: 139820,
        color: '#d4a574',
        size: 3.5,
        orbitRadius: 35,
        orbitSpeed: 0.01,
        rotationSpeed: 0.04,
        texture: 'jupiter'
    },
    saturn: {
        name: 'Saturn',
        description: 'Saturn is famous for its beautiful ring system, made of ice and rock. It\'s the second-largest planet and has at least 82 known moons.',
        distance: '1.4 billion km',
        distanceValue: 1400,
        period: '10,759 days',
        periodValue: 10759,
        diameter: '116,460 km',
        diameterValue: 116460,
        color: '#e8d5a3',
        size: 2.9,
        orbitRadius: 45,
        orbitSpeed: 0.008,
        rotationSpeed: 0.038,
        texture: 'saturn',
        hasRings: true
    },
    uranus: {
        name: 'Uranus',
        description: 'Uranus is an ice giant with a unique sideways rotation. It was the first planet discovered using a telescope and has 27 known moons.',
        distance: '2.9 billion km',
        distanceValue: 2900,
        period: '30,687 days',
        periodValue: 30687,
        diameter: '50,724 km',
        diameterValue: 50724,
        color: '#7de3f4',
        size: 1.8,
        orbitRadius: 55,
        orbitSpeed: 0.006,
        rotationSpeed: 0.03,
        texture: 'uranus'
    },
    neptune: {
        name: 'Neptune',
        description: 'Neptune is the farthest planet from the Sun and an ice giant. It has the strongest winds in the solar system, reaching 2,100 km/h.',
        distance: '4.5 billion km',
        distanceValue: 4500,
        period: '60,190 days',
        periodValue: 60190,
        diameter: '49,244 km',
        diameterValue: 49244,
        color: '#3d5ef7',
        size: 1.7,
        orbitRadius: 65,
        orbitSpeed: 0.005,
        rotationSpeed: 0.028,
        texture: 'neptune'
    }
};

// Global variables
let scene, camera, renderer, controls, composer;
let sun, sunGlow;
let planets = {};
let orbitLines = {};
let stars, nebula;
let clock = new THREE.Clock();
let orbitSpeedMultiplier = 1;
let isCompactView = false;
let showOrbitLines = true;
let audioContext, ambientSound;
let selectedPlanet = null;
let hoveredPlanet = null;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// Scale factors
const REALISTIC_SCALE = {
    sunSize: 8,
    planetMultiplier: 1,
    orbitMultiplier: 1
};

const COMPACT_SCALE = {
    sunSize: 5,
    planetMultiplier: 2,
    orbitMultiplier: 0.4
};

// Texture URLs (using generated textures as fallback)
const TEXTURE_URLS = {
    sun: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/sun.jpg',
    mercury: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mercury.jpg',
    venus: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/venus_atmosphere.jpg',
    earth: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth.jpg',
    moon: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon.jpg',
    mars: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/mars.jpg',
    jupiter: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/jupiter.jpg',
    saturn: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/saturn.jpg',
    saturnRing: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/saturn_ring.png',
    uranus: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/uranus.jpg',
    neptune: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/neptune.jpg',
    stars: 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'
};

// Initialize the scene
function init() {
    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0002);

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 80, 120);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 500;
    controls.enablePan = true;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.5;

    // Post-processing
    setupPostProcessing();

    // Create scene elements
    createBackground();
    createStars();
    createNebula();
    createSun();
    createPlanets();
    createOrbitLines();

    // Event listeners
    setupEventListeners();

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 2500);

    // Start animation
    animate();
}

// Post-processing setup
function setupPostProcessing() {
    composer = new EffectComposer(renderer);
    
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5,  // strength
        0.4,  // radius
        0.85  // threshold
    );
    composer.addPass(bloomPass);
}

// Create background
function createBackground() {
    const textureLoader = new THREE.TextureLoader();
    
    // Create a gradient background
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');
    
    // Deep space gradient
    const gradient = ctx.createRadialGradient(1024, 1024, 0, 1024, 1024, 1400);
    gradient.addColorStop(0, '#0a0a1a');
    gradient.addColorStop(0.5, '#050510');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2048, 2048);
    
    // Add some subtle nebula-like clouds
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * 2048;
        const y = Math.random() * 2048;
        const radius = Math.random() * 300 + 100;
        const nebulaGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        
        const hue = Math.random() * 60 + 200;
        nebulaGradient.addColorStop(0, `hsla(${hue}, 80%, 30%, 0.1)`);
        nebulaGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = nebulaGradient;
        ctx.fillRect(0, 0, 2048, 2048);
    }
    
    const bgTexture = new THREE.CanvasTexture(canvas);
    scene.background = bgTexture;
}

// Create starfield
function createStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 15000;
    const positions = new Float32Array(starsCount * 3);
    const colors = new Float32Array(starsCount * 3);
    const sizes = new Float32Array(starsCount);
    
    for (let i = 0; i < starsCount; i++) {
        const i3 = i * 3;
        
        // Random position on a sphere
        const radius = 500 + Math.random() * 1500;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);
        
        // Star colors (white to slight blue/yellow)
        const colorChoice = Math.random();
        if (colorChoice < 0.7) {
            colors[i3] = 1;
            colors[i3 + 1] = 1;
            colors[i3 + 2] = 1;
        } else if (colorChoice < 0.85) {
            colors[i3] = 0.8;
            colors[i3 + 1] = 0.9;
            colors[i3 + 2] = 1;
        } else {
            colors[i3] = 1;
            colors[i3 + 1] = 0.9;
            colors[i3 + 2] = 0.7;
        }
        
        sizes[i] = Math.random() * 2 + 0.5;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const starsMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });
    
    stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

// Create nebula effect
function createNebula() {
    const nebulaGeometry = new THREE.BufferGeometry();
    const nebulaCount = 2000;
    const positions = new Float32Array(nebulaCount * 3);
    const colors = new Float32Array(nebulaCount * 3);
    
    for (let i = 0; i < nebulaCount; i++) {
        const i3 = i * 3;
        const radius = 400 + Math.random() * 600;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i3 + 2] = radius * Math.cos(phi);
        
        // Nebula colors (purple, blue, pink)
        const hue = Math.random() * 0.3 + 0.5;
        colors[i3] = hue;
        colors[i3 + 1] = hue * 0.5;
        colors[i3 + 2] = hue + 0.2;
    }
    
    nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    nebulaGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const nebulaMaterial = new THREE.PointsMaterial({
        size: 4,
        vertexColors: true,
        transparent: true,
        opacity: 0.15,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });
    
    nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
    scene.add(nebula);
}

// Create the Sun
function createSun() {
    const scale = isCompactView ? COMPACT_SCALE : REALISTIC_SCALE;
    
    // Sun geometry
    const sunGeometry = new THREE.SphereGeometry(scale.sunSize, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd00,
        transparent: false
    });
    
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    
    // Sun glow (inner)
    const glowGeometry = new THREE.SphereGeometry(scale.sunSize * 1.2, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8800,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
    });
    sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(sunGlow);
    
    // Sun outer glow
    const outerGlowGeometry = new THREE.SphereGeometry(scale.sunSize * 1.5, 32, 32);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    scene.add(outerGlow);
    
    // Point light from sun
    const sunLight = new THREE.PointLight(0xffffff, 2, 1000, 0.5);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);
    
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
    scene.add(ambientLight);
    
    // Store sun reference
    sun.userData = { name: 'Sun', isSun: true };
    planets.sun = { mesh: sun, data: { name: 'Sun', description: 'The Sun is the star at the center of our Solar System. It is a nearly perfect sphere of hot plasma.', distance: '0 km', diameter: '1,392,684 km', color: '#ffdd00' } };
}

// Create planets
function createPlanets() {
    const textureLoader = new THREE.TextureLoader();
    const scale = isCompactView ? COMPACT_SCALE : REALISTIC_SCALE;
    
    Object.keys(PLANET_DATA).forEach(key => {
        const planetData = PLANET_DATA[key];
        const planetSize = planetData.size * (isCompactView ? COMPACT_SCALE.planetMultiplier : REALISTIC_SCALE.planetMultiplier) * scale.planetMultiplier;
        
        // Planet group
        const planetGroup = new THREE.Group();
        planetGroup.userData = { 
            name: planetData.name, 
            key: key,
            data: planetData,
            orbitAngle: Math.random() * Math.PI * 2
        };
        
        // Planet mesh
        const geometry = new THREE.SphereGeometry(planetSize, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: planetData.color,
            roughness: 0.7,
            metalness: 0.1
        });
        
        // Try to load texture
        if (TEXTURE_URLS[planetData.texture]) {
            textureLoader.load(
                TEXTURE_URLS[planetData.texture],
                (texture) => {
                    material.map = texture;
                    material.color.set(0xffffff);
                    material.needsUpdate = true;
                },
                undefined,
                () => {
                    console.log(`Texture not found for ${key}, using color`);
                }
            );
        }
        
        const planetMesh = new THREE.Mesh(geometry, material);
        planetMesh.castShadow = true;
        planetMesh.receiveShadow = true;
        planetGroup.add(planetMesh);
        
        // Planet orbit position
        const orbitRadius = planetData.orbitRadius * (isCompactView ? COMPACT_SCALE.orbitMultiplier : REALISTIC_SCALE.orbitMultiplier);
        planetGroup.position.x = orbitRadius;
        
        // Add to scene
        scene.add(planetGroup);
        
        // Store planet reference
        planets[key] = {
            group: planetGroup,
            mesh: planetMesh,
            data: planetData,
            orbitRadius: orbitRadius,
            orbitAngle: planetGroup.userData.orbitAngle,
            rotationAngle: 0
        };
        
        // Add clouds for Earth
        if (key === 'earth') {
            const cloudGeometry = new THREE.SphereGeometry(planetSize * 1.02, 32, 32);
            const cloudMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
            planetMesh.add(clouds);
            planets[key].clouds = clouds;
        }
        
        // Add Moon for Earth
        if (planetData.hasMoon) {
            const moonSize = planetSize * 0.27;
            const moonGeometry = new THREE.SphereGeometry(moonSize, 16, 16);
            const moonMaterial = new THREE.MeshStandardMaterial({
                color: 0xaaaaaa,
                roughness: 0.9
            });
            
            if (TEXTURE_URLS.moon) {
                textureLoader.load(
                    TEXTURE_URLS.moon,
                    (texture) => {
                        moonMaterial.map = texture;
                        moonMaterial.color.set(0xffffff);
                        moonMaterial.needsUpdate = true;
                    }
                );
            }
            
            const moon = new THREE.Mesh(moonGeometry, moonMaterial);
            moon.castShadow = true;
            moon.receiveShadow = true;
            moon.position.set(planetSize * 2.5, 0, 0);
            
            const moonGroup = new THREE.Group();
            moonGroup.add(moon);
            planetGroup.add(moonGroup);
            
            planets[key].moon = moon;
            planets[key].moonGroup = moonGroup;
        }
        
        // Add rings for Saturn
        if (planetData.hasRings) {
            const ringGeometry = new THREE.RingGeometry(planetSize * 1.4, planetSize * 2.2, 64);
            const ringMaterial = new THREE.MeshStandardMaterial({
                color: 0xddccaa,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            planetMesh.add(ring);
            
            // Inner ring
            const innerRingGeometry = new THREE.RingGeometry(planetSize * 1.2, planetSize * 1.35, 64);
            const innerRing = new THREE.Mesh(innerRingGeometry, ringMaterial.clone());
            innerRing.rotation.x = Math.PI / 2;
            planetMesh.add(innerRing);
            
            planets[key].rings = ring;
        }
    });
}

// Create orbit lines
function createOrbitLines() {
    const textureLoader = new THREE.TextureLoader();
    
    Object.keys(PLANET_DATA).forEach(key => {
        const planetData = PLANET_DATA[key];
        const orbitRadius = planetData.orbitRadius * (isCompactView ? COMPACT_SCALE.orbitMultiplier : REALISTIC_SCALE.orbitMultiplier);
        
        const orbitGeometry = new THREE.BufferGeometry();
        const orbitPoints = [];
        
        for (let i = 0; i <= 128; i++) {
            const angle = (i / 128) * Math.PI * 2;
            orbitPoints.push(
                Math.cos(angle) * orbitRadius,
                0,
                Math.sin(angle) * orbitRadius
            );
        }
        
        orbitGeometry.setAttribute('position', new THREE.Float32BufferAttribute(orbitPoints, 3));
        
        const orbitMaterial = new THREE.LineBasicMaterial({
            color: 0x334455,
            transparent: true,
            opacity: 0.3
        });
        
        const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
        scene.add(orbitLine);
        
        orbitLines[key] = orbitLine;
    });
}

// Setup event listeners
function setupEventListeners() {
    // Window resize
    window.addEventListener('resize', onWindowResize);
    
    // Mouse move for hover
    window.addEventListener('mousemove', onMouseMove);
    
    // Click for selection
    window.addEventListener('click', onMouseClick);
    
    // Control panel events
    document.getElementById('speed-slider').addEventListener('input', (e) => {
        orbitSpeedMultiplier = parseFloat(e.target.value);
        document.getElementById('speed-value').textContent = orbitSpeedMultiplier + 'x';
    });
    
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            if (e.target.dataset.mode === 'compact') {
                switchToCompactView();
            } else {
                switchToRealisticView();
            }
        });
    });
    
    document.getElementById('orbit-lines-toggle').addEventListener('change', (e) => {
        showOrbitLines = e.target.checked;
        Object.values(orbitLines).forEach(line => {
            line.visible = showOrbitLines;
        });
    });
    
    document.getElementById('ambient-music-toggle').addEventListener('change', (e) => {
        toggleAmbientMusic(e.target.checked);
    });
    
    document.getElementById('close-panel').addEventListener('click', () => {
        document.getElementById('info-panel').classList.add('hidden');
        document.getElementById('info-panel').classList.remove('visible');
        selectedPlanet = null;
    });
}

// Window resize handler
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

// Mouse move handler
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // Get all planet meshes
    const planetMeshes = Object.values(planets).map(p => p.mesh).filter(p => p);
    const intersects = raycaster.intersectObjects(planetMeshes);
    
    // Reset previous hover
    if (hoveredPlanet && hoveredPlanet !== selectedPlanet) {
        hoveredPlanet.material.emissive.setHex(0x000000);
    }
    
    if (intersects.length > 0) {
        const planet = intersects[0].object;
        if (planet !== selectedPlanet) {
            planet.material.emissive.setHex(0x222222);
            hoveredPlanet = planet;
            document.body.style.cursor = 'pointer';
        }
    } else {
        hoveredPlanet = null;
        document.body.style.cursor = 'default';
    }
}

// Mouse click handler
function onMouseClick(event) {
    raycaster.setFromCamera(mouse, camera);
    
    const planetMeshes = Object.values(planets).map(p => p.mesh).filter(p => p);
    const intersects = raycaster.intersectObjects(planetMeshes);
    
    // Reset previous selection
    if (selectedPlanet) {
        selectedPlanet.material.emissive.setHex(0x000000);
    }
    
    if (intersects.length > 0) {
        const planet = intersects[0].object;
        
        // Find which planet this is
        let planetKey = null;
        Object.keys(planets).forEach(key => {
            if (planets[key].mesh === planet) {
                planetKey = key;
            }
        });
        
        if (planetKey) {
            selectedPlanet = planet;
            showPlanetInfo(planetKey);
            
            // Highlight selected planet
            planet.material.emissive.setHex(0x444444);
        }
    }
}

// Show planet info panel
function showPlanetInfo(planetKey) {
    const planetData = PLANET_DATA[planetKey];
    const panel = document.getElementById('info-panel');
    
    document.getElementById('planet-name').textContent = planetData.name;
    document.getElementById('planet-distance').textContent = planetData.distance;
    document.getElementById('planet-period').textContent = planetData.period;
    document.getElementById('planet-diameter').textContent = planetData.diameter;
    document.getElementById('planet-description').textContent = planetData.description;
    
    const icon = document.getElementById('panel-icon');
    icon.className = 'planet-icon planet-color-' + planetKey;
    icon.style.background = planetData.color;
    icon.style.boxShadow = `0 0 30px ${planetData.color}`;
    
    panel.classList.remove('hidden');
    setTimeout(() => {
        panel.classList.add('visible');
    }, 10);
}

// Toggle ambient music
function toggleAmbientMusic(enabled) {
    const audio = document.getElementById('ambient-audio');
    
    if (enabled) {
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Audio play failed:', e));
    } else {
        audio.pause();
    }
}

// Switch to compact view
function switchToCompactView() {
    isCompactView = true;
    updatePlanetScales();
}

// Switch to realistic view
function switchToRealisticView() {
    isCompactView = false;
    updatePlanetScales();
}

// Update planet scales
function updatePlanetScales() {
    const scale = isCompactView ? COMPACT_SCALE : REALISTIC_SCALE;
    
    // Update sun
    if (sun) {
        sun.geometry.dispose();
        sun.geometry = new THREE.SphereGeometry(scale.sunSize, 64, 64);
    }
    
    // Update planets
    Object.keys(PLANET_DATA).forEach(key => {
        const planetData = PLANET_DATA[key];
        const planetSize = planetData.size * scale.planetMultiplier;
        
        if (planets[key] && planets[key].mesh) {
            planets[key].mesh.geometry.dispose();
            planets[key].mesh.geometry = new THREE.SphereGeometry(planetSize, 32, 32);
            
            // Update moon size
            if (planets[key].moon) {
                const moonSize = planetSize * 0.27;
                planets[key].moon.geometry.dispose();
                planets[key].moon.geometry = new THREE.SphereGeometry(moonSize, 16, 16);
            }
        }
        
        // Update orbit radius
        if (planets[key]) {
            planets[key].orbitRadius = planetData.orbitRadius * scale.orbitMultiplier;
        }
    });
    
    // Update orbit lines
    updateOrbitLines();
}

// Update orbit lines
function updateOrbitLines() {
    Object.keys(PLANET_DATA).forEach(key => {
        const planetData = PLANET_DATA[key];
        const orbitRadius = planetData.orbitRadius * (isCompactView ? COMPACT_SCALE.orbitMultiplier : REALISTIC_SCALE.orbitMultiplier);
        
        if (orbitLines[key]) {
            const positions = orbitLines[key].geometry.attributes.position.array;
            for (let i = 0; i <= 128; i++) {
                const angle = (i / 128) * Math.PI * 2;
                positions[i * 3] = Math.cos(angle) * orbitRadius;
                positions[i * 3 + 2] = Math.sin(angle) * orbitRadius;
            }
            orbitLines[key].geometry.attributes.position.needsUpdate = true;
        }
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();
    
    // Update controls
    controls.update();
    
    // Animate sun
    if (sun) {
        sun.rotation.y += 0.002;
        
        // Pulsating glow
        const pulseScale = 1 + Math.sin(elapsed * 2) * 0.05;
        if (sunGlow) {
            sunGlow.scale.set(pulseScale, pulseScale, pulseScale);
        }
    }
    
    // Animate planets
    Object.keys(planets).forEach(key => {
        if (key === 'sun') return;
        
        const planet = planets[key];
        
        // Orbit around sun
        planet.orbitAngle += planet.data.orbitSpeed * orbitSpeedMultiplier * delta;
        planet.group.position.x = Math.cos(planet.orbitAngle) * planet.orbitRadius;
        planet.group.position.z = Math.sin(planet.orbitAngle) * planet.orbitRadius;
        
        // Rotation on own axis
        planet.rotationAngle += planet.data.rotationSpeed * orbitSpeedMultiplier * delta;
        planet.mesh.rotation.y = planet.rotationAngle;
        
        // Animate moon
        if (planet.moon && planet.moonGroup) {
            planet.moonGroup.rotation.y += 0.02 * orbitSpeedMultiplier;
        }
        
        // Animate clouds
        if (planet.clouds) {
            planet.clouds.rotation.y += 0.001;
        }
    });
    
    // Slowly rotate stars
    if (stars) {
        stars.rotation.y += 0.00005;
    }
    
    // Slowly rotate nebula
    if (nebula) {
        nebula.rotation.y += 0.00002;
        nebula.rotation.x += 0.00001;
    }
    
    // Render with post-processing
    composer.render();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
