import { authFetch } from '../../../shared/utils/authFetch';

type LoginPayload = { email: string; password: string };

type BackendLoginResponse = { accessToken: string; refreshToken: string; user: { id: string; nombre: string; email: string; rol: string } };

type BackendProfileResponse = { id: string; nombre: string; email: string; rol: string };

const mapUsuario = (u: BackendLoginResponse['user'] | BackendProfileResponse) => ({ id: u.id, nombre: u.nombre, email: u.email, rol: u.rol || 'admin' });

export const login = async (payload: LoginPayload) => {
  const response = await authFetch<BackendLoginResponse>('/auth/login', { method: 'POST', body: payload, useAuth: false });
  return { accessToken: response.accessToken, refreshToken: response.refreshToken, user: mapUsuario(response.user) };
};

export const getProfile = async () => { const profile = await authFetch<BackendProfileResponse>('/usuarios/mi-perfil'); return mapUsuario(profile); };
