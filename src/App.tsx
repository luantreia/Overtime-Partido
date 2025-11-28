import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { ControlPage } from './features/control/ControlPage';
import { BroadcastPage } from './features/broadcast/BroadcastPage';
import { OverlayPage } from './features/overlay/OverlayPage';
import { CameraCapturePage } from './features/camera';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import { AuthProvider, useAuth } from './app/providers/AuthContext';
import { ToastProvider } from './shared/components/Toast/ToastProvider';

import { ConfigPage } from './features/config/ConfigPage';
import { StatsPage } from './features/stats/StatsPage';
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
      <Route path="/register" element={<RegisterPage />} />

      {/* Rutas de Gestión: Con Layout y Protegidas */}
      <Route path="*" element={
        <ProtectedRoute>
          <div className="min-h-screen bg-gray-100">
            <nav className="bg-blue-600 text-white p-4 shadow-md">
              <div className="container mx-auto flex justify-between items-center">
                <div className="text-xl font-bold">Overtime Gestión</div>
                <div className="flex items-center space-x-4">
                  <Link to="/config" className="hover:text-blue-200">Configuración</Link>
                  {/* <Link to="/control" className="hover:text-blue-200">Botonera</Link> */}
                  {/* <Link to="/stats" className="hover:text-blue-200">Estadísticas</Link> */}
                  {/* <Link to="/overlay" className="hover:text-blue-200" target="_blank">Overlay (OBS)</Link> */}
                  <div className="ml-4 flex items-center gap-2 border-l pl-4 border-blue-400">
                    <span className="text-sm">{user?.nombre}</span>
                    <button onClick={logout} className="text-sm bg-blue-700 px-2 py-1 rounded hover:bg-blue-800">Salir</button>
                  </div>
                </div>
              </div>
            </nav>

            <div className="container mx-auto mt-4">
              <Routes>
                <Route path="/" element={<div className="p-4"><h2>Bienvenido al sistema de gestión de partidos. Selecciona una opción del menú.</h2></div>} />
                <Route path="/config" element={<ConfigPage />} />
                <Route path="/control" element={<ControlPage />} />
                <Route path="/stats" element={<StatsPage />} />
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
