console.warn('EVENT TARGET SHIM STUB LOADED');

const ET = global.EventTarget || class EventTarget {
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() { return true; }
};

module.exports = ET;
module.exports.EventTarget = ET;
module.exports.defineEventAttribute = () => {};
module.exports.default = ET;