// import Worker from 'web-worker';
// globalThis.Worker = Worker

import { Worker } from 'node:worker_threads';
globalThis.Worker = Worker


void !function () {
    typeof self == 'undefined'
      && typeof global == 'object'
      && (global.self = global);
  }();