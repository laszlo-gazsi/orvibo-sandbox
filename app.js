/* eslint-disable no-console */
const Orvibo = require('node-orvibo-2');
const Device = require('./Device');
const Server = require('./HttpServer');

const EVENTS = {
  READY: 'ready',
  DEVICE_FOUND: 'deviceadded',
  SUBSCRIBE_FINISHED: 'subscribed',
  INFO_QUERY_FINISHED: 'queried',
  STATUS_CHANGE_CONFIRMED: 'statechangeconfirmed',
};

const orviboClient = new Orvibo();

const requests = {};
const devices = {};
const connectedDevices = {};

const getLooper = (fn) => setInterval(fn, 1000);

const nextPhase = (macAddress, operation) => {
  const lastRequest = requests[macAddress];
  if (lastRequest) {
    clearInterval(lastRequest);
  }

  const nextRequest = operation ? getLooper(operation) : 'COMPLETE';
  connectedDevices[macAddress].setLastRequest(nextRequest);
  requests[macAddress] = nextRequest; // has to go
};

const doSubscribe = (device) => orviboClient.subscribe(device);
const doQuery = (device) => orviboClient.query({ device, table: '04' });
const doSetState = (device, state) => {
  orviboClient.setState(device, state);
};

orviboClient.on(EVENTS.READY, () => {
  console.log('[INFO] Detecting s20 sockets...');
  orviboClient.discover();
});

orviboClient.on(EVENTS.DEVICE_FOUND, (device) => {
  connectedDevices[device.macAddress] = new Device(device);
  nextPhase(device.macAddress, () => doSubscribe(device));
});

orviboClient.on(EVENTS.SUBSCRIBE_FINISHED, (subscription) => {
  nextPhase(subscription.macAddress, () => doQuery(subscription));
});

orviboClient.on(EVENTS.INFO_QUERY_FINISHED, (query) => {
  devices[query.macAddress] = query;
  nextPhase(query.macAddress);
  const unfinished = Object.keys(requests).filter((request) => requests[request] !== 'COMPLETE');
  if (unfinished.length === 0) {
    console.log(`[INFO] ${Object.keys(devices).length} device(s) found.`);
  }
});

orviboClient.on(EVENTS.STATUS_CHANGE_CONFIRMED, (device) => {
  console.log(`Status changed on ${device.macAddress}`);
  nextPhase(device.macAddress);
});

orviboClient.listen();

const toggleAllDevices = () => {
  Object.keys(devices).forEach((key) => {
    const device = devices[key];
    console.log(`Request state change on ${device.macAddress}`);
    nextPhase(device.macAddress, () => doSetState(device, !device.state));
  });
};

const port = 8081;
const server = new Server(
  port,
  devices,
  {
    toggleAllDevices,
  },
);
server.start();

setInterval(() => {
  console.log('[INFO] Resubscribing');
  Object.keys(connectedDevices).forEach((macAddress) => {
    const device = connectedDevices[macAddress].getInfo();
    nextPhase(device.macAddress, () => doSubscribe(device));
  });
}, 5 * 60 * 1000);
