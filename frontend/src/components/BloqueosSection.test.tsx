import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '../api/apiClient';
import type { Bloqueo } from '../types/odontologia';
import { BloqueosSection } from './BloqueosSection';

function makeClient(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    checkSession: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getMotivos: vi.fn(),
    createMotivo: vi.fn(),
    updateMotivo: vi.fn(),
    getHorario: vi.fn(),
    replaceHorario: vi.fn(),
    getBloqueos: vi.fn().mockResolvedValue({ ok: true, data: [] }),
    createBloqueo: vi.fn(),
    deleteBloqueo: vi.fn(),
    getAgenda: vi.fn(),
    getTurnoDetalle: vi.fn(),
    getPublicMotivos: vi.fn(),
    getPublicDisponibilidad: vi.fn(),
    createPublicTurno: vi.fn(),
    getGestionTurno: vi.fn(),
    getGestionDisponibilidad: vi.fn(),
    cancelarGestionTurno: vi.fn(),
    reprogramarGestionTurno: vi.fn(),
    clearCsrfToken: vi.fn(),
    ...overrides,
  };
}

const sampleBloqueo: Bloqueo = {
  id: '33333333-3333-3333-3333-333333333333',
  inicio: '2026-12-10T12:00:00Z',
  fin: '2026-12-10T15:00:00Z',
  descripcion: 'Capacitación',
};

describe('BloqueosSection', () => {
  it('lista bloqueos al cargar y permite crear uno nuevo en la zona del consultorio', async () => {
    const user = userEvent.setup();
    const created: Bloqueo = {
      id: '44444444-4444-4444-4444-444444444444',
      inicio: '2026-12-15T12:00:00.000Z',
      fin: '2026-12-15T14:00:00.000Z',
      descripcion: 'Feriado',
    };
    const createBloqueo = vi.fn().mockResolvedValue({ ok: true, data: created });
    const client = makeClient({
      getBloqueos: vi.fn().mockResolvedValue({ ok: true, data: [sampleBloqueo] }),
      createBloqueo,
    });

    render(<BloqueosSection apiClient={client} onSessionExpired={vi.fn()} />);
    expect(await screen.findByText('Capacitación')).toBeTruthy();

    await user.type(screen.getByLabelText(/fecha de inicio/i), '2026-12-15');
    await user.type(screen.getByLabelText(/hora de inicio/i), '09:00');
    await user.type(screen.getByLabelText(/fecha de fin/i), '2026-12-15');
    await user.type(screen.getByLabelText(/hora de fin/i), '11:00');
    await user.type(screen.getByLabelText(/descripción/i), 'Feriado');
    await user.click(screen.getByRole('button', { name: /agregar bloqueo/i }));

    expect(createBloqueo).toHaveBeenCalledWith({
      inicio: '2026-12-15T12:00:00.000Z',
      fin: '2026-12-15T14:00:00.000Z',
      descripcion: 'Feriado',
    });
    expect(await screen.findByText('Feriado')).toBeTruthy();
  });

  it('no agrega bloqueo ante 409 CONFIGURATION_CONFLICT', async () => {
    const user = userEvent.setup();
    const createBloqueo = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      codigo: 'CONFIGURATION_CONFLICT',
      message: 'El cambio entra en conflicto con turnos confirmados vigentes.',
    });
    const client = makeClient({ createBloqueo });

    render(<BloqueosSection apiClient={client} onSessionExpired={vi.fn()} />);
    await screen.findByText(/no hay bloqueos/i);

    await user.type(screen.getByLabelText(/fecha de inicio/i), '2026-12-15');
    await user.type(screen.getByLabelText(/hora de inicio/i), '09:00');
    await user.type(screen.getByLabelText(/fecha de fin/i), '2026-12-15');
    await user.type(screen.getByLabelText(/hora de fin/i), '11:00');
    await user.click(screen.getByRole('button', { name: /agregar bloqueo/i }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/conflicto/i);
    expect(screen.getByText(/no hay bloqueos/i)).toBeTruthy();
  });

  it('retira bloqueo en 204 y resincroniza ante 404 BLOQUEO_NOT_FOUND', async () => {
    const user = userEvent.setup();
    const getBloqueos = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: [sampleBloqueo] })
      .mockResolvedValueOnce({ ok: true, data: [] });
    const deleteBloqueo = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        codigo: 'BLOQUEO_NOT_FOUND',
        message: 'El bloqueo seleccionado ya no existe en la agenda.',
      });

    render(
      <BloqueosSection
        apiClient={makeClient({ getBloqueos, deleteBloqueo })}
        onSessionExpired={vi.fn()}
      />,
    );

    await screen.findByText('Capacitación');
    await user.click(screen.getByRole('button', { name: /retirar/i }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/ya no existe/i);
    expect(getBloqueos).toHaveBeenCalledTimes(2);
    expect(await screen.findByText(/no hay bloqueos/i)).toBeTruthy();
  });
});
