import React from 'react';

interface State { hasError: boolean; message?: string }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, message: error?.message || 'Error inesperado' };
  }

  componentDidCatch(error: any, info: any) {
    // Aquí se podría loguear a un servicio externo
    // console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-4 border border-red-300 bg-red-50 rounded-lg text-red-700">
          <h2 className="font-bold mb-2">Ocurrió un error</h2>
          <p className="text-sm">{this.state.message}</p>
          <button onClick={() => this.setState({ hasError: false, message: undefined })} className="mt-4 px-3 py-1.5 bg-red-600 text-white text-sm rounded">
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
