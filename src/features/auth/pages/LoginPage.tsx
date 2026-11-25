import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout, LoginForm } from 'overtime-kit';
import { useAuth } from '../../../app/providers/AuthContext';
import { useToast } from '../../../shared/components/Toast/ToastProvider';

/** El formulario y el marco vienen de overtime-kit; acá sólo queda qué hace esta app al entrar. */
const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/config';

  const ingresar = (email: string, password: string) => login(email, password);

  return (
    <AuthLayout marca="OT" titulo="Overtime Partido" subtitulo="Control de partido en vivo"
      pie={
        <p>
          ¿Todavía no tenés cuenta?{' '}
          <Link to="/register" className="font-semibold text-brand-300 underline hover:text-brand-200">
            Crear una
          </Link>
        </p>
      }>
      <LoginForm
        onSubmit={ingresar}
        onSuccess={() => {
          addToast({ type: 'success', title: 'Sesión iniciada', message: 'Bienvenido/a' });
          navigate(from, { replace: true });
        }}
        onError={(message) => addToast({ type: 'error', title: 'No se pudo iniciar sesión', message })}
        enlaceOlvide={
          <Link to="/olvide-password" className="underline hover:text-slate-100">
            Olvidé mi contraseña
          </Link>
        }
      />
    </AuthLayout>
  );
};

export default LoginPage;
