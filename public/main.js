import Engine from './js/core/Engine.js';

class EdgeClient {
    constructor() {
        this.engine = new Engine();
        
        // 🚨 确保UI层的pointer-events逻辑保持正确
        const uiLayer = document.getElementById('ui-layer');
        if (uiLayer) {
            uiLayer.style.pointerEvents = 'none';
        }
        
        // 🚨 为所有面板添加拖拽功能
        if (this.engine.uiManager && this.engine.uiManager.initDraggablePanels) {
            this.engine.uiManager.initDraggablePanels();
        }
        
        // 🚨 终极点火指令：强制启动 3D 渲染循环，不要等待 UI 按钮！
        this.engine.startSimulation();
        
        this.ws = null;
        this.timeScale = 1.0; // 初始化时间倍率
        this.initWebSocket();
        this.setupInterventions();
        this.setupTimeControl();
    }

    initWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        console.log(`[EdgeClient] 连接到云端 Durable Object: ${wsUrl}`);
        this.ws = new WebSocket(wsUrl);

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch(data.type) {
                case 'PHYSICS_UPDATE':
                    if (this.engine.sceneManager && data.state && data.state.bodies) {
                        // 将云端扁平数据转换为纯数据对象
                        const colors = [0xff4444, 0x44ff44, 0x4444ff]; // 三颗恒星分别设为红、绿、蓝
                        const formattedBodies = data.state.bodies.map((b, index) => ({
                            id: index + 1,
                            targetX: b.x,
                            targetY: b.y,
                            targetZ: b.z || 0, // 提取纯坐标
                            mass: b.mass,
                            radius: 4,
                            color: colors[index % 3]
                        }));
                        // 通知引擎更新目标
                        this.engine.targetBodies = formattedBodies;

                        // 🚨 新增：传递系统半径，更新历史虚影
                        if (data.state.system_radius) {
                            this.engine.sceneManager.updateSystemRadius(data.state.system_radius);
                        }

                        // 🚨 保持原有的“大撕裂”视觉预警逻辑
                        if (data.state.system_radius > 450) {
                            if (!document.body.classList.contains('rip-warning')) {
                                document.body.style.boxShadow = "inset 0 0 150px rgba(255, 0, 0, 0.8)";
                                document.body.classList.add('rip-warning');
                            }
                        } else {
                            if (document.body.classList.contains('rip-warning')) {
                                document.body.style.boxShadow = "none";
                                document.body.classList.remove('rip-warning');
                            }
                        }
                    }
                    break;
                case 'SOCIAL_UPDATE':
                    if (this.engine.uiManager) {
                        this.engine.uiManager.updateSanityDisplay(data.sanity);
                    }
                    break;
                case 'SANITY_COLLAPSE_ALERT':
                    if (this.engine.uiManager) {
                        this.engine.uiManager.showMessage(`⚠️ 混沌律警告: ${data.message}`, 'error');
                    }
                    break;
            }
        };

        this.ws.onclose = () => setTimeout(() => this.initWebSocket(), 5000);
    }

    setupInterventions() {
        const shieldBtn = document.getElementById('btn-shield');
        const beaconBtn = document.getElementById('btn-beacon');
        
        if(shieldBtn) shieldBtn.addEventListener('click', () => this.sendIntervention('GRAVITY_SHIELD', 100));
        if(beaconBtn) beaconBtn.addEventListener('click', () => this.sendIntervention('RATIONAL_BEACON', 20));
    }

    sendIntervention(type, power) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'INTERVENTION', interventionType: type, power: power, timeScale: this.timeScale }));
        }
    }

    setupTimeControl() {
        const slider = document.getElementById('speed-slider');
        const valueDisplay = document.getElementById('speed-tag');
        
        if (slider && valueDisplay) {
            slider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                this.timeScale = val;
                valueDisplay.innerText = val + 'x';
                
                // 发送指令通知后端加速物理步进
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({ type: 'SET_TIME_SCALE', value: val }));
                }
            });
        }
    }
}

// 启动引擎与边缘链接
window.edgeClient = new EdgeClient();