const debug = process.env.AX_E2E_DEBUG === 'true';

module.exports = {
  launch: {
    headless: !debug,
    slowMo: (debug) ? 25 : 0,
    args: [
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  },
};
