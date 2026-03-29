// Universe Engine Enhanced Features
// Additions for advanced physics, black holes, trails, collisions, and spaceship mode

// ==========================================
// ORBIT TRAIL CLASS
// ==========================================

class OrbitTrail {
    constructor(body, color, maxLength = 200) {
        this.body = body;
        this.maxLength = maxLength;
        this.positions = [];
        this.color = color;
        
        // Create line geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(maxLength * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setDrawRange(0, 0);
        
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.6,
            linewidth: 2
        });
        
        this.line = new THREE.Line(geometry, material);
        this.line.frustumCulled = false;
        scene.add(this.line);
    }
    
    update() {
        if (!this.body || this.body.merged) return;
        
        // Add current position
        const pos = this.body.position.clone();
        
        // Only add if moved enough
        if (this.positions.length === 0 || pos.distanceToSquared(this.positions[this.positions.length - 1]) > 0.1) {
            this.positions.push(pos);
            if (this.positions.length > this.maxLength) {
                this.positions.shift();
            }
        }
        
        // Update geometry
        const positions = this.line.geometry.attributes.position.array;
        for (let i = 0; i < this.positions.length; i++) {
            positions[i * 3] = this.positions[i].x;
            positions[i * 3 + 1] = this.positions[i].y;
            positions[i * 3 + 2] = this.positions[i].z;
        }
        
        this.line.geometry.attributes.position.needsUpdate = true;
        this.line.geometry.setDrawRange(0, this.positions.length);
    }
    
    dispose() {
        if (this.line) {
            scene.remove(this.line);
            this.line.geometry.dispose();
            this.line.material.dispose();
        }
    }
}

// ==========================================
// BLACK HOLE CREATION
// ==========================================

function createBlackHole(options = {}) {
    const size = options.size || 8;
    const position = options.position || new THREE.Vector3(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 200
    );
    const name = options.name || `Black Hole ${nextId++}`;
    
    // Create physics body for black hole (EXTREMELY massive)
    const mass = options.mass || calculateMass('blackhole', size) * 100; // 100x more massive
    const physicsBody = new PhysicsBody({
        id: Date.now(),
        mass: mass,
        position: position.clone(),
        velocity: new THREE.Vector3(0, 0, 0),
        radius: size,
        type: 'blackhole'
    });
    physicsEngine.addBody(physicsBody);
    
    // Black hole group
    const bhGroup = new THREE.Group();
    bhGroup.position.copy(position);
    
    // Event horizon (black sphere)
    const horizonGeometry = new THREE.SphereGeometry(size, 64, 64);
    const horizonMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 1
    });
    const horizon = new THREE.Mesh(horizonGeometry, horizonMaterial);
    bhGroup.add(horizon);
    
    // Accretion disk
    const diskGeometry = new THREE.RingGeometry(size * 1.5, size * 3, 64);
    const diskMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
    });
    const disk = new THREE.Mesh(diskGeometry, diskMaterial);
    disk.rotation.x = Math.PI / 2;
    bhGroup.add(disk);
    
    // Outer glow (red shifted light)
    const glowGeometry = new THREE.SphereGeometry(size * 4, 64, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff2200,
        transparent: true,
        opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    bhGroup.add(glow);
    
    // Gravitational lensing effect (inner ring)
    const lensGeometry = new THREE.RingGeometry(size * 1.2, size * 1.5, 64);
    const lensMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
    });
    const lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.rotation.x = Math.PI / 2;
    bhGroup.add(lens);
    
    scene.add(bhGroup);
    
    // Store black hole data
    const bhData = {
        id: physicsBody.id,
        type: 'blackhole',
        name: name,
        mesh: horizon,
        group: bhGroup,
        disk: disk,
        glow: glow,
        lens: lens,
        size: size,
        baseSize: size,
        mass: mass,
        physicsBody: physicsBody,
        rotationSpeed: 0.01,
        description: 'A region of spacetime where gravity is so strong that nothing can escape'
    };
    horizon.userData = bhData;
    blackHoles.push(bhData);
    
    return bhData;
}

// ==========================================
// SPACESHIP MODE
// ==========================================

