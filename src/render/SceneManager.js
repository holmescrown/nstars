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

    this.init();
  }

  init() {
    // 创建场景
    this.scene = new THREE.Scene();

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      100000
    );
    this.camera.position.set(0, 1000, 2000);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.container.appendChild(this.renderer.domElement);

    // 创建控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 500;
    this.controls.maxDistance = 50000;

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
    this.scene.add(ambientLight);
  }

  addBody(id, body) {
    // 创建星体网格
    const geometry = new THREE.SphereGeometry(body.radius, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      emissive: 0xffff00,
      emissiveIntensity: 0.5
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...body.position);

    // 创建尾迹
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.LineBasicMaterial({
      color: 0xffff88,
      transparent: true,
      opacity: 0.6
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
      trailPoints
    });
  }

  updateBody(id, body) {
    const bodyData = this.bodies.get(id);
    if (!bodyData) return;

    const { mesh, trail, trailPoints } = bodyData;

    // 更新位置
    mesh.position.set(...body.position);

    // 更新尾迹
    trailPoints.push(...body.position);
    if (trailPoints.length > this.maxTrailLength * 3) {
      trailPoints.splice(0, 3);
    }

    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(trailPoints, 3));
    
    // 清理旧的几何体
    if (trail.geometry) {
      trail.geometry.dispose();
    }
    
    trail.geometry = trailGeometry;
  }

  removeBody(id) {
    const bodyData = this.bodies.get(id);
    if (!bodyData) return;

    const { mesh, trail } = bodyData;

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
    if (trail.material) {
      trail.material.dispose();
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
