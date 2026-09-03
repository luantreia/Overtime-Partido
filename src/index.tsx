import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { iniciarObservabilidad } from './shared/observabilidad/sentry';

// Antes del primer render: si el SDK arranca despues, los errores de montaje se pierden.
iniciarObservabilidad();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
