// Jetbrains IDE doesn't respect env and globals from .eslintrc. This is a workaround.
// eslint-disable-next-line no-redeclare
/* global describe, expect, it, page */

const { hostUrl, timeout } = require('../args');

describe('The home page', () => {
  it('should see a title', async () => {
    await page.goto(hostUrl, { waitUntil: 'networkidle2' });

    // Test the title.
    await expect(page.title()).resolves.toMatch('Sign-In');
  }, timeout);
});
