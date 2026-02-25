// --- FILE: c:\github\三体\src\LifeCycleManager.ts ---
import { calculateTernaryPhysics } from "./wasm_physics_engine";
import { AICivilizationReporter } from "./AICivilizationReporter";

export class LifeCycleManager {
  private planetaryState = {
    bodies: [
      { mass: 1.0, x: 0, y: 0, z: 40, vx: 0, vy: 0, vz: 0.2 },
      { mass: 1.0, x: 100, y: 0, z: -40, vx: 0, vy: 0.5, vz: -0.1 },
      { mass: 1.0, x: -50, y: 86.6, z: 10, vx: -0.433, vy: -0.25, vz: 0.15 }
    ],
    planet: { x: 50, y: 50, vx: 0.1, vy: 0.1 },
    epoch: "Order_Plateau",
    timeScale: 1.0
  };

  private state: any;
  private broadcast: (data: any) => void;
  private aiReporter: AICivilizationReporter;
  private civilizations: Map<string, Civilization> = new Map();
  
  // 🚨 新增：用于控制物理循环的定时器指针
  private loopTimer: any = null;

  constructor(state: any, broadcast: (data: any) => void) {
    this.state = state;
    this.broadcast = broadcast;
    this.aiReporter = new AICivilizationReporter(state.env.AI);
  }

  async onTick() {
    try {
      // 1. 每秒更新 10 次物理轨道
      const nextState = calculateTernaryPhysics(this.planetaryState);
      
      // 2. 环境判定：计算行星到三颗恒星的距离与辐射强度
      const chaosLevel = this.calculateChaosLevel(nextState);
      
      // 3. 触发“形态相变”或“理智波动”
      await this.updateCivilizationVitals(chaosLevel);
      
      // 4. 广播数据
      this.broadcast({ type: "PHYSICS_UPDATE", state: nextState, timeScale: this.planetaryState.timeScale });
    } catch (error) {
      console.error("[Engine Error] 物理帧计算崩溃，已被成功拦截保护:", error);
    }
  }

  // 🚨 新增：动态计算三体系统的混沌程度
  private calculateChaosLevel(state: any): number {
    const bodies = state.bodies;
    let totalVelocity = 0;
    bodies.forEach((b: any) => totalVelocity += Math.sqrt(b.vx * b.vx + b.vy * b.vy + Math.pow((b.vz || 0), 2)));
    const avgVelocity = totalVelocity / bodies.length;
    
    // 速度越高、系统半径越大，混沌指数越高（乱纪元）
    const chaosIndex = (avgVelocity * 0.5) + (state.system_radius * 0.01);
    return Math.min(1.0, chaosIndex / 50.0); // 归一化到 0-1
  }

  private async updateCivilizationVitals(radiation: number) {
    // 🚨 铁律修复：必须 await 存储，否则 currentSanity 是 Promise，计算会得到 NaN
    const currentSanity = (await this.state.storage.get("sanity_index")) as number || 100;

    // 1. 混沌律逻辑：当辐射超过阈值，理智值迅速下降
    let sanityImpact = radiation > 0.8 ? -5 : 1;
    const newSanity = Math.max(0, Math.min(100, currentSanity + sanityImpact));

    // 2. 联动 GRN 与 AI 预警：仅在跨越阈值时触发，避免每帧重复调用 AI
    if (newSanity < 30 && currentSanity >= 30) {
      this.triggerGRNNode("GRN_FANATICISM_ACTIVATE");
      
      try {
        // 🚨 激活 AI 模型调用：生成富有文学感的文明预警
        const collapseAlert = await this.aiReporter.generateSanityCollapseReport({
          name: "三体文明",
          current_sanity: Math.floor(newSanity),
          max_sanity: 100,
          tech_level: 5,
          population: 1000000,
          event: "恒星近距离掠过，全球脱水开始"
        });
        
        this.broadcast({ type: "SANITY_COLLAPSE_ALERT", message: collapseAlert });
      } catch (e) {
        console.error("AI Reporter 启动失败，降级为基础消息", e);
        this.broadcast({ type: "SANITY_COLLAPSE_ALERT", message: "警告：理智值过低，文明处于崩溃边缘！" });
      }
    }

    // 🚨 铁律修复：异步持久化
    await this.state.storage.put("sanity_index", newSanity);
    this.broadcast({ type: "SOCIAL_UPDATE", sanity: newSanity });
  }

