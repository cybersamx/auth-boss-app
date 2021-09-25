module.exports = {
  hostUrl: process.env.AX_E2E_HOST_URL || 'http://localhost:8080',
  debug: process.env.AX_E2E_DEBUG === 'true',
  timeout: process.env.AX_E2E_TIMEOUT || 15 * 1000, // timeout in milliseconds
};
