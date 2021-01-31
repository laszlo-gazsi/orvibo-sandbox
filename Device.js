class Device {
  constructor(device) {
    this.info = device;
    this.lastRequest = null;
    this.lastRequestTime = null;
  }

  getMacAddress() {
    return this.info.macAddress;
  }

  setLastRequest(request) {
    this.lastRequest = request;
    this.lastRequestTime = Date.now();
  }

  getLastRequest() {
    return {
      request: this.lastRequest,
      timestamp: this.lastRequestTime,
    };
  }

  updateInfo(deviceInfo) {
    this.info = {
      ...this.info,
      ...deviceInfo,
    };
  }

  getInfo() {
    return this.info;
  }
}

module.exports = Device;
