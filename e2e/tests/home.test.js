// Jetbrains IDE doesn't respect env and globals from .eslintrc. This is a workaround.
// eslint-disable-next-line no-redeclare
/* global beforeEach, describe, expect, it, page */

const timeout = 15 * 1000; // timeout in milliseconds

describe('The home page', () => {
  beforeEach(async () => {
    await page.goto('http://localhost:8080', {
      waitUntil: 'networkidle2',
    });
  });

  it('should see a title', async () => {
    // Test the title.
    await expect(page.title()).resolves.toMatch('Sign-In');
  }, timeout);
});
