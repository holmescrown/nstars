// RK4Integrator.js
class RK4Integrator {
  constructor() {
    this.G = 6.67430e-11; // 万有引力常数
  }

  calculateAcceleration(bodies, index) {
    const body = bodies[index];
    let ax = 0;
    let ay = 0;
    let az = 0;

    for (let i = 0; i < bodies.length; i++) {
      if (i === index) continue;

      const otherBody = bodies[i];
      const dx = otherBody.position[0] - body.position[0];
      const dy = otherBody.position[1] - body.position[1];
      const dz = otherBody.position[2] - body.position[2];

      const distanceSquared = dx * dx + dy * dy + dz * dz;
      if (distanceSquared < 1e-10) continue; // 避免除以零

      const distance = Math.sqrt(distanceSquared);
      const force = (this.G * body.mass * otherBody.mass) / distanceSquared;
      const acceleration = force / body.mass;

      ax += (dx / distance) * acceleration;
      ay += (dy / distance) * acceleration;
      az += (dz / distance) * acceleration;
    }

    return [ax, ay, az];
  }

  derivative(state, bodies) {
    const derivatives = [];

    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      const acceleration = this.calculateAcceleration(state, i);

      derivatives.push({
        position: [...body.velocity],
        velocity: acceleration
      });
    }

    return derivatives;
  }

  addStates(state1, state2, dt) {
    const result = [];

    for (let i = 0; i < state1.length; i++) {
      const body1 = state1[i];
      const body2 = state2[i];

      result.push({
        mass: body1.mass,
        radius: body1.radius,
        position: [
          body1.position[0] + body2.position[0] * dt,
          body1.position[1] + body2.position[1] * dt,
          body1.position[2] + body2.position[2] * dt
        ],
        velocity: [
          body1.velocity[0] + body2.velocity[0] * dt,
          body1.velocity[1] + body2.velocity[1] * dt,
          body1.velocity[2] + body2.velocity[2] * dt
        ]
      });
    }

    return result;
  }

  integrate(bodies, dt) {
    const k1 = this.derivative(bodies, bodies);
    const k2 = this.derivative(this.addStates(bodies, k1, dt * 0.5), bodies);
    const k3 = this.derivative(this.addStates(bodies, k2, dt * 0.5), bodies);
    const k4 = this.derivative(this.addStates(bodies, k3, dt), bodies);

    const weightedSum = [];
    for (let i = 0; i < bodies.length; i++) {
      weightedSum.push({
        position: [
          (k1[i].position[0] + 2 * k2[i].position[0] + 2 * k3[i].position[0] + k4[i].position[0]) / 6,
          (k1[i].position[1] + 2 * k2[i].position[1] + 2 * k3[i].position[1] + k4[i].position[1]) / 6,
          (k1[i].position[2] + 2 * k2[i].position[2] + 2 * k3[i].position[2] + k4[i].position[2]) / 6
        ],
        velocity: [
          (k1[i].velocity[0] + 2 * k2[i].velocity[0] + 2 * k3[i].velocity[0] + k4[i].velocity[0]) / 6,
          (k1[i].velocity[1] + 2 * k2[i].velocity[1] + 2 * k3[i].velocity[1] + k4[i].velocity[1]) / 6,
          (k1[i].velocity[2] + 2 * k2[i].velocity[2] + 2 * k3[i].velocity[2] + k4[i].velocity[2]) / 6
        ]
      });
    }

    return this.addStates(bodies, weightedSum, dt);
  }

  checkCollisions(bodies) {
    const collisions = [];

    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const body1 = bodies[i];
        const body2 = bodies[j];

        const dx = body1.position[0] - body2.position[0];
        const dy = body1.position[1] - body2.position[1];
        const dz = body1.position[2] - body2.position[2];

        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const minDistance = body1.radius + body2.radius;

        if (distance < minDistance) {
          collisions.push([i, j]);
        }
      }
    }

    return collisions;
  }

  mergeBodies(body1, body2) {
    const totalMass = body1.mass + body2.mass;
    const newPosition = [
      (body1.position[0] * body1.mass + body2.position[0] * body2.mass) / totalMass,
      (body1.position[1] * body1.mass + body2.position[1] * body2.mass) / totalMass,
      (body1.position[2] * body1.mass + body2.position[2] * body2.mass) / totalMass
    ];

    const newVelocity = [
      (body1.velocity[0] * body1.mass + body2.velocity[0] * body2.mass) / totalMass,
      (body1.velocity[1] * body1.mass + body2.velocity[1] * body2.mass) / totalMass,
      (body1.velocity[2] * body1.mass + body2.velocity[2] * body2.mass) / totalMass
    ];

    // 简单的体积相加假设（实际应该是质量的立方根关系）
    const newRadius = Math.cbrt(Math.pow(body1.radius, 3) + Math.pow(body2.radius, 3));

    return {
      mass: totalMass,
      radius: newRadius,
      position: newPosition,
      velocity: newVelocity
    };
  }
}

// worker.js (Web Worker 逻辑)
class PhysicsWorker {
  constructor() {
    this.integrator = new RK4Integrator();
    this.bodies = [];
    this.isRunning = false;
    this.lastTime = 0;
    this.fixedTimeStep = 0.016; // 约60fps
    this.accumulator = 0;
  }

  handleMessage(data) {
    switch (data.type) {
      case 'INIT':
        this.init(data.payload);
        break;
      case 'START':
        this.start();
        break;
      case 'STOP':
        this.stop();
        break;
      case 'RESET':
        this.reset(data.payload);
        break;
      case 'ADD_BODY':
        this.addBody(data.payload);
        break;
      case 'REMOVE_BODY':
        this.removeBody(data.payload);
        break;
    }
  }

  init(initialState) {
    this.bodies = initialState.bodies || [];
    this.isRunning = false;
    this.lastTime = 0;
    this.accumulator = 0;

    self.postMessage({
      type: 'INITIALIZED',
      payload: { bodies: this.bodies }
    });
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.lastTime = performance.now() / 1000;
      this.simulationLoop();
    }
  }

  stop() {
    this.isRunning = false;
  }

  reset(initialState) {
    this.init(initialState);
  }

  addBody(body) {
    this.bodies.push(body);
  }

  removeBody(index) {
    if (index >= 0 && index < this.bodies.length) {
      this.bodies.splice(index, 1);
    }
  }

  simulationLoop() {
    if (!this.isRunning) return;

    const currentTime = performance.now() / 1000;
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.accumulator += deltaTime;

    // 使用固定时间步长进行积分
    while (this.accumulator >= this.fixedTimeStep) {
      this.bodies = this.integrator.integrate(this.bodies, this.fixedTimeStep);
      this.handleCollisions();
      this.accumulator -= this.fixedTimeStep;
    }

    // 发送当前状态回主线程
    self.postMessage({
      type: 'PHYSICS_UPDATE',
      payload: { bodies: this.bodies }
    });

    // 继续下一帧
    requestAnimationFrame(() => this.simulationLoop());
  }

  handleCollisions() {
    const collisions = this.integrator.checkCollisions(this.bodies);

    if (collisions.length > 0) {
      // 处理碰撞，合并星体
      const bodiesToRemove = new Set();
      const newBodies = [];

      collisions.forEach(([i, j]) => {
        if (!bodiesToRemove.has(i) && !bodiesToRemove.has(j)) {
          const mergedBody = this.integrator.mergeBodies(this.bodies[i], this.bodies[j]);
          newBodies.push(mergedBody);
          bodiesToRemove.add(i);
          bodiesToRemove.add(j);
        }
      });

      // 保留未碰撞的星体
      this.bodies.forEach((body, index) => {
        if (!bodiesToRemove.has(index)) {
          newBodies.push(body);
        }
      });

      this.bodies = newBodies;

      // 通知主线程发生了碰撞
      self.postMessage({
        type: 'COLLISION',
        payload: { bodies: this.bodies }
      });
    }
  }
}

// 初始化 Worker
const physicsWorker = new PhysicsWorker();

self.addEventListener('message', (event) => {
  physicsWorker.handleMessage(event.data);
});
