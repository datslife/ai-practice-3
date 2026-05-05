import * as Keychain from 'react-native-keychain';

const SERVICE = 'auth';

export async function saveToken(token: string): Promise<void> {
  await Keychain.setGenericPassword(SERVICE, token);
}

export async function getToken(): Promise<string | null> {
  const result = await Keychain.getGenericPassword();
  if (!result) return null;
  return result.password;
}

export async function clearToken(): Promise<void> {
  await Keychain.resetGenericPassword();
}
