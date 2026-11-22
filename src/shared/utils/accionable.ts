import type React from 'react';

/**
 * Props para que un elemento no nativo (un `div` tarjeta, una fila) se pueda usar con teclado:
 * rol de botón, foco con Tab y activación con Enter/Espacio, igual que un `<button>`.
 *
 * Preferí `<button>` o `<Link>` cuando se pueda. Esto es para bloques con layout propio (grids,
 * flex con varios hijos) donde cambiar la etiqueta rompería estilos. Si `onActivate` es
 * `undefined` no agrega nada, así el mismo bloque puede ser clickeable o no según el caso.
 *
 *   <div {...accionable(esRanked ? () => abrir(id) : undefined)} className="... focus-visible:ring-2">
 */
export function accionable(onActivate?: () => void): React.HTMLAttributes<HTMLElement> {
  if (!onActivate) return {};
  return {
    role: 'button',
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
      }
    },
  };
}
