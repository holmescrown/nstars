export class UIManager {
  constructor(options = {}) {
    this.options = options;
    this.callbacks = {};
    this.elements = {};
    this.uiElements = new Map();

    this.init();
  }

  init() {
    // 缓存 DOM 元素
    this.elements = {
      status: document.getElementById('status') || null,
      eraDisplay: document.getElementById('era') || null,
      temperatureDisplay: document.getElementById('temperature') || null,
      startButton: document.getElementById('start-simulation') || null,
      shareButton: document.getElementById('share-civilization') || null,
      dimensionalCollapseButton: document.getElementById('dimensional-collapse') || null,
      resetButton: document.getElementById('reset-simulation') || null
    };

    // 初始化 uiElements Map
    this.uiElements.set('status', this.elements.status);
    this.uiElements.set('eraDisplay', this.elements.eraDisplay);
    this.uiElements.set('temperatureDisplay', this.elements.temperatureDisplay);
    this.uiElements.set('startButton', this.elements.startButton);
    this.uiElements.set('shareButton', this.elements.shareButton);
    this.uiElements.set('dimensionalCollapseButton', this.elements.dimensionalCollapseButton);
    this.uiElements.set('resetButton', this.elements.resetButton);
    this.uiElements.set('bodyInfo', document.getElementById('bodyInfo') || null);

    // 绑定事件
    this.bindEvents();
  }

  bindEvents() {
    if (this.elements.startButton) {
      this.elements.startButton.addEventListener('click', () => {
        if (this.callbacks.onStart) {
          this.callbacks.onStart();
        }
      });
    }

    if (this.elements.shareButton) {
      this.elements.shareButton.addEventListener('click', () => {
        if (this.callbacks.onShare) {
          this.callbacks.onShare();
        }
      });
    }

    if (this.elements.dimensionalCollapseButton) {
      this.elements.dimensionalCollapseButton.addEventListener('click', () => {
        if (this.callbacks.onDimensionalCollapse) {
          this.callbacks.onDimensionalCollapse();
        }
      });
    }

    if (this.elements.resetButton) {
      this.elements.resetButton.addEventListener('click', () => {
        if (this.callbacks.onReset) {
          this.callbacks.onReset();
        }
      });
    }
  }

  /**
   * 更新状态显示
   * @param {string} era - 纪元
   * @param {number} temperature - 温度
   */
  updateStatus(era, temperature) {
    if (this.elements.eraDisplay) {
      this.elements.eraDisplay.textContent = era;
    }

    if (this.elements.temperatureDisplay) {
      this.elements.temperatureDisplay.textContent = `${temperature.toFixed(2)} K`;
    }
  }

  /**
   * 显示消息（增强版：增加 AI 报告的解析支持）
   */
  showMessage(message, type = 'info') {
    if (this.elements.status) {
      // 如果消息包含 Markdown 换行符，进行简单格式化
      const formattedMsg = message.replace(/\n/g, '<br>');
      this.elements.status.innerHTML = `<div class="msg-content">${formattedMsg}</div>`;
      this.elements.status.className = `status-${type} active`;
      
      // 🚨 Level E 优化：AI 报告通常较长，增加显示时间到 8 秒
      const displayTime = type === 'error' ? 8000 : 3000;
      
      clearTimeout(this.msgTimeout);
      this.msgTimeout = setTimeout(() => {
        if (this.elements.status) {
          this.elements.status.classList.remove('active');
          this.elements.status.innerHTML = '';
        }
      }, displayTime);
    }
  }

  /**
   * 设置回调函数
   * @param {Object} callbacks - 回调函数对象
   */
  setCallbacks(callbacks) {
    this.callbacks = {
      ...this.callbacks,
      ...callbacks
    };
  }

  /**
   * 启用/禁用按钮
   * @param {string} buttonId - 按钮 ID
   * @param {boolean} enabled - 是否启用
   */
  setButtonEnabled(buttonId, enabled) {
    const button = this.elements[buttonId];
    if (button) {
      button.disabled = !enabled;
    }
  }

  updateSanityDisplay(sanity) {
    const sanityDiv = this.uiElements.get('bodyInfo');
    if (sanityDiv) {
      // 🚨 修改：使用 = 而不是 +=，且每次更新仅保留一行
      sanityDiv.innerHTML = `<div style="color: #ff4444; font-size: 16px; margin-top: 10px;">🌟 当前文明理智值: ${sanity.toFixed(2)}</div>`;
    }
  }

  // 修改 makeDraggable，接收两个参数：panel(容器) 和 handle(拖拽把手)
  makeDraggable(panel, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    // 鼠标样式只加在把手上
    handle.style.cursor = 'move';
    
    handle.onmousedown = (e) => {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = () => {
        document.onmouseup = null;
        document.onmousemove = null;
      };
      document.onmousemove = (e) => {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        panel.style.top = (panel.offsetTop - pos2) + "px";
        panel.style.left = (panel.offsetLeft - pos1) + "px";
      };
    };
  }

  // 在初始化时为所有面板添加拖拽功能
  initDraggablePanels() {
    const topInfo = document.getElementById('top-info');
    if (topInfo) {
      const header = topInfo.querySelector('h2');
      if (header) this.makeDraggable(topInfo, header);
    }

    const interventionPanel = document.getElementById('intervention-panel');
    if (interventionPanel) {
      const header = interventionPanel.querySelector('h3');
      if (header) this.makeDraggable(interventionPanel, header);
    }
  }
} 
