import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '../api/apiClient';
import type { Motivo } from '../types/odontologia';
import { MotivosSection } from './MotivosSection';

function makeClient(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    checkSession: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getMotivos: vi.fn().mockResolvedValue({ ok: true, data: [] }),
    createMotivo: vi.fn(),
    updateMotivo: vi.fn(),
    getHorario: vi.fn(),
    replaceHorario: vi.fn(),
    getBloqueos: vi.fn(),
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

const sampleMotivo: Motivo = {
  id: '11111111-1111-1111-1111-111111111111',
  nombre: 'Control general',
  duracionMinutos: 30,
};

describe('MotivosSection', () => {
  it('lista motivos al cargar y no ofrece boton de borrado', async () => {
    const client = makeClient({
      getMotivos: vi.fn().mockResolvedValue({ ok: true, data: [sampleMotivo] }),
    });

    render(<MotivosSection apiClient={client} onSessionExpired={vi.fn()} />);

    expect(await screen.findByText('Control general')).toBeTruthy();
    expect(screen.getByText('30 min')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /eliminar|borrar/i })).toBeNull();
  });

  it('crea motivo enviando duracionMinutos como entero JSON y actualiza la lista en 201', async () => {
    const user = userEvent.setup();
    const created: Motivo = {
      id: '22222222-2222-2222-2222-222222222222',
      nombre: 'Endodoncia',
      duracionMinutos: 60,
    };
    const createMotivo = vi.fn().mockResolvedValue({ ok: true, data: created });
    const client = makeClient({ createMotivo });

    render(<MotivosSection apiClient={client} onSessionExpired={vi.fn()} />);
    await screen.findByText(/no hay motivos cargados/i);

    await user.type(screen.getByLabelText(/nombre del motivo/i), 'Endodoncia');
    await user.selectOptions(screen.getByLabelText(/duración/i), '60');
    await user.click(screen.getByRole('button', { name: /crear motivo/i }));

    expect(createMotivo).toHaveBeenCalledWith({ nombre: 'Endodoncia', duracionMinutos: 60 });
    expect(typeof createMotivo.mock.calls[0]?.[0]?.duracionMinutos).toBe('number');
    expect(await screen.findByText('Endodoncia')).toBeTruthy();
  });

  it('edita un motivo existente y solo actualiza tras recibir 200', async () => {
    const user = userEvent.setup();
    const updated: Motivo = { ...sampleMotivo, nombre: 'Control anual', duracionMinutos: 45 };
    const updateMotivo = vi.fn().mockResolvedValue({ ok: true, data: updated });
    const client = makeClient({
      getMotivos: vi.fn().mockResolvedValue({ ok: true, data: [sampleMotivo] }),
      updateMotivo,
    });

    render(<MotivosSection apiClient={client} onSessionExpired={vi.fn()} />);
    await screen.findByText('Control general');

    await user.click(screen.getByRole('button', { name: /editar/i }));
    const nameInput = screen.getByLabelText(/nombre del motivo/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Control anual');
    await user.selectOptions(screen.getByLabelText(/duración/i), '45');
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(updateMotivo).toHaveBeenCalledWith(sampleMotivo.id, {
      nombre: 'Control anual',
      duracionMinutos: 45,
    });
    expect(await screen.findByText('Control anual')).toBeTruthy();
  });

  it('muestra error ante 400 VALIDATION_ERROR o 404 MOTIVO_NOT_FOUND sin alterar la lista', async () => {
    const user = userEvent.setup();
    const updateMotivo = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      codigo: 'MOTIVO_NOT_FOUND',
      message: 'El motivo de consulta seleccionado ya no existe.',
    });
    const client = makeClient({
      getMotivos: vi.fn().mockResolvedValue({ ok: true, data: [sampleMotivo] }),
      updateMotivo,
    });

    render(<MotivosSection apiClient={client} onSessionExpired={vi.fn()} />);
    await screen.findByText('Control general');

    await user.click(screen.getByRole('button', { name: /editar/i }));
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/ya no existe/i);
    expect(screen.getByText('Control general')).toBeTruthy();
  });

  it('rechaza nombre vacio en cliente sin llamar a la API', async () => {
    const user = userEvent.setup();
    const createMotivo = vi.fn();
    const client = makeClient({ createMotivo });

    render(<MotivosSection apiClient={client} onSessionExpired={vi.fn()} />);
    await screen.findByText(/no hay motivos cargados/i);

    await user.click(screen.getByRole('button', { name: /crear motivo/i }));
    expect(createMotivo).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toMatch(/ingresá un nombre/i);
  });
});
