import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../app/providers/AuthContext';
import { useToast } from '../../../shared/components/Toast/ToastProvider';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation() as any;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      await login(email, password);
      addToast({ type: 'success', title: 'Sesión iniciada', message: 'Bienvenido/a' });
      const redirectTo = location.state?.from?.pathname || '/control';
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      const message = err?.message || 'Error al iniciar sesión';
      setError(message);
      addToast({ type: 'error', title: 'No se pudo iniciar sesión', message });
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold text-slate-900 text-center">Acceso Gestión Partido</h1>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm text-slate-700">Email</label>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700">Password</label>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50" disabled={loading} type="submit">
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm">
          <p>¿No tienes cuenta? <Link to="/register" className="text-blue-600 hover:underline">Regístrate aquí</Link></p>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
