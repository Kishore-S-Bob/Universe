(function() {
    // Scene variables
    let scene, camera, renderer, controls;
    let raycaster, mouse;
    
    // State
    let isPaused = false;
    let timeScale = 1.0;
    let selectedPlanet = null;
    let showOrbits = true;
    let showLabels = true;
    let focusMode = false;
    let autoRotate = false;
    let hoveredPlanet = null;
    let originalCameraPosition = new THREE.Vector3(0, 60, 120);
    let originalTarget = new THREE.Vector3(0, 0, 0);
    let targetCameraPosition = null;
    let targetLookAt = null;
    let cameraAnimationProgress = 1;
    let audioContext = null;
    let audioGainNode = null;
    let audioOscillators = [];
    
    // Planet objects
    const planets = [];
    const planetMeshes = [];
    const orbitLines = [];
    const planetLabels = [];
    
    // Constants
    const BASE_SPEED = 0.005;
    
    // Scientific planet data (scaled for visualization)
    const planetsData = [
        {
            name: "Mercury",
            radius: 0.38,
            distance: 10,
            orbitalPeriod: 0.24,
            rotationPeriod: 58.6,
            color: 0x8c7853,
            diameter: "4,879 km",
            distanceText: "57.9 million km",
            periodText: "88 days",
            dayText: "59 Earth days",
            description: "Mercury is the smallest and innermost planet in the Solar System. Its surface is heavily cratered and similar in appearance to the Moon's.",
            colorClass: "planet-color-mercury"
        },
        {
            name: "Venus",
            radius: 0.95,
            distance: 15,
            orbitalPeriod: 0.62,
            rotationPeriod: -243,
            color: 0xe6c87a,
            diameter: "12,104 km",
            distanceText: "108.2 million km",
            periodText: "225 days",
            dayText: "243 Earth days",
            description: "Venus is the second planet from the Sun and is the hottest planet in the Solar System due to its thick, toxic atmosphere.",
            colorClass: "planet-color-venus"
        },
        {
            name: "Earth",
            radius: 1,
            distance: 20,
            orbitalPeriod: 1,
            rotationPeriod: 1,
            color: 0x4a90d9,
            diameter: "12,742 km",
            distanceText: "149.6 million km",
            periodText: "365.25 days",
            dayText: "24 hours",
            description: "Earth is the third planet from the Sun and the only astronomical object known to harbor life. It has one natural satellite, the Moon.",
            colorClass: "planet-color-earth",
            hasMoon: true
        },
        {
            name: "Mars",
            radius: 0.53,
            distance: 28,
            orbitalPeriod: 1.88,
            rotationPeriod: 1.03,
            color: 0xc1440e,
            diameter: "6,779 km",
            distanceText: "227.9 million km",
            periodText: "687 days",
            dayText: "24.6 hours",
            description: "Mars is the fourth planet from the Sun, often called the 'Red Planet' due to its reddish appearance caused by iron oxide on its surface.",
            colorClass: "planet-color-mars"
        },
        {
            name: "Jupiter",
            radius: 3.5,
            distance: 45,
            orbitalPeriod: 11.86,
            rotationPeriod: 0.41,
            color: 0xd4a574,
            diameter: "139,820 km",
            distanceText: "778.5 million km",
            periodText: "11.9 years",
            dayText: "9.9 hours",
            description: "Jupiter is the fifth planet from the Sun and the largest in the Solar System. It is a gas giant with a mass more than two and a half times that of all other planets combined.",
            colorClass: "planet-color-jupiter"
        },
        {
            name: "Saturn",
            radius: 2.9,
            distance: 62,
            orbitalPeriod: 29.46,
            rotationPeriod: 0.45,
            color: 0xe8d5a3,
            diameter: "116,460 km",
            distanceText: "1.4 billion km",
            periodText: "29.5 years",
            dayText: "10.7 hours",
            description: "Saturn is the sixth planet from the Sun and the second-largest. It is famous for its prominent ring system, composed mainly of ice particles, with a smaller amount of rocky debris and dust.",
            colorClass: "planet-color-saturn",
            hasRings: true
        },
        {
            name: "Uranus",
            radius: 1.8,
            distance: 80,
            orbitalPeriod: 84.01,
            rotationPeriod: -0.72,
            color: 0x7de3f4,
            diameter: "50,724 km",
            distanceText: "2.9 billion km",
            periodText: "84 years",
            dayText: "17.2 hours",
            description: "Uranus is the seventh planet from the Sun and has the third-largest planetary radius. It has a unique tilt, rotating on its side relative to its orbital plane.",
            colorClass: "planet-color-uranus"
        },
        {
            name: "Neptune",
            radius: 1.7,
            distance: 95,
            orbitalPeriod: 164.8,
            rotationPeriod: 0.67,
            color: 0x3d5ef7,
            diameter: "49,244 km",
            distanceText: "4.5 billion km",
            periodText: "165 years",
            dayText: "16.1 hours",
            description: "Neptune is the eighth and farthest known Solar planet from the Sun. It is a dense ice giant with the strongest winds of any planet in the Solar System.",
            colorClass: "planet-color-neptune"
        }
    ];

    function init() {
        // Create raycaster for mouse interaction
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000005);

        // Camera setup
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
        camera.position.set(0, 60, 120);

        // Renderer setup
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('canvas-container').appendChild(renderer.domElement);

        // OrbitControls
        // Try THREE.OrbitControls first (r128 CDN), fall back to global OrbitControls
        if (typeof THREE.OrbitControls === 'function') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
        } else if (typeof OrbitControls === 'function') {
            controls = new OrbitControls(camera, renderer.domElement);
        } else {
            console.error('OrbitControls not loaded');
            return;
        }
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 15;
        controls.maxDistance = 300;
        controls.maxPolarAngle = Math.PI / 1.5;
        controls.enablePan = false;
        controls.autoRotate = false;
        controls.autoRotateSpeed = 0.5;

        // Lighting
        // Sun light (point light at center)
        const sunLight = new THREE.PointLight(0xffffff, 2.5, 500, 1);
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        scene.add(sunLight);

        // Ambient light for visibility of dark sides
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        scene.add(ambientLight);

        // Create the Sun
        createSun();

        // Create planets
        createPlanets();

        // Create starfield
        createStarfield();

        // Create planet labels
        createPlanetLabels();

        // Setup event listeners
        setupEventListeners();

        // Hide loading screen after animation
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
        }, 2500);

        // Start animation loop
        animate();
    }

    function createSun() {
        // Sun geometry and material with glow effect
        const sunGeometry = new THREE.SphereGeometry(5, 64, 64);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffdd44,
            emissive: 0xffdd44
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun);

        // Sun glow (larger sphere with transparency)
        const glowGeometry = new THREE.SphereGeometry(6.5, 64, 64);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff8800,
            transparent: true,
            opacity: 0.3
        });
        const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        scene.add(sunGlow);

        // Additional outer glow
        const outerGlowGeometry = new THREE.SphereGeometry(8, 64, 64);
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.1
        });
        const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        scene.add(outerGlow);

        // Corona effect (animated outer glow)
        const coronaGeometry = new THREE.SphereGeometry(10, 64, 64);
        const coronaMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.05
        });
        const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
        scene.add(corona);

        // Animate corona
        function animateCorona() {
            const time = Date.now() * 0.001;
            const scale = 1 + Math.sin(time * 2) * 0.1;
            corona.scale.set(scale, scale, scale);
            requestAnimationFrame(animateCorona);
        }
        animateCorona();

        // Store sun reference for animations
        scene.userData.sun = { sun, sunGlow, outerGlow, corona };
    }

    function createPlanets() {
        planetsData.forEach((data, index) => {
            // Orbit group for rotation around the sun
            const orbitGroup = new THREE.Group();
            scene.add(orbitGroup);

            // Planet mesh
            const planetGeometry = new THREE.SphereGeometry(data.radius, 32, 32);
            const planetMaterial = new THREE.MeshStandardMaterial({
                color: data.color,
                roughness: 0.8,
                metalness: 0.2,
                emissive: data.color,
                emissiveIntensity: 0.1
            });
            const planet = new THREE.Mesh(planetGeometry, planetMaterial);
            planet.position.x = data.distance;
            planet.castShadow = true;
            planet.receiveShadow = true;
            planet.userData = {
                name: data.name,
                index: index,
                data: data,
                originalScale: data.radius
            };
            orbitGroup.add(planet);

            // Create orbit line
            const orbitLine = createOrbitLine(data.distance);
            scene.add(orbitLine);
            orbitLines.push(orbitLine);

            // Saturn's rings
            if (data.hasRings) {
                createSaturnRings(planet, data.radius);
            }

            // Earth's Moon
            let moonGroup = null;
            let moon = null;
            if (data.hasMoon) {
                moonGroup = new THREE.Group();
                planet.add(moonGroup);

                const moonGeometry = new THREE.SphereGeometry(0.27, 16, 16);
                const moonMaterial = new THREE.MeshStandardMaterial({
                    color: 0x888888,
                    roughness: 1,
                    metalness: 0
                });
                moon = new THREE.Mesh(moonGeometry, moonMaterial);
                moon.position.x = 2;
                moon.castShadow = true;
                moon.receiveShadow = true;
                moonGroup.add(moon);
            }

            // Store planet data
            planets.push({
                group: orbitGroup,
                planet: planet,
                moonGroup: moonGroup,
                moon: moon,
                orbitalSpeed: BASE_SPEED / data.orbitalPeriod,
                rotationSpeed: 0.02 / Math.abs(data.rotationPeriod),
                angle: Math.random() * Math.PI * 2,
                data: data
            });

            planetMeshes.push(planet);
        });
    }

    function createOrbitLine(radius) {
        const points = [];
        const segments = 128;
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            ));
        }
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0x444466,
            transparent: true,
            opacity: 0.5
        });
        return new THREE.Line(geometry, material);
    }

    function createSaturnRings(planet, planetRadius) {
        const innerRadius = planetRadius * 1.2;
        const outerRadius = planetRadius * 2.2;
        const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
        
        // Adjust UV mapping for ring texture effect
        const pos = ringGeometry.attributes.position;
        const uv = ringGeometry.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const radius = Math.sqrt(x * x + y * y);
            uv.setXY(i, (radius - innerRadius) / (outerRadius - innerRadius), 0);
        }

        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xc9b896,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2.2; // Tilt the rings
        planet.add(rings);
    }

    function createStarfield() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 8000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            const radius = 500 + Math.random() * 500;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Vary star colors slightly
            const colorVariation = 0.8 + Math.random() * 0.4;
            colors[i * 3] = colorVariation;
            colors[i * 3 + 1] = colorVariation;
            colors[i * 3 + 2] = colorVariation + Math.random() * 0.1;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const starMaterial = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);
    }

    function createPlanetLabels() {
        const labelsContainer = document.getElementById('planet-labels');
        
        planetsData.forEach((data, index) => {
            const label = document.createElement('div');
            label.className = 'planet-label visible';
            label.textContent = data.name;
            label.dataset.planetIndex = index;
            labelsContainer.appendChild(label);
            planetLabels.push(label);
        });
    }

    function updatePlanetLabels() {
        if (!showLabels || planetLabels.length === 0) {
            if (planetLabels.length > 0) {
                planetLabels.forEach(label => label.classList.remove('visible'));
            }
            return;
        }

        planets.forEach((planetData, index) => {
            const label = planetLabels[index];
            if (!label) return;

            const planetWorldPos = new THREE.Vector3();
            planetData.planet.getWorldPosition(planetWorldPos);

            // Project 3D position to 2D screen coordinates
            const screenPos = planetWorldPos.clone().project(camera);

            // Check if planet is in front of camera
            if (screenPos.z < 1) {
                const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
                const y = (screenPos.y * -0.5 + 0.5) * window.innerHeight;

                label.style.left = `${x}px`;
                label.style.top = `${y}px`;
                label.classList.add('visible');
            } else {
                label.classList.remove('visible');
            }
        });
    }

    function setupEventListeners() {
        // Window resize
        window.addEventListener('resize', onWindowResize);

        // Mouse click for planet selection
        renderer.domElement.addEventListener('click', onMouseClick);

        // Mouse move for hover effects
        renderer.domElement.addEventListener('mousemove', onMouseMove);

        // Mouse down/up for drag state
        renderer.domElement.addEventListener('mousedown', () => {
            document.getElementById('canvas-container').classList.add('interacting');
        });
        renderer.domElement.addEventListener('mouseup', () => {
            document.getElementById('canvas-container').classList.remove('interacting');
        });

        // Speed slider
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');
        speedSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            timeScale = value / 20; // Scale slider to reasonable time multiplier
            speedValue.textContent = timeScale.toFixed(1) + 'x';
        });

        // Play/Pause button
        const playPauseBtn = document.getElementById('play-pause-btn');
        playPauseBtn.addEventListener('click', () => {
            isPaused = !isPaused;
            playPauseBtn.textContent = isPaused ? 'Play' : 'Pause';
            playPauseBtn.classList.toggle('active', !isPaused);
        });

        // Reset view button
        const resetViewBtn = document.getElementById('reset-view-btn');
        resetViewBtn.addEventListener('click', () => {
            exitFocusMode();
            camera.position.set(0, 60, 120);
            controls.target.set(0, 0, 0);
            controls.update();
        });

        // Auto-rotate checkbox
        document.getElementById('auto-rotate').addEventListener('change', (e) => {
            autoRotate = e.target.checked;
            controls.autoRotate = autoRotate;
        });

        // Ambient sound checkbox
        document.getElementById('ambient-sound').addEventListener('change', (e) => {
            if (e.target.checked) {
                startAmbientSound();
            } else {
                stopAmbientSound();
            }
        });

        // Back to Solar System button
        document.getElementById('back-to-solar-btn').addEventListener('click', () => {
            exitFocusMode();
        });

        // Show orbits checkbox
        document.getElementById('show-orbits').addEventListener('change', (e) => {
            showOrbits = e.target.checked;
            orbitLines.forEach(line => {
                line.visible = showOrbits;
            });
        });

        // Show labels checkbox
        document.getElementById('show-labels').addEventListener('change', (e) => {
            showLabels = e.target.checked;
        });

        // Info panel close button
        document.querySelector('.close-btn').addEventListener('click', () => {
            hideInfoPanel();
            exitFocusMode();
        });

        // Close info panel when clicking outside
        document.addEventListener('click', (e) => {
            const infoPanel = document.getElementById('info-panel');
            if (!infoPanel.contains(e.target) && !e.target.closest('#planet-labels')) {
                // Don't close if clicking on a planet
                const isPlanetClick = raycaster.intersectObjects(planetMeshes).length > 0;
                if (!isPlanetClick && selectedPlanet) {
                    hideInfoPanel();
                    exitFocusMode();
                }
            }
        });
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Raycast to find hovered planet
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(planetMeshes);

        // Reset previous hover state
        if (hoveredPlanet && (!intersects.length || intersects[0].object !== hoveredPlanet)) {
            hoveredPlanet.scale.set(
                hoveredPlanet.userData.originalScale / hoveredPlanet.userData.data.radius,
                hoveredPlanet.userData.originalScale / hoveredPlanet.userData.data.radius,
                hoveredPlanet.userData.originalScale / hoveredPlanet.userData.data.radius
            );
            hoveredPlanet.material.emissiveIntensity = 0.1;
            hoveredPlanet = null;
            document.getElementById('canvas-container').classList.remove('hovering');
        }

        // Set new hover state
        if (intersects.length > 0 && intersects[0].object !== selectedPlanet) {
            const planet = intersects[0].object;
            if (planet !== hoveredPlanet) {
                hoveredPlanet = planet;
                // Slight scale up
                planet.scale.set(1.2, 1.2, 1.2);
                // Increase glow
                planet.material.emissiveIntensity = 0.5;
                document.getElementById('canvas-container').classList.add('hovering');
            }
        }
    }

    function onMouseClick(event) {
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Raycast to find clicked planet
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(planetMeshes);

        if (intersects.length > 0) {
            const clickedPlanet = intersects[0].object;
            selectPlanet(clickedPlanet);
        }
    }

    function selectPlanet(planet) {
        selectedPlanet = planet;
        const data = planet.userData.data;

        // Update info panel
        const infoPanel = document.getElementById('info-panel');
        const infoIcon = document.getElementById('info-icon');
        const infoName = document.getElementById('info-name');
        const infoDiameter = document.getElementById('info-diameter');
        const infoDistance = document.getElementById('info-distance');
        const infoPeriod = document.getElementById('info-period');
        const infoDay = document.getElementById('info-day');
        const infoDescription = document.getElementById('info-description');
        const backToSolarBtn = document.getElementById('back-to-solar-btn');

        // Update icon
        infoIcon.className = `planet-icon ${data.colorClass}`;

        // Update text content
        infoName.textContent = data.name;
        infoDiameter.textContent = data.diameter;
        infoDistance.textContent = data.distanceText;
        infoPeriod.textContent = data.periodText;
        infoDay.textContent = data.dayText;
        infoDescription.textContent = data.description;

        // Show panel and back button
        infoPanel.classList.remove('hidden');
        infoPanel.classList.add('visible');
        backToSolarBtn.style.display = 'block';

        // Highlight planet
        planet.scale.set(1.3, 1.3, 1.3);
        planet.material.emissiveIntensity = 0.8;

        // Enter focus mode
        enterFocusMode(planet);

        // Update selection ring
        updateSelectionRing(planet);
    }

    function updateSelectionRing(planet) {
        const selectionRing = document.getElementById('selection-ring');
        
        // Get planet screen position
        const planetWorldPos = new THREE.Vector3();
        planet.getWorldPosition(planetWorldPos);
        const screenPos = planetWorldPos.clone().project(camera);

        if (screenPos.z < 1) {
            const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
            const y = (screenPos.y * -0.5 + 0.5) * window.innerHeight;

            // Calculate ring size based on planet radius and distance
            const distanceToCamera = camera.position.distanceTo(planetWorldPos);
            const baseSize = planet.userData.data.radius * 2;
            const ringSize = (baseSize * 1000) / distanceToCamera;

            selectionRing.style.left = `${x}px`;
            selectionRing.style.top = `${y}px`;
            selectionRing.style.width = `${ringSize}px`;
            selectionRing.style.height = `${ringSize}px`;
            selectionRing.style.display = 'block';
        }
    }

    function hideInfoPanel() {
        if (selectedPlanet) {
            // Reset planet scale and glow
            selectedPlanet.scale.set(1, 1, 1);
            selectedPlanet.material.emissiveIntensity = 0.1;
        }
        selectedPlanet = null;
        const infoPanel = document.getElementById('info-panel');
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
        document.getElementById('selection-ring').style.display = 'none';
        document.getElementById('back-to-solar-btn').style.display = 'none';
    }

    function enterFocusMode(planet) {
        focusMode = true;

        // Store original camera position if not already stored
        if (!originalCameraPosition.equals(camera.position)) {
            originalCameraPosition.copy(camera.position);
            originalTarget.copy(controls.target);
        }

        // Calculate target camera position (closer to planet)
        const planetWorldPos = new THREE.Vector3();
        planet.getWorldPosition(planetWorldPos);

        const distanceOffset = 15; // Distance from planet
        const offset = new THREE.Vector3(distanceOffset, distanceOffset * 0.5, distanceOffset);

        targetCameraPosition = planetWorldPos.clone().add(offset);
        targetLookAt = planetWorldPos.clone();

        // Start animation
        cameraAnimationProgress = 0;
    }

    function exitFocusMode() {
        if (!focusMode) return;

        focusMode = false;

        // Animate back to original position
        targetCameraPosition = originalCameraPosition.clone();
        targetLookAt = originalTarget.clone();

        // Reset planet scale if selected
        if (selectedPlanet) {
            selectedPlanet.scale.set(1, 1, 1);
            selectedPlanet.material.emissiveIntensity = 0.1;
        }

        // Start animation
        cameraAnimationProgress = 0;
    }

    function updateCameraAnimation(deltaTime) {
        if (cameraAnimationProgress >= 1) return;

        cameraAnimationProgress += deltaTime * 2; // Animation speed
        if (cameraAnimationProgress > 1) cameraAnimationProgress = 1;

        // Ease-in-out function
        const ease = cameraAnimationProgress < 0.5
            ? 2 * cameraAnimationProgress * cameraAnimationProgress
            : 1 - Math.pow(-2 * cameraAnimationProgress + 2, 2) / 2;

        // Interpolate camera position
        if (targetCameraPosition) {
            camera.position.lerp(targetCameraPosition, ease);
        }

        // Interpolate look-at target
        if (targetLookAt) {
            controls.target.lerp(targetLookAt, ease);
            controls.update();
        }
    }

    function startAmbientSound() {
        if (audioContext) return; // Already started

        try {
            // Create audio context
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioGainNode = audioContext.createGain();
            audioGainNode.gain.value = 0.1; // Low volume
            audioGainNode.connect(audioContext.destination);

            // Create multiple oscillators for layered drone effect
            const frequencies = [60, 90, 120, 150, 180];

            frequencies.forEach((freq, index) => {
                const oscillator = audioContext.createOscillator();
                const gain = audioContext.createGain();

                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);

                // Subtle frequency modulation
                const lfo = audioContext.createOscillator();
                const lfoGain = audioContext.createGain();
                lfo.frequency.setValueAtTime(0.1 + index * 0.05, audioContext.currentTime);
                lfoGain.gain.setValueAtTime(5, audioContext.currentTime);
                lfo.connect(lfoGain);
                lfoGain.connect(oscillator.frequency);
                lfo.start();

                // Very low volume
                gain.gain.setValueAtTime(0.05, audioContext.currentTime);

                oscillator.connect(gain);
                gain.connect(audioGainNode);
                oscillator.start();

                audioOscillators.push({ oscillator, gain, lfo });
            });
        } catch (err) {
            console.log('Audio initialization failed:', err);
        }
    }

    function stopAmbientSound() {
        if (!audioContext) return;

        // Fade out
        if (audioGainNode) {
            audioGainNode.gain.setValueAtTime(audioGainNode.gain.value, audioContext.currentTime);
            audioGainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
        }

        setTimeout(() => {
            audioOscillators.forEach(({ oscillator, lfo }) => {
                oscillator.stop();
                lfo.stop();
            });
            audioOscillators = [];
            if (audioContext) {
                audioContext.close();
                audioContext = null;
            }
            audioGainNode = null;
        }, 500);
    }

    function animate() {
        requestAnimationFrame(animate);

        const deltaTime = 1 / 60; // Assuming 60 FPS

        if (!isPaused) {
            // Update planet orbits
            planets.forEach(planet => {
                // Orbital rotation
                planet.group.rotation.y += planet.orbitalSpeed * timeScale;

                // Self-rotation
                planet.planet.rotation.y += planet.rotationSpeed * timeScale;

                // Moon rotation (if exists)
                if (planet.moonGroup) {
                    planet.moonGroup.rotation.y += 0.05 * timeScale;
                }
            });
        }

        // Update camera animation
        updateCameraAnimation(deltaTime);

        // Update labels every frame
        updatePlanetLabels();

        // Update selection ring position if planet is selected
        if (selectedPlanet) {
            updateSelectionRing(selectedPlanet);

            // In focus mode, keep camera focused on planet
            if (focusMode && cameraAnimationProgress >= 1) {
                const planetWorldPos = new THREE.Vector3();
                selectedPlanet.getWorldPosition(planetWorldPos);
                controls.target.copy(planetWorldPos);
                controls.update();
            }
        }

        controls.update();
        renderer.render(scene, camera);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
