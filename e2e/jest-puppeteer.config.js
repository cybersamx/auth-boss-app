const { debug } = require('./args');

module.exports = {
  launch: {
    headless: !debug,
    slowMo: (debug) ? 25 : 0,
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
    ],
  },
};
