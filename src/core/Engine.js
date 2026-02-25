import * as THREE from 'three';
import { SceneManager } from '../render/SceneManager.js';
import { PostProcessor } from '../render/PostProcessor.js';
import { Starfield } from '../render/Starfield.js';
import { UIManager } from '../ui/UIManager.js';
import { StateSerializer } from '../utils/StateSerializer.js';

export class Engine {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;

    // 组件
    this.sceneManager = null;
    this.postProcessor = null;
    this.starfield = null;
    this.uiManager = null;
    
    // 物理引擎
    this.worker = null;
    this.bodies = new Map();
    this.lastPhysicsUpdate = 0;
    
    // 动画
    this.animationId = null;
    this.lastTime = 0;
    this.isRunning = false;

    this.init();
  }

  init() {
    // 初始化场景管理器
    this.sceneManager = new SceneManager(this.container);

    // 初始化后期处理器
    this.postProcessor = new PostProcessor(
      this.sceneManager.getRenderer(),
      this.sceneManager.getScene(),
      this.sceneManager.getCamera()
    );

    // 初始化星空背景
    this.starfield = new Starfield();
    this.sceneManager.addToScene(this.starfield.getGroup());

    // 初始化 UI 管理器
    this.uiManager = new UIManager();
    this.uiManager.setCallbacks({
      onStart: () => this.startSimulation(),
      onShare: () => this.shareCivilization(),
      onDimensionalCollapse: () => this.triggerDimensionalCollapse(),
      onReset: () => this.resetSimulation()
    });

    // 初始化物理 Worker
    this.initWorker();

    // 初始化事件监听
    this.initEventListeners();

    // 尝试从 URL 加载状态
    this.loadStateFromUrl();
  }

  initWorker() {
    // 使用独立的 worker.js 文件
    this.worker = new Worker('./src/physics/worker.js');

    this.worker.addEventListener('message', (event) => {
      this.handleWorkerMessage(event.data);
    });

    // 初始化 Worker 状态
    const initialBodies = this.createInitialBodies();
    this.worker.postMessage({
      type: 'INIT',
      payload: { bodies: initialBodies }
    });

    // 存储初始星体
    initialBodies.forEach((body, index) => {
      this.bodies.set(index, body);
      this.sceneManager.addBody(index, body);
    });
  }

  createInitialBodies() {
    // 创建三个初始星体
    return [
      {
        mass: 1.989e30, // 太阳质量
        radius: 696340, // 太阳半径
        position: [-1500000, 0, 0],
        velocity: [0, 0, -10]
      },
      {
        mass: 1.989e30,
        radius: 696340,
        position: [1500000, 0, 0],
        velocity: [0, 0, 10]
      },
      {
        mass: 1.989e30,
        radius: 696340,
        position: [0, 1500000, 0],
        velocity: [10, 0, 0]
      }
    ];
  }

  handleWorkerMessage(data) {
    switch (data.type) {
      case 'INITIALIZED':
        console.log('物理引擎初始化完成');
        break;
      
      case 'PHYSICS_UPDATE':
        this.updateBodies(data.payload.bodies);
        this.lastPhysicsUpdate = performance.now();
        break;
      
      case 'COLLISION':
        console.log('发生星体碰撞');
        this.updateBodies(data.payload.bodies);
        // 生成文明灭绝报告
        this.generateExtinctionReport();
        break;
    }
  }

  updateBodies(newBodies) {
    // 清除旧星体
    for (const id of this.bodies.keys()) {
      this.sceneManager.removeBody(id);
    }
    this.bodies.clear();

    // 添加新星体
    newBodies.forEach((body, index) => {
      this.bodies.set(index, body);
      this.sceneManager.addBody(index, body);
    });
  }

  startSimulation() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now();
      this.worker.postMessage({ type: 'START' });
      this.animate();
      this.uiManager.showMessage('模拟开始', 'info');
    }
  }

  stopSimulation() {
    if (this.isRunning) {
      this.isRunning = false;
      this.worker.postMessage({ type: 'STOP' });
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      this.uiManager.showMessage('模拟停止', 'info');
    }
  }

  resetSimulation() {
    this.stopSimulation();
    
    // 重置物理状态
    const initialBodies = this.createInitialBodies();
    this.worker.postMessage({
      type: 'RESET',
      payload: { bodies: initialBodies }
    });

    // 重置渲染状态
    for (const id of this.bodies.keys()) {
      this.sceneManager.removeBody(id);
    }
    this.bodies.clear();

    initialBodies.forEach((body, index) => {
      this.bodies.set(index, body);
      this.sceneManager.addBody(index, body);
    });

    this.uiManager.showMessage('模拟重置', 'info');
  }

  animate() {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // 航位推测 (Dead Reckoning)
    this.predictPositions(dt);

    // 更新星空
    this.starfield.update();

    // 更新场景
    this.sceneManager.getControls().update();

    // 渲染
    this.postProcessor.render(
      this.sceneManager.getScene(),
      this.sceneManager.getCamera()
    );

    // 更新 UI
    this.updateUI();

    // 继续动画循环
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  predictPositions(dt) {
    // 根据速度预测位置
    for (const [id, body] of this.bodies.entries()) {
      // 创建临时位置向量用于预测
      const predictedPosition = new THREE.Vector3(
        ...body.position
      ).addScaledVector(
        new THREE.Vector3(...body.velocity),
        dt
      );

      // 更新渲染
      this.sceneManager.updateBody(id, {
        ...body,
        position: [predictedPosition.x, predictedPosition.y, predictedPosition.z]
      });
    }
  }

  updateUI() {
    // 计算纪元和温度（示例值）
    const era = `宇宙纪元 ${Math.floor(Date.now() / 10000)}`;
    const temperature = 2.73 + Math.sin(Date.now() / 10000) * 0.1;

    this.uiManager.updateStatus(era, temperature);
  }

  shareCivilization() {
    // 编码当前状态到 URL
    const bodiesArray = Array.from(this.bodies.values());
    StateSerializer.encodeToUrl(bodiesArray);

    // 复制 URL 到剪贴板
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        this.uiManager.showMessage('文明坐标已复制到剪贴板', 'info');
      })
      .catch(err => {
        this.uiManager.showMessage('复制失败，请手动复制 URL', 'error');
        console.error('剪贴板复制失败:', err);
      });
  }

  triggerDimensionalCollapse() {
    // 触发二向箔打击（示例实现）
    this.uiManager.showMessage('二向箔打击已触发', 'warning');
    // 这里可以添加二向箔的视觉效果
  }

  async generateExtinctionReport() {
    try {
      // 调用后端 API 生成文明灭绝报告
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'extinction',
          params: {
            speciesCode: 'Morpho-Alpha-' + Math.floor(Math.random() * 1000),
            epoch: Math.floor(Math.random() * 20000),
            traits: ['高度晶化表皮', '无意识神经簇'],
            extinctionReason: '轨道坠落',
            sanityIndex: Math.random() * 30
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.uiManager.showMessage(data.report, 'warning');
      } else {
        console.error('生成报告失败:', response.status);
      }
    } catch (error) {
      console.error('API 调用失败:', error);
    }
  }

  loadStateFromUrl() {
    const bodies = StateSerializer.decodeFromUrl();
    if (bodies && bodies.length > 0) {
      // 加载从 URL 解码的状态
      this.worker.postMessage({
        type: 'RESET',
        payload: { bodies }
      });

      // 更新渲染状态
      for (const id of this.bodies.keys()) {
        this.sceneManager.removeBody(id);
      }
      this.bodies.clear();

      bodies.forEach((body, index) => {
        this.bodies.set(index, body);
        this.sceneManager.addBody(index, body);
      });

      this.uiManager.showMessage('已加载文明坐标', 'info');
    }
  }

  initEventListeners() {
    // 窗口大小变化
    window.addEventListener('resize', () => this.handleResize());
  }

  handleResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.sceneManager.resize(width, height);
    this.postProcessor.resize(width, height);
  }

  dispose() {
    // 停止动画
    this.stopSimulation();

    // 终止 Worker
    if (this.worker) {
      this.worker.terminate();
    }

    // 清理场景
    this.starfield.dispose();
    this.postProcessor.dispose();
    this.sceneManager.dispose();
  }
}
