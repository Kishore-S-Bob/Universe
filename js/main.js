(function() {
    let scene, camera, renderer, controls;
    const planets = [];

    function init() {
        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        // Camera setup
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        camera.position.set(0, 30, 80);

        // Renderer setup
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(renderer.domElement);

        // OrbitControls
        // For Three.js r128 via script tag, OrbitControls is usually THREE.OrbitControls
        if (typeof THREE.OrbitControls === 'function') {
            controls = new THREE.OrbitControls(camera, renderer.domElement);
        } else {
            // Fallback if it's not on THREE object directly
            controls = new OrbitControls(camera, renderer.domElement);
        }
        controls.enableDamping = true;

        // Sun at center
        const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sun);

        // PointLight from the sun
        const pointLight = new THREE.PointLight(0xffffff, 2, 500);
        scene.add(pointLight);
        
        // Ambient light for subtle visibility of dark sides
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        // Planet data
        const planetData = [
            { name: "Earth", radius: 1, distance: 15, speed: 0.01, color: 0x2233ff },
            { name: "Mars", radius: 0.8, distance: 25, speed: 0.008, color: 0xff4422 },
            { name: "Jupiter", radius: 3, distance: 45, speed: 0.005, color: 0xd3a567 }
        ];

        planetData.forEach(data => {
            // Orbit group
            const orbitGroup = new THREE.Group();
            scene.add(orbitGroup);

            // Planet mesh
            const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
            const material = new THREE.MeshStandardMaterial({ color: data.color });
            const planet = new THREE.Mesh(geometry, material);
            planet.position.x = data.distance;
            orbitGroup.add(planet);

            planets.push({ group: orbitGroup, planet: planet, speed: data.speed });
        });

        // Stars background
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1 });
        const starVertices = [];
        for (let i = 0; i < 5000; i++) {
            const x = (Math.random() - 0.5) * 1500;
            const y = (Math.random() - 0.5) * 1500;
            const z = (Math.random() - 0.5) * 1500;
            starVertices.push(x, y, z);
        }
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const stars = new THREE.Points(starGeometry, starMaterial);
        scene.add(stars);

        // Resize handler
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Start animation loop
        function animate() {
            requestAnimationFrame(animate);

            planets.forEach(p => {
                p.group.rotation.y += p.speed;
                p.planet.rotation.y += 0.02; // Spin on its axis
            });

            controls.update();
            renderer.render(scene, camera);
        }
        animate();
    }

    // Initialize when window loads to ensure THREE and OrbitControls are available
    window.onload = init;
})();
