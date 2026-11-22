const overtimeKit = require('overtime-kit/tailwind-preset');

module.exports = {
  presets: [overtimeKit],
  // El `content` del preset no se hereda: Tailwind reemplaza esta clave, no la fusiona. Sin
  // expandir `overtimeKit.content` acá, las clases que sólo existen dentro del kit no se generan
  // y sus componentes salen sin estilo, sin ningún error que lo avise.
  content: ['./src/**/*.{js,jsx,ts,tsx}', ...overtimeKit.content],
  theme: {
    extend: {
      // Espejo de los tokens de overtime-kit v0.2.0 (text-muted, text-2xs). Borrar al subir el pin a v0.2.0.
      fontSize: { '2xs': ['11px', { lineHeight: '16px' }] },
      colors: { muted: '#64748b' },
    },
  },
  plugins: [],
};
