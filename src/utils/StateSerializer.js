export class StateSerializer {
  /**
   * 将物理状态编码为 Base64 字符串
   * @param {Array} bodies - 星体数组
   * @returns {string} - Base64 编码的状态
   */
  static encodeState(bodies) {
    try {
      // 提取关键数据，减少数据量
      const simplifiedBodies = bodies.map(body => ({
        position: body.position,
        velocity: body.velocity,
        mass: body.mass,
        radius: body.radius
      }));

      // 序列化为 JSON
      const jsonString = JSON.stringify(simplifiedBodies);

      // 使用 TextEncoder 转换为 UTF-8
      const encoder = new TextEncoder();
      const utf8Bytes = encoder.encode(jsonString);

      // 转换为 Base64
      const base64String = btoa(String.fromCharCode(...utf8Bytes));

      return base64String;
    } catch (error) {
      console.error('状态编码失败:', error);
      return '';
    }
  }

  /**
   * 从 Base64 字符串解码物理状态
   * @param {string} base64Str - Base64 编码的状态
   * @returns {Array|null} - 解码后的星体数组或 null
   */
  static decodeState(base64Str) {
    try {
      // 从 Base64 解码
      const utf8Bytes = atob(base64Str);

      // 使用 TextDecoder 转换为字符串
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(new Uint8Array([...utf8Bytes].map(char => char.charCodeAt(0))));

      // 解析 JSON
      const bodies = JSON.parse(jsonString);

      // 验证数据结构
      if (Array.isArray(bodies)) {
        return bodies;
      } else {
        throw new Error('无效的状态数据结构');
      }
    } catch (error) {
      console.error('状态解码失败:', error);
      return null;
    }
  }

  /**
   * 将状态编码到 URL
   * @param {Array} bodies - 星体数组
   */
  static encodeToUrl(bodies) {
    const encodedState = this.encodeState(bodies);
    if (encodedState) {
      const url = new URL(window.location.href);
      url.searchParams.set('state', encodedState);
      window.history.replaceState({}, '', url.toString());
    }
  }

  /**
   * 从 URL 解码状态
   * @returns {Array|null} - 解码后的星体数组或 null
   */
  static decodeFromUrl() {
    const url = new URL(window.location.href);
    const encodedState = url.searchParams.get('state');
    if (encodedState) {
      return this.decodeState(encodedState);
    }
    return null;
  }
}