function createSpaceship() {
    if (spaceship) return;
    
    const shipGroup = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.ConeGeometry(0.5, 2, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.4,
        metalness: 0.8
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    shipGroup.add(body);
    
    // Cockpit
    const cockpitGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const cockpitMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a90d9,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.8
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.3, -0.5);
    shipGroup.add(cockpit);
    
    // Engines
    const engineGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.5, 8);
    const engineMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.6,
        metalness: 0.7
    });
    
    const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    leftEngine.rotation.x = Math.PI / 2;
    leftEngine.position.set(-0.4, 0, 0.8);
    shipGroup.add(leftEngine);
    
    const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
    rightEngine.rotation.x = Math.PI / 2;
    rightEngine.position.set(0.4, 0, 0.8);
    shipGroup.add(rightEngine);
    
    // Engine glow
    const glowGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.8
    });
    
    const leftGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    leftGlow.position.set(-0.4, 0, 1.1);
    shipGroup.add(leftGlow);
    
    const rightGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    rightGlow.position.set(0.4, 0, 1.1);
    shipGroup.add(rightGlow);
    
    // Initial position
    shipGroup.position.set(0, 0, 100);
    
    scene.add(shipGroup);
    
    spaceship = {
        mesh: shipGroup,
        velocity: new THREE.Vector3(0, 0, -1),
        speed: 1.0,
        boostActive: false,
        leftGlow: leftGlow,
        rightGlow: rightGlow
    };
}

