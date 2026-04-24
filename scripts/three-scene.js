/* ============================================================
   BioLab — Three.js 3D DNA Helix
   Rotating phosphor-glow double helix with mouse parallax
   ============================================================ */

(function () {
  const container = document.getElementById('threeContainer');
  if (!container || typeof THREE === 'undefined') return;

  let scene, camera, renderer;
  let helixGroup;
  let mouseX = 0, mouseY = 0;
  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;

  function init() {
    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    // Renderer
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Create DNA helix
    createHelix();

    // Events
    window.addEventListener('resize', onResize);
    document.addEventListener('mousemove', onMouseMove);

    // Animate
    animate();
  }

  function createHelix() {
    helixGroup = new THREE.Group();

    const helixParams = {
      turns: 4,
      pointsPerTurn: 30,
      radius: 4,
      height: 40,
      baseRadius: 0.15,
      bondRadius: 0.06,
    };

    const totalPoints = helixParams.turns * helixParams.pointsPerTurn;

    // Colors
    const emerald = new THREE.Color(0x00D4AA);
    const cyan = new THREE.Color(0x00BCD4);
    const purple = new THREE.Color(0x7C4DFF);
    const pink = new THREE.Color(0xE040FB);

    // Strand 1 material
    const strandMat1 = new THREE.MeshBasicMaterial({
      color: emerald,
      transparent: true,
      opacity: 0.7,
    });

    // Strand 2 material
    const strandMat2 = new THREE.MeshBasicMaterial({
      color: purple,
      transparent: true,
      opacity: 0.7,
    });

    // Bond material
    const bondMat = new THREE.MeshBasicMaterial({
      color: cyan,
      transparent: true,
      opacity: 0.3,
    });

    const sphereGeo = new THREE.SphereGeometry(helixParams.baseRadius, 8, 8);
    const bondGeo = new THREE.CylinderGeometry(helixParams.bondRadius, helixParams.bondRadius, 1, 4);

    for (let i = 0; i < totalPoints; i++) {
      const t = i / totalPoints;
      const angle = t * helixParams.turns * Math.PI * 2;
      const y = (t - 0.5) * helixParams.height;

      // Strand 1
      const x1 = Math.cos(angle) * helixParams.radius;
      const z1 = Math.sin(angle) * helixParams.radius;

      // Strand 2 (offset by PI)
      const x2 = Math.cos(angle + Math.PI) * helixParams.radius;
      const z2 = Math.sin(angle + Math.PI) * helixParams.radius;

      // Nucleotide spheres
      const sphere1 = new THREE.Mesh(sphereGeo, strandMat1);
      sphere1.position.set(x1, y, z1);
      helixGroup.add(sphere1);

      const sphere2 = new THREE.Mesh(sphereGeo, strandMat2);
      sphere2.position.set(x2, y, z2);
      helixGroup.add(sphere2);

      // Bonds (every 3rd point)
      if (i % 3 === 0) {
        const dx = x2 - x1;
        const dy2 = 0;
        const dz = z2 - z1;
        const length = Math.sqrt(dx * dx + dz * dz);

        const bond = new THREE.Mesh(bondGeo, bondMat);
        bond.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
        bond.scale.y = length;
        bond.rotation.z = Math.PI / 2;
        bond.rotation.y = -angle;
        helixGroup.add(bond);
      }
    }

    // Center and add glow points
    const glowGeo = new THREE.SphereGeometry(0.4, 6, 6);
    const glowMat = new THREE.MeshBasicMaterial({
      color: emerald,
      transparent: true,
      opacity: 0.15,
    });

    for (let i = 0; i < 20; i++) {
      const glow = new THREE.Mesh(glowGeo, glowMat.clone());
      glow.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 20
      );
      glow.userData.floatSpeed = Math.random() * 0.01 + 0.005;
      glow.userData.floatOffset = Math.random() * Math.PI * 2;
      helixGroup.add(glow);
    }

    // Position helix to the right side
    helixGroup.position.x = 10;
    helixGroup.rotation.z = 0.3;
    scene.add(helixGroup);
  }

  function onResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onMouseMove(e) {
    mouseX = (e.clientX - windowHalfX) / windowHalfX;
    mouseY = (e.clientY - windowHalfY) / windowHalfY;
  }

  function animate() {
    requestAnimationFrame(animate);

    if (helixGroup) {
      // Auto rotation
      helixGroup.rotation.y += 0.003;

      // Mouse parallax (gentle)
      helixGroup.rotation.x += (mouseY * 0.2 - helixGroup.rotation.x) * 0.02;
      helixGroup.position.x += (10 + mouseX * 2 - helixGroup.position.x) * 0.02;

      // Float glow particles
      const time = Date.now() * 0.001;
      helixGroup.children.forEach(child => {
        if (child.userData.floatSpeed) {
          child.position.y += Math.sin(time * child.userData.floatSpeed * 100 + child.userData.floatOffset) * 0.01;
        }
      });
    }

    renderer.render(scene, camera);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // Small delay to let Three.js load
    setTimeout(init, 100);
  }
})();
