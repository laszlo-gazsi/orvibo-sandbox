const express = require('express');

class HttpServer {
  constructor(port, devices, callbacks) {
    this.port = port;
    this.devices = devices;
    this.app = null;
    this.callbacks = callbacks;
  }

  start() {
    this.app = express();
    this.app.use(express.static('public'));

    this.app.get('/devices', (req, res) => {
      res.send(JSON.stringify(this.devices));
    });

    this.app.post('/switch', (req, res) => {
      this.callbacks.toggleAllDevices();
      res.redirect('/');
    });

    this.app.listen(this.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server started at http://localhost:${this.port}`);
    });
  }
}

module.exports = HttpServer;
