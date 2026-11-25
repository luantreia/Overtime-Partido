import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { ControlPage } from './features/control/ControlPage';
import { BroadcastPage } from './features/broadcast/BroadcastPage';
import { OverlayPage } from './features/overlay/OverlayPage';
import { CameraCapturePage } from './features/camera';
import LoginPage from './features/auth/pages/LoginPage';
import OlvidePasswordPage from './features/auth/pages/OlvidePasswordPage';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import { AuthProvider, useAuth } from './app/providers/AuthContext';
import { ToastProvider } from './shared/components/Toast/ToastProvider';

import { ConfigPage } from './features/config/ConfigPage';
import ErrorBoundary from './shared/components/ErrorBoundary';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-4">Cargando...</div>;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

function AppContent() {
  const { user, logout } = useAuth();

  return (
    <Routes>
      {/* Ruta Overlay: Sin Layout, pantalla completa, pública (o protegida si se desea) */}
      <Route path="/overlay" element={<OverlayPage />} />
      <Route path="/broadcast" element={<BroadcastPage />} />

      {/* Rutas de Cámara: Públicas para acceso desde móviles */}
      <Route path="/camera/:matchId/:slot" element={<CameraCapturePage />} />

      {/* Rutas de Autenticación */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/olvide-password" element={<OlvidePasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rutas de Gestión: Con Layout y Protegidas */}
      <Route path="*" element={
        <ProtectedRoute>
          <div className="min-h-dvh bg-slate-50">
            <nav className="bg-brand-600 text-white p-4 shadow-md">
              <div className="container mx-auto flex justify-between items-center">
                <div className="text-xl font-bold">Overtime Gestión</div>
                <div className="flex items-center space-x-4">
                  <Link to="/config" className="hover:text-brand-200">Mis partidos</Link>
                  <div className="ml-4 flex items-center gap-2 border-l pl-4 border-brand-400">
                    <span className="text-sm">{user?.nombre}</span>
                    <button onClick={logout} className="text-sm bg-brand-700 px-2 py-1 rounded hover:bg-brand-800">Salir</button>
                  </div>
                </div>
              </div>
            </nav>

            <div className="container mx-auto mt-4">
              <Routes>
                <Route path="/" element={<Navigate to="/config" replace />} />
                <Route path="/config" element={<ConfigPage />} />
                <Route path="/control" element={<ControlPage />} />
                <Route path="/stats" element={<Navigate to="/config" replace />} />
              </Routes>
            </div>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <ErrorBoundary>
            <React.Suspense fallback={<div className="p-6 text-center">Cargando módulo...</div>}>
              <AppContent />
            </React.Suspense>
          </ErrorBoundary>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
