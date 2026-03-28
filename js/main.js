(function() {
    // Scene variables
    let scene, camera, renderer, controls;
    let raycaster, mouse;
    
    // Mode management
    let currentMode = 'universe'; // 'universe' or 'solar'
    
    // State
    let isPaused = false;
    let isReversed = false;
    let timeScale = 1.0;
    let selectedObject = null;
    let showOrbits = true;
    let autoRotate = false;
    let hoveredObject = null;
    let focusMode = false;
    let originalCameraPosition = new THREE.Vector3(0, 100, 200);
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
    
    // Solar System objects
    const solarSystemObjects = [];
    let solarOrbitLines = [];
    let sunData = null;
    
    // Solar System data - realistic proportions (scaled)
    const SOLAR_SYSTEM_DATA = {
        sun: {
            name: 'Sun',
            size: 15,
            color: 0xffdd00,
            distance: 0,
            orbitalPeriod: 0,
            rotationPeriod: 25,
            mass: 1000, // Mass in physics units
            description: 'The Sun is the star at the center of our Solar System.'
        },
        planets: [
            {
                name: 'Mercury',
                size: 0.8,
                color: 0xb5b5b5,
                distance: 25,
                orbitalPeriod: 88, // Earth days
                rotationPeriod: 58.6,
                mass: 0.055,
                description: 'Mercury is the smallest planet in our Solar System.'
            },
            {
                name: 'Venus',
                size: 1.5,
                color: 0xe6c87a,
                distance: 35,
                orbitalPeriod: 225,
                rotationPeriod: -243,
                mass: 0.815,
                description: 'Venus is the hottest planet in our Solar System.'
            },
            {
                name: 'Earth',
                size: 1.6,
                color: 0x4a90d9,
                distance: 48,
                orbitalPeriod: 365,
                rotationPeriod: 1,
                hasMoon: true,
                mass: 1.0,
                description: 'Earth is the third planet from the Sun and our home.'
            },
            {
                name: 'Mars',
                size: 1.0,
                color: 0xc1440e,
                distance: 62,
                orbitalPeriod: 687,
                rotationPeriod: 1.03,
                mass: 0.107,
                description: 'Mars is the fourth planet, known as the Red Planet.'
            },
            {
                name: 'Jupiter',
                size: 5,
                color: 0xd4a574,
                distance: 90,
                orbitalPeriod: 4333,
                rotationPeriod: 0.41,
                mass: 317.8,
                description: 'Jupiter is the largest planet in our Solar System.'
            },
            {
                name: 'Saturn',
                size: 4.2,
                color: 0xe6d4a8,
                distance: 120,
                orbitalPeriod: 10759,
                rotationPeriod: 0.45,
                hasRings: true,
                mass: 95.2,
                description: 'Saturn is known for its beautiful ring system.'
            },
            {
                name: 'Uranus',
                size: 2.5,
                color: 0x7de3f4,
                distance: 150,
                orbitalPeriod: 30687,
                rotationPeriod: -0.72,
                mass: 14.5,
                description: 'Uranus is an ice giant with a tilted rotation.'
            },
            {
                name: 'Neptune',
                size: 2.4,
                color: 0x3d5ef7,
                distance: 180,
                orbitalPeriod: 60190,
                rotationPeriod: 0.67,
                mass: 17.1,
                description: 'Neptune is the farthest planet from the Sun.'
            }
        ],
        moon: {
            name: 'Moon',
            size: 0.4,
            color: 0xcccccc,
            distance: 4,
            orbitalPeriod: 27.3,
            parent: 'Earth',
            mass: 0.0123
        }
    };

    // Physics Constants
    const GRAVITATIONAL_CONSTANT = 0.5; // Scaled G for simulation stability
    const BASE_SPEED = 0.005;
    const PHYSICS_TIME_STEP = 0.016; // ~60fps
    let nextId = 1;

    // ==========================================
    // NEWTONIAN PHYSICS ENGINE
    // ==========================================
    
    class PhysicsBody {
        constructor(options = {}) {
            this.id = options.id || Date.now();
            this.mass = options.mass || 1;
            this.position = options.position ? options.position.clone() : new THREE.Vector3();
            this.velocity = options.velocity ? options.velocity.clone() : new THREE.Vector3();
            this.acceleration = new THREE.Vector3();
            this.prevAcceleration = new THREE.Vector3();
            this.radius = options.radius || 1;
            this.type = options.type || 'body';
            
            // For trajectory trail
            this.trail = [];
            this.maxTrailLength = 200;
        }

        // Calculate kinetic energy: KE = 0.5 * m * v^2
        getKineticEnergy() {
            return 0.5 * this.mass * this.velocity.lengthSq();
        }

        // Get orbital speed for circular orbit around a central mass
        static getCircularOrbitalVelocity(centralMass, distance) {
            return Math.sqrt((GRAVITATIONAL_CONSTANT * centralMass) / distance);
        }

        // Get escape velocity
        static getEscapeVelocity(centralMass, distance) {
            return Math.sqrt((2 * GRAVITATIONAL_CONSTANT * centralMass) / distance);
        }

        // Get orbital period using Kepler's 3rd law: T^2 = (4π^2 / GM) * r^3
        static getOrbitalPeriod(centralMass, semiMajorAxis) {
            return 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / (GRAVITATIONAL_CONSTANT * centralMass));
        }
    }

    class PhysicsEngine {
        constructor() {
            this.bodies = [];
            this.timeStep = PHYSICS_TIME_STEP;
            this.substeps = 4; // Substepping for stability
        }

        addBody(body) {
            this.bodies.push(body);
            return body;
        }

        removeBody(body) {
            const index = this.bodies.indexOf(body);
            if (index > -1) {
                this.bodies.splice(index, 1);
            }
        }

        clear() {
            this.bodies = [];
        }

        // Calculate gravitational force between two bodies
        // F = G * (m1 * m2) / r^2
        calculateGravitationalForce(body1, body2) {
            const direction = new THREE.Vector3().subVectors(body2.position, body1.position);
            const distanceSq = direction.lengthSq();
            const distance = Math.sqrt(distanceSq);

            // Prevent division by zero and extreme forces at very close distances
            const minDistance = body1.radius + body2.radius;
            const effectiveDistance = Math.max(distance, minDistance);
            const effectiveDistanceSq = effectiveDistance * effectiveDistance;

            // Newton's Law of Universal Gravitation
            const forceMagnitude = (GRAVITATIONAL_CONSTANT * body1.mass * body2.mass) / effectiveDistanceSq;
            
            direction.normalize();
            return direction.multiplyScalar(forceMagnitude);
        }

        // Calculate total gravitational force on a body from all other bodies
        calculateNetForce(body) {
            const netForce = new THREE.Vector3();
            
            for (const other of this.bodies) {
                if (other === body) continue;
                
                const force = this.calculateGravitationalForce(body, other);
                netForce.add(force);
            }
            
            return netForce;
        }

        // Velocity Verlet integration for stable orbital mechanics
        // More stable than Euler method for long-term simulations
        update(dt) {
            const subDt = dt / this.substeps;
            
            for (let step = 0; step < this.substeps; step++) {
                // Step 1: Calculate forces and accelerations at current positions
                for (const body of this.bodies) {
                    const force = this.calculateNetForce(body);
                    body.acceleration.copy(force.divideScalar(body.mass));
                }

                // Step 2: Update positions: x(t+dt) = x(t) + v(t)*dt + 0.5*a(t)*dt^2
                for (const body of this.bodies) {
                    const velocityTerm = body.velocity.clone().multiplyScalar(subDt);
                    const accelTerm = body.acceleration.clone().multiplyScalar(0.5 * subDt * subDt);
                    body.position.add(velocityTerm).add(accelTerm);
                    
                    // Update trail
                    if (body.trail.length === 0 || body.position.distanceToSquared(body.trail[body.trail.length - 1]) > 0.5) {
                        body.trail.push(body.position.clone());
                        if (body.trail.length > body.maxTrailLength) {
                            body.trail.shift();
                        }
                    }
                }

                // Step 3: Calculate new accelerations at new positions
                const newAccelerations = [];
                for (const body of this.bodies) {
                    const force = this.calculateNetForce(body);
                    newAccelerations.push(force.divideScalar(body.mass));
                }

                // Step 4: Update velocities: v(t+dt) = v(t) + 0.5*(a(t) + a(t+dt))*dt
                for (let i = 0; i < this.bodies.length; i++) {
                    const body = this.bodies[i];
                    const avgAccel = body.acceleration.clone().add(newAccelerations[i]).multiplyScalar(0.5);
                    body.velocity.add(avgAccel.multiplyScalar(subDt));
                }
            }
        }

        // Get total energy of the system
        getTotalEnergy() {
            let kineticEnergy = 0;
            let potentialEnergy = 0;

            for (const body of this.bodies) {
                kineticEnergy += body.getKineticEnergy();
            }

            // Calculate potential energy: U = -G * m1 * m2 / r
            for (let i = 0; i < this.bodies.length; i++) {
                for (let j = i + 1; j < this.bodies.length; j++) {
                    const distance = this.bodies[i].position.distanceTo(this.bodies[j].position);
                    potentialEnergy -= (GRAVITATIONAL_CONSTANT * this.bodies[i].mass * this.bodies[j].mass) / distance;
                }
            }

            return { kinetic: kineticEnergy, potential: potentialEnergy, total: kineticEnergy + potentialEnergy };
        }
    }

    // Global physics engine instance
    const physicsEngine = new PhysicsEngine();
    
    // Helper to get mass from object type and size
    function calculateMass(type, size) {
        const densityFactors = {
            star: 10,    // Stars are much more massive
            planet: 1,   // Reference density
            moon: 0.5,   // Moons are less dense on average
            sun: 1000    // Sun is extremely massive
        };
        
        const factor = densityFactors[type] || 1;
        // Mass = density * volume = density * (4/3 * π * r^3)
        return factor * (4 / 3) * Math.PI * Math.pow(size, 3) * 0.1;
    }

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
        camera.position.set(0, 100, 200);

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
        setupModeEventListeners();

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
                colors[i * 3] = 0.9 + Math.random() * 0.1;
                colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
                colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
            } else if (colorType < 0.8) {
                colors[i * 3] = 0.7 + Math.random() * 0.3;
                colors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
                colors[i * 3 + 2] = 1.0;
            } else {
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
        
        // Create physics body for star (stars are static/imovable)
        const mass = options.mass || calculateMass('star', size);
        const physicsBody = new PhysicsBody({
            id: Date.now(),
            mass: mass,
            position: position.clone(),
            velocity: new THREE.Vector3(0, 0, 0),
            radius: size,
            type: 'star'
        });
        physicsEngine.addBody(physicsBody);

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
            id: physicsBody.id,
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
            mass: mass,
            physicsBody: physicsBody,
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

        // Get parent group and position
        const parentGroup = parent.parent || parent;
        const parentPosition = parentGroup.position.clone();
        
        // Get parent's physics body for mass
        const parentData = parent.userData;
        const parentMass = parentData.physicsBody ? parentData.physicsBody.mass : calculateMass('star', parentData.size || 5);
        
        // Calculate initial position
        const initialAngle = options.initialAngle || Math.random() * Math.PI * 2;
        const initialPosition = new THREE.Vector3(
            parentPosition.x + Math.cos(initialAngle) * distance,
            parentPosition.y,
            parentPosition.z + Math.sin(initialAngle) * distance
        );
        
        // Calculate orbital velocity for circular orbit (perpendicular to radius)
        // v = sqrt(GM/r)
        const orbitalVelocityMagnitude = PhysicsBody.getCircularOrbitalVelocity(parentMass, distance);
        const velocityDirection = new THREE.Vector3(
            -Math.sin(initialAngle),
            0,
            Math.cos(initialAngle)
        );
        const initialVelocity = velocityDirection.multiplyScalar(orbitalVelocityMagnitude * orbitSpeed);
        
        // Create physics body for planet
        const mass = options.mass || calculateMass('planet', size);
        const physicsBody = new PhysicsBody({
            id: Date.now(),
            mass: mass,
            position: initialPosition,
            velocity: initialVelocity,
            radius: size,
            type: 'planet'
        });
        physicsEngine.addBody(physicsBody);

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
        planet.position.copy(initialPosition);
        planet.castShadow = true;
        planet.receiveShadow = true;
        scene.add(planet);

        // Create orbit line
        const orbitLine = createOrbitLine(distance);
        orbitLine.position.copy(parentPosition);
        orbitLine.visible = showOrbits;
        scene.add(orbitLine);
        orbitLines.push(orbitLine);

        // Store planet data
        const planetData = {
            id: physicsBody.id,
            type: 'planet',
            name: name,
            mesh: planet,
            parent: parent,
            parentPhysicsBody: parentData.physicsBody,
            orbitLine: orbitLine,
            size: size,
            baseSize: size,
            color: new THREE.Color(color),
            distance: distance,
            mass: mass,
            physicsBody: physicsBody,
            rotationSpeed: 0.02 * rotationSpeed,
            initialAngle: initialAngle
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

        // Get parent data and position
        const parentData = parent.userData;
        const parentPosition = parentData.physicsBody ? parentData.physicsBody.position.clone() : parent.position.clone();
        const parentMass = parentData.physicsBody ? parentData.physicsBody.mass : calculateMass('planet', parentData.size || 1);
        
        // Calculate initial position
        const initialAngle = options.initialAngle || Math.random() * Math.PI * 2;
        const initialPosition = new THREE.Vector3(
            parentPosition.x + Math.cos(initialAngle) * distance,
            parentPosition.y,
            parentPosition.z + Math.sin(initialAngle) * distance
        );
        
        // Calculate orbital velocity for circular orbit around planet
        // Moon orbits relative to planet, so we add planet's velocity
        const orbitalVelocityMagnitude = PhysicsBody.getCircularOrbitalVelocity(parentMass, distance);
        const velocityDirection = new THREE.Vector3(
            -Math.sin(initialAngle),
            0,
            Math.cos(initialAngle)
        );
        
        // Start with parent's velocity if parent has physics body
        const parentVelocity = parentData.physicsBody ? parentData.physicsBody.velocity.clone() : new THREE.Vector3();
        const relativeVelocity = velocityDirection.multiplyScalar(orbitalVelocityMagnitude * orbitSpeed);
        const initialVelocity = parentVelocity.add(relativeVelocity);
        
        // Create physics body for moon
        const mass = options.mass || calculateMass('moon', size);
        const physicsBody = new PhysicsBody({
            id: Date.now(),
            mass: mass,
            position: initialPosition,
            velocity: initialVelocity,
            radius: size,
            type: 'moon'
        });
        physicsEngine.addBody(physicsBody);

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
        moon.position.copy(initialPosition);
        moon.castShadow = true;
        moon.receiveShadow = true;
        scene.add(moon);

        // Create moon orbit line (visual only - centered on parent)
        const moonOrbitLine = createOrbitLine(distance);
        moonOrbitLine.visible = showOrbits;
        scene.add(moonOrbitLine);

        // Store moon data
        const moonData = {
            id: physicsBody.id,
            type: 'moon',
            name: name,
            mesh: moon,
            parent: parent,
            parentData: parentData,
            parentPhysicsBody: parentData.physicsBody,
            orbitLine: moonOrbitLine,
            size: size,
            baseSize: size,
            color: new THREE.Color(color),
            distance: distance,
            mass: mass,
            physicsBody: physicsBody,
            rotationSpeed: 0.02 * rotationSpeed,
            initialAngle: initialAngle
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

    // Create Saturn's rings
    function createSaturnRings(planetMesh, size) {
        const ringGeometry = new THREE.RingGeometry(size * 1.3, size * 2.2, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xc9b896,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2.2;
        planetMesh.add(rings);
        return rings;
    }

    // ==========================================
    // SOLAR SYSTEM MODE FUNCTIONS
    // ==========================================

    // Load the Solar System
    function loadSolarSystem() {
        clearSolarSystem();
        
        const solarData = SOLAR_SYSTEM_DATA;
        
        // Create Sun
        sunData = createSolarSun(solarData.sun);
        
        // Create planets
        const earthData = solarData.planets.find(p => p.name === 'Earth');
        
        solarData.planets.forEach(planetInfo => {
            const planet = createSolarPlanet(planetInfo);
            
            // Create Moon for Earth
            if (planetInfo.hasMoon && planet) {
                createSolarMoon(solarData.moon, planet);
            }
        });

        // Adjust camera for Solar System
        camera.position.set(0, 80, 250);
        controls.target.set(0, 0, 0);
        controls.update();
    }

    // Create Sun for Solar System mode
    function createSolarSun(sunInfo) {
        const size = sunInfo.size;
        const position = new THREE.Vector3(0, 0, 0);
        
        // Create physics body for Sun
        const mass = sunInfo.mass || calculateMass('sun', size);
        const physicsBody = new PhysicsBody({
            id: Date.now(),
            mass: mass,
            position: position.clone(),
            velocity: new THREE.Vector3(0, 0, 0),
            radius: size,
            type: 'sun'
        });
        physicsEngine.addBody(physicsBody);
        
        // Sun group
        const sunGroup = new THREE.Group();
        sunGroup.position.copy(position);
        
        // Sun mesh
        const sunGeometry = new THREE.SphereGeometry(size, 64, 64);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: sunInfo.color,
            emissive: sunInfo.color
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sunGroup.add(sun);

        // Sun glow layers
        const glowColors = [0.3, 0.2, 0.1, 0.05];
        const glowSizes = [1.2, 1.5, 1.8, 2.2];
        
        glowSizes.forEach((s, i) => {
            const glowGeometry = new THREE.SphereGeometry(size * s, 64, 64);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: sunInfo.color,
                transparent: true,
                opacity: glowColors[i]
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            sunGroup.add(glow);
        });

        // Point light from Sun
        const sunLight = new THREE.PointLight(0xffffff, 2, 800, 1);
        sunGroup.add(sunLight);
        
        // Ambient light for the whole scene
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);

        scene.add(sunGroup);

        // Store sun data
        const sunDataObj = {
            id: physicsBody.id,
            type: 'sun',
            name: sunInfo.name,
            mesh: sun,
            group: sunGroup,
            size: size,
            color: new THREE.Color(sunInfo.color),
            mass: mass,
            physicsBody: physicsBody,
            rotationSpeed: 0.001 * sunInfo.rotationPeriod,
            description: sunInfo.description,
            angle: 0
        };
        sun.userData = sunDataObj;
        solarSystemObjects.push(sunDataObj);

        return sunDataObj;
    }

    // Create planet for Solar System mode
    function createSolarPlanet(planetInfo) {
        const size = planetInfo.size;
        const distance = planetInfo.distance;
        
        // Get Sun's physics body for gravitational calculations
        const sunPhysicsBody = sunData ? sunData.physicsBody : null;
        if (!sunPhysicsBody) return null;
        
        const sunMass = sunPhysicsBody.mass;
        
        // Calculate initial position (start on positive X axis)
        const initialAngle = Math.random() * Math.PI * 2;
        const initialPosition = new THREE.Vector3(
            Math.cos(initialAngle) * distance,
            0,
            Math.sin(initialAngle) * distance
        );
        
        // Calculate orbital velocity for circular orbit (Kepler's laws)
        // v = sqrt(GM/r)
        const orbitalVelocityMagnitude = PhysicsBody.getCircularOrbitalVelocity(sunMass, distance);
        const velocityDirection = new THREE.Vector3(
            -Math.sin(initialAngle),
            0,
            Math.cos(initialAngle)
        );
        const initialVelocity = velocityDirection.multiplyScalar(orbitalVelocityMagnitude);
        
        // Create physics body
        const mass = planetInfo.mass || calculateMass('planet', size);
        const physicsBody = new PhysicsBody({
            id: Date.now(),
            mass: mass,
            position: initialPosition,
            velocity: initialVelocity,
            radius: size,
            type: 'solarPlanet'
        });
        physicsEngine.addBody(physicsBody);

        // Planet mesh
        const planetGeometry = new THREE.SphereGeometry(size, 32, 32);
        const planetMaterial = new THREE.MeshStandardMaterial({
            color: planetInfo.color,
            roughness: 0.8,
            metalness: 0.1,
            emissive: planetInfo.color,
            emissiveIntensity: 0.1
        });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planet.position.copy(initialPosition);
        planet.castShadow = true;
        planet.receiveShadow = true;
        scene.add(planet);

        // Add Saturn's rings
        if (planetInfo.hasRings) {
            const rings = createSaturnRings(planet, size);
            planet.userData.rings = rings;
        }

        // Create orbit line (visual reference)
        const orbitLine = createOrbitLine(distance);
        orbitLine.position.set(0, 0, 0);
        orbitLine.visible = showOrbits;
        scene.add(orbitLine);
        solarOrbitLines.push(orbitLine);
        
        // Rotation speed (scaled)
        const rotationSpeed = 0.02 * (1 / Math.abs(planetInfo.rotationPeriod));

        // Store planet data
        const planetData = {
            id: physicsBody.id,
            type: 'solarPlanet',
            name: planetInfo.name,
            mesh: planet,
            physicsBody: physicsBody,
            orbitLine: orbitLine,
            size: size,
            color: new THREE.Color(planetInfo.color),
            distance: distance,
            mass: mass,
            orbitalPeriod: planetInfo.orbitalPeriod,
            rotationSpeed: rotationSpeed,
            rotationPeriod: planetInfo.rotationPeriod,
            description: planetInfo.description,
            initialAngle: initialAngle
        };
        planet.userData = planetData;
        solarSystemObjects.push(planetData);

        return planetData;
    }

    // Create Moon for Solar System mode
    function createSolarMoon(moonInfo, earthPlanet) {
        const size = moonInfo.size;
        const distance = moonInfo.distance;
        
        // Get Earth's physics body
        const earthPhysicsBody = earthPlanet.physicsBody;
        if (!earthPhysicsBody) return null;
        
        const earthMass = earthPhysicsBody.mass;
        const earthPosition = earthPhysicsBody.position.clone();
        
        // Calculate initial position relative to Earth
        const initialAngle = 0;
        const moonOffset = new THREE.Vector3(
            Math.cos(initialAngle) * distance,
            0,
            Math.sin(initialAngle) * distance
        );
        const initialPosition = earthPosition.clone().add(moonOffset);
        
        // Calculate orbital velocity for circular orbit around Earth
        // v = sqrt(GM/r)
        const moonOrbitalSpeed = PhysicsBody.getCircularOrbitalVelocity(earthMass, distance);
        const velocityDirection = new THREE.Vector3(
            -Math.sin(initialAngle),
            0,
            Math.cos(initialAngle)
        );
        
        // Moon's velocity is Earth's velocity plus relative orbital velocity
        const relativeVelocity = velocityDirection.multiplyScalar(moonOrbitalSpeed);
        const initialVelocity = earthPhysicsBody.velocity.clone().add(relativeVelocity);
        
        // Create physics body
        const mass = moonInfo.mass || calculateMass('moon', size);
        const physicsBody = new PhysicsBody({
            id: Date.now(),
            mass: mass,
            position: initialPosition,
            velocity: initialVelocity,
            radius: size,
            type: 'solarMoon'
        });
        physicsEngine.addBody(physicsBody);

        // Moon mesh
        const moonGeometry = new THREE.SphereGeometry(size, 16, 16);
        const moonMaterial = new THREE.MeshStandardMaterial({
            color: moonInfo.color,
            roughness: 1,
            metalness: 0,
            emissive: moonInfo.color,
            emissiveIntensity: 0.05
        });
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.position.copy(initialPosition);
        moon.castShadow = true;
        moon.receiveShadow = true;
        scene.add(moon);

        // Create moon orbit line
        const moonOrbitLine = createOrbitLine(distance);
        moonOrbitLine.visible = showOrbits;
        scene.add(moonOrbitLine);

        // Store moon data
        const moonData = {
            id: physicsBody.id,
            type: 'solarMoon',
            name: moonInfo.name,
            mesh: moon,
            physicsBody: physicsBody,
            parent: earthPlanet,
            orbitLine: moonOrbitLine,
            size: size,
            color: new THREE.Color(moonInfo.color),
            distance: distance,
            mass: mass,
            orbitalPeriod: moonInfo.orbitalPeriod,
            rotationSpeed: 0.02,
            description: 'Earth\'s natural satellite',
            initialAngle: initialAngle
        };
        moon.userData = moonData;
        solarSystemObjects.push(moonData);

        return moonData;
    }

    // Clear Solar System
    function clearSolarSystem() {
        // Remove all physics bodies
        solarSystemObjects.forEach(obj => {
            if (obj.physicsBody) {
                physicsEngine.removeBody(obj.physicsBody);
            }
        });
        
        // Remove all solar system objects from scene
        solarSystemObjects.forEach(obj => {
            if (obj.group && obj.group.parent) {
                scene.remove(obj.group);
            } else if (obj.mesh && obj.mesh.parent) {
                scene.remove(obj.mesh);
            }
            if (obj.orbitLine && obj.orbitLine.parent) {
                scene.remove(obj.orbitLine);
            }
        });
        
        // Remove orbit lines
        solarOrbitLines.forEach(line => {
            scene.remove(line);
        });
        
        solarSystemObjects.length = 0;
        solarOrbitLines.length = 0;
        sunData = null;
        
        deselectObject();
    }

    // Load Solar System to Universe Builder
    function loadSolarSystemToUniverse() {
        // Clear current universe
        clearUniverse();
        
        // Create a star at center to represent Sun
        const star = createStar({
            name: 'Sun',
            size: 15,
            color: 0xffdd00,
            position: new THREE.Vector3(0, 0, 0),
            glowIntensity: 2,
            mass: SOLAR_SYSTEM_DATA.sun.mass
        });

        // Add planets from solar system
        SOLAR_SYSTEM_DATA.planets.forEach(planetInfo => {
            const planet = createPlanet({
                parent: star.mesh,
                name: planetInfo.name,
                size: planetInfo.size,
                color: planetInfo.color,
                distance: planetInfo.distance,
                mass: planetInfo.mass,
                orbitSpeed: 1.0,  // Physics-based orbit
                rotationSpeed: 1 / Math.abs(planetInfo.rotationPeriod)
            });
            
            // Add Moon for Earth
            if (planetInfo.hasMoon && planet) {
                createMoon({
                    parent: planet.mesh,
                    name: 'Moon',
                    size: 0.4,
                    color: 0xcccccc,
                    distance: 4,
                    mass: SOLAR_SYSTEM_DATA.moon.mass,
                    orbitSpeed: 1.0  // Physics-based orbit
                });
            }
        });

        // Switch to Universe mode
        switchMode('universe');
        
        alert('Solar System loaded into Universe Builder! You can now edit it.');
    }

    // ==========================================
    // MODE SWITCHING
    // ==========================================

    // Switch between modes
    function switchMode(mode) {
        if (mode === currentMode) return;
        
        // Clear current scene objects safely
        if (currentMode === 'universe') {
            clearUniverse();
        } else if (currentMode === 'solar') {
            clearSolarSystem();
        }
        
        currentMode = mode;
        
        // Update UI
        updateModeUI();
        
        // Load new mode
        if (mode === 'solar') {
            loadSolarSystem();
        } else {
            // Reset camera for universe mode
            camera.position.set(0, 100, 200);
            controls.target.set(0, 0, 0);
            controls.update();
        }
    }

    // Update mode UI
    function updateModeUI() {
        const universeBtn = document.getElementById('universe-mode-btn');
        const solarBtn = document.getElementById('solar-mode-btn');
        const controlPanel = document.getElementById('control-panel');
        const solarPanel = document.getElementById('solar-panel');
        
        if (currentMode === 'universe') {
            universeBtn.classList.add('active');
            solarBtn.classList.remove('active');
            controlPanel.classList.remove('hidden');
            solarPanel.classList.add('hidden');
        } else {
            universeBtn.classList.remove('active');
            solarBtn.classList.add('active');
            controlPanel.classList.add('hidden');
            solarPanel.classList.remove('hidden');
        }
    }

    // ==========================================
    // EXISTING UNIVERSE BUILDER FUNCTIONS
    // ==========================================

    // Delete object
    function deleteObject(objData) {
        if (!objData) return;

        // Remove physics body
        if (objData.physicsBody) {
            physicsEngine.removeBody(objData.physicsBody);
        }

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
        if (objData.mesh && objData.mesh.parent) {
            scene.remove(objData.mesh);
        }
        if (objData.group && objData.group.parent) {
            objData.group.parent.remove(objData.group);
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
        if (objData.type === 'star' || objData.type === 'sun') {
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
        if (selectedObject.type !== 'star' && selectedObject.type !== 'sun') {
            selectedObject.mesh.material.emissiveIntensity = 0.1;
        }

        selectedObject = null;
        hideInspector();
    }

    // Show inspector panel
    function showInspector(objData) {
        const inspector = document.getElementById('inspector-panel');
        const inspectorContent = document.getElementById('inspector-content');
        
        let content = '';
        
        if (currentMode === 'solar' && (objData.type === 'solarPlanet' || objData.type === 'sun' || objData.type === 'solarMoon')) {
            // Solar System mode info panel
            document.getElementById('inspector-title').textContent = objData.name;
            
            content = `
                <div class="property-group">
                    <label>Name</label>
                    <div class="info-value">${objData.name}</div>
                </div>
            `;
            
            if (objData.type === 'sun') {
                content += `
                    <div class="property-group">
                        <label>Type</label>
                        <div class="info-value">Star</div>
                    </div>
                    <div class="property-group">
                        <label>Description</label>
                        <div class="info-value description">${objData.description}</div>
                    </div>
                `;
            } else if (objData.type === 'solarPlanet') {
                content += `
                    <div class="property-group">
                        <label>Distance from Sun</label>
                        <div class="info-value">${objData.distance} AU (scaled)</div>
                    </div>
                    <div class="property-group">
                        <label>Orbital Period</label>
                        <div class="info-value">${objData.orbitalPeriod} Earth days</div>
                    </div>
                    <div class="property-group">
                        <label>Rotation Period</label>
                        <div class="info-value">${Math.abs(objData.rotationPeriod)} Earth days</div>
                    </div>
                    <div class="property-group">
                        <label>Description</label>
                        <div class="info-value description">${objData.description}</div>
                    </div>
                `;
            } else if (objData.type === 'solarMoon') {
                content += `
                    <div class="property-group">
                        <label>Parent</label>
                        <div class="info-value">${objData.parent.name}</div>
                    </div>
                    <div class="property-group">
                        <label>Orbital Period</label>
                        <div class="info-value">${objData.orbitalPeriod} Earth days</div>
                    </div>
                    <div class="property-group">
                        <label>Description</label>
                        <div class="info-value description">${objData.description}</div>
                    </div>
                `;
            }
            
            content += `
                <button id="focus-btn" class="action-btn">🎥 Focus</button>
            `;
        } else {
            // Universe Builder mode
            document.getElementById('inspector-title').textContent = `${objData.type.charAt(0).toUpperCase() + objData.type.slice(1)} Properties`;
            
            content = `
                <div class="property-group">
                    <label for="obj-name">Name</label>
                    <input type="text" id="obj-name" class="text-input" value="${objData.name}">
                </div>

                <div class="property-group">
                    <label for="obj-size">Size: <span id="size-value">${objData.size.toFixed(1)}</span></label>
                    <input type="range" id="obj-size" min="0.1" max="10" step="0.1" value="${objData.size}">
                </div>
            `;

            if (objData.type !== 'star') {
                content += `
                    <div class="property-group">
                        <label for="obj-speed">Orbit Speed: <span id="speed-value-prop">${((objData.orbitalSpeed / BASE_SPEED) * Math.sqrt(objData.distance)).toFixed(1)}</span></label>
                        <input type="range" id="obj-speed" min="0" max="10" step="0.1" value="${(objData.orbitalSpeed / BASE_SPEED) * Math.sqrt(objData.distance)}">
                    </div>

                    <div class="property-group">
                        <label for="obj-distance">Distance from Parent: <span id="distance-value">${objData.distance.toFixed(0)}</span></label>
                        <input type="range" id="obj-distance" min="5" max="200" step="1" value="${objData.distance}">
                    </div>
                `;
            }

            content += `
                <div class="property-group">
                    <label for="obj-color">Color</label>
                    <input type="color" id="obj-color" value="#${objData.color.getHexString()}">
                </div>
            `;

            if (objData.type === 'star') {
                content += `
                    <div class="property-group">
                        <label for="obj-glow">Glow Intensity: <span id="glow-value">${objData.glowIntensity.toFixed(1)}</span></label>
                        <input type="range" id="obj-glow" min="0" max="3" step="0.1" value="${objData.glowIntensity}">
                    </div>
                `;
            }

            content += `
                <div class="property-group">
                    <label for="obj-rotation">Rotation Speed: <span id="rotation-value">${(objData.rotationSpeed / 0.02).toFixed(1)}</span></label>
                    <input type="range" id="obj-rotation" min="0" max="5" step="0.1" value="${objData.rotationSpeed / 0.02}">
                </div>

                <div class="button-group">
                    <button id="focus-btn" class="action-btn">🎥 Focus</button>
                    <button id="delete-btn" class="danger-btn">🗑️ Delete</button>
                </div>
            `;
        }
        
        inspectorContent.innerHTML = content;
        
        // Re-attach event listeners for dynamic content
        attachInspectorListeners();
        
        inspector.classList.remove('hidden');
    }

    // Attach inspector event listeners
    function attachInspectorListeners() {
        const focusBtn = document.getElementById('focus-btn');
        if (focusBtn) {
            focusBtn.addEventListener('click', () => {
                if (selectedObject) focusOnObject(selectedObject);
            });
        }
        
        const deleteBtn = document.getElementById('delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (selectedObject && confirm(`Delete ${selectedObject.name}?`)) {
                    if (currentMode === 'solar') {
                        // For solar system, just deselect
                        deselectObject();
                    } else {
                        deleteObject(selectedObject);
                    }
                }
            });
        }
        
        // Universe Builder listeners
        const nameInput = document.getElementById('obj-name');
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                if (selectedObject) selectedObject.name = e.target.value;
            });
        }
        
        const sizeInput = document.getElementById('obj-size');
        if (sizeInput) {
            sizeInput.addEventListener('input', (e) => {
                if (selectedObject) {
                    const size = parseFloat(e.target.value);
                    selectedObject.size = size;
                    const mesh = selectedObject.mesh;
                    mesh.geometry.dispose();
                    mesh.geometry = new THREE.SphereGeometry(size, 32, 32);
                    document.getElementById('size-value').textContent = size.toFixed(1);
                }
            });
        }
        
        const speedInput = document.getElementById('obj-speed');
        if (speedInput) {
            speedInput.addEventListener('input', (e) => {
                if (selectedObject && selectedObject.type !== 'star') {
                    const speed = parseFloat(e.target.value);
                    selectedObject.orbitalSpeed = (BASE_SPEED * speed) / Math.sqrt(selectedObject.distance);
                    document.getElementById('speed-value-prop').textContent = speed.toFixed(1);
                }
            });
        }
        
        const distInput = document.getElementById('obj-distance');
        if (distInput) {
            distInput.addEventListener('input', (e) => {
                if (selectedObject && selectedObject.type !== 'star' && selectedObject.physicsBody) {
                    const distance = parseFloat(e.target.value);
                    selectedObject.distance = distance;
                    
                    // Recalculate position based on parent's position
                    let parentPosition = new THREE.Vector3(0, 0, 0);
                    if (selectedObject.parentPhysicsBody) {
                        parentPosition = selectedObject.parentPhysicsBody.position.clone();
                    } else if (selectedObject.parent) {
                        const parentGroup = selectedObject.parent.parent || selectedObject.parent;
                        parentPosition = parentGroup.position.clone();
                    }
                    
                    // Place at initial angle, new distance
                    const angle = selectedObject.initialAngle || 0;
                    const newPosition = new THREE.Vector3(
                        parentPosition.x + Math.cos(angle) * distance,
                        parentPosition.y,
                        parentPosition.z + Math.sin(angle) * distance
                    );
                    
                    // Update physics body position and recalculate velocity
                    selectedObject.physicsBody.position.copy(newPosition);
                    
                    // Recalculate orbital velocity for new distance
                    const parentMass = selectedObject.parentPhysicsBody ? 
                        selectedObject.parentPhysicsBody.mass : 
                        (selectedObject.parent && selectedObject.parent.userData.physicsBody ? 
                            selectedObject.parent.userData.physicsBody.mass : 1000);
                    
                    const orbitalSpeed = PhysicsBody.getCircularOrbitalVelocity(parentMass, distance);
                    const velocityDirection = new THREE.Vector3(
                        -Math.sin(angle),
                        0,
                        Math.cos(angle)
                    );
                    
                    // For moons, add parent's velocity
                    let parentVelocity = new THREE.Vector3();
                    if (selectedObject.parentPhysicsBody) {
                        parentVelocity = selectedObject.parentPhysicsBody.velocity.clone();
                    }
                    
                    const newVelocity = velocityDirection.multiplyScalar(orbitalSpeed).add(parentVelocity);
                    selectedObject.physicsBody.velocity.copy(newVelocity);
                    
                    // Sync mesh
                    selectedObject.mesh.position.copy(newPosition);
                    
                    // Update orbit line
                    if (selectedObject.orbitLine) {
                        scene.remove(selectedObject.orbitLine);
                        const newOrbitLine = createOrbitLine(distance);
                        newOrbitLine.position.copy(parentPosition);
                        newOrbitLine.visible = showOrbits;
                        scene.add(newOrbitLine);
                        const index = orbitLines.indexOf(selectedObject.orbitLine);
                        if (index > -1) orbitLines[index] = newOrbitLine;
                        selectedObject.orbitLine = newOrbitLine;
                    }
                    
                    document.getElementById('distance-value').textContent = distance.toFixed(0);
                }
            });
        }
        
        const colorInput = document.getElementById('obj-color');
        if (colorInput) {
            colorInput.addEventListener('input', (e) => {
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
        }
        
        const glowInput = document.getElementById('obj-glow');
        if (glowInput) {
            glowInput.addEventListener('input', (e) => {
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
        }
        
        const rotInput = document.getElementById('obj-rotation');
        if (rotInput) {
            rotInput.addEventListener('input', (e) => {
                if (selectedObject) {
                    const speed = parseFloat(e.target.value);
                    selectedObject.rotationSpeed = 0.02 * speed;
                    document.getElementById('rotation-value').textContent = speed.toFixed(1);
                }
            });
        }
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

        // Get world position from physics body or mesh
        const worldPos = new THREE.Vector3();
        if (objData.physicsBody) {
            worldPos.copy(objData.physicsBody.position);
        } else if (objData.mesh) {
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

    // Generate random universe with physics-based orbits
    function generateRandomUniverse() {
        clearUniverse();

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

            const numPlanets = 2 + Math.floor(Math.random() * 5);
            for (let j = 0; j < numPlanets; j++) {
                const distance = 15 + j * 10 + Math.random() * 8;
                const planet = createPlanet({
                    parent: star.mesh,
                    size: 0.5 + Math.random() * 2,
                    color: getRandomPlanetColor(),
                    distance: distance,
                    orbitSpeed: 0.8 + Math.random() * 0.4, // Varied speeds for variety
                    rotationSpeed: 0.5 + Math.random() * 2
                });

                if (Math.random() > 0.5) {
                    const numMoons = 1 + Math.floor(Math.random() * 3);
                    for (let k = 0; k < numMoons; k++) {
                        createMoon({
                            parent: planet.mesh,
                            size: 0.1 + Math.random() * 0.3,
                            color: 0x888888 + Math.random() * 0x222222,
                            distance: 2 + k * 1.5 + Math.random(),
                            orbitSpeed: 0.8 + Math.random() * 0.4
                        });
                    }
                }
            }
        }
    }

    // Clear universe
    function clearUniverse() {
        // Clear all physics bodies
        physicsEngine.clear();
        
        [...moons].forEach(m => {
            if (m.mesh && m.mesh.parent) scene.remove(m.mesh);
            if (m.orbitLine && m.orbitLine.parent) scene.remove(m.orbitLine);
        });
        [...planets].forEach(p => {
            if (p.mesh && p.mesh.parent) scene.remove(p.mesh);
            if (p.orbitLine && p.orbitLine.parent) scene.remove(p.orbitLine);
        });
        [...stars].forEach(s => {
            if (s.group && s.group.parent) scene.remove(s.group);
        });
        
        moons.length = 0;
        planets.length = 0;
        stars.length = 0;
        orbitLines.length = 0;
        
        updatePlanetButtonStates();
        updateMoonButtonStates();
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
            version: 2, // Version 2 includes physics data
            stars: stars.map(s => ({
                name: s.name,
                size: s.size,
                color: '#' + s.color.getHexString(),
                position: { x: s.physicsBody.position.x, y: s.physicsBody.position.y, z: s.physicsBody.position.z },
                glowIntensity: s.glowIntensity,
                mass: s.mass
            })),
            planets: planets.map(p => ({
                name: p.name,
                size: p.size,
                color: '#' + p.color.getHexString(),
                distance: p.distance,
                orbitSpeed: 1.0, // Physics-based speed
                rotationSpeed: p.rotationSpeed / 0.02,
                parentName: p.parentData?.name || (stars.find(s => s.mesh === p.parent)?.name),
                mass: p.mass,
                initialAngle: p.initialAngle
            })),
            moons: moons.map(m => ({
                name: m.name,
                size: m.size,
                color: '#' + m.color.getHexString(),
                distance: m.distance,
                orbitSpeed: 1.0, // Physics-based speed
                rotationSpeed: m.rotationSpeed / 0.02,
                parentName: m.parentData?.name,
                mass: m.mass,
                initialAngle: m.initialAngle
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

                const starMap = new Map();
                data.stars.forEach(starData => {
                    // Handle both old and new format
                    const position = starData.position || { x: 0, y: 0, z: 0 };
                    const star = createStar({
                        name: starData.name,
                        size: starData.size,
                        color: parseInt(starData.color.replace('#', '0x')),
                        position: new THREE.Vector3(position.x, position.y, position.z),
                        glowIntensity: starData.glowIntensity,
                        mass: starData.mass
                    });
                    starMap.set(star.name, star);
                });

                const planetMap = new Map();
                data.planets.forEach(planetData => {
                    const parent = starMap.get(planetData.parentName);
                    if (parent) {
                        const planet = createPlanet({
                            name: planetData.name,
                            size: planetData.size,
                            color: parseInt(planetData.color.replace('#', '0x')),
                            distance: planetData.distance,
                            orbitSpeed: planetData.orbitSpeed !== undefined ? planetData.orbitSpeed : 1.0,
                            rotationSpeed: planetData.rotationSpeed,
                            parent: parent.mesh,
                            mass: planetData.mass,
                            initialAngle: planetData.initialAngle
                        });
                        planetMap.set(planet.name, planet);
                    }
                });

                data.moons.forEach(moonData => {
                    const parent = planetMap.get(moonData.parentName);
                    if (parent) {
                        createMoon({
                            name: moonData.name,
                            size: moonData.size,
                            color: parseInt(moonData.color.replace('#', '0x')),
                            distance: moonData.distance,
                            orbitSpeed: moonData.orbitSpeed !== undefined ? moonData.orbitSpeed : 1.0,
                            rotationSpeed: moonData.rotationSpeed,
                            parent: parent.mesh,
                            mass: moonData.mass,
                            initialAngle: moonData.initialAngle
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

    // ==========================================
    // EVENT LISTENERS
    // ==========================================

    function setupEventListeners() {
        // Window resize
        window.addEventListener('resize', onWindowResize);

        // Mouse interactions
        renderer.domElement.addEventListener('click', onMouseClick);
        renderer.domElement.addEventListener('mousemove', onMouseMove);
        renderer.domElement.addEventListener('contextmenu', onContextMenu);

        // Creation buttons (Universe mode)
        document.getElementById('add-star-btn').addEventListener('click', () => showCreationModal('star'));
        document.getElementById('add-planet-btn').addEventListener('click', () => showCreationModal('planet'));
        document.getElementById('add-moon-btn').addEventListener('click', () => showCreationModal('moon'));

        // Universe time controls
        document.getElementById('play-pause-btn').addEventListener('click', togglePlayPause);
        document.getElementById('reverse-btn').addEventListener('click', toggleReverse);
        document.getElementById('speed-slider').addEventListener('input', (e) => {
            timeScale = parseFloat(e.target.value) / 50;
            document.getElementById('speed-value').textContent = timeScale.toFixed(1) + 'x';
        });

        // Universe view options
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

        // Navigation - Universe mode
        document.getElementById('reset-view-btn').addEventListener('click', () => {
            exitFocusMode();
            camera.position.set(0, 100, 200);
            controls.target.set(0, 0, 0);
            controls.update();
        });

        // Inspector close
        document.getElementById('close-inspector').addEventListener('click', deselectObject);

        // Modal controls
        document.getElementById('close-modal').addEventListener('click', hideCreationModal);
        document.getElementById('creation-modal').addEventListener('click', (e) => {
            if (e.target.id === 'creation-modal') hideCreationModal();
        });

        // Focus controls
        document.getElementById('back-to-universe-btn').addEventListener('click', exitFocusMode);

        // Context menu
        document.getElementById('context-menu').addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action && selectedObject) {
                if (action === 'focus') focusOnObject(selectedObject);
                else if (action === 'edit') selectObject(selectedObject);
                else if (action === 'delete') {
                    if (currentMode === 'solar') {
                        deselectObject();
                    } else if (confirm(`Delete ${selectedObject.name}?`)) {
                        deleteObject(selectedObject);
                    }
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

    // Setup mode event listeners
    function setupModeEventListeners() {
        // Mode toggle buttons
        document.getElementById('universe-mode-btn').addEventListener('click', () => switchMode('universe'));
        document.getElementById('solar-mode-btn').addEventListener('click', () => switchMode('solar'));

        // Solar System mode controls
        document.getElementById('solar-play-pause-btn').addEventListener('click', toggleSolarPlayPause);
        document.getElementById('solar-reverse-btn').addEventListener('click', toggleSolarReverse);
        document.getElementById('solar-speed-slider').addEventListener('input', (e) => {
            timeScale = parseFloat(e.target.value) / 50;
            document.getElementById('solar-speed-value').textContent = timeScale.toFixed(1) + 'x';
        });

        // Solar view options
        document.getElementById('solar-show-orbits').addEventListener('change', (e) => {
            showOrbits = e.target.checked;
            solarOrbitLines.forEach(line => line.visible = showOrbits);
            solarSystemObjects.forEach(obj => {
                if (obj.orbitLine) obj.orbitLine.visible = showOrbits;
            });
        });
        document.getElementById('solar-auto-rotate').addEventListener('change', (e) => {
            autoRotate = e.target.checked;
            controls.autoRotate = autoRotate;
        });

        // Solar navigation
        document.getElementById('solar-reset-view-btn').addEventListener('click', () => {
            exitFocusMode();
            camera.position.set(0, 80, 250);
            controls.target.set(0, 0, 0);
            controls.update();
        });

        // Load to Universe Builder
        document.getElementById('load-to-universe-btn').addEventListener('click', loadSolarSystemToUniverse);
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

        // Add slider event listeners
        addSliderListeners();

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

    // Add slider listeners for creation modal
    function addSliderListeners() {
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
        ['x', 'y', 'z'].forEach(axis => {
            const slider = document.getElementById(`create-pos-${axis}`);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    document.getElementById(`create-pos-${axis}-val`).textContent = e.target.value;
                });
            }
        });
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

    // Toggle play/pause (Universe mode)
    function togglePlayPause() {
        isPaused = !isPaused;
        const btn = document.getElementById('play-pause-btn');
        btn.textContent = isPaused ? '▶️' : '⏸️';
        btn.classList.toggle('active', !isPaused);
    }

    // Toggle reverse (Universe mode)
    function toggleReverse() {
        isReversed = !isReversed;
        const btn = document.getElementById('reverse-btn');
        btn.classList.toggle('active', isReversed);
    }

    // Toggle play/pause (Solar mode)
    function toggleSolarPlayPause() {
        isPaused = !isPaused;
        const btn = document.getElementById('solar-play-pause-btn');
        btn.textContent = isPaused ? '▶️' : '⏸️';
        btn.classList.toggle('active', !isPaused);
    }

    // Toggle reverse (Solar mode)
    function toggleSolarReverse() {
        isReversed = !isReversed;
        const btn = document.getElementById('solar-reverse-btn');
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
        
        let allMeshes = [];
        if (currentMode === 'universe') {
            allMeshes = [...stars.map(s => s.mesh), ...planets.map(p => p.mesh), ...moons.map(m => m.mesh)];
        } else {
            allMeshes = solarSystemObjects.map(obj => obj.mesh);
        }
        
        const intersects = raycaster.intersectObjects(allMeshes);

        // Reset hover state
        if (hoveredObject && (!intersects.length || intersects[0].object !== hoveredObject.mesh)) {
            if (hoveredObject !== selectedObject) {
                hoveredObject.mesh.scale.set(1, 1, 1);
                if (hoveredObject.type !== 'star' && hoveredObject.type !== 'sun') {
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
                    if (hoveredObject.type !== 'star' && hoveredObject.type !== 'sun') {
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
        if (event.button !== 0) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        
        let allMeshes = [];
        if (currentMode === 'universe') {
            allMeshes = [...stars.map(s => s.mesh), ...planets.map(p => p.mesh), ...moons.map(m => m.mesh)];
        } else {
            allMeshes = solarSystemObjects.map(obj => obj.mesh);
        }
        
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
        
        let allMeshes = [];
        if (currentMode === 'universe') {
            allMeshes = [...stars.map(s => s.mesh), ...planets.map(p => p.mesh), ...moons.map(m => m.mesh)];
        } else {
            allMeshes = solarSystemObjects.map(obj => obj.mesh);
        }
        
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

    // Animation loop with physics-based motion
    function animate() {
        requestAnimationFrame(animate);

        const deltaTime = 1 / 60;
        const effectiveTimeScale = isReversed ? -timeScale : timeScale;
        const physicsDelta = deltaTime * Math.abs(effectiveTimeScale);

        if (!isPaused) {
            // Update physics simulation
            physicsEngine.update(physicsDelta);

            if (currentMode === 'universe') {
                // Update stars - keep them at their physics positions (typically stationary)
                stars.forEach(star => {
                    star.mesh.rotation.y += star.rotationSpeed * effectiveTimeScale;
                    
                    // Update star corona pulse effect
                    const time = Date.now() * 0.001;
                    const scale = 1 + Math.sin(time * 2 + star.id) * 0.05;
                    star.corona.scale.set(scale, scale, scale);
                });

                // Update planets - sync mesh position with physics body
                planets.forEach(planet => {
                    // Sync position from physics
                    planet.mesh.position.copy(planet.physicsBody.position);
                    
                    // Self-rotation
                    planet.mesh.rotation.y += planet.rotationSpeed * effectiveTimeScale;
                    
                    // Update orbit line position to follow parent
                    if (planet.parent && planet.orbitLine) {
                        const parentGroup = planet.parent.parent || planet.parent;
                        planet.orbitLine.position.copy(parentGroup.position);
                    }
                });

                // Update moons - sync mesh position with physics body
                moons.forEach(moon => {
                    // Sync position from physics
                    moon.mesh.position.copy(moon.physicsBody.position);
                    
                    // Self-rotation
                    moon.mesh.rotation.y += moon.rotationSpeed * effectiveTimeScale;
                    
                    // Update orbit line position to follow parent planet
                    if (moon.parentData && moon.parentData.physicsBody && moon.orbitLine) {
                        moon.orbitLine.position.copy(moon.parentData.physicsBody.position);
                    }
                });
            } else {
                // Animate Solar System - sync with physics
                solarSystemObjects.forEach(obj => {
                    if (obj.physicsBody) {
                        // Sync mesh position with physics body
                        obj.mesh.position.copy(obj.physicsBody.position);
                    }
                    
                    if (obj.type === 'sun') {
                        // Rotate Sun
                        obj.mesh.rotation.y += obj.rotationSpeed * effectiveTimeScale;
                    } else {
                        // Rotate planets and moons
                        obj.mesh.rotation.y += obj.rotationSpeed * effectiveTimeScale;
                    }
                    
                    // Update orbit line for Moon to follow Earth
                    if (obj.type === 'solarMoon' && obj.parent && obj.orbitLine) {
                        const parentPhysics = obj.parent.physicsBody;
                        if (parentPhysics) {
                            obj.orbitLine.position.copy(parentPhysics.position);
                        }
                    }
                });
            }
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
            if (selectedObject.physicsBody) {
                worldPos.copy(selectedObject.physicsBody.position);
            } else if (selectedObject.mesh) {
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
