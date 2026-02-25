// WebGPU 渲染器
class WebGPURenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.device = null;
    this.context = null;
    this.pipeline = null;
    this.starTrails = [];
    this.maxTrailLength = 100;

    this.init();
  }

  async init() {
    // 初始化 WebGPU
    if (!navigator.gpu) {
      throw new Error("WebGPU is not supported");
    }

    this.context = this.canvas.getContext("webgpu");
    const adapter = await navigator.gpu.requestAdapter();
    this.device = await adapter.requestDevice();

    // 配置画布
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: presentationFormat,
      alphaMode: "premultiplied"
    });

    // 初始化渲染管道
    this.initPipeline(presentationFormat);
  }

  initPipeline(format) {
    // 这里可以实现完整的 WebGPU 渲染管道
    // 包括顶点着色器、片段着色器等
    console.log("Initializing WebGPU pipeline");
  }

  // 绘制引力势阱网格
  drawGravityGrid(masses) {
    // 实现引力势阱网格绘制
    console.log("Drawing gravity grid for masses:", masses);
  }

  // 更新恒星发光粒子拖尾
  updateStarTrails(positions) {
    // 更新拖尾数据
    this.starTrails = positions.map((pos, index) => {
      const trail = this.starTrails[index] || [];
      trail.push({ x: pos.x, y: pos.y });
      if (trail.length > this.maxTrailLength) {
        trail.shift();
      }
      return trail;
    });

    // 绘制拖尾
    console.log("Updating star trails:", this.starTrails);
  }

  // 根据理智值应用色调分级
  applyColorGrade(sanity) {
    // 高理智为蓝绿色（秩序），低理智为猩红色（混沌）
    let color;
    if (sanity > 70) {
      // 秩序：蓝绿色
      color = { r: 0.2, g: 0.8, b: 0.6 };
    } else if (sanity > 30) {
      // 过渡：黄色
      color = { r: 0.8, g: 0.6, b: 0.2 };
    } else {
      // 混沌：猩红色
      color = { r: 0.8, g: 0.2, b: 0.2 };
    }

    // 应用色调
    console.log("Applying color grade based on sanity:", sanity, color);
  }

  // 渲染一帧
  async renderFrame(physicsData) {
    if (!this.device) return;

    // 绘制引力势阱网格
    this.drawGravityGrid(physicsData.masses);

    // 绘制恒星发光粒子拖尾
    this.updateStarTrails(physicsData.positions);

    // 动态光效：根据理智值调整整体色调
    this.applyColorGrade(physicsData.sanity);

    // 实现完整的 WebGPU 渲染逻辑
    console.log("Rendering frame with physics data:", physicsData);
  }
}

// 初始化渲染器
let renderer;
async function initRenderer() {
  const canvas = document.getElementById("simulationCanvas");
  if (canvas) {
    renderer = new WebGPURenderer(canvas);
    await renderer.init();
  }
}

// 处理 WebSocket 消息
function handleWebSocketMessage(event) {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case "PHYSICS_UPDATE":
      if (renderer) {
        const physicsData = {
          masses: data.state.bodies.map(body => body.mass),
          positions: data.state.bodies.map(body => ({ x: body.x, y: body.y })),
          sanity: 100 // 默认值，等待 SOCIAL_UPDATE
        };
        renderer.renderFrame(physicsData);
      }
      break;
    
    case "SOCIAL_UPDATE":
      if (renderer) {
        // 更新理智值
        console.log("Received social update:", data);
      }
      break;
  }
}

// 连接 WebSocket
function connectWebSocket() {
  const ws = new WebSocket("wss://your-durable-object-url");
  
  ws.onopen = () => {
    console.log("WebSocket connected");
  };
  
  ws.onmessage = handleWebSocketMessage;
  
  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };
  
  ws.onclose = () => {
    console.log("WebSocket closed");
    // 尝试重连
    setTimeout(connectWebSocket, 5000);
  };
}

// 启动应用
async function startApp() {
  await initRenderer();
  connectWebSocket();
}

// 页面加载完成后启动
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