function updateSpaceship(deltaTime) {
    if (!spaceship || !spaceshipMode) return;
    
    // Calculate movement direction based on keys
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(spaceship.mesh.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(spaceship.mesh.quaternion);
    const up = new THREE.Vector3(0, 1, 0);
    
    // Speed multiplier
    const speedMultiplier = boostActive ? 3.0 : 1.0;
    const acceleration = 20.0 * speedMultiplier;
    
    // Apply acceleration based on keys
    if (keys.w) {
        spaceship.velocity.add(forward.multiplyScalar(acceleration * deltaTime));
    }
    if (keys.s) {
        spaceship.velocity.add(forward.multiplyScalar(-acceleration * deltaTime));
    }
    if (keys.a) {
        spaceship.mesh.rotateY(2.0 * deltaTime);
    }
    if (keys.d) {
        spaceship.mesh.rotateY(-2.0 * deltaTime);
    }
    
    // Apply velocity limit
    const maxSpeed = boostActive ? 150 : 50;
    if (spaceship.velocity.length() > maxSpeed) {
        spaceship.velocity.normalize().multiplyScalar(maxSpeed);
    }
    
    // Update position
    spaceship.mesh.position.add(spaceship.velocity.clone().multiplyScalar(deltaTime));
    
    // Update engine glow
    const glowIntensity = boostActive ? 1.5 : 0.8;
    const glowColor = boostActive ? 0xff4400 : 0x00d4ff;
    spaceship.leftGlow.material.color.setHex(glowColor);
    spaceship.rightGlow.material.color.setHex(glowColor);
    spaceship.leftGlow.scale.setScalar(glowIntensity);
    spaceship.rightGlow.scale.setScalar(glowIntensity);
    
    // Camera follow spaceship
    const offset = spaceship.velocity.clone().normalize().multiplyScalar(20).add(new THREE.Vector3(0, 5, 0));
    camera.position.lerp(spaceship.mesh.position.clone().add(offset), 0.1);
    controls.target.lerp(spaceship.mesh.position, 0.1);
    controls.update();
}

// ==========================================
// ENERGY DISPLAY
// ==========================================

function updateEnergyDisplay() {
    const energy = physicsEngine.getTotalEnergy();
    
    // Update energy display in UI if it exists
    const energyPanel = document.getElementById('energy-display');
    if (energyPanel) {
        energyPanel.innerHTML = `
            <div class="energy-item">
                <span>Kinetic Energy:</span>
                <span class="energy-value">${energy.kinetic.toFixed(2)}</span>
            </div>
            <div class="energy-item">
                <span>Potential Energy:</span>
                <span class="energy-value">${energy.potential.toFixed(2)}</span>
            </div>
            <div class="energy-item">
                <span>Total Energy:</span>
                <span class="energy-value">${energy.total.toFixed(2)}</span>
            </div>
        `;
    }
    
    return energy;
}

// ==========================================
// COLLISION HANDLING
// ==========================================

function handleCollisions() {
    const collisions = physicsEngine.checkCollisions();
    
    for (const collision of collisions) {
        const { larger, smaller } = physicsEngine.handleCollision(collision.body1, collision.body2);
        
        // Find and remove the smaller object from scene
        let smallerData = null;
        
        if (currentMode === 'universe') {
            // Find in planets, moons arrays
            for (let i = planets.length - 1; i >= 0; i--) {
                if (planets[i].physicsBody === smaller) {
                    smallerData = planets[i];
                    planets.splice(i, 1);
                    break;
                }
            }
            if (!smallerData) {
                for (let i = moons.length - 1; i >= 0; i--) {
                    if (moons[i].physicsBody === smaller) {
                        smallerData = moons[i];
                        moons.splice(i, 1);
                        break;
                    }
                }
            }
        }
        
        if (smallerData) {
            // Remove from scene
            scene.remove(smallerData.mesh);
            if (smallerData.orbitLine) {
                scene.remove(smallerData.orbitLine);
            }
        }
        
        // Grow the larger object
        const growthFactor = Math.pow(smaller.mass / larger.mass + 1, 1/3);
        larger.radius *= growthFactor;
        
        // Find larger object data
        let largerData = null;
        if (currentMode === 'universe') {
            largerData = planets.find(p => p.physicsBody === larger) ||
                        moons.find(m => m.physicsBody === larger) ||
                        stars.find(s => s.physicsBody === larger);
        }
        
        if (largerData) {
            largerData.size = larger.radius;
            // Scale mesh
            largerData.mesh.geometry.dispose();
            largerData.mesh.geometry = new THREE.SphereGeometry(larger.radius, 32, 32);
        }
    }
}

// ==========================================
// MISSION SYSTEM
// ==========================================

function startMission(type) {
    missionActive = true;
    
    switch(type) {
        case 'stable':
            missionObjective = {
                type: 'stable',
                description: 'Create a stable planetary system with at least 3 planets',
                check: () => planets.length >= 3 && stars.length >= 1
            };
            break;
        case 'collision':
            missionObjective = {
                type: 'collision',
                description: 'Cause a collision between two celestial bodies',
                check: () => false // Checked in collision handler
            };
            break;
        case 'explore':
            missionObjective = {
                type: 'explore',
                description: 'Visit all planets in the system',
                planetsVisited: new Set(),
                check: function() {
                    return this.planetsVisited.size >= planets.length && planets.length >= 3;
                }
            };
            break;
    }
    
    showMissionPanel();
}

function showMissionPanel() {
    const panel = document.getElementById('mission-panel');
    if (panel && missionObjective) {
        panel.innerHTML = `
            <h4>🎯 Mission</h4>
            <p>${missionObjective.description}</p>
            <div class="mission-progress">
                ${getMissionProgressText()}
            </div>
        `;
        panel.classList.remove('hidden');
    }
}

function getMissionProgressText() {
    if (!missionObjective) return '';
    
    switch(missionObjective.type) {
        case 'stable':
            return `Progress: ${planets.length}/3 planets created`;
        case 'explore':
            return `Progress: ${missionObjective.planetsVisited.size}/${planets.length} planets visited`;
        default:
            return 'Mission in progress...';
    }
}

function checkMissionComplete() {
    if (!missionActive || !missionObjective) return;
    
    if (missionObjective.check()) {
        missionActive = false;
        showMissionComplete();
    }
}

function showMissionComplete() {
    const panel = document.getElementById('mission-panel');
    if (panel) {
        panel.innerHTML = `
            <h4>🎉 Mission Complete!</h4>
            <p>You completed: ${missionObjective.description}</p>
        `;
        setTimeout(() => {
            panel.classList.add('hidden');
        }, 5000);
    }
}
