import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    this.bodies = new Map(); // 存储星体 { id: { mesh, trail, trailPoints } }
    this.maxTrailLength = 500;
    
    // 🚨 新增：历史虚影半径与陀螺仪偏移量
    this.maxSystemRadius = 0;
    this.ghostSphere = null;
    this.targetRotationX = 0;
    this.targetRotationY = 0;

    this.init();
    this.setupGhostSphere(); // 🚨 新增
    this.setupGyro();        // 🚨 新增
  }

  init() {
    // 创建场景
    this.scene = new THREE.Scene();

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight, // 🚨 替换这里
      0.1,
      100000
    );
    this.camera.position.set(0, 0, 300);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight); // 🚨 替换这里
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);

    // 创建控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 100;
    this.controls.maxDistance = 5000;

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
    this.scene.add(ambientLight);
  }

  // 🚨 新增：初始化历史虚影球体
  setupGhostSphere() {
    const geometry = new THREE.SphereGeometry(1, 32, 32); // 基础半径1，按比例缩放
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending
    });
    this.ghostSphere = new THREE.Mesh(geometry, material);
    // 初始状态下隐藏
    this.ghostSphere.visible = false;
    this.scene.add(this.ghostSphere);
  }

  // 🚨 新增：监听移动端陀螺仪
  setupGyro() {
    window.addEventListener('deviceorientation', (event) => {
      if (event.beta !== null && event.gamma !== null) {
        // beta: 前后倾斜 (-180 to 180), gamma: 左右倾斜 (-90 to 90)
        // 将角度转换为微小的弧度偏移，作为整个场景的旋转基准
        this.targetRotationX = THREE.MathUtils.degToRad(event.beta - 90) * 0.2;
        this.targetRotationY = THREE.MathUtils.degToRad(event.gamma) * 0.2;
      }
    });
  }

  // 🚨 新增：更新系统边界虚影
  updateSystemRadius(currentRadius) {
    if (currentRadius > this.maxSystemRadius) {
      this.maxSystemRadius = currentRadius;
      
      // 更新虚影球体的缩放比例
      this.ghostSphere.scale.set(this.maxSystemRadius, this.maxSystemRadius, this.maxSystemRadius);
      
      // 只有当半径足够大（具备观赏价值）时才显示
      if (this.maxSystemRadius > 200 && !this.ghostSphere.visible) {
        this.ghostSphere.visible = true;
      }
      
      // 越接近大撕裂边缘（假设500为红线），虚影越红越亮
      const dangerRatio = Math.min(1.0, this.maxSystemRadius / 500);
      this.ghostSphere.material.opacity = 0.05 + (dangerRatio * 0.15);
    }
  }

  addBody(id, body) {
    // 创建星体网格
    const geometry = new THREE.SphereGeometry(body.radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: body.color || 0xffffff,
      emissive: body.color || 0xffff00,
      emissiveIntensity: 0.5
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...body.position);

    // 创建尾迹 - 使用星体颜色
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.LineBasicMaterial({
      vertexColors: true, // 🚨 必须开启顶点颜色
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const trail = new THREE.Line(trailGeometry, trailMaterial);
    const trailPoints = [];

    // 添加到场景
    this.scene.add(mesh);
    this.scene.add(trail);

    // 存储星体信息
    this.bodies.set(id, {
      mesh,
      trail,
      trailPoints,
      trailMaterial
    });
  }

  updateBody(id, body) {
    const bodyData = this.bodies.get(id);
    if (!bodyData) return;
    const { mesh, trail, trailPoints } = bodyData;

    // 🚨 同步 3D 坐标
    mesh.position.set(body.position[0], body.position[1], body.position[2]);

    // 更新尾迹
    this.updateTrail(id, mesh.position, body.color || mesh.material.color.getHex());
  }

  // 新增专门更新尾迹的方法
  updateTrail(id, position, colorCode) {
    const bodyData = this.bodies.get(id);
    if (!bodyData) return;
    const { trail, trailPoints } = bodyData;

    trailPoints.push(position.x, position.y, position.z);
    if (trailPoints.length > 900) trailPoints.splice(0, 3); // 保持超长弧线

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(trailPoints, 3));

    // 🚨 重新注入渐变色计算，让尾迹随时间自然消散
    const count = trailPoints.length / 3;
    const colors = new Float32Array(trailPoints.length);
    const baseColor = new THREE.Color(colorCode);
    
    for (let i = 0; i < count; i++) {
        const ratio = i / (count - 1);
        colors[i * 3] = baseColor.r * ratio;
        colors[i * 3 + 1] = baseColor.g * ratio;
        colors[i * 3 + 2] = baseColor.b * ratio;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    if (trail.geometry) trail.geometry.dispose();
    trail.geometry = geometry;
  }

  removeBody(id) {
    const bodyData = this.bodies.get(id);
    if (!bodyData) return;

    const { mesh, trail, trailMaterial } = bodyData;

    // 从场景中移除
    this.scene.remove(mesh);
    this.scene.remove(trail);

    // 清理资源
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      mesh.material.dispose();
    }
    if (trail.geometry) {
      trail.geometry.dispose();
    }
    if (trailMaterial) {
      trailMaterial.dispose();
    }

    // 从映射中删除
    this.bodies.delete(id);
  }

  mergeBodies(id1, id2, newId, newBody) {
    // 移除旧星体
    this.removeBody(id1);
    this.removeBody(id2);

    // 添加新合并的星体
    this.addBody(newId, newBody);
  }

  clearAllBodies() {
    // 移除所有星体
    for (const id of this.bodies.keys()) {
      this.removeBody(id);
    }
  }

  render() {
    this.controls.update();
    
    // 🚨 新增：将陀螺仪的微小偏差平滑应用到场景旋转上，制造沉浸视差
    if (this.scene) {
        this.scene.rotation.x = THREE.MathUtils.lerp(this.scene.rotation.x, this.targetRotationX, 0.05);
        this.scene.rotation.y = THREE.MathUtils.lerp(this.scene.rotation.y, this.targetRotationY, 0.05);
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  addToScene(object) {
    this.scene.add(object);
  }

  removeFromScene(object) {
    this.scene.remove(object);
  }

  getScene() {
    return this.scene;
  }

  updateBodies(bodies) {
    // 🚨 新增：用于计算系统中心的变量
    let centerX = 0, centerY = 0, centerZ = 0;

    bodies.forEach(body => {
      // 累加坐标用于计算质心
      centerX += body.position[0];
      centerY += body.position[1];
      centerZ += body.position[2];

      if (!this.bodies.has(body.id)) {
        // 1. 如果实体不存在，则新增（仅在初始化时执行）
        this.addBody(body.id, body);
        
        // 2. 仅在创建第一个星体时，将相机拉远以纵观全局
        if (body.id === 1) {
          this.camera.position.set(0, 0, 300);
          this.camera.lookAt(0, 0, 0);
        }
      } else {
        // 3. 如果实体已存在，仅更新坐标和尾迹，绝不重建几何体！
        this.updateBody(body.id, body);
      }
    });

    // 🚨 新增：视角自动追踪（Focus Mode）
    if (bodies.length > 0 && this.controls) {
      centerX /= bodies.length;
      centerY /= bodies.length;
      centerZ /= bodies.length;

      // 使用 lerp 实现平滑追踪，避免镜头疯狂抖动
      const targetCenter = new THREE.Vector3(centerX, centerY, centerZ);
      this.controls.target.lerp(targetCenter, 0.05);
    }
  }

  getCamera() {
    return this.camera;
  }

  getRenderer() {
    return this.renderer;
  }

  getControls() {
    return this.controls;
  }

  dispose() {
    // 清理所有星体
    this.clearAllBodies();

    // 清理控制器
    if (this.controls) {
      this.controls.dispose();
    }

    // 清理渲染器
    if (this.renderer) {
      this.renderer.dispose();
    }

    // 从 DOM 中移除画布
    if (this.renderer && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
