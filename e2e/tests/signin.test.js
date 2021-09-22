// Jetbrains IDE doesn't respect env and globals from .eslintrc. This is a workaround.
// eslint-disable-next-line no-redeclare
/* global beforeEach, describe, expect, it, page */

const timeout = 15 * 1000; // timeout in milliseconds

describe('The sign-in flow', () => {
  beforeEach(async () => {
    await page.goto('http://localhost:8080', {
      waitUntil: 'networkidle2',
    });
  });

  it('should sign in with valid username and password', async () => {
    // Enter username and password.
    await expect(page).toFillForm('form[name="signin"]', {
      username: 'chan',
      password: 'mypassword',
    });

    // Submit the form and redirect to a protected page.
    await expect(page).toClick('button', { text: 'SIGN IN', delay: 25 });
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await expect(page.url()).toContain('/profile');

    // Sign out.
    await expect(page).toClick('button', { text: 'SIGN OUT', delay: 25 });
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await expect(page).toMatch('Sign in');
  }, timeout);

  it('should not sign in with an invalid username', async () => {
    // Enter username and password.
    await expect(page).toFillForm('form[name="signin"]', {
      username: 'chana',
      password: 'mypassword',
    });

    // Submit the form and redirect to a protected page.
    await expect(page).toClick('button', { text: 'SIGN IN', delay: 25 });
    // Wait till we get the expected status code. Otherwise it will timeout and fail.
    await page.waitForResponse((res) => res.status() === 500);
  }, timeout);

  it('should not sign in with an invalid password', async () => {
    // Enter username and password.
    await expect(page).toFillForm('form[name="signin"]', {
      username: 'chan',
      password: 'password123',
    });

    // Submit the form and redirect to a protected page.
    await expect(page).toClick('button', { text: 'SIGN IN', delay: 25 });
    // Wait till we get the expected status code. Otherwise it will timeout and fail.
    await page.waitForResponse((res) => res.status() === 500);
  }, timeout);
});
