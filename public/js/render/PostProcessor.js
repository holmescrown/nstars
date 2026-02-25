import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export class PostProcessor {
  constructor(renderer, scene, camera, options = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    
    // 泛光参数
    this.options = {
      threshold: options.threshold || 0.1,
      strength: options.strength || 1.5,
      radius: options.radius || 0.5,
      ...options
    };

    this.composer = null;
    this.renderPass = null;
    this.bloomPass = null;

    this.init();
  }

  init() {
    const size = this.renderer.getSize(new THREE.Vector2());
    const pixelRatio = Math.min(window.devicePixelRatio, 2);

    // 创建 EffectComposer
    this.composer = new EffectComposer(this.renderer);

    // 创建渲染通道
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // 创建泛光通道
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      this.options.strength,
      this.options.radius,
      this.options.threshold
    );
    this.composer.addPass(this.bloomPass);

    // 设置像素比
    this.composer.setPixelRatio(pixelRatio);
  }

  resize(width, height) {
    this.composer.setSize(width, height);
  }

  render(scene, camera) {
    this.composer.render();
  }

  updateOptions(options) {
    this.options = {
      ...this.options,
      ...options
    };

    if (this.bloomPass) {
      this.bloomPass.threshold = this.options.threshold;
      this.bloomPass.strength = this.options.strength;
      this.bloomPass.radius = this.options.radius;
    }
  }

  dispose() {
    if (this.composer) {
      this.composer.dispose();
    }
  }
}
