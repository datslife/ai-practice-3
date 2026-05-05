jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn().mockResolvedValue(true),
  getGenericPassword: jest.fn().mockResolvedValue({ password: 'test-token' }),
  resetGenericPassword: jest.fn().mockResolvedValue(true),
}));

import { saveToken, getToken, clearToken } from '../../src/storage/authStorage';
import * as Keychain from 'react-native-keychain';

describe('authStorage', () => {
  it('saveToken stores token via Keychain', async () => {
    await saveToken('my-jwt');
    expect(Keychain.setGenericPassword).toHaveBeenCalledWith('auth', 'my-jwt');
  });

  it('getToken retrieves stored token', async () => {
    const token = await getToken();
    expect(token).toBe('test-token');
  });

  it('clearToken removes token', async () => {
    await clearToken();
    expect(Keychain.resetGenericPassword).toHaveBeenCalled();
  });

  it('getToken returns null when nothing stored', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValueOnce(false);
    const token = await getToken();
    expect(token).toBeNull();
  });
});
