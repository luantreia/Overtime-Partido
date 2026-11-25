import { Link, useNavigate, useParams } from 'react-router-dom';
import { AuthLayout, ResetPasswordForm } from 'overtime-kit';
import { resetPassword } from '../services/authService';
import { useToast } from '../../../shared/components/Toast/ToastProvider';

/** Destino del link que llega por mail (`/reset-password/:token`). */
const ResetPasswordPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  return (
    <AuthLayout
      marca="OT"
      titulo="Elegí una contraseña nueva"
      pie={
        <Link to="/login" className="font-semibold text-brand-300 underline hover:text-brand-200">
          Volver a iniciar sesión
        </Link>
      }
    >
      <ResetPasswordForm
        token={token}
        onSubmit={resetPassword}
        onSuccess={() => {
          addToast({ type: 'success', title: 'Contraseña actualizada', message: 'Ya podés iniciar sesión con tu contraseña nueva.' });
          navigate('/login', { replace: true });
        }}
      />
    </AuthLayout>
  );
};

export default ResetPasswordPage;
