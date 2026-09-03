import * as Sentry from '@sentry/react';

/**
 * Reporte de errores en producción.
 *
 * Sin `REACT_APP_SENTRY_DSN` definido esto no hace absolutamente nada: no inicializa el SDK, no
 * abre conexiones y no manda un solo byte. Es deliberado — así el desarrollo local y los forks
 * no ensucian el proyecto con ruido, y nadie tiene que configurar nada para levantar la app.
 *
 * Hasta ahora, cuando la app rompía en el celular de un DT en un gimnasio, esa información se
 * perdía: el usuario veía una pantalla rota y nadie más se enteraba nunca. El ErrorBoundary
 * atrapa el crash, pero atrapar no es avisar.
 */
export const iniciarObservabilidad = (): void => {
  const dsn = process.env.REACT_APP_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // La versión del build. Sin esto, un error no se puede atribuir a un deploy concreto y
    // "esto empezó a fallar ayer" deja de ser una pista.
    release: process.env.REACT_APP_VERSION,

    /**
     * Muestreo de trazas de rendimiento. Va bajo a propósito: el backend está en el plan free
     * de Render y el plan gratuito de Sentry tiene cuota; capturar el 100% la quema en días y
     * después no queda cupo para lo que importa, que son los errores.
     */
    tracesSampleRate: 0.1,

    /**
     * Qué NO reportar. Sin este filtro, el ruido entierra las señales reales: las extensiones
     * del navegador y los cortes de red de un gimnasio generan cientos de eventos que no son
     * bugs de la app y sobre los que no se puede hacer nada.
     */
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      'Failed to fetch',
      'NetworkError when attempting to fetch resource',
      'Load failed',
    ],

    beforeSend(event) {
      // Los errores de extensiones del navegador llegan con el stack apuntando a chrome-extension://
      // y no son de la app. Reportarlos sólo consume cuota.
      const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];
      const deExtension = frames.some((frame) =>
        /^(chrome-extension|moz-extension|safari-extension):/.test(frame.filename ?? ''),
      );
      return deExtension ? null : event;
    },
  });
};

/**
 * Asocia los errores al usuario que los sufrió, para poder responderle.
 *
 * Va sólo el id y el rol: nunca el email ni el nombre. Sentry es un servicio de terceros y no
 * hace falta mandarle datos personales para saber a quién le pasó qué — con el id alcanza para
 * cruzarlo contra la base propia si hiciera falta.
 */
export const identificarUsuario = (usuario: { id: string; rol?: string } | null): void => {
  if (!process.env.REACT_APP_SENTRY_DSN) return;
  Sentry.setUser(usuario ? { id: usuario.id, segment: usuario.rol } : null);
};
