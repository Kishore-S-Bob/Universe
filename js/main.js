(function() {
    // Scene variables
    let scene, camera, renderer, controls;
    let raycaster, mouse;
    
    // State
    let isPaused = false;
    let isReversed = false;
    let timeScale = 1.0;
    let selectedObject = null;
    let showOrbits = true;
    let autoRotate = false;
    let hoveredObject = null;
    let focusMode = false;
    let originalCameraPosition = new THREE.Vector3(0, 100, 150);
    let originalTarget = new THREE.Vector3(0, 0, 0);
    let targetCameraPosition = null;
    let targetLookAt = null;
    let cameraAnimationProgress = 1;
    
    // Universe objects
    const stars = [];
    const planets = [];
    const moons = [];
    const orbitLines = [];
    let starfield = null;
    
    // Constants
    const BASE_SPEED = 0.005;
    let nextId = 1;

    // Initialize
    function init() {
        // Create raycaster for mouse interaction
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000008);

        // Camera setup
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
        camera.position.set(0, 100, 150);

        // Renderer setup
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('canvas-container').appendChild(renderer.domElement);

        // OrbitControls
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
        controls.minDistance = 10;
        controls.maxDistance = 1000;
        controls.maxPolarAngle = Math.PI / 1.8;
        controls.enablePan = true;

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
        scene.add(ambientLight);

        // Create starfield
        createStarfield();

        // Setup event listeners
        setupEventListeners();

        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
        }, 2000);

        // Start animation loop
        animate();
    }

    // Starfield creation
    function createStarfield() {
        if (starfield) {
            scene.remove(starfield);
        }

        const starGeometry = new THREE.BufferGeometry();
        const starCount = 15000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const radius = 500 + Math.random() * 2000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Vary star colors
            const colorType = Math.random();
            if (colorType < 0.6) {
                // White/yellow stars
                colors[i * 3] = 0.9 + Math.random() * 0.1;
                colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
                colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
            } else if (colorType < 0.8) {
                // Blue stars
                colors[i * 3] = 0.7 + Math.random() * 0.3;
                colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
                colors[i * 3 + 2] = 1.0;
            } else {
                // Red/orange stars
                colors[i * 3] = 1.0;
                colors[i * 3 + 1] = 0.6 + Math.random() * 0.4;
                colors[i * 3 + 2] = 0.4 + Math.random() * 0.2;
            }

            sizes[i] = 1 + Math.random() * 2;
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const starMaterial = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true
        });

        starfield = new THREE.Points(starGeometry, starMaterial);
        starfield.userData.animateStars = true;
        scene.add(starfield);
    }

    // Create a star
    function createStar(options = {}) {
        const size = options.size || 5;
        const color = options.color || 0xffdd44;
        const position = options.position || new THREE.Vector3(
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 200
        );
        const glowIntensity = options.glowIntensity || 1;
        const name = options.name || `Star ${nextId++}`;

        // Star group
        const starGroup = new THREE.Group();
        starGroup.position.copy(position);
        
        // Star geometry and material
        const starGeometry = new THREE.SphereGeometry(size, 64, 64);
        const starMaterial = new THREE.MeshBasicMaterial({
            color: color,
            emissive: color
        });
        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.castShadow = true;
        starGroup.add(star);

        // Star glow
        const glowGeometry = new THREE.SphereGeometry(size * 1.3, 64, 64);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3 * glowIntensity
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        starGroup.add(glow);

        // Outer glow
        const outerGlowGeometry = new THREE.SphereGeometry(size * 1.6, 64, 64);
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15 * glowIntensity
        });
        const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        starGroup.add(outerGlow);

        // Corona effect
        const coronaGeometry = new THREE.SphereGeometry(size * 2, 64, 64);
        const coronaMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.08 * glowIntensity
        });
        const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
        starGroup.add(corona);

        // Point light
        const light = new THREE.PointLight(color, 2 * glowIntensity, 300, 1);
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        starGroup.add(light);

        scene.add(starGroup);

        // Store star data
        const starData = {
            id: Date.now(),
            type: 'star',
            name: name,
            mesh: star,
            group: starGroup,
            glow: glow,
            outerGlow: outerGlow,
            corona: corona,
            light: light,
            size: size,
            baseSize: size,
            color: new THREE.Color(color),
            glowIntensity: glowIntensity,
            rotationSpeed: 0.005,
            angle: Math.random() * Math.PI * 2
        };
        star.userData = starData;
        stars.push(starData);

        updatePlanetButtonStates();
        return starData;
    }

    // Create a planet
    function createPlanet(options = {}) {
        const parent = options.parent || (stars.length > 0 ? stars[0].mesh : null);
        if (!parent) {
            alert('Please create a star first!');
            return null;
        }

        const size = options.size || 1;
        const color = options.color || 0x4a90d9;
        const distance = options.distance || 20;
        const orbitSpeed = options.orbitSpeed || 1;
        const rotationSpeed = options.rotationSpeed || 1;
        const name = options.name || `Planet ${nextId++}`;

        // Get parent group
        const parentGroup = parent.parent || parent;

        // Orbit group
        const orbitGroup = new THREE.Group();
        orbitGroup.position.copy(parentGroup.position);
        scene.add(orbitGroup);

        // Planet mesh
        const planetGeometry = new THREE.SphereGeometry(size, 32, 32);
        const planetMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.8,
            metalness: 0.2,
            emissive: color,
            emissiveIntensity: 0.1
        });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planet.position.x = distance;
        planet.castShadow = true;
        planet.receiveShadow = true;
        orbitGroup.add(planet);

        // Create orbit line
        const orbitLine = createOrbitLine(distance);
        orbitLine.position.copy(parentGroup.position);
        orbitLine.visible = showOrbits;
        scene.add(orbitLine);
        orbitLines.push(orbitLine);

        // Store planet data
        const planetData = {
            id: Date.now(),
            type: 'planet',
            name: name,
            mesh: planet,
            group: orbitGroup,
            parent: parent,
            orbitLine: orbitLine,
            size: size,
            baseSize: size,
            color: new THREE.Color(color),
            distance: distance,
            orbitalSpeed: (BASE_SPEED * orbitSpeed) / Math.sqrt(distance),
            rotationSpeed: 0.02 * rotationSpeed,
            angle: Math.random() * Math.PI * 2
        };
        planet.userData = planetData;
        planets.push(planetData);

        updateMoonButtonStates();
        return planetData;
    }

    // Create a moon
    function createMoon(options = {}) {
        const parent = options.parent || (planets.length > 0 ? planets[0].mesh : null);
        if (!parent) {
            alert('Please create a planet first!');
            return null;
        }

        const size = options.size || 0.3;
        const color = options.color || 0x888888;
        const distance = options.distance || 3;
        const orbitSpeed = options.orbitSpeed || 1;
        const rotationSpeed = options.rotationSpeed || 1;
        const name = options.name || `Moon ${nextId++}`;

        // Moon orbit group (attached to planet)
        const moonOrbitGroup = new THREE.Group();
        parent.add(moonOrbitGroup);

        // Moon mesh
        const moonGeometry = new THREE.SphereGeometry(size, 16, 16);
        const moonMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 1,
            metalness: 0,
            emissive: color,
            emissiveIntensity: 0.05
        });
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.position.x = distance;
        moon.castShadow = true;
        moon.receiveShadow = true;
        moonOrbitGroup.add(moon);

        // Create moon orbit line
        const moonOrbitLine = createOrbitLine(distance);
        moonOrbitLine.rotation.x = Math.PI / 2;
        moonOrbitLine.visible = showOrbits;
        parent.add(moonOrbitLine);

        // Get planet data
        const parentData = parent.userData;

        // Store moon data
        const moonData = {
            id: Date.now(),
            type: 'moon',
            name: name,
            mesh: moon,
            group: moonOrbitGroup,
            parent: parent,
            parentData: parentData,
            orbitLine: moonOrbitLine,
            size: size,
            baseSize: size,
            color: new THREE.Color(color),
            distance: distance,
            orbitalSpeed: BASE_SPEED * 2 * orbitSpeed,
            rotationSpeed: 0.02 * rotationSpeed,
            angle: Math.random() * Math.PI * 2
        };
        moon.userData = moonData;
        moons.push(moonData);

        return moonData;
    }

    // Create orbit line
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
            color: 0x4444aa,
            transparent: true,
            opacity: 0.4
        });
        return new THREE.Line(geometry, material);
    }

    // Delete object
    function deleteObject(objData) {
        if (!objData) return;

        // Delete orbit line if exists
        if (objData.orbitLine) {
            scene.remove(objData.orbitLine);
            const index = orbitLines.indexOf(objData.orbitLine);
            if (index > -1) orbitLines.splice(index, 1);
        }

        // If deleting a star, delete all its planets and moons
        if (objData.type === 'star') {
            const planetsToRemove = planets.filter(p => p.parent === objData.mesh || p.parent === objData.group);
            planetsToRemove.forEach(p => deleteObject(p));
        }

        // If deleting a planet, delete all its moons
        if (objData.type === 'planet') {
            const moonsToRemove = moons.filter(m => m.parent === objData.mesh);
            moonsToRemove.forEach(m => deleteObject(m));
        }

        // Remove mesh
        if (objData.group && objData.group.parent) {
            objData.group.parent.remove(objData.group);
        } else if (objData.mesh && objData.mesh.parent) {
            objData.mesh.parent.remove(objData.mesh);
        }

        // Remove from arrays
        const arrays = [stars, planets, moons];
        arrays.forEach(arr => {
            const index = arr.indexOf(objData);
            if (index > -1) arr.splice(index, 1);
        });

        // Update button states
        updatePlanetButtonStates();
        updateMoonButtonStates();

        // Hide inspector if this object was selected
        if (selectedObject === objData) {
            deselectObject();
        }
    }

    // Select object
    function selectObject(objData) {
        deselectObject();
        selectedObject = objData;

        // Highlight effect
        if (objData.type === 'star') {
            objData.mesh.scale.set(1.1, 1.1, 1.1);
        } else {
            objData.mesh.scale.set(1.2, 1.2, 1.2);
            objData.mesh.material.emissiveIntensity = 0.5;
        }

        // Show inspector
        showInspector(objData);
    }

    // Deselect object
    function deselectObject() {
        if (!selectedObject) return;

        // Reset scale and emissive
        selectedObject.mesh.scale.set(1, 1, 1);
        if (selectedObject.type !== 'star') {
            selectedObject.mesh.material.emissiveIntensity = 0.1;
        }

        selectedObject = null;
        hideInspector();
    }

    // Show inspector panel
    function showInspector(objData) {
        const inspector = document.getElementById('inspector-panel');
        const title = document.getElementById('inspector-title');
        
        title.textContent = `${objData.type.charAt(0).toUpperCase() + objData.type.slice(1)} Properties`;
        
        // Update form values
        document.getElementById('obj-name').value = objData.name;
        document.getElementById('obj-size').value = objData.size;
        document.getElementById('size-value').textContent = objData.size.toFixed(1);
        
        if (objData.type === 'star') {
            document.getElementById('obj-speed').parentElement.style.display = 'none';
            document.getElementById('obj-distance').parentElement.style.display = 'none';
        } else {
            document.getElementById('obj-speed').parentElement.style.display = 'block';
            document.getElementById('obj-distance').parentElement.style.display = 'block';
            document.getElementById('obj-speed').value = (objData.orbitalSpeed / BASE_SPEED) * Math.sqrt(objData.distance);
            document.getElementById('speed-value-prop').textContent = ((objData.orbitalSpeed / BASE_SPEED) * Math.sqrt(objData.distance)).toFixed(1);
            document.getElementById('obj-distance').value = objData.distance;
            document.getElementById('distance-value').textContent = objData.distance.toFixed(0);
        }
        
        document.getElementById('obj-color').value = '#' + objData.color.getHexString();
        document.getElementById('obj-rotation').value = objData.rotationSpeed / 0.02;
        document.getElementById('rotation-value').textContent = (objData.rotationSpeed / 0.02).toFixed(1);
        
        if (objData.type === 'star') {
            document.getElementById('obj-glow').parentElement.style.display = 'block';
            document.getElementById('obj-glow').value = objData.glowIntensity;
            document.getElementById('glow-value').textContent = objData.glowIntensity.toFixed(1);
        } else {
            document.getElementById('obj-glow').parentElement.style.display = 'none';
        }
        
        inspector.classList.remove('hidden');
    }

    // Hide inspector panel
    function hideInspector() {
        document.getElementById('inspector-panel').classList.add('hidden');
    }

    // Focus on object
    function focusOnObject(objData) {
        focusMode = true;
        selectedObject = objData;

        // Store original camera position
        if (!originalCameraPosition.equals(camera.position)) {
            originalCameraPosition.copy(camera.position);
            originalTarget.copy(controls.target);
        }

        // Get world position
        const worldPos = new THREE.Vector3();
        if (objData.group) {
            objData.group.getWorldPosition(worldPos);
        } else {
            objData.mesh.getWorldPosition(worldPos);
        }

        // Calculate target camera position
        const distanceOffset = objData.size * 15;
        const offset = new THREE.Vector3(distanceOffset, distanceOffset * 0.5, distanceOffset);

        targetCameraPosition = worldPos.clone().add(offset);
        targetLookAt = worldPos.clone();

        cameraAnimationProgress = 0;

        // Show focus controls
        document.getElementById('focus-controls').classList.remove('hidden');
    }

    // Exit focus mode
    function exitFocusMode() {
        if (!focusMode) return;
        focusMode = false;

        targetCameraPosition = originalCameraPosition.clone();
        targetLookAt = originalTarget.clone();
        cameraAnimationProgress = 0;

        document.getElementById('focus-controls').classList.add('hidden');
    }

    // Generate random universe
    function generateRandomUniverse() {
        // Clear existing
        clearUniverse();

        // Generate random stars (1-3)
        const numStars = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numStars; i++) {
            const star = createStar({
                size: 3 + Math.random() * 4,
                color: getRandomStarColor(),
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * 150,
                    (Math.random() - 0.5) * 30,
                    (Math.random() - 0.5) * 150
                ),
                glowIntensity: 0.5 + Math.random() * 1
            });

            // Generate planets for each star
            const numPlanets = 2 + Math.floor(Math.random() * 5);
            for (let j = 0; j < numPlanets; j++) {
                const distance = 15 + j * 10 + Math.random() * 8;
                const planet = createPlanet({
                    parent: star.mesh,
                    size: 0.5 + Math.random() * 2,
                    color: getRandomPlanetColor(),
                    distance: distance,
                    orbitSpeed: 0.5 + Math.random() * 2,
                    rotationSpeed: 0.5 + Math.random() * 2
                });

                // Generate moons for some planets
                if (Math.random() > 0.5) {
                    const numMoons = 1 + Math.floor(Math.random() * 3);
                    for (let k = 0; k < numMoons; k++) {
                        createMoon({
                            parent: planet.mesh,
                            size: 0.1 + Math.random() * 0.3,
                            color: 0x888888 + Math.random() * 0x222222,
                            distance: 2 + k * 1.5 + Math.random(),
                            orbitSpeed: 0.5 + Math.random() * 1.5
                        });
                    }
                }
            }
        }
    }

    // Clear universe
    function clearUniverse() {
        // Delete all objects in reverse order
        [...moons].forEach(m => deleteObject(m));
        [...planets].forEach(p => deleteObject(p));
        [...stars].forEach(s => deleteObject(s));
        
        deselectObject();
    }

    // Get random star color
    function getRandomStarColor() {
        const colors = [0xffdd44, 0xff8844, 0xffffff, 0xaaddff, 0xffaa88];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Get random planet color
    function getRandomPlanetColor() {
        const colors = [
            0x4a90d9, 0xc1440e, 0xe6c87a, 0x7de3f4, 0x3d5ef7,
            0x8b4513, 0x2e8b57, 0xff6b6b, 0x9b59b6, 0x1abc9c
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Save universe to JSON
    function saveUniverse() {
        const universeData = {
            stars: stars.map(s => ({
                name: s.name,
                size: s.size,
                color: '#' + s.color.getHexString(),
                position: { x: s.group.position.x, y: s.group.position.y, z: s.group.position.z },
                glowIntensity: s.glowIntensity
            })),
            planets: planets.map(p => ({
                name: p.name,
                size: p.size,
                color: '#' + p.color.getHexString(),
                distance: p.distance,
                orbitSpeed: (p.orbitalSpeed / BASE_SPEED) * Math.sqrt(p.distance),
                rotationSpeed: p.rotationSpeed / 0.02,
                parentName: p.parentData?.name || (stars.find(s => s.mesh === p.parent)?.name)
            })),
            moons: moons.map(m => ({
                name: m.name,
                size: m.size,
                color: '#' + m.color.getHexString(),
                distance: m.distance,
                orbitSpeed: m.orbitalSpeed / BASE_SPEED / 2,
                rotationSpeed: m.rotationSpeed / 0.02,
                parentName: m.parentData?.name
            }))
        };

        const blob = new Blob([JSON.stringify(universeData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my-universe.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    // Load universe from JSON
    function loadUniverse(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                clearUniverse();

                // Create stars
                const starMap = new Map();
                data.stars.forEach(starData => {
                    const star = createStar(starData);
                    starMap.set(star.name, star);
                });

                // Create planets
                const planetMap = new Map();
                data.planets.forEach(planetData => {
                    const parent = starMap.get(planetData.parentName);
                    if (parent) {
                        const planet = createPlanet({
                            ...planetData,
                            parent: parent.mesh,
                            color: parseInt(planetData.color.replace('#', '0x'))
                        });
                        planetMap.set(planet.name, planet);
                    }
                });

                // Create moons
                data.moons.forEach(moonData => {
                    const parent = planetMap.get(moonData.parentName);
                    if (parent) {
                        createMoon({
                            ...moonData,
                            parent: parent.mesh,
                            color: parseInt(moonData.color.replace('#', '0x'))
                        });
                    }
                });

                alert('Universe loaded successfully!');
            } catch (err) {
                alert('Error loading universe: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    // Update planet button state
    function updatePlanetButtonStates() {
        const btn = document.getElementById('add-planet-btn');
        btn.disabled = stars.length === 0;
    }

    // Update moon button state
    function updateMoonButtonStates() {
        const btn = document.getElementById('add-moon-btn');
        btn.disabled = planets.length === 0;
    }

    // Setup event listeners
    function setupEventListeners() {
        // Window resize
        window.addEventListener('resize', onWindowResize);

        // Mouse interactions
        renderer.domElement.addEventListener('click', onMouseClick);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('contextmenu', onContextMenu);

        // Creation buttons
        document.getElementById('add-star-btn').addEventListener('click', () => showCreationModal('star'));
        document.getElementById('add-planet-btn').addEventListener('click', () => showCreationModal('planet'));
        document.getElementById('add-moon-btn').addEventListener('click', () => showCreationModal('moon'));

        // Time controls
        document.getElementById('play-pause-btn').addEventListener('click', togglePlayPause);
        document.getElementById('reverse-btn').addEventListener('click', toggleReverse);
        document.getElementById('speed-slider').addEventListener('input', (e) => {
            timeScale = parseFloat(e.target.value) / 50;
            document.getElementById('speed-value').textContent = timeScale.toFixed(1) + 'x';
        });

        // View options
        document.getElementById('show-orbits').addEventListener('change', (e) => {
            showOrbits = e.target.checked;
            orbitLines.forEach(line => line.visible = showOrbits);
        });
        document.getElementById('auto-rotate').addEventListener('change', (e) => {
            autoRotate = e.target.checked;
            controls.autoRotate = autoRotate;
        });

        // Universe actions
        document.getElementById('generate-random-btn').addEventListener('click', generateRandomUniverse);
        document.getElementById('save-btn').addEventListener('click', saveUniverse);
        document.getElementById('load-btn').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        document.getElementById('file-input').addEventListener('change', (e) => {
            if (e.target.files[0]) {
                loadUniverse(e.target.files[0]);
            }
        });
        document.getElementById('clear-all-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the entire universe?')) {
                clearUniverse();
            }
        });

        // Navigation
        document.getElementById('reset-view-btn').addEventListener('click', () => {
            exitFocusMode();
            camera.position.set(0, 100, 150);
            controls.target.set(0, 0, 0);
            controls.update();
        });
        document.getElementById('back-to-universe-btn').addEventListener('click', exitFocusMode);

        // Inspector controls
        document.getElementById('close-inspector').addEventListener('click', deselectObject);
        document.getElementById('obj-name').addEventListener('input', (e) => {
            if (selectedObject) selectedObject.name = e.target.value;
        });
        document.getElementById('obj-size').addEventListener('input', (e) => {
            if (selectedObject) {
                const size = parseFloat(e.target.value);
                selectedObject.size = size;
                const mesh = selectedObject.mesh;
                mesh.geometry.dispose();
                mesh.geometry = new THREE.SphereGeometry(size, mesh.geometry.parameters.radiusSegments || 32, mesh.geometry.parameters.heightSegments || 32);
                document.getElementById('size-value').textContent = size.toFixed(1);
            }
        });
        document.getElementById('obj-speed').addEventListener('input', (e) => {
            if (selectedObject && selectedObject.type !== 'star') {
                const speed = parseFloat(e.target.value);
                selectedObject.orbitalSpeed = (BASE_SPEED * speed) / Math.sqrt(selectedObject.distance);
                document.getElementById('speed-value-prop').textContent = speed.toFixed(1);
            }
        });
        document.getElementById('obj-distance').addEventListener('input', (e) => {
            if (selectedObject && selectedObject.type !== 'star') {
                const distance = parseFloat(e.target.value);
                selectedObject.distance = distance;
                selectedObject.mesh.position.x = distance;
                
                // Update orbit line
                if (selectedObject.orbitLine) {
                    scene.remove(selectedObject.orbitLine);
                    const newOrbitLine = createOrbitLine(distance);
                    if (selectedObject.parent) {
                        const parentGroup = selectedObject.parent.parent || selectedObject.parent;
                        newOrbitLine.position.copy(parentGroup.position);
                    }
                    newOrbitLine.visible = showOrbits;
                    scene.add(newOrbitLine);
                    const index = orbitLines.indexOf(selectedObject.orbitLine);
                    if (index > -1) orbitLines[index] = newOrbitLine;
                    selectedObject.orbitLine = newOrbitLine;
                }
                
                document.getElementById('distance-value').textContent = distance.toFixed(0);
            }
        });
        document.getElementById('obj-color').addEventListener('input', (e) => {
            if (selectedObject) {
                const color = new THREE.Color(e.target.value);
                selectedObject.color = color;
                selectedObject.mesh.material.color = color;
                selectedObject.mesh.material.emissive = color;
                
                if (selectedObject.type === 'star') {
                    selectedObject.glow.material.color = color;
                    selectedObject.outerGlow.material.color = color;
                    selectedObject.corona.material.color = color;
                    selectedObject.light.color = color;
                }
            }
        });
        document.getElementById('obj-glow').addEventListener('input', (e) => {
            if (selectedObject && selectedObject.type === 'star') {
                const intensity = parseFloat(e.target.value);
                selectedObject.glowIntensity = intensity;
                selectedObject.glow.material.opacity = 0.3 * intensity;
                selectedObject.outerGlow.material.opacity = 0.15 * intensity;
                selectedObject.corona.material.opacity = 0.08 * intensity;
                selectedObject.light.intensity = 2 * intensity;
                document.getElementById('glow-value').textContent = intensity.toFixed(1);
            }
        });
        document.getElementById('obj-rotation').addEventListener('input', (e) => {
            if (selectedObject) {
                const speed = parseFloat(e.target.value);
                selectedObject.rotationSpeed = 0.02 * speed;
                document.getElementById('rotation-value').textContent = speed.toFixed(1);
            }
        });
        document.getElementById('focus-btn').addEventListener('click', () => {
            if (selectedObject) focusOnObject(selectedObject);
        });
        document.getElementById('delete-btn').addEventListener('click', () => {
            if (selectedObject && confirm(`Delete ${selectedObject.name}?`)) {
                deleteObject(selectedObject);
            }
        });

        // Modal controls
        document.getElementById('close-modal').addEventListener('click', hideCreationModal);
        document.getElementById('creation-modal').addEventListener('click', (e) => {
            if (e.target.id === 'creation-modal') hideCreationModal();
        });

        // Context menu
        document.getElementById('context-menu').addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action && selectedObject) {
                if (action === 'focus') focusOnObject(selectedObject);
                else if (action === 'edit') selectObject(selectedObject);
                else if (action === 'delete') {
                    if (confirm(`Delete ${selectedObject.name}?`)) deleteObject(selectedObject);
                }
            }
            hideContextMenu();
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#context-menu')) {
                hideContextMenu();
            }
        });
    }

    // Show creation modal
    function showCreationModal(type) {
        const modal = document.getElementById('creation-modal');
        const form = document.getElementById('creation-form');
        const title = document.getElementById('modal-title');

        let formContent = '';

        if (type === 'star') {
            title.textContent = 'Create Star';
            formContent = `
                <div class="property-group">
                    <label>Name</label>
                    <input type="text" id="create-name" value="New Star" class="text-input">
                </div>
                <div class="property-group">
                    <label>Size: <span id="create-size-val">5</span></label>
                    <input type="range" id="create-size" min="2" max="10" step="0.5" value="5">
                </div>
                <div class="property-group">
                    <label>Color</label>
                    <input type="color" id="create-color" value="#ffdd44">
                </div>
                <div class="property-group">
                    <label>Glow Intensity: <span id="create-glow-val">1.0</span></label>
                    <input type="range" id="create-glow" min="0.5" max="3" step="0.1" value="1">
                </div>
                <div class="property-group">
                    <label>Position X: <span id="create-pos-x-val">0</span></label>
                    <input type="range" id="create-pos-x" min="-100" max="100" value="0">
                </div>
                <div class="property-group">
                    <label>Position Y: <span id="create-pos-y-val">0</span></label>
                    <input type="range" id="create-pos-y" min="-50" max="50" value="0">
                </div>
                <div class="property-group">
                    <label>Position Z: <span id="create-pos-z-val">0</span></label>
                    <input type="range" id="create-pos-z" min="-100" max="100" value="0">
                </div>
                <button id="create-submit" class="action-btn">Create Star</button>
            `;
        } else if (type === 'planet') {
            title.textContent = 'Create Planet';
            const starOptions = stars.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
            formContent = `
                <div class="property-group">
                    <label>Parent Star</label>
                    <select id="create-parent" class="text-input">${starOptions}</select>
                </div>
                <div class="property-group">
                    <label>Name</label>
                    <input type="text" id="create-name" value="New Planet" class="text-input">
                </div>
                <div class="property-group">
                    <label>Size: <span id="create-size-val">1</span></label>
                    <input type="range" id="create-size" min="0.3" max="5" step="0.1" value="1">
                </div>
                <div class="property-group">
                    <label>Color</label>
                    <input type="color" id="create-color" value="#4a90d9">
                </div>
                <div class="property-group">
                    <label>Distance from Star: <span id="create-dist-val">20</span></label>
                    <input type="range" id="create-distance" min="10" max="100" value="20">
                </div>
                <div class="property-group">
                    <label>Orbit Speed: <span id="create-speed-val">1.0</span></label>
                    <input type="range" id="create-orbit-speed" min="0.1" max="5" step="0.1" value="1">
                </div>
                <div class="property-group">
                    <label>Rotation Speed: <span id="create-rot-val">1.0</span></label>
                    <input type="range" id="create-rot-speed" min="0.1" max="5" step="0.1" value="1">
                </div>
                <button id="create-submit" class="action-btn">Create Planet</button>
            `;
        } else if (type === 'moon') {
            title.textContent = 'Create Moon';
            const planetOptions = planets.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
            formContent = `
                <div class="property-group">
                    <label>Parent Planet</label>
                    <select id="create-parent" class="text-input">${planetOptions}</select>
                </div>
                <div class="property-group">
                    <label>Name</label>
                    <input type="text" id="create-name" value="New Moon" class="text-input">
                </div>
                <div class="property-group">
                    <label>Size: <span id="create-size-val">0.3</span></label>
                    <input type="range" id="create-size" min="0.1" max="1" step="0.1" value="0.3">
                </div>
                <div class="property-group">
                    <label>Color</label>
                    <input type="color" id="create-color" value="#888888">
                </div>
                <div class="property-group">
                    <label>Distance from Planet: <span id="create-dist-val">3</span></label>
                    <input type="range" id="create-distance" min="2" max="10" step="0.5" value="3">
                </div>
                <div class="property-group">
                    <label>Orbit Speed: <span id="create-speed-val">1.0</span></label>
                    <input type="range" id="create-orbit-speed" min="0.1" max="3" step="0.1" value="1">
                </div>
                <div class="property-group">
                    <label>Rotation Speed: <span id="create-rot-val">1.0</span></label>
                    <input type="range" id="create-rot-speed" min="0.1" max="5" step="0.1" value="1">
                </div>
                <button id="create-submit" class="action-btn">Create Moon</button>
            `;
        }

        form.innerHTML = formContent;

        // Add event listeners for sliders
        const sizeSlider = document.getElementById('create-size');
        if (sizeSlider) {
            sizeSlider.addEventListener('input', (e) => {
                document.getElementById('create-size-val').textContent = e.target.value;
            });
        }
        const distSlider = document.getElementById('create-distance');
        if (distSlider) {
            distSlider.addEventListener('input', (e) => {
                document.getElementById('create-dist-val').textContent = e.target.value;
            });
        }
        const speedSlider = document.getElementById('create-orbit-speed');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                document.getElementById('create-speed-val').textContent = parseFloat(e.target.value).toFixed(1);
            });
        }
        const rotSlider = document.getElementById('create-rot-speed');
        if (rotSlider) {
            rotSlider.addEventListener('input', (e) => {
                document.getElementById('create-rot-val').textContent = parseFloat(e.target.value).toFixed(1);
            });
        }
        const glowSlider = document.getElementById('create-glow');
        if (glowSlider) {
            glowSlider.addEventListener('input', (e) => {
                document.getElementById('create-glow-val').textContent = parseFloat(e.target.value).toFixed(1);
            });
        }

        // Position sliders for stars
        ['x', 'y', 'z'].forEach(axis => {
            const slider = document.getElementById(`create-pos-${axis}`);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    document.getElementById(`create-pos-${axis}-val`).textContent = e.target.value;
                });
            }
        });

        // Submit button
        document.getElementById('create-submit').addEventListener('click', () => {
            const options = {
                name: document.getElementById('create-name').value,
                size: parseFloat(document.getElementById('create-size').value),
                color: parseInt(document.getElementById('create-color').value.replace('#', '0x'))
            };

            if (type === 'star') {
                options.position = new THREE.Vector3(
                    parseFloat(document.getElementById('create-pos-x').value),
                    parseFloat(document.getElementById('create-pos-y').value),
                    parseFloat(document.getElementById('create-pos-z').value)
                );
                options.glowIntensity = parseFloat(document.getElementById('create-glow').value);
                createStar(options);
            } else {
                const parentName = document.getElementById('create-parent').value;
                options.distance = parseFloat(document.getElementById('create-distance').value);
                options.orbitSpeed = parseFloat(document.getElementById('create-orbit-speed').value);
                options.rotationSpeed = parseFloat(document.getElementById('create-rot-speed').value);

                if (type === 'planet') {
                    const parent = stars.find(s => s.name === parentName);
                    if (parent) options.parent = parent.mesh;
                } else {
                    const parent = planets.find(p => p.name === parentName);
                    if (parent) options.parent = parent.mesh;
                }

                if (type === 'planet') {
                    createPlanet(options);
                } else {
                    createMoon(options);
                }
            }

            hideCreationModal();
        });

        modal.classList.remove('hidden');
    }

    // Hide creation modal
    function hideCreationModal() {
        document.getElementById('creation-modal').classList.add('hidden');
    }

    // Show context menu
    function showContextMenu(x, y, objData) {
        const menu = document.getElementById('context-menu');
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.classList.remove('hidden');
        selectedObject = objData;
    }

    // Hide context menu
    function hideContextMenu() {
        document.getElementById('context-menu').classList.add('hidden');
    }

    // Toggle play/pause
    function togglePlayPause() {
        isPaused = !isPaused;
        const btn = document.getElementById('play-pause-btn');
        btn.textContent = isPaused ? '▶️' : '⏸️';
        btn.classList.toggle('active', !isPaused);
    }

    // Toggle reverse
    function toggleReverse() {
        isReversed = !isReversed;
        const btn = document.getElementById('reverse-btn');
        btn.classList.toggle('active', isReversed);
    }

    // Window resize handler
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Mouse move handler
    function onMouseMove(event) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const allMeshes = [...stars.map(s => s.mesh), ...planets.map(p => p.mesh), ...moons.map(m => m.mesh)];
        const intersects = raycaster.intersectObjects(allMeshes);

        // Reset hover state
        if (hoveredObject && (!intersects.length || intersects[0].object !== hoveredObject.mesh)) {
            if (hoveredObject !== selectedObject) {
                hoveredObject.mesh.scale.set(1, 1, 1);
                if (hoveredObject.type !== 'star') {
                    hoveredObject.mesh.material.emissiveIntensity = 0.1;
                }
            }
            hoveredObject = null;
            renderer.domElement.style.cursor = 'grab';
            hideTooltip();
        }

        // Set new hover state
        if (intersects.length > 0) {
            const mesh = intersects[0].object;
            const objData = mesh.userData;
            
            if (objData && objData.id && hoveredObject !== objData) {
                hoveredObject = objData;
                
                if (hoveredObject !== selectedObject) {
                    hoveredObject.mesh.scale.set(1.1, 1.1, 1.1);
                    if (hoveredObject.type !== 'star') {
                        hoveredObject.mesh.material.emissiveIntensity = 0.3;
                    }
                }
                
                renderer.domElement.style.cursor = 'pointer';
                showTooltip(event.clientX, event.clientY, objData);
            }
        }
    }

    // Mouse click handler
    function onMouseClick(event) {
        if (event.button !== 0) return; // Only left click

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const allMeshes = [...stars.map(s => s.mesh), ...planets.map(p => p.mesh), ...moons.map(m => m.mesh)];
        const intersects = raycaster.intersectObjects(allMeshes);

        if (intersects.length > 0) {
            const objData = intersects[0].object.userData;
            if (objData && objData.id) {
                selectObject(objData);
            }
        }
    }

    // Context menu handler
    function onContextMenu(event) {
        event.preventDefault();

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const allMeshes = [...stars.map(s => s.mesh), ...planets.map(p => p.mesh), ...moons.map(m => m.mesh)];
        const intersects = raycaster.intersectObjects(allMeshes);

        if (intersects.length > 0) {
            const objData = intersects[0].object.userData;
            if (objData && objData.id) {
                showContextMenu(event.clientX, event.clientY, objData);
            }
        }
    }

    // Show tooltip
    function showTooltip(x, y, objData) {
        const tooltip = document.getElementById('tooltip');
        tooltip.textContent = objData.name;
        tooltip.style.left = (x + 15) + 'px';
        tooltip.style.top = (y + 15) + 'px';
        tooltip.classList.remove('hidden');
    }

    // Hide tooltip
    function hideTooltip() {
        document.getElementById('tooltip').classList.add('hidden');
    }

    // Camera animation update
    function updateCameraAnimation(deltaTime) {
        if (cameraAnimationProgress >= 1) return;

        cameraAnimationProgress += deltaTime * 2;
        if (cameraAnimationProgress > 1) cameraAnimationProgress = 1;

        const ease = cameraAnimationProgress < 0.5
            ? 2 * cameraAnimationProgress * cameraAnimationProgress
            : 1 - Math.pow(-2 * cameraAnimationProgress + 2, 2) / 2;

        if (targetCameraPosition) {
            camera.position.lerp(targetCameraPosition, ease);
        }

        if (targetLookAt) {
            controls.target.lerp(targetLookAt, ease);
            controls.update();
        }
    }

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        const deltaTime = 1 / 60;
        const effectiveTimeScale = isReversed ? -timeScale : timeScale;

        if (!isPaused) {
            // Animate stars
            stars.forEach(star => {
                star.angle += star.rotationSpeed * effectiveTimeScale;
                star.mesh.rotation.y = star.angle;
                
                // Animate corona
                const time = Date.now() * 0.001;
                const scale = 1 + Math.sin(time * 2 + star.id) * 0.05;
                star.corona.scale.set(scale, scale, scale);
            });

            // Animate planets
            planets.forEach(planet => {
                planet.angle += planet.orbitalSpeed * effectiveTimeScale;
                planet.group.rotation.y = planet.angle;
                planet.mesh.rotation.y += planet.rotationSpeed * effectiveTimeScale;
            });

            // Animate moons
            moons.forEach(moon => {
                moon.angle += moon.orbitalSpeed * effectiveTimeScale;
                moon.group.rotation.y = moon.angle;
                moon.mesh.rotation.y += moon.rotationSpeed * effectiveTimeScale;
            });
        }

        // Animate starfield
        if (starfield && starfield.userData.animateStars) {
            const time = Date.now() * 0.0001;
            starfield.rotation.y = time * 0.5;
        }

        // Update camera animation
        updateCameraAnimation(deltaTime);

        // Keep focus on selected object in focus mode
        if (focusMode && selectedObject && cameraAnimationProgress >= 1) {
            const worldPos = new THREE.Vector3();
            if (selectedObject.group) {
                selectedObject.group.getWorldPosition(worldPos);
            } else {
                selectedObject.mesh.getWorldPosition(worldPos);
            }
            controls.target.copy(worldPos);
            controls.update();
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
