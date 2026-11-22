const overtimeKit = require('overtime-kit/tailwind-preset');

module.exports = {
  presets: [overtimeKit],
  // El `content` del preset no se hereda: Tailwind reemplaza esta clave, no la fusiona. Sin
  // expandir `overtimeKit.content` acá, las clases que sólo existen dentro del kit no se generan
  // y sus componentes salen sin estilo, sin ningún error que lo avise.
  content: ['./src/**/*.{js,jsx,ts,tsx}', ...overtimeKit.content],
  theme: {
    extend: {},
  },
  plugins: [],
};
