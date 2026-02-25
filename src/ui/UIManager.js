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
   * 显示消息
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型 (info, warning, error)
   */
  showMessage(message, type = 'info') {
    if (this.elements.status) {
      this.elements.status.textContent = message;
      this.elements.status.className = `status-${type}`;
      
      // 3秒后清除消息
      setTimeout(() => {
        if (this.elements.status) {
          this.elements.status.textContent = '';
          this.elements.status.className = '';
        }
      }, 3000);
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
      sanityDiv.innerHTML += `<div style="color: #ff4444; font-size: 16px; margin-top: 10px;">🌟 当前文明理智值: ${sanity.toFixed(2)}</div>`;
    }
  }
}
