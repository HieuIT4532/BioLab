/* ============================================================
   BioLab — Cell Explorer 3D
   Three.js interactive cell models with organelle highlighting
   ============================================================ */

(function () {
  const canvas = document.getElementById('cellCanvas');
  const viewport = document.getElementById('cellViewport');
  if (!canvas || !viewport || typeof THREE === 'undefined') return;

  let scene, camera, renderer, controls;
  let cellGroup = null;
  let autoRotate = true;
  let currentCell = 'animal';
  let organelleMeshes = {};

  // ── Cell Data ──
  const CELL_DATA = {
    animal: {
      label: '🧫 Tế Bào Động Vật',
      color: 0x00D4AA,
      organelles: [
        { name: 'Nhân tế bào', latin: 'Nucleus', color: '#7C4DFF', desc: 'Trung tâm điều khiển, chứa DNA mang thông tin di truyền. Nhân được bao bọc bởi màng nhân có lỗ nhân cho phép RNA đi ra.', size: 1.8, pos: [0, 0, 0] },
        { name: 'Ty thể', latin: 'Mitochondria', color: '#FF5252', desc: 'Nhà máy năng lượng của tế bào — thực hiện hô hấp tế bào, chuyển hóa glucose thành ATP. Có DNA riêng!', size: 0.6, pos: [2.5, 1, 0.5] },
        { name: 'Lưới nội chất trơn', latin: 'Smooth ER', color: '#FFD740', desc: 'Tổng hợp lipid, chuyển hóa carbohydrate, giải độc thuốc và chất hóa học.', size: 0.5, pos: [-2, -1, 1] },
        { name: 'Lưới nội chất hạt', latin: 'Rough ER', color: '#FF9800', desc: 'Gắn ribosome trên bề mặt — tổng hợp protein. Protein được đóng gói và vận chuyển tới bộ Golgi.', size: 0.5, pos: [-1.5, 1.5, -0.5] },
        { name: 'Bộ Golgi', latin: 'Golgi Apparatus', color: '#00BCD4', desc: 'Bưu điện tế bào — đóng gói, chế biến và phân phối protein/lipid tới đích đến đúng trong hoặc ngoài tế bào.', size: 0.7, pos: [1.5, -1.5, -1] },
        { name: 'Ribosome', latin: 'Ribosome', color: '#E040FB', desc: 'Máy dịch mã — đọc mRNA và lắp ráp amino acid thành chuỗi polypeptide (protein). Có thể tự do hoặc gắn trên RER.', size: 0.25, pos: [0.5, 2, 1.5] },
        { name: 'Lysosome', latin: 'Lysosome', color: '#00E676', desc: 'Hệ tiêu hóa tế bào — chứa enzyme phân giải chất thải, vi khuẩn xâm nhập, bào quan hỏng.', size: 0.45, pos: [-2.5, 0.5, -1.5] },
        { name: 'Màng sinh chất', latin: 'Cell Membrane', color: '#40C4FF', desc: 'Hàng rào bảo vệ linh hoạt — mô hình khảm lỏng phospholipid kép, kiểm soát chất ra/vào tế bào.', size: 4.5, pos: [0, 0, 0], isMembrane: true },
      ]
    },
    plant: {
      label: '🌱 Tế Bào Thực Vật',
      color: 0x4CAF50,
      organelles: [
        { name: 'Nhân tế bào', latin: 'Nucleus', color: '#7C4DFF', desc: 'Giống tế bào động vật — chứa DNA, điều khiển mọi hoạt động sống.', size: 1.6, pos: [0.5, 0, 0] },
        { name: 'Lục lạp', latin: 'Chloroplast', color: '#4CAF50', desc: 'Bào quan ĐẶC TRƯNG thực vật — thực hiện quang hợp, chuyển CO₂ + H₂O + ánh sáng → C₆H₁₂O₆ + O₂. Chứa diệp lục (chlorophyll).', size: 0.8, pos: [-2, 1, 0.5] },
        { name: 'Không bào lớn', latin: 'Central Vacuole', color: '#81D4FA', desc: 'Chiếm tới 90% thể tích tế bào! Dự trữ nước, ion, chất dinh dưỡng. Duy trì áp suất thẩm thấu (sức trương).', size: 2.5, pos: [-0.5, -0.3, 0] },
        { name: 'Thành tế bào', latin: 'Cell Wall', color: '#8D6E63', desc: 'Lớp bảo vệ cứng bên ngoài màng — cellulose. Giữ hình dạng, bảo vệ, và cho phép trao đổi chất qua cầu liên bào.', size: 5, pos: [0, 0, 0], isWall: true },
        { name: 'Ty thể', latin: 'Mitochondria', color: '#FF5252', desc: 'Nhà máy năng lượng — hô hấp tế bào tạo ATP. Thực vật VẪN CẦN ty thể dù có lục lạp!', size: 0.5, pos: [2, -1, 1] },
        { name: 'Bộ Golgi', latin: 'Golgi Apparatus', color: '#00BCD4', desc: 'Đóng gói và vận chuyển protein, đặc biệt tổng hợp polysaccharide cho thành tế bào.', size: 0.6, pos: [2, 1.5, -0.5] },
        { name: 'Màng sinh chất', latin: 'Cell Membrane', color: '#40C4FF', desc: 'Nằm bên trong thành tế bào — kiểm soát vận chuyển chất. Mô hình khảm lỏng.', size: 4.6, pos: [0, 0, 0], isMembrane: true },
      ]
    },
    bacteria: {
      label: '🦠 Vi Khuẩn (Prokaryote)',
      color: 0xE040FB,
      organelles: [
        { name: 'Vùng nhân', latin: 'Nucleoid', color: '#FFD740', desc: 'KHÔNG CÓ MÀNG NHÂN — DNA vòng nằm lơ lửng trong tế bào chất. Đây là điểm khác biệt lớn nhất với Eukaryote!', size: 1, pos: [0, 0, 0] },
        { name: 'Plasmid', latin: 'Plasmid', color: '#FF4081', desc: 'DNA vòng nhỏ ngoài nhiễm sắc thể — mang gene kháng kháng sinh. Có thể truyền ngang giữa vi khuẩn (biến nạp, tiếp hợp).', size: 0.3, pos: [1.2, 0.8, 0] },
        { name: 'Ribosome 70S', latin: 'Ribosome 70S', color: '#E040FB', desc: 'Nhỏ hơn ribosome eukaryote (80S). Đây là mục tiêu của nhiều kháng sinh (streptomycin, tetracycline).', size: 0.2, pos: [-0.8, -0.5, 0.5] },
        { name: 'Thành tế bào', latin: 'Cell Wall', color: '#8D6E63', desc: 'Peptidoglycan — khác với cellulose ở thực vật. Gram+ có thành dày, Gram- có thành mỏng + màng ngoài.', size: 3.5, pos: [0, 0, 0], isWall: true },
        { name: 'Lông roi', latin: 'Flagellum', color: '#00E676', desc: 'Cơ quan vận động — motor protein quay 100-1000 vòng/phút, giúp vi khuẩn di chuyển hướng hóa chất (chemotaxis).', size: 0.15, pos: [3, 0, 0], isFlagellum: true },
        { name: 'Pili', latin: 'Pili/Fimbriae', color: '#00BCD4', desc: 'Sợi protein ngắn trên bề mặt — giúp vi khuẩn bám vào bề mặt hoặc truyền DNA (sex pilus) khi tiếp hợp.', size: 0.1, pos: [0, 2, 1] },
        { name: 'Màng sinh chất', latin: 'Cell Membrane', color: '#40C4FF', desc: 'Lớp phospholipid kép — thực hiện hô hấp tế bào (vì VK không có ty thể!).', size: 3.2, pos: [0, 0, 0], isMembrane: true },
      ]
    }
  };

  function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0A0E27);

    // Camera
    camera = new THREE.PerspectiveCamera(50, viewport.clientWidth / viewport.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 12);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Controls
    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 25;
    controls.minDistance = 5;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const point = new THREE.PointLight(0x00D4AA, 1, 50);
    point.position.set(10, 10, 10);
    scene.add(point);

    const point2 = new THREE.PointLight(0x7C4DFF, 0.5, 50);
    point2.position.set(-10, -5, 5);
    scene.add(point2);

    // Build initial cell
    buildCell('animal');

    // Events
    window.addEventListener('resize', onResize);
    setupUI();

    // Animate
    animate();
  }

  function buildCell(type) {
    // Remove old
    if (cellGroup) {
      scene.remove(cellGroup);
      cellGroup = null;
    }
    organelleMeshes = {};

    cellGroup = new THREE.Group();
    const data = CELL_DATA[type];

    // Update label
    const label = document.getElementById('viewportLabel');
    if (label) label.textContent = data.label;

    // Build organelles
    data.organelles.forEach((org, i) => {
      let mesh;
      const color = new THREE.Color(org.color);

      if (org.isMembrane) {
        // Transparent sphere for membrane
        const geo = new THREE.SphereGeometry(org.size, 32, 32);
        const mat = new THREE.MeshPhongMaterial({
          color: color,
          transparent: true,
          opacity: 0.12,
          side: THREE.DoubleSide,
          wireframe: false,
        });
        mesh = new THREE.Mesh(geo, mat);
        // Add wireframe overlay
        const wireGeo = new THREE.SphereGeometry(org.size + 0.02, 24, 24);
        const wireMat = new THREE.MeshBasicMaterial({ color: color, wireframe: true, transparent: true, opacity: 0.08 });
        const wire = new THREE.Mesh(wireGeo, wireMat);
        cellGroup.add(wire);
      } else if (org.isWall) {
        // Box-like wall for plant/bacteria
        const geo = type === 'bacteria'
          ? new THREE.CapsuleGeometry(org.size * 0.6, org.size * 0.8, 16, 24)
          : new THREE.BoxGeometry(org.size, org.size, org.size, 4, 4, 4);
        const mat = new THREE.MeshPhongMaterial({
          color: color,
          transparent: true,
          opacity: 0.08,
          side: THREE.DoubleSide,
        });
        mesh = new THREE.Mesh(geo, mat);
        const wireGeo = type === 'bacteria'
          ? new THREE.CapsuleGeometry(org.size * 0.6 + 0.02, org.size * 0.8 + 0.02, 8, 16)
          : new THREE.BoxGeometry(org.size + 0.04, org.size + 0.04, org.size + 0.04, 4, 4, 4);
        const wireMat = new THREE.MeshBasicMaterial({ color: color, wireframe: true, transparent: true, opacity: 0.1 });
        cellGroup.add(new THREE.Mesh(wireGeo, wireMat));
      } else if (org.isFlagellum) {
        // Curved line for flagellum
        const points = [];
        for (let t = 0; t < 30; t++) {
          const x = org.pos[0] + t * 0.15;
          const y = org.pos[1] + Math.sin(t * 0.5) * 0.4;
          const z = org.pos[2] + Math.cos(t * 0.5) * 0.2;
          points.push(new THREE.Vector3(x, y, z));
        }
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeo = new THREE.TubeGeometry(curve, 30, 0.05, 6, false);
        const tubeMat = new THREE.MeshPhongMaterial({ color: color, emissive: color, emissiveIntensity: 0.3 });
        mesh = new THREE.Mesh(tubeGeo, tubeMat);
      } else {
        // Standard sphere organelle
        const geo = new THREE.SphereGeometry(org.size, 16, 16);
        const mat = new THREE.MeshPhongMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 0.15,
          transparent: true,
          opacity: 0.85,
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(...org.pos);
      }

      if (mesh && !org.isFlagellum) {
        mesh.position.set(...org.pos);
      }

      if (mesh) {
        mesh.userData = { orgIndex: i, orgName: org.name };
        cellGroup.add(mesh);
        organelleMeshes[org.name] = mesh;
      }
    });

    scene.add(cellGroup);

    // Build organelle list UI
    buildOrganelleList(type);
  }

  function buildOrganelleList(type) {
    const list = document.getElementById('organelleList');
    const data = CELL_DATA[type];
    list.innerHTML = '';

    data.organelles.forEach((org, i) => {
      const item = document.createElement('div');
      item.className = 'organelle-item';
      item.innerHTML = `
        <span class="organelle-dot" style="background:${org.color}"></span>
        <span>${org.name}</span>
      `;
      item.addEventListener('click', () => highlightOrganelle(type, i));
      list.appendChild(item);
    });
  }

  function highlightOrganelle(type, index) {
    const data = CELL_DATA[type];
    const org = data.organelles[index];

    // Update detail panel
    const detail = document.getElementById('organelleDetail');
    const title = document.getElementById('detailTitle');
    const desc = document.getElementById('detailDesc');
    detail.classList.add('visible');
    title.textContent = `${org.name} (${org.latin})`;
    desc.textContent = org.desc;

    // Highlight in list
    document.querySelectorAll('.organelle-item').forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });

    // Flash the organelle in 3D
    const mesh = organelleMeshes[org.name];
    if (mesh && mesh.material) {
      const origOpacity = mesh.material.opacity;
      mesh.material.opacity = 1;
      mesh.material.emissiveIntensity = 0.8;
      setTimeout(() => {
        mesh.material.opacity = origOpacity;
        mesh.material.emissiveIntensity = 0.15;
      }, 800);
    }
  }

  function setupUI() {
    // Cell type buttons
    document.querySelectorAll('.cell-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.cell;
        currentCell = type;
        document.querySelectorAll('.cell-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        buildCell(type);
      });
    });

    // Controls
    document.getElementById('btnRotate')?.addEventListener('click', () => {
      autoRotate = !autoRotate;
    });

    document.getElementById('btnZoomIn')?.addEventListener('click', () => {
      camera.position.z = Math.max(camera.position.z - 2, 5);
    });

    document.getElementById('btnZoomOut')?.addEventListener('click', () => {
      camera.position.z = Math.min(camera.position.z + 2, 25);
    });

    document.getElementById('btnReset')?.addEventListener('click', () => {
      camera.position.set(0, 0, 12);
      controls.reset();
    });

    // Raycaster for clicking organelles
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (cellGroup) {
        const intersects = raycaster.intersectObjects(cellGroup.children, false);
        if (intersects.length > 0) {
          const hit = intersects[0].object;
          if (hit.userData.orgIndex !== undefined) {
            highlightOrganelle(currentCell, hit.userData.orgIndex);
          }
        }
      }
    });
  }

  function onResize() {
    camera.aspect = viewport.clientWidth / viewport.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
  }

  function animate() {
    requestAnimationFrame(animate);

    if (autoRotate && cellGroup) {
      cellGroup.rotation.y += 0.003;
    }

    controls.update();
    renderer.render(scene, camera);
  }

  // Wait for THREE and OrbitControls
  function waitAndInit() {
    if (typeof THREE !== 'undefined' && typeof THREE.OrbitControls !== 'undefined') {
      init();
    } else {
      setTimeout(waitAndInit, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitAndInit);
  } else {
    waitAndInit();
  }
})();
