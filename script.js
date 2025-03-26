import * as THREE from 'three';

let scene, camera, renderer, clock;
let airplane;
let speed = 0.0; // Initial speed
const maxSpeed = 1.5;
const minSpeed = 0.1;
const acceleration = 0.01;
const deceleration = 0.02;
const rotationSpeed = 0.02;
const groundLevel = 0;

// Control state
const controls = {
    pitchUp: false,
    pitchDown: false,
    rollLeft: false,
    rollRight: false,
    accelerate: false,
    decelerate: false
};

init();
animate();

function init() {
    // --- Basic Setup ---
    scene = new THREE.Scene();
    clock = new THREE.Clock();

    // Use a light blue background color for the sky
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 50, 300); // Add some fog for depth

    // --- Camera ---
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 15); // Start behind and slightly above the plane

    // --- Renderer ---
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 15);
    directionalLight.castShadow = true; // Optional, for more realism later if needed
    scene.add(directionalLight);

    // --- Airplane ---
    airplane = createAirplane();
    scene.add(airplane);
    airplane.position.y = 10; // Start slightly above ground

    // --- Environment ---
    createEnvironment();

    // --- Controls ---
    setupControls();

    // --- Resize Listener ---
    window.addEventListener('resize', onWindowResize, false);
}

function createAirplane() {
    const airplaneGroup = new THREE.Group();

    // Basic materials (no textures)
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, flatShading: true }); // Grey
    const wingMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd, flatShading: true }); // Lighter Grey
    const tailMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, flatShading: true }); // Red

    // Fuselage (Body) - Using Cylinder for a slightly more rounded look
    const fuselageGeometry = new THREE.CylinderGeometry(0.5, 0.7, 6, 8);
    const fuselage = new THREE.Mesh(fuselageGeometry, bodyMaterial);
    fuselage.rotation.x = Math.PI / 2; // Rotate to lie flat
    airplaneGroup.add(fuselage);

    // Wings
    const wingGeometry = new THREE.BoxGeometry(8, 0.2, 2);
    const wing = new THREE.Mesh(wingGeometry, wingMaterial);
    wing.position.y = 0.1; // Slightly above center
    airplaneGroup.add(wing);

    // Tail Fin (Vertical Stabilizer)
    const tailFinGeometry = new THREE.BoxGeometry(0.2, 1.5, 1);
    const tailFin = new THREE.Mesh(tailFinGeometry, tailMaterial);
    tailFin.position.set(0, 0.8, -2.8); // Position at the back and top
    airplaneGroup.add(tailFin);

    // Horizontal Stabilizer
    const hStabGeometry = new THREE.BoxGeometry(3, 0.15, 1);
    const hStab = new THREE.Mesh(hStabGeometry, wingMaterial);
    hStab.position.set(0, 0.1, -2.8); // Position at the back
    airplaneGroup.add(hStab);

    // Cockpit (simple)
    const cockpitGeometry = new THREE.SphereGeometry(0.4, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshStandardMaterial({ color: 0x4444cc, flatShading: true }); // Blueish
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.5, 1.5); // Front top
    cockpit.rotation.x = -Math.PI / 15; // Slight tilt
    airplaneGroup.add(cockpit);

    // Rotate the whole group so Z is forward
    airplaneGroup.rotation.y = Math.PI;

    return airplaneGroup;
}

function createEnvironment() {
    // Ground Plane
    const groundGeometry = new THREE.PlaneGeometry(500, 500, 50, 50); // Increased segments
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x228B22, // Forest Green
        wireframe: false, // Set true for a grid look
        flatShading: true,
        roughness: 1.0,
        metalness: 0.0
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate flat
    ground.position.y = groundLevel;
    scene.add(ground);

    // Simple "Mountains" or Obstacles (Cubes)
    const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, flatShading: true }); // Brown
    for (let i = 0; i < 20; i++) {
        const size = Math.random() * 10 + 5;
        const obstacleGeometry = new THREE.BoxGeometry(size, Math.random() * 30 + 10, size);
        const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        obstacle.position.set(
            (Math.random() - 0.5) * 400,
            obstacle.geometry.parameters.height / 2 + groundLevel, // Sit on the ground
            (Math.random() - 0.5) * 400
        );
        obstacle.rotation.y = Math.random() * Math.PI;
        scene.add(obstacle);
    }
}

function setupControls() {
    document.addEventListener('keydown', handleKeyDown, false);
    document.addEventListener('keyup', handleKeyUp, false);
}

function handleKeyDown(event) {
    switch (event.key.toLowerCase()) {
        case 'w': controls.pitchDown = true; break;
        case 's': controls.pitchUp = true; break;
        case 'a': controls.rollLeft = true; break;
        case 'd': controls.rollRight = true; break;
        case 'arrowup': controls.accelerate = true; break;
        case 'arrowdown': controls.decelerate = true; break;
    }
}

function handleKeyUp(event) {
    switch (event.key.toLowerCase()) {
        case 'w': controls.pitchDown = false; break;
        case 's': controls.pitchUp = false; break;
        case 'a': controls.rollLeft = false; break;
        case 'd': controls.rollRight = false; break;
        case 'arrowup': controls.accelerate = false; break;
        case 'arrowdown': controls.decelerate = false; break;
    }
}

function updateAirplane(deltaTime) {
    // --- Update Speed ---
    if (controls.accelerate) {
        speed += acceleration;
    }
    if (controls.decelerate) {
        speed -= deceleration;
    }
    // Apply some basic drag/friction
    speed *= 0.99;
    speed = Math.max(minSpeed, Math.min(maxSpeed, speed));

    // --- Update Rotation ---
    // Pitch (around X-axis - locally)
    if (controls.pitchUp) {
        airplane.rotateX(rotationSpeed);
    }
    if (controls.pitchDown) {
        airplane.rotateX(-rotationSpeed);
    }

    // Roll (around Z-axis - locally)
    if (controls.rollLeft) {
        airplane.rotateZ(rotationSpeed);
    }
    if (controls.rollRight) {
        airplane.rotateZ(-rotationSpeed);
    }

     // Apply a small amount of auto-leveling for roll (optional, helps stability)
     const rollAngle = airplane.rotation.z;
     airplane.rotateZ(-rollAngle * 0.01); // Gently return to level

    // --- Update Position ---
    // Get the airplane's forward direction vector
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(airplane.quaternion);

    // Move the airplane
    airplane.position.addScaledVector(forward, speed * deltaTime * 100); // Scale speed for noticeable movement

    // --- Ground Constraint ---
    if (airplane.position.y < groundLevel + 1) { // Add a small buffer above ground
        airplane.position.y = groundLevel + 1;
        // Optionally reduce speed on hitting ground or bounce slightly
        speed *= 0.9;
    }

    // --- Update Camera ---
    // Calculate desired camera position: behind and slightly above the plane
    const offset = new THREE.Vector3(0, 3, 12); // Camera offset in airplane's local space
    offset.applyQuaternion(airplane.quaternion); // Rotate offset to match airplane's orientation
    const desiredCameraPosition = airplane.position.clone().add(offset);

    // Smoothly move camera (Lerp)
    camera.position.lerp(desiredCameraPosition, deltaTime * 5.0);

    // Make camera look slightly ahead of the plane for smoother tracking
    const lookAtPosition = airplane.position.clone().add(forward.multiplyScalar(10)); // Look 10 units ahead
    camera.lookAt(lookAtPosition);

}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();

    updateAirplane(deltaTime);

    renderer.render(scene, camera);
}