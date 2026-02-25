export function calculateTernaryPhysics(state: any) {
    const G = 2000; // 🚨 放大引力常数，让视觉运动极其剧烈
    const dt = 0.05; // 时间步长
    const bodies = state.bodies;
    
    // 🚨 新增：边界回归参数
    const BOUNDARY = 500;
    const CENTRIPETAL_K = 2.0;
    
    // 计算引力加速度
    for (let i = 0; i < bodies.length; i++) {
        let ax = 0, ay = 0;
        for (let j = 0; j < bodies.length; j++) {
            if (i === j) continue;
            const dx = bodies[j].x - bodies[i].x;
            const dy = bodies[j].y - bodies[i].y;
            const distSq = dx * dx + dy * dy + 100; // 软化因子，防止无限加速
            const f = (G * bodies[j].mass) / distSq;
            const dist = Math.sqrt(distSq);
            ax += f * (dx / dist);
            ay += f * (dy / dist);
        }
        
        // 🚨 新增：当星体飞得太远时，施加向心力强行拉回
        const distFromCenter = Math.sqrt(bodies[i].x * bodies[i].x + bodies[i].y * bodies[i].y);
        if (distFromCenter > BOUNDARY) {
            const excessDist = distFromCenter - BOUNDARY;
            const pullForce = excessDist * CENTRIPETAL_K;
            ax -= pullForce * (bodies[i].x / (distFromCenter || 1));
            ay -= pullForce * (bodies[i].y / (distFromCenter || 1));
        }

        bodies[i].vx += ax * dt;
        bodies[i].vy += ay * dt;
    }
    
    // 更新坐标
    for (let i = 0; i < bodies.length; i++) {
        bodies[i].x += bodies[i].vx * dt;
        bodies[i].y += bodies[i].vy * dt;
    }
    
    return state;
}