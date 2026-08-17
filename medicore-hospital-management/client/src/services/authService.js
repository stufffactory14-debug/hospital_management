import api from '../lib/api';
import { clearStoredAuth, getStoredAuth, setStoredAuth } from '../lib/authStorage';

const saveAuthResponse = (response) => {
  const { token, user } = response.data.data;
  setStoredAuth({ token, user });
  return { token, user };
};

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return saveAuthResponse(response);
};

export const register = async (details) => {
  const response = await api.post('/auth/register', details);
  return saveAuthResponse(response);
};

export const logout = () => clearStoredAuth();

export const getCurrentAuth = () => getStoredAuth();
