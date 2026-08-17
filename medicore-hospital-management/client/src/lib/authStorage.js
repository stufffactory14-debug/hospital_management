const TOKEN_KEY = 'medicore.auth.token';
const USER_KEY = 'medicore.auth.user';

const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 <= Date.now() : false;
  } catch {
    return true;
  }
};

export const getStoredAuth = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);

  if (!token || !rawUser || isTokenExpired(token)) {
    clearStoredAuth();
    return { token: null, user: null };
  }

  try {
    return { token, user: JSON.parse(rawUser) };
  } catch {
    clearStoredAuth();
    return { token: null, user: null };
  }
};

export const getStoredToken = () => getStoredAuth().token;

export const setStoredAuth = ({ token, user }) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
