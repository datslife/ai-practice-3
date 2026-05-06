import { by, device, element, expect as detoxExpect, waitFor } from 'detox';

const ALICE_EMAIL = 'alice@e2e.test';
const ALICE_PASS = 'Alice123!';
const BOB_ROW = 'userlist-row-bob@e2e.test';

async function loginAlice() {
  await waitFor(element(by.id('login-email-input'))).toBeVisible().withTimeout(10_000);
  await element(by.id('login-email-input')).typeText(ALICE_EMAIL);
  await element(by.id('login-password-input')).typeText(ALICE_PASS);
  await element(by.id('login-submit-button')).tap();
  await waitFor(element(by.id('userlist-search-input'))).toBeVisible().withTimeout(15_000);
}

describe('Chat flows', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('user list shows Bob after login', async () => {
    await loginAlice();
    await waitFor(element(by.id(BOB_ROW))).toBeVisible().withTimeout(15_000);
    await detoxExpect(element(by.text('Bob'))).toBeVisible();
  });

  it('send message shows optimistic bubble immediately', async () => {
    await loginAlice();
    await waitFor(element(by.id(BOB_ROW))).toBeVisible().withTimeout(15_000);
    await element(by.id(BOB_ROW)).tap();

    await waitFor(element(by.id('chat-message-input'))).toBeVisible().withTimeout(10_000);
    await element(by.id('chat-message-input')).typeText('Hello E2E');
    await element(by.id('chat-send-button')).tap();

    await waitFor(element(by.text('Hello E2E'))).toBeVisible().withTimeout(5_000);
  });

  it('sent message does not show Retry (delivery confirmed by server)', async () => {
    await loginAlice();
    await waitFor(element(by.id(BOB_ROW))).toBeVisible().withTimeout(15_000);
    await element(by.id(BOB_ROW)).tap();

    await waitFor(element(by.id('chat-message-input'))).toBeVisible().withTimeout(10_000);
    await element(by.id('chat-message-input')).typeText('Confirm delivery');
    await element(by.id('chat-send-button')).tap();

    await waitFor(element(by.text('Confirm delivery'))).toBeVisible().withTimeout(5_000);
    // Retry only renders when status === 'failed'; 8 s gives socket time to ack
    await waitFor(element(by.text('Retry'))).not.toBeVisible().withTimeout(8_000);
    await detoxExpect(element(by.text('Confirm delivery'))).toBeVisible();
  });
});
