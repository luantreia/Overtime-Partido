/**
 * Chequeo automático de accesibilidad (axe-core). Mismo criterio que en Overtime-Public.
 *
 * Corre en jsdom, así que NO mide contraste (jsdom no calcula estilos): eso lo cubren los tokens
 * `text-muted`/`text-2xs`. Sí atrapa lo estructural: roles inválidos, botones sin nombre,
 * elementos interactivos anidados, ids duplicados.
 *
 * Para sumar un componente: renderizarlo con datos realistas y pasar el contenedor a `axe`.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import PartidoCard from './components/PartidoCard/PartidoCard';

expect.extend(toHaveNoViolations);

const partido = {
  _id: 'x1',
  estado: 'en_juego',
  fecha: '2026-11-22',
  hora: '18:00',
  equipoLocal: { _id: 'e1', nombre: 'Equipo 1' },
  equipoVisitante: { _id: 'e2', nombre: 'Equipo 2' },
  marcadorLocal: 2,
  marcadorVisitante: 1,
} as any;

describe('accesibilidad (axe)', () => {
  it('PartidoCard clickeable', async () => {
    const { container } = render(
      <MemoryRouter>
        <PartidoCard partido={partido} onClick={() => {}} />
      </MemoryRouter>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('PartidoCard de solo lectura', async () => {
    const { container } = render(
      <MemoryRouter>
        <PartidoCard partido={partido} />
      </MemoryRouter>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
