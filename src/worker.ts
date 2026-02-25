// --- FILE: c:\github\三体\src\worker.ts ---
import { LifeCycleManager } from './LifeCycleManager';

// 定义项目环境变量
export interface Env {
  CIVILIZATION_STATE: DurableObjectNamespace;
  AI: any;
}

// 定义 Durable Object 的内部状态结构
interface CivilizationState {
  storage: DurableObjectStorage;
  env: Env;
}

// 核心 Durable Object 类：处理文明持久化与实时通讯
export class LifeCycleManagerDO implements DurableObject {
  private state: CivilizationState;
  private manager: LifeCycleManager;
  private connections: Set<WebSocket> = new Set();
  // 🚨 审计加固：解决 1101 错误的关键异步锁
  private initPromise: Promise<void> | null = null;
  // 🚨 时间流速全局变量
  private timeScale: number = 1.0; 

  constructor(state: DurableObjectState, env: Env) {
    this.state = { storage: state.storage, env };
    // 实例化你在 LifeCycleManager.ts 中编写的复杂演化逻辑
    this.manager = new LifeCycleManager(this.state, (data: any) => this.broadcast(data));
  }

  // 广播消息给所有连接的前端（如渲染器 renderer.js）
  private broadcast(data: any) {
    const message = JSON.stringify(data);
    for (const ws of this.connections) {
      try {
        ws.send(message);
      } catch (error) {
        this.connections.delete(ws);
      }
    }
  }

  // 处理进入 Durable Object 的所有流量
  async fetch(request: Request) {
    // 🚨 审计加固：确保在处理任何请求前，SQLite 存储已完成 initialize
    if (!this.initPromise) {
      this.initPromise = this.manager.initialize();
    }
    await this.initPromise;

    const url = new URL(request.url);

    // 处理WebSocket连接 
    if (url.pathname === '/ws') { 
      const { 0: client, 1: server } = new WebSocketPair(); 
      
      // 🚨 终极修复：接收并彻底激活 WebSocket 数据链路！ 
      server.accept(); 
      
      this.handleWebSocket(server); 
      return new Response(null, { 
        status: 101, 
        webSocket: client 
      }); 
    }

    // 路由 2：处理获取当前文明理智值的 API
    if (url.pathname.includes('/api/civilization')) {
      const sanity = await this.state.storage.get('sanity_index') || 100;
      return new Response(JSON.stringify({ sanity }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('LifeCycleManagerDO is active', { status: 200 });
  }

  // 管理 WebSocket 交互逻辑：接收玩家的“干预”指令
  private handleWebSocket(ws: WebSocket) {
    this.connections.add(ws);

    // 🚨 修复：只有当第一个玩家连入时，才启动计算引擎
    if (this.connections.size === 1) {
      this.manager.startLoop();
    }

    ws.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data as string);
        
        if (data.type === 'INTERVENTION') {
          // 当玩家通过 UI 点击“引力盾”或“理智灯塔”时触发
          await this.manager.handleIntervention(data.interventionType, data.power, data.timeScale);
        } else if (data.type === 'SET_TIME_SCALE') {
          // 处理时间缩放设置并更新全局变量
          this.timeScale = data.value;
          await this.manager.handleIntervention('SET_TIME_SCALE', data.value);
        }
      } catch (error) {
        console.error('WebSocket 消息处理失败:', error);
      }
    });

    // 🚨 修复：统一清理逻辑，当所有玩家退出时，必须停止引擎
    const cleanup = () => {
      this.connections.delete(ws);
      if (this.connections.size === 0) {
        this.manager.stopLoop();
      }
    };

    ws.addEventListener('close', cleanup);
    ws.addEventListener('error', cleanup);
  }
}

// Cloudflare Worker的主入口
export default {
  async fetch(request: Request, env: Env) {
    try {
      const url = new URL(request.url);

      if (url.pathname.startsWith('/api/do/') || url.pathname.includes('/ws')) {
        // 🚨 修复：严格校验 WebSocket 升级头，这是 Cloudflare 稳定连接的铁律
        if (url.pathname.includes('/ws') && request.headers.get("Upgrade") !== "websocket") {
          return new Response("Expected Upgrade: websocket", { status: 426 });
        }
        
        const id = env.CIVILIZATION_STATE.idFromName('default_trisolaris');
        const stub = env.CIVILIZATION_STATE.get(id);
        return await stub.fetch(request);
      }

      // 🚨 删除了原有的 'Three-Body Engine Active!' 拦截代码。
      // 现在，只要请求的不是 API，Cloudflare 底层会自动去 public 目录找 index.html
      return new Response('API Not Found', { status: 404 });
    } catch (err: any) {
      // 🚨 修复：增加全局兜底，确保 Worker 永不假死
      return new Response(err.message, { status: 500 });
    }
  }
};