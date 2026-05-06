import { by, device, element, expect as detoxExpect, waitFor } from 'detox';

const EMAIL = 'alice@e2e.test';
const PASS = 'Alice123!';

async function ensureLoginScreen() {
  try {
    await waitFor(element(by.id('userlist-search-input'))).toBeVisible().withTimeout(6_000);
    await element(by.id('nav-profile-button')).tap();
    await waitFor(element(by.id('profile-signout-button'))).toBeVisible().withTimeout(5_000);
    await element(by.id('profile-signout-button')).tap();
  } catch {
    // already on login screen (or loading → resolves to login screen)
  }
  await waitFor(element(by.id('login-email-input'))).toBeVisible().withTimeout(10_000);
}

describe('Auth flows', () => {
  beforeAll(async () => {
    await device.launchApp({ delete: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('valid login navigates to user list', async () => {
    await ensureLoginScreen();
    await element(by.id('login-email-input')).typeText(EMAIL);
    await element(by.id('login-password-input')).typeText(PASS);
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('userlist-search-input'))).toBeVisible().withTimeout(15_000);
  });

  it('wrong password shows error message', async () => {
    await ensureLoginScreen();
    await element(by.id('login-email-input')).typeText(EMAIL);
    await element(by.id('login-password-input')).typeText('WrongPass!');
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('login-error-text'))).toBeVisible().withTimeout(10_000);
    await detoxExpect(element(by.id('login-error-text'))).toHaveText('Invalid email or password');
  });

  it('logout returns to login screen', async () => {
    await ensureLoginScreen();
    await element(by.id('login-email-input')).typeText(EMAIL);
    await element(by.id('login-password-input')).typeText(PASS);
    await element(by.id('login-submit-button')).tap();
    await waitFor(element(by.id('userlist-search-input'))).toBeVisible().withTimeout(15_000);

    await element(by.id('nav-profile-button')).tap();
    await waitFor(element(by.id('profile-signout-button'))).toBeVisible().withTimeout(10_000);
    await element(by.id('profile-signout-button')).tap();

    await waitFor(element(by.id('login-email-input'))).toBeVisible().withTimeout(15_000);
  });
});