  private triggerGRNNode(nodeId: string) {
    // 触发基因调控网络节点
    console.log(`Triggering GRN node: ${nodeId}`);
    // 这里可以实现更复杂的基因调控逻辑
  }

  // 初始化方法
  async initialize() {
    try {
      // 🚨 修复：安全地初始化存储，不在这里启动 setInterval
      const existingSanity = await this.state.storage.get("sanity_index");
      if (existingSanity === undefined) {
        await this.state.storage.put("sanity_index", 100);
      }
    } catch (e) {
      console.error("DO 存储初始化失败:", e);
    }
  }

  // 🚨 新增：按需启动演化循环
  startLoop() {
    if (this.loopTimer) return;
    console.log("【宇宙点火】玩家已接入，物理引擎启动...");
    this.loopTimer = setInterval(async () => {
      await this.onTick();
    }, 100); // 维持 100ms 一帧
  }

  // 🚨 新增：按需冻结演化循环
  stopLoop() {
    if (this.loopTimer) {
      console.log("【宇宙冻结】玩家已离开，物理引擎休眠节省 CPU...");
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
  }

  // 玩家干预接口
  async handleIntervention(type: string, power: number) {
    switch(type) {
      case "GRAVITY_SHIELD": // 引力护盾：暂时抵消混沌律的影响
        this.planetaryState.planet.shield = power;
        break;
      case "RATIONAL_BEACON": // 理智灯塔：消耗 Evo-Points 恢复文明理智
        await this.restoreSanity(power);
        break;
    }
  }

  // 恢复理智值
  private async restoreSanity(power: number) {
    // 🚨 修复：补充 await
    const currentSanity = (await this.state.storage.get("sanity_index")) as number || 100;
    const newSanity = Math.min(100, currentSanity + power);
    await this.state.storage.put("sanity_index", newSanity);
    this.broadcast({ type: "SOCIAL_UPDATE", sanity: newSanity });
  }
}

// 保留你原有的 Civilization 类定义
class Civilization {
    public readonly name: string;
    public readonly birthTime: number;
    public currentSanity: number;
    public maxSanity: number;
    public techLevel: number;
    public population: number;
    public extinctionTime: number | null = null;
    public extinctionReason: string | null = null;
    public fossilRecord: string = '';
    private events: string[] = [];
    
    constructor(name: string, birthTime: number) {
        this.name = name;
        this.birthTime = birthTime;
        this.currentSanity = 100;
        this.maxSanity = 100;
        this.techLevel = 1;
        this.population = 1000;
    }
    
    get isExtinct(): boolean { return this.extinctionTime !== null; }
    
    update(currentTime: number) {
        if (this.isExtinct) return;
        this.techLevel = Math.min(10, 1 + Math.floor((currentTime - this.birthTime) / 10000));
        this.population = Math.floor(this.population * (1 + 0.001 * this.techLevel));
        this.updateSanity(currentTime);
        this.checkExtinction(currentTime);
    }
    
    private updateSanity(currentTime: number) {
        this.currentSanity = Math.max(0, this.currentSanity - 0.01);
        if (this.techLevel > 5) this.currentSanity = Math.max(0, this.currentSanity - 0.02);
        if (Math.random() < 0.01) {
            const event = this.generateRandomEvent();
            this.events.push(event);
            this.fossilRecord += `${currentTime}: ${event}\n`;
        }
    }
    
    private generateRandomEvent(): string {
        const events = ['发现了另一个文明的信号', '遭遇了引力异常', '太阳活动异常'];
        const event = events[Math.floor(Math.random() * events.length)];
        this.currentSanity = Math.max(0, this.currentSanity - 10);
        return event;
    }
    
    private checkExtinction(currentTime: number) {
        if (this.currentSanity <= 0) {
            this.extinctionTime = currentTime;
            this.extinctionReason = '理智崩溃';
        }
    }
}