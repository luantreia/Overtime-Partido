import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import { authFetch } from '../../../shared/utils/authFetch';

const RegisterPage: React.FC = () => {
  const { addToast } = useToast();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      // Assuming there is a register endpoint. If not, this will fail.
      // Based on standard practices, it might be /auth/register or /usuarios
      await authFetch('/auth/register', { 
        method: 'POST', 
        body: { nombre, email, password },
        useAuth: false 
      });
      
      addToast({ type: 'success', title: 'Registro exitoso', message: 'Ahora puedes iniciar sesión' });
      navigate('/login');
    } catch (err: any) {
      const message = err?.message || 'Error al registrarse';
      setError(message);
      addToast({ type: 'error', title: 'No se pudo registrar', message });
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold text-slate-900 text-center">Registro Gestión Partido</h1>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm text-slate-700">Nombre</label>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700">Email</label>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-700">Password</label>
            <input className="w-full rounded-lg border border-slate-300 px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="w-full rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50" disabled={loading} type="submit">
            {loading ? 'Registrarse…' : 'Registrarse'}
          </button>
        </form>
        <div className="mt-4 text-center text-sm">
          <p>¿Ya tienes cuenta? <Link to="/login" className="text-blue-600 hover:underline">Inicia sesión aquí</Link></p>
        </div>
      </div>
    </div>
  );
};
export default RegisterPage;
