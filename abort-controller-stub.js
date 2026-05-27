const AC = global.AbortController || class AbortController {
  constructor() { this.signal = { aborted: false, addEventListener() {}, removeEventListener() {} }; }
  abort() { this.signal.aborted = true; }
};

const AS = global.AbortSignal || class AbortSignal {};

module.exports = AC;
module.exports.AbortController = AC;
module.exports.AbortSignal = AS;
module.exports.default = AC;