// Jetbrains IDE doesn't respect env and globals from .eslintrc. This is a workaround.
// eslint-disable-next-line no-redeclare
/* global describe, expect, it */

const { hostUrl, timeout } = require('../args');

describe('The app error handling', () => {
  it('should show 401 for unauthorized access to protected pages', async () => {
    // No cookies so launch a new page as incognito.
    const ctx = await browser.createIncognitoBrowserContext();
    const incogPage = await ctx.newPage();
    const res = await incogPage.goto(`${hostUrl}/profile`, { waitUntil: 'networkidle2' });

    // Test status code.
    await expect(res.status()).toBe(401);

    // Clear history.
    await ctx.close();
  }, timeout);
});
