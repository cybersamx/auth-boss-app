// Jetbrains IDE doesn't respect env and globals from .eslintrc. This is a workaround.
// eslint-disable-next-line no-redeclare
/* global beforeEach, describe, expect, it, page */

const { hostUrl, timeout } = require('../args');

describe('The sign-in flow', () => {
  beforeEach(async () => {
    await page.goto(hostUrl, {
      waitUntil: 'networkidle2',
    });
  });

  it('should sign in with valid username and password', async () => {
    // Enter username and password.
    await expect(page).toFillForm('form[name="signin"]', {
      username: 'chan',
      password: 'mypassword',
    });

    // Reusable promises.
    const expectSignIn = expect(page).toMatchElement('p#form-title', { text: 'Sign in' });
    const waitForNav = page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Submit the form and redirect to a protected page.
    await expectSignIn;
    await expect(page).toClick('button#btn-signin', { delay: 25 });
    await waitForNav;
    await expect(page.url()).toContain('/profile');

    // Sign out.
    await expect(page).toClick('button#btn-signout', { delay: 25 });

    // Back to the sign-in page.
    await waitForNav;
    await expectSignIn;
  }, timeout);

  it('should not sign in with an invalid username', async () => {
    // Enter username and password.
    await expect(page).toFillForm('form[name="signin"]', {
      username: 'chana',
      password: 'mypassword',
    });

    // Submit the form and expect error message.
    await expect(page).toClick('button#btn-signin', { delay: 25 });
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await expect(page).toMatchElement('div#error-msg', { text: 'User not found' });
  }, timeout);

  it('should not sign in with an invalid password', async () => {
    // Enter username and password.
    await expect(page).toFillForm('form[name="signin"]', {
      username: 'chan',
      password: 'password123',
    });

    // Submit the form and expect error message.
    await expect(page).toClick('button#btn-signin', { delay: 25 });
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await expect(page).toMatchElement('div#error-msg', { text: 'Invalid credentials' });
  }, timeout);
});
