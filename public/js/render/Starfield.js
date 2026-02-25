import * as THREE from 'three';

function createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    
    // 绘制径向渐变，中心不透明，边缘全透明
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    
    return new THREE.CanvasTexture(canvas);
}

export class Starfield {
  constructor(size = 2000, starCount = 1500) {
    this.size = size;
    this.starCount = starCount;
    this.group = new THREE.Group();
    this.createStarfield();
  }

  createStarfield() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.starCount * 3);
    const colors = new Float32Array(this.starCount * 3);
    const sizes = new Float32Array(this.starCount);

    for (let i = 0; i < this.starCount; i++) {
      // 生成球面上的随机点
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = this.size;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // 随机颜色（偏白）
      const color = new THREE.Color();
      color.setHSL(0, 0, 0.5 + Math.random() * 0.5);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      // 随机大小
      sizes[i] = 1 + Math.random() * 3;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 2, // 缩小尺寸
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      depthWrite: false, // 必须保持 false
      map: createCircleTexture() // 保留圆形遮罩
    });
    // 🚨 删除 blending: THREE.AdditiveBlending 以大幅降低 GPU 像素重绘压力

    const stars = new THREE.Points(geometry, material);
    this.group.add(stars);
  }

  update() {
    // 缓慢旋转，增加深邃感
    this.group.rotation.y += 0.0001;
  }

  getGroup() {
    return this.group;
  }

  dispose() {
    // 清理资源
    this.group.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }
}
