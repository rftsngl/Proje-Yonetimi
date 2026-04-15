const AUTH_TOKEN_KEY = 'zodiac_auth_token';
const LEGACY_AUTH_TOKEN_KEY = 'projex_auth_token';

export const getStoredAuthToken = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return (
    window.localStorage.getItem(AUTH_TOKEN_KEY) ||
    window.localStorage.getItem(LEGACY_AUTH_TOKEN_KEY) ||
    ''
  );
};

export const setStoredAuthToken = (token: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
};

export const clearStoredAuthToken = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
};
