import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '../api/apiClient';
import type {
  AgendaResponse,
  ApiResult,
  TurnoDetalleResponse,
} from '../types/odontologia';
import { AgendaSection } from './AgendaSection';

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

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
    getBloqueos: vi.fn(),
    createBloqueo: vi.fn(),
    deleteBloqueo: vi.fn(),
    getAgenda: vi.fn().mockResolvedValue({
      ok: true,
      data: sampleAgendaDia,
    }),
    getTurnoDetalle: vi.fn().mockResolvedValue({
      ok: true,
      data: sampleDetalleConfirmado,
    }),
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

const TURNO_1_ID = '11111111-1111-1111-1111-111111111111';
const TURNO_2_ID = '22222222-2222-2222-2222-222222222222';

const sampleAgendaDia: AgendaResponse = {
  vista: 'DIA',
  desde: '2026-12-10',
  hasta: '2026-12-10',
  zonaHoraria: 'America/Argentina/Mendoza',
  turnos: [
    {
      id: TURNO_1_ID,
      motivoId: 'aaaa1111-1111-1111-1111-111111111111',
      motivoNombre: 'Limpieza dental',
      inicio: '2026-12-10T12:00:00Z',
      fin: '2026-12-10T12:30:00Z',
      duracionReservadaMinutos: 30,
      estado: 'CONFIRMADO',
      pacienteNombre: 'Lucía',
      pacienteApellido: 'Gómez',
    },
    {
      id: TURNO_2_ID,
      motivoId: 'bbbb2222-2222-2222-2222-222222222222',
      motivoNombre: 'Extracción',
      inicio: '2026-12-10T14:00:00Z',
      fin: '2026-12-10T14:45:00Z',
      duracionReservadaMinutos: 45,
      estado: 'CANCELADO',
      pacienteNombre: 'Marcos',
      pacienteApellido: 'Pérez',
    },
  ],
};

const sampleAgendaSemana: AgendaResponse = {
  vista: 'SEMANA',
  desde: '2026-12-07',
  hasta: '2026-12-13',
  zonaHoraria: 'America/Argentina/Mendoza',
  turnos: [
    {
      id: TURNO_1_ID,
      motivoId: 'aaaa1111-1111-1111-1111-111111111111',
      motivoNombre: 'Limpieza dental',
      inicio: '2026-12-10T12:00:00Z',
      fin: '2026-12-10T12:30:00Z',
      duracionReservadaMinutos: 30,
      estado: 'CONFIRMADO',
      pacienteNombre: 'Lucía',
      pacienteApellido: 'Gómez',
    },
  ],
};

const sampleDetalleConfirmado: TurnoDetalleResponse = {
  id: TURNO_1_ID,
  motivoId: 'aaaa1111-1111-1111-1111-111111111111',
  motivoNombre: 'Limpieza dental',
  inicio: '2026-12-10T12:00:00Z',
  fin: '2026-12-10T12:30:00Z',
  duracionReservadaMinutos: 30,
  estado: 'CONFIRMADO',
  revision: 2,
  creadoEn: '2026-12-01T15:30:00Z',
  canceladoEn: null,
  paciente: {
    nombre: 'Lucía',
    apellido: 'Gómez',
    email: 'lucia.gomez@example.com',
    telefono: '+54 261 555 0101',
    dni: '35123456',
  },
};

const sampleDetalleCancelado: TurnoDetalleResponse = {
  id: TURNO_2_ID,
  motivoId: 'bbbb2222-2222-2222-2222-222222222222',
  motivoNombre: 'Extracción',
  inicio: '2026-12-10T14:00:00Z',
  fin: '2026-12-10T14:45:00Z',
  duracionReservadaMinutos: 45,
  estado: 'CANCELADO',
  revision: 0,
  creadoEn: '2026-12-01T15:30:00Z',
  canceladoEn: '2026-12-05T18:15:00Z',
  paciente: {
    nombre: 'Marcos',
    apellido: 'Pérez',
    email: 'marcos.perez@example.com',
    telefono: '+54 261 555 0202',
    dni: '38999111',
  },
};

describe('AgendaSection', () => {
  it('carga vista DIA inicial sin fecha, formatea periodo y horarios en zonaHoraria, respeta orden y distingue CONFIRMADO de CANCELADO', async () => {
    const getAgenda = vi.fn().mockResolvedValue({ ok: true, data: sampleAgendaDia });
    render(<AgendaSection apiClient={makeClient({ getAgenda })} onSessionExpired={vi.fn()} />);

    expect(await screen.findByText(/^10\/12\/2026$/)).toBeTruthy();
    expect(getAgenda).toHaveBeenCalledTimes(1);
    expect(getAgenda).toHaveBeenCalledWith({ vista: 'DIA' });

    const list = screen.getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);

    // Respeta orden recibido y muestra horarios en America/Argentina/Mendoza (UTC-3)
    expect(items[0]?.textContent).toMatch(/09:00 a 09:30/);
    expect(items[0]?.textContent).toMatch(/Limpieza dental/);
    expect(items[0]?.textContent).toMatch(/Lucía Gómez/);
    expect(items[0]?.textContent).toMatch(/Confirmado/i);

    expect(items[1]?.textContent).toMatch(/11:00 a 11:45/);
    expect(items[1]?.textContent).toMatch(/Extracción/);
    expect(items[1]?.textContent).toMatch(/Marcos Pérez/);
    expect(items[1]?.textContent).toMatch(/Cancelado.*horario liberado/i);
  });

  it('permite cambiar vista DIA/SEMANA, navegar Anterior/Siguiente, elegir fecha valida e invalida y volver a Hoy', async () => {
    const user = userEvent.setup();
    const getAgenda = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaDia })
      .mockResolvedValueOnce({ ok: true, data: { ...sampleAgendaDia, desde: '2026-12-11', hasta: '2026-12-11' } })
      .mockResolvedValueOnce({ ok: true, data: { ...sampleAgendaDia, desde: '2026-12-10', hasta: '2026-12-10' } })
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaSemana })
      .mockResolvedValueOnce({ ok: true, data: { ...sampleAgendaSemana, desde: '2026-12-14', hasta: '2026-12-20' } })
      .mockResolvedValueOnce({ ok: true, data: { ...sampleAgendaSemana, desde: '2026-12-07', hasta: '2026-12-13' } })
      .mockResolvedValueOnce({ ok: true, data: { ...sampleAgendaSemana, desde: '2026-12-21', hasta: '2026-12-27' } })
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaSemana });

        render(<AgendaSection apiClient={makeClient({ getAgenda })} onSessionExpired={vi.fn()} />);
    await screen.findByText(/^10\/12\/2026$/);

    // Siguiente / Anterior en DIA (+1 / -1)
    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(getAgenda).toHaveBeenLastCalledWith({ vista: 'DIA', fecha: '2026-12-11' });
    });

    await user.click(screen.getByRole('button', { name: /anterior/i }));
    await waitFor(() => {
      expect(getAgenda).toHaveBeenLastCalledWith({ vista: 'DIA', fecha: '2026-12-10' });
    });

    // Cambiar a vista SEMANA
    await user.click(screen.getByRole('button', { name: /semana/i }));
    await waitFor(() => {
      expect(getAgenda).toHaveBeenLastCalledWith({ vista: 'SEMANA', fecha: '2026-12-10' });
    });
    expect(await screen.findByText(/07\/12\/2026 al 13\/12\/2026/)).toBeTruthy();

    // Siguiente / Anterior en SEMANA (+7 / -7 usando selectedFecha ?? agenda.desde)
    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(getAgenda).toHaveBeenLastCalledWith({ vista: 'SEMANA', fecha: '2026-12-17' });
    });

    await user.click(screen.getByRole('button', { name: /anterior/i }));
    await waitFor(() => {
      expect(getAgenda).toHaveBeenLastCalledWith({ vista: 'SEMANA', fecha: '2026-12-10' });
    });

    // Selector de fecha invalida/vacia muestra validacion y no llama getAgenda
    const callsBeforeInvalid = getAgenda.mock.calls.length;
    const dateInput = screen.getByLabelText(/fecha/i) as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: '' } });
    expect((await screen.findByRole('alert')).textContent).toMatch(/fecha válida/i);
    expect(getAgenda).toHaveBeenCalledTimes(callsBeforeInvalid);

    // Fecha valida consulta getAgenda con esa fecha
    fireEvent.change(dateInput, { target: { value: '2026-12-22' } });
    await waitFor(() => {
      expect(getAgenda).toHaveBeenLastCalledWith({ vista: 'SEMANA', fecha: '2026-12-22' });
    });

    // Boton Hoy vuelve a llamar sin fecha
    await user.click(screen.getByRole('button', { name: /^hoy$/i }));
    await waitFor(() => {
      expect(getAgenda).toHaveBeenLastCalledWith({ vista: 'SEMANA' });
    });
  });

  it('distingue agenda vacia de error de consulta, limpia turnos previos ante error (FL-01) y permite reintentar', async () => {
    const user = userEvent.setup();
    const getAgenda = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaDia })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        codigo: 'TECHNICAL_FAILURE',
        message: 'Ocurrió un error técnico en el servidor. No se guardaron cambios.',
      })
      .mockResolvedValueOnce({
        ok: true,
        data: { ...sampleAgendaDia, desde: '2026-12-11', hasta: '2026-12-11', turnos: [] },
      });

    render(<AgendaSection apiClient={makeClient({ getAgenda })} onSessionExpired={vi.fn()} />);
    expect(await screen.findByText(/Lucía Gómez/)).toBeTruthy();

    // Error al cambiar a siguiente dia limpia los turnos previos
    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/error técnico/i);
    expect(screen.queryByText(/Lucía Gómez/)).toBeNull();

    // Reintentar consulta y obtiene agenda vacia sin role="alert"
    await user.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(await screen.findByText(/no hay turnos/i)).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('descarta respuestas fuera de orden de getAgenda y getTurnoDetalle', async () => {
    const user = userEvent.setup();
    const agendaFirst = createDeferred<ApiResult<AgendaResponse>>();
    const agendaSecond = createDeferred<ApiResult<AgendaResponse>>();
    const detalleFirst = createDeferred<ApiResult<TurnoDetalleResponse>>();
    const detalleSecond = createDeferred<ApiResult<TurnoDetalleResponse>>();

    const getAgenda = vi
      .fn()
      .mockReturnValueOnce(agendaFirst.promise)
      .mockReturnValueOnce(agendaSecond.promise);
    const getTurnoDetalle = vi
      .fn()
      .mockReturnValueOnce(detalleFirst.promise)
      .mockReturnValueOnce(detalleSecond.promise);

    render(
      <AgendaSection
        apiClient={makeClient({ getAgenda, getTurnoDetalle })}
        onSessionExpired={vi.fn()}
      />,
    );

    // Dispara una segunda consulta antes de que resuelva la primera
    await user.click(screen.getByRole('button', { name: /semana/i }));

    agendaSecond.resolve({
      ok: true,
      data: {
        ...sampleAgendaSemana,
        turnos: [
          {
            ...sampleAgendaDia.turnos[0]!,
            id: TURNO_1_ID,
            pacienteNombre: 'Sofía',
            pacienteApellido: 'Reciente',
          },
          sampleAgendaDia.turnos[1]!,
        ],
      },
    });
    expect(await screen.findByText(/Sofía Reciente/)).toBeTruthy();

    // Resuelve la primera consulta tarde: NO debe pisar la mas reciente
    agendaFirst.resolve({
      ok: true,
      data: {
        ...sampleAgendaDia,
        turnos: [
          {
            ...sampleAgendaDia.turnos[0]!,
            id: TURNO_1_ID,
            pacienteNombre: 'Viejo',
            pacienteApellido: 'Tardio',
          },
        ],
      },
    });
    await waitFor(() => {
      expect(screen.getByText(/Sofía Reciente/)).toBeTruthy();
    });
    expect(screen.queryByText(/Viejo Tardio/)).toBeNull();

    // Ahora probar out-of-order en getTurnoDetalle
    await user.click(screen.getByRole('button', { name: /Sofía Reciente/i }));
    await user.click(screen.getByRole('button', { name: /Marcos Pérez/i }));

    detalleSecond.resolve({ ok: true, data: sampleDetalleCancelado });
    expect(await screen.findByText(/marcos\.perez@example\.com/i)).toBeTruthy();

    detalleFirst.resolve({ ok: true, data: sampleDetalleConfirmado });
    await waitFor(() => {
      expect(screen.getByText(/marcos\.perez@example\.com/i)).toBeTruthy();
    });
    expect(screen.queryByText(/lucia\.gomez@example\.com/i)).toBeNull();
  });

  it('abre detalle del turno con 5 datos del paciente, revision sin REPROGRAMADO (RN-RP-02), canceladoEn en zonaHoraria y permite cerrarlo', async () => {
    const user = userEvent.setup();
    const getTurnoDetalle = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleDetalleConfirmado })
      .mockResolvedValueOnce({ ok: true, data: sampleDetalleCancelado });

    render(
      <AgendaSection
        apiClient={makeClient({ getTurnoDetalle })}
        onSessionExpired={vi.fn()}
      />,
    );

    await screen.findByText(/Lucía Gómez/);
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));

    const detailPanel = await screen.findByRole('region', { name: /detalle del turno/i });
    expect(within(detailPanel).getByText(/Limpieza dental/)).toBeTruthy();
    expect(within(detailPanel).getByText(/30 min/)).toBeTruthy();
    expect(within(detailPanel).getByText(/Confirmado/i)).toBeTruthy();
    expect(within(detailPanel).getByText(/Revisión:\s*2/i)).toBeTruthy();
    expect(within(detailPanel).getByText(/01\/12\/2026.*12:30/)).toBeTruthy();
    expect(within(detailPanel).getByText(/Lucía Gómez/)).toBeTruthy();
    expect(within(detailPanel).getByText(/lucia\.gomez@example\.com/)).toBeTruthy();
    expect(within(detailPanel).getByText(/\+54 261 555 0101/)).toBeTruthy();
    expect(within(detailPanel).getByText(/35123456/)).toBeTruthy();
    // RN-RP-02: nunca mostrar texto REPROGRAMADO
    expect(document.body.textContent ?? '').not.toMatch(/reprogramado/i);

    // Abrir turno cancelado muestra canceladoEn en America/Argentina/Mendoza (18:15Z -> 15:15)
    await user.click(screen.getByRole('button', { name: /Marcos Pérez/i }));
    await waitFor(() => {
      expect(within(detailPanel).getByText(/marcos\.perez@example\.com/)).toBeTruthy();
    });
    expect(within(detailPanel).getByText(/05\/12\/2026.*15:15/)).toBeTruthy();

    // Cerrar detalle
    await user.click(within(detailPanel).getByRole('button', { name: /cerrar detalle/i }));
    expect(screen.queryByRole('region', { name: /detalle del turno/i })).toBeNull();
  });

  it('ante 404 TURNO_NOT_FOUND al abrir detalle muestra alerta en detalle sin romper la lista', async () => {
    const user = userEvent.setup();
    const getTurnoDetalle = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      codigo: 'TURNO_NOT_FOUND',
      message: 'El turno seleccionado no existe en la agenda.',
    });

    render(
      <AgendaSection
        apiClient={makeClient({ getTurnoDetalle })}
        onSessionExpired={vi.fn()}
      />,
    );

    await screen.findByText(/Lucía Gómez/);
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));

    const detailPanel = await screen.findByRole('region', { name: /detalle del turno/i });
    expect(within(detailPanel).getByRole('alert').textContent).toMatch(/no existe/i);
    // Lista intacta
    expect(screen.getByText(/Lucía Gómez/)).toBeTruthy();
    expect(screen.getByText(/Marcos Pérez/)).toBeTruthy();
  });

  it('Actualizar refresca agenda y detalle en paralelo, y cierra detalle si el turno salio del periodo o devuelve 404', async () => {
    const user = userEvent.setup();
    const getAgenda = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaDia })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          ...sampleAgendaDia,
          turnos: [
            {
              ...sampleAgendaDia.turnos[0]!,
              inicio: '2026-12-10T15:00:00Z',
              fin: '2026-12-10T15:30:00Z',
            },
            sampleAgendaDia.turnos[1]!,
          ],
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          ...sampleAgendaDia,
          turnos: [sampleAgendaDia.turnos[1]!],
        },
      });

    const getTurnoDetalle = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleDetalleConfirmado })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          ...sampleDetalleConfirmado,
          inicio: '2026-12-10T15:00:00Z',
          fin: '2026-12-10T15:30:00Z',
          revision: 3,
        },
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        codigo: 'TURNO_NOT_FOUND',
        message: 'El turno seleccionado no existe en la agenda.',
      });

    render(
      <AgendaSection
        apiClient={makeClient({ getAgenda, getTurnoDetalle })}
        onSessionExpired={vi.fn()}
      />,
    );

    await screen.findByText(/Lucía Gómez/);
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));
    await screen.findByText(/Revisión:\s*2/i);

    // Primera actualizacion: ejecuta ambos en paralelo y actualiza lista + detalle
    await user.click(screen.getByRole('button', { name: /actualizar/i }));
    await waitFor(() => {
      expect(screen.getByText(/Revisión:\s*3/i)).toBeTruthy();
    });
    expect(getAgenda).toHaveBeenCalledTimes(2);
    expect(getTurnoDetalle).toHaveBeenCalledTimes(2);

    // Segunda actualizacion: el turno salio de agenda.turnos -> cierra detalle
    await user.click(screen.getByRole('button', { name: /actualizar/i }));
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: /detalle del turno/i })).toBeNull();
    });
  });

  it('cierra detalle si Actualizar recibe 404 TURNO_NOT_FOUND aunque el turno siga listado y maneja NETWORK_ERROR', async () => {
    const user = userEvent.setup();
    const getAgenda = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaDia })
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaDia })
      .mockResolvedValueOnce({
        ok: false,
        status: 0,
        codigo: 'NETWORK_ERROR',
        message: 'No se pudo conectar con el servidor. Verificá la conexión e intentá nuevamente.',
      });

    const getTurnoDetalle = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleDetalleConfirmado })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        codigo: 'TURNO_NOT_FOUND',
        message: 'El turno seleccionado no existe en la agenda.',
      });

    render(
      <AgendaSection
        apiClient={makeClient({ getAgenda, getTurnoDetalle })}
        onSessionExpired={vi.fn()}
      />,
    );

    await screen.findByText(/Lucía Gómez/);
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));
    await screen.findByRole('region', { name: /detalle del turno/i });

    await user.click(screen.getByRole('button', { name: /actualizar/i }));
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: /detalle del turno/i })).toBeNull();
    });

    await user.click(screen.getByRole('button', { name: /actualizar/i }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/conectar con el servidor/i);
    expect(screen.queryByText(/Lucía Gómez/)).toBeNull();
  });

  it('invoca onSessionExpired ante 401 SESSION_REQUIRED en getAgenda o getTurnoDetalle', async () => {
    const user = userEvent.setup();
    const onSessionExpired1 = vi.fn();
    const getAgenda401 = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      codigo: 'SESSION_REQUIRED',
      message: 'Tu sesión expiró o no está activa. Volvé a ingresar.',
    });

    const { unmount } = render(
      <AgendaSection
        apiClient={makeClient({ getAgenda: getAgenda401 })}
        onSessionExpired={onSessionExpired1}
      />,
    );

    await waitFor(() => {
      expect(onSessionExpired1).toHaveBeenCalledWith(
        'Tu sesión expiró o no está activa. Volvé a ingresar.',
      );
    });
    unmount();

    const onSessionExpired2 = vi.fn();
    const getTurnoDetalle401 = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      codigo: 'SESSION_REQUIRED',
      message: 'Tu sesión expiró o no está activa. Volvé a ingresar.',
    });

    render(
      <AgendaSection
        apiClient={makeClient({ getTurnoDetalle: getTurnoDetalle401 })}
        onSessionExpired={onSessionExpired2}
      />,
    );

    await screen.findByText(/Lucía Gómez/);
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));

    await waitFor(() => {
      expect(onSessionExpired2).toHaveBeenCalledWith(
        'Tu sesión expiró o no está activa. Volvé a ingresar.',
      );
    });
  });

  it('es de solo lectura y navegable por teclado', async () => {
    const user = userEvent.setup();
    const getTurnoDetalle = vi.fn().mockResolvedValue({ ok: true, data: sampleDetalleConfirmado });
    render(
      <AgendaSection
        apiClient={makeClient({ getTurnoDetalle })}
        onSessionExpired={vi.fn()}
      />,
    );

    await screen.findByText(/Lucía Gómez/);

    // Ausencia de acciones fuera de alcance (solo lectura)
    expect(screen.queryByRole('button', { name: /editar|eliminar|borrar|cancelar turno|reprogramar|cobrar|nuevo turno/i })).toBeNull();
    expect(screen.queryByText(/historia clínica|cobros|pagos/i)).toBeNull();

    // Recorrido con teclado hasta el primer turno y activacion con Enter
    const turnoButton = screen.getByRole('button', { name: /Lucía Gómez/i });
    let focused = false;
    for (let i = 0; i < 15; i += 1) {
      await user.tab();
      if (document.activeElement === turnoButton) {
        focused = true;
        break;
      }
    }
    expect(focused).toBe(true);
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('region', { name: /detalle del turno/i })).toBeTruthy();
  });

  it('cierra el detalle si al cambiar fecha (Siguiente) el turno ya no pertenece al periodo', async () => {
    const user = userEvent.setup();
    const getAgenda = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaDia })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          ...sampleAgendaDia,
          desde: '2026-12-11',
          hasta: '2026-12-11',
          turnos: [sampleAgendaDia.turnos[1]!],
        },
      });

    render(
      <AgendaSection
        apiClient={makeClient({ getAgenda })}
        onSessionExpired={vi.fn()}
      />,
    );

    await screen.findByText(/Lucía Gómez/);
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));
    expect(await screen.findByRole('region', { name: /detalle del turno/i })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    await waitFor(() => {
      expect(screen.getByText(/^11\/12\/2026$/)).toBeTruthy();
    });
    expect(screen.queryByRole('region', { name: /detalle del turno/i })).toBeNull();
  });

  it('conserva el detalle al alternar Dia -> Semana si el turno sigue en la respuesta y lo cierra ante periodo vacio', async () => {
    const user = userEvent.setup();
    const getAgenda = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaDia })
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaSemana })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          ...sampleAgendaSemana,
          desde: '2026-12-14',
          hasta: '2026-12-20',
          turnos: [],
        },
      });

    render(
      <AgendaSection
        apiClient={makeClient({ getAgenda })}
        onSessionExpired={vi.fn()}
      />,
    );

    await screen.findByText(/Lucía Gómez/);
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));
    expect(await screen.findByRole('region', { name: /detalle del turno/i })).toBeTruthy();

    // Alternar DIA -> SEMANA donde TURNO_1_ID sigue presente
    await user.click(screen.getByRole('button', { name: /semana/i }));
    await screen.findByText(/07\/12\/2026 al 13\/12\/2026/);
    expect(screen.getByRole('region', { name: /detalle del turno/i })).toBeTruthy();

    // Cambiar a un periodo vacio -> cierra el detalle
    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    await screen.findByText(/no hay turnos/i);
    expect(screen.queryByRole('region', { name: /detalle del turno/i })).toBeNull();
  });

  it('limpia el detalle abierto si el cambio de periodo falla con 500 TECHNICAL_FAILURE o fecha invalida en input', async () => {
    const user = userEvent.setup();
    const getAgenda = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaDia })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        codigo: 'TECHNICAL_FAILURE',
        message: 'Ocurrió un error técnico en el servidor.',
      })
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaDia });

    render(
      <AgendaSection
        apiClient={makeClient({ getAgenda })}
        onSessionExpired={vi.fn()}
      />,
    );

    await screen.findByText(/Lucía Gómez/);
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));
    expect(await screen.findByRole('region', { name: /detalle del turno/i })).toBeTruthy();

    // Falla 500 TECHNICAL_FAILURE al cambiar de periodo
    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/error técnico/i);
    expect(screen.queryByRole('region', { name: /detalle del turno/i })).toBeNull();

    // Reintentar para recuperar la agenda y volver a abrir el detalle
    await user.click(screen.getByRole('button', { name: /reintentar/i }));
    await screen.findByText(/Lucía Gómez/);
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));
    expect(await screen.findByRole('region', { name: /detalle del turno/i })).toBeTruthy();

    // Fecha invalida en el input limpia agenda y detalle anterior
    const dateInput = screen.getByLabelText(/fecha/i);
    fireEvent.change(dateInput, { target: { value: '' } });
    expect((await screen.findByRole('alert')).textContent).toMatch(/fecha válida/i);
    expect(screen.queryByRole('region', { name: /detalle del turno/i })).toBeNull();
  });

  it('descarta respuesta demorada de getTurnoDetalle tras cierre manual', async () => {
    const user = userEvent.setup();
    const detalleDeferred = createDeferred<ApiResult<TurnoDetalleResponse>>();
    const getTurnoDetalle = vi.fn().mockReturnValueOnce(detalleDeferred.promise);

    render(
      <AgendaSection
        apiClient={makeClient({ getTurnoDetalle })}
        onSessionExpired={vi.fn()}
      />,
    );

    await screen.findByText(/Lucía Gómez/);
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));
    const detailPanel = await screen.findByRole('region', { name: /detalle del turno/i });

    await user.click(within(detailPanel).getByRole('button', { name: /cerrar detalle/i }));
    expect(screen.queryByRole('region', { name: /detalle del turno/i })).toBeNull();

    detalleDeferred.resolve({ ok: true, data: sampleDetalleConfirmado });
    await waitFor(() => {
      expect(getTurnoDetalle).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByRole('region', { name: /detalle del turno/i })).toBeNull();
  });

  it('descarta respuesta demorada de getTurnoDetalle si se cambio a un periodo sin el turno', async () => {
    const user = userEvent.setup();
    const detalleDeferred = createDeferred<ApiResult<TurnoDetalleResponse>>();
    const getAgenda = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaDia })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          ...sampleAgendaDia,
          desde: '2026-12-11',
          hasta: '2026-12-11',
          turnos: [],
        },
      });
    const getTurnoDetalle = vi.fn().mockReturnValueOnce(detalleDeferred.promise);

    render(
      <AgendaSection
        apiClient={makeClient({ getAgenda, getTurnoDetalle })}
        onSessionExpired={vi.fn()}
      />,
    );

    await screen.findByText(/Lucía Gómez/);
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));
    expect(await screen.findByRole('region', { name: /detalle del turno/i })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    await screen.findByText(/no hay turnos/i);
    expect(screen.queryByRole('region', { name: /detalle del turno/i })).toBeNull();

    detalleDeferred.resolve({ ok: true, data: sampleDetalleConfirmado });
    await waitFor(() => {
      expect(getTurnoDetalle).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByRole('region', { name: /detalle del turno/i })).toBeNull();
  });

  it('conserva Actualizar cuando el turno sigue en el periodo y descarta respuesta demorada si se cierra manualmente mientras carga detalle', async () => {
    const user = userEvent.setup();
    const detalleDeferred = createDeferred<ApiResult<TurnoDetalleResponse>>();

    const getAgenda = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaDia })
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaDia });

    const getTurnoDetalle = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleDetalleConfirmado })
      .mockResolvedValueOnce({
        ok: true,
        data: { ...sampleDetalleConfirmado, revision: 3 },
      })
      .mockReturnValueOnce(detalleDeferred.promise);

    render(
      <AgendaSection
        apiClient={makeClient({ getAgenda, getTurnoDetalle })}
        onSessionExpired={vi.fn()}
      />,
    );

    await screen.findByText(/Lucía Gómez/);
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));
    await screen.findByText(/Revisión:\s*2/i);

    // Actualizar con turno vigente
    await user.click(screen.getByRole('button', { name: /actualizar/i }));
    await waitFor(() => {
      expect(screen.getByText(/Revisión:\s*3/i)).toBeTruthy();
    });

    // Seleccionar otro turno con respuesta demorada y cerrar manualmente antes de resolver
    await user.click(screen.getByRole('button', { name: /Marcos Pérez/i }));
    const detailPanel = screen.getByRole('region', { name: /detalle del turno/i });
    await user.click(within(detailPanel).getByRole('button', { name: /cerrar detalle/i }));
    expect(screen.queryByRole('region', { name: /detalle del turno/i })).toBeNull();

    detalleDeferred.resolve({ ok: true, data: sampleDetalleCancelado });
    await waitFor(() => {
      expect(getTurnoDetalle).toHaveBeenCalledTimes(3);
    });
    expect(screen.queryByRole('region', { name: /detalle del turno/i })).toBeNull();
  });

  it('muestra siempre el campo Revision (incluido 0) en turnos confirmados recien reservados y reprogramados sin texto Reprogramado', async () => {
    const user = userEvent.setup();
    const detalleRecienReservado: TurnoDetalleResponse = {
      ...sampleDetalleConfirmado,
      revision: 0,
      canceladoEn: null,
    };
    const detalleReprogramado: TurnoDetalleResponse = {
      ...sampleDetalleConfirmado,
      id: TURNO_2_ID,
      revision: 2,
      canceladoEn: null,
    };

    const getTurnoDetalle = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: detalleRecienReservado })
      .mockResolvedValueOnce({ ok: true, data: detalleReprogramado });

    render(
      <AgendaSection
        apiClient={makeClient({ getTurnoDetalle })}
        onSessionExpired={vi.fn()}
      />,
    );

    await screen.findByText(/Lucía Gómez/);
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));

    const detailPanel = await screen.findByRole('region', { name: /detalle del turno/i });
    expect(within(detailPanel).getByText('Revisión')).toBeTruthy();
    expect(within(detailPanel).getByText(/Revisión:\s*0/i)).toBeTruthy();
    expect(within(detailPanel).getByText('Confirmado')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /Marcos Pérez/i }));
    await waitFor(() => {
      expect(within(detailPanel).getByText(/Revisión:\s*2/i)).toBeTruthy();
    });
    expect(within(detailPanel).getByText('Confirmado')).toBeTruthy();
    expect(document.body.textContent ?? '').not.toMatch(/reprogramado/i);
  });

  it('invalida consulta fetchAgenda en vuelo al borrar #agenda-fecha, mantiene lista vacia, detalle cerrado, sin loading y permite elegir nueva fecha valida', async () => {
    const user = userEvent.setup();
    const delayedNext = createDeferred<ApiResult<AgendaResponse>>();
    const getAgenda = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaDia })
      .mockReturnValueOnce(delayedNext.promise)
      .mockResolvedValueOnce({
        ok: true,
        data: { ...sampleAgendaDia, desde: '2026-12-20', hasta: '2026-12-20' },
      });

    render(<AgendaSection apiClient={makeClient({ getAgenda })} onSessionExpired={vi.fn()} />);

    await screen.findByText(/Lucía Gómez/);
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));
    expect(await screen.findByRole('region', { name: /detalle del turno/i })).toBeTruthy();

    // Disparar consulta demorada al navegar con Siguiente
    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(screen.getByText(/cargando agenda/i)).toBeTruthy();

    // Borrar la fecha antes de que resuelva la promesa pendiente
    const dateInput = screen.getByLabelText(/fecha/i);
    fireEvent.change(dateInput, { target: { value: '' } });

    // Resolver la solicitud pendiente con sampleAgendaDia
    delayedNext.resolve({ ok: true, data: sampleAgendaDia });

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toMatch(/fecha válida/i);
    });
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByText(/Lucía Gómez/)).toBeNull();
    expect(screen.queryByRole('region', { name: /detalle del turno/i })).toBeNull();
    expect(screen.queryByText(/cargando agenda/i)).toBeNull();

    // Seleccionar otra fecha valida recupera la agenda y limpia el error
    fireEvent.change(dateInput, { target: { value: '2026-12-20' } });
    expect(await screen.findByText(/^20\/12\/2026$/)).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('list')).toBeTruthy();
  });

  it('invalida handleRefresh (Actualizar) en vuelo al borrar #agenda-fecha, descarta agenda/detalle tardios y permite Reintentar', async () => {
    const user = userEvent.setup();
    const delayedAgendaRefresh = createDeferred<ApiResult<AgendaResponse>>();
    const delayedDetalleRefresh = createDeferred<ApiResult<TurnoDetalleResponse>>();
    const getAgenda = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaDia })
      .mockReturnValueOnce(delayedAgendaRefresh.promise)
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaDia });
    const getTurnoDetalle = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleDetalleConfirmado })
      .mockReturnValueOnce(delayedDetalleRefresh.promise);

    render(
      <AgendaSection
        apiClient={makeClient({ getAgenda, getTurnoDetalle })}
        onSessionExpired={vi.fn()}
      />,
    );

    await screen.findByText(/Lucía Gómez/);
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));
    expect(await screen.findByRole('region', { name: /detalle del turno/i })).toBeTruthy();

    // Disparar Actualizar en vuelo
    await user.click(screen.getByRole('button', { name: /actualizar/i }));
    expect(screen.getByText(/cargando agenda/i)).toBeTruthy();

    // Borrar la fecha antes de que resuelvan las promesas de Actualizar
    const dateInput = screen.getByLabelText(/fecha/i);
    fireEvent.change(dateInput, { target: { value: '' } });

    // Resolver ambas promesas pendientes
    delayedAgendaRefresh.resolve({ ok: true, data: sampleAgendaDia });
    delayedDetalleRefresh.resolve({ ok: true, data: sampleDetalleConfirmado });

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toMatch(/fecha válida/i);
    });
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByText(/Lucía Gómez/)).toBeNull();
    expect(screen.queryByRole('region', { name: /detalle del turno/i })).toBeNull();
    expect(screen.queryByText(/cargando agenda/i)).toBeNull();

    // Reintentar recupera la agenda y limpia el error
    await user.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(await screen.findByText(/Lucía Gómez/)).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('list')).toBeTruthy();
  });

  it('no invoca onSessionExpired si handleRefresh fue invalidado por fecha invalida antes de resolver con 401', async () => {
    const user = userEvent.setup();
    const onSessionExpired = vi.fn();
    const delayedAgendaRefresh = createDeferred<ApiResult<AgendaResponse>>();
    const delayedDetalleRefresh = createDeferred<ApiResult<TurnoDetalleResponse>>();
    const getAgenda = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaDia })
      .mockReturnValueOnce(delayedAgendaRefresh.promise);
    const getTurnoDetalle = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleDetalleConfirmado })
      .mockReturnValueOnce(delayedDetalleRefresh.promise);

    render(
      <AgendaSection
        apiClient={makeClient({ getAgenda, getTurnoDetalle })}
        onSessionExpired={onSessionExpired}
      />,
    );

    await screen.findByText(/Lucía Gómez/);
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));
    expect(await screen.findByRole('region', { name: /detalle del turno/i })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /actualizar/i }));
    const dateInput = screen.getByLabelText(/fecha/i);
    fireEvent.change(dateInput, { target: { value: '' } });

    delayedAgendaRefresh.resolve({
      ok: false,
      status: 401,
      codigo: 'SESSION_REQUIRED',
      message: 'Tu sesión expiró o no está activa. Volvé a ingresar.',
    });
    delayedDetalleRefresh.resolve({
      ok: false,
      status: 401,
      codigo: 'SESSION_REQUIRED',
      message: 'Tu sesión expiró o no está activa. Volvé a ingresar.',
    });

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toMatch(/fecha válida/i);
    });
    expect(onSessionExpired).not.toHaveBeenCalled();
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByRole('region', { name: /detalle del turno/i })).toBeNull();
    expect(screen.queryByText(/cargando agenda/i)).toBeNull();
  });

  it('descarta detalle pendiente del periodo anterior al cambiar de Dia a Semana aunque el turno siga listado reprogramado y permite consultar el detalle vigente', async () => {
    const user = userEvent.setup();
    const detalleViejoDeferred = createDeferred<ApiResult<TurnoDetalleResponse>>();

    const agendaDia10am: AgendaResponse = {
      ...sampleAgendaDia,
      turnos: [
        {
          ...sampleAgendaDia.turnos[0]!,
          inicio: '2026-12-10T13:00:00Z',
          fin: '2026-12-10T13:30:00Z',
        },
      ],
    };
    const agendaSemana12pm: AgendaResponse = {
      ...sampleAgendaSemana,
      turnos: [
        {
          ...sampleAgendaDia.turnos[0]!,
          inicio: '2026-12-10T15:00:00Z',
          fin: '2026-12-10T15:30:00Z',
        },
      ],
    };
    const detalleViejo10am: TurnoDetalleResponse = {
      ...sampleDetalleConfirmado,
      inicio: '2026-12-10T13:00:00Z',
      fin: '2026-12-10T13:30:00Z',
      revision: 1,
    };
    const detalleVigente12pm: TurnoDetalleResponse = {
      ...sampleDetalleConfirmado,
      inicio: '2026-12-10T15:00:00Z',
      fin: '2026-12-10T15:30:00Z',
      revision: 2,
    };

    const getAgenda = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: agendaDia10am })
      .mockResolvedValueOnce({ ok: true, data: agendaSemana12pm });
    const getTurnoDetalle = vi
      .fn()
      .mockReturnValueOnce(detalleViejoDeferred.promise)
      .mockResolvedValueOnce({ ok: true, data: detalleVigente12pm });

    render(
      <AgendaSection
        apiClient={makeClient({ getAgenda, getTurnoDetalle })}
        onSessionExpired={vi.fn()}
      />,
    );

    await screen.findByText(/10:00 a 10:30/);
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));
    expect(screen.getByText(/cargando detalle/i)).toBeTruthy();

    // Mientras #1 sigue pendiente, cambia a Semana donde el turno figura reprogramado a las 12:00
    await user.click(screen.getByRole('button', { name: /semana/i }));
    await screen.findByText(/12:00 a 12:30/);
    expect(screen.queryByText(/cargando detalle/i)).toBeNull();

    // Llega la respuesta anterior (10:00, revision 1): NO debe mostrarse ni reabrir el panel
    detalleViejoDeferred.resolve({ ok: true, data: detalleViejo10am });
    await waitFor(() => {
      expect(getTurnoDetalle).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByRole('region', { name: /detalle del turno/i })).toBeNull();
    expect(screen.queryByText(/Revisión:\s*1/i)).toBeNull();
    expect(screen.queryByText(/cargando detalle/i)).toBeNull();

    // Permite volver a consultar el detalle vigente del turno en Semana
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));
    const detailPanel = await screen.findByRole('region', { name: /detalle del turno/i });
    expect(await within(detailPanel).findByText(/12:00 a 12:30/)).toBeTruthy();
    expect(within(detailPanel).getByText(/Revisión:\s*2/i)).toBeTruthy();
    expect(getTurnoDetalle).toHaveBeenCalledTimes(2);
  });

  it('una respuesta 401 SESSION_REQUIRED de detalle descartada tras cambiar vista no altera sesion ni deja indicador de carga', async () => {
    const user = userEvent.setup();
    const onSessionExpired = vi.fn();
    const detalle401Deferred = createDeferred<ApiResult<TurnoDetalleResponse>>();

    const getAgenda = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaDia })
      .mockResolvedValueOnce({ ok: true, data: sampleAgendaSemana });
    const getTurnoDetalle = vi.fn().mockReturnValueOnce(detalle401Deferred.promise);

    render(
      <AgendaSection
        apiClient={makeClient({ getAgenda, getTurnoDetalle })}
        onSessionExpired={onSessionExpired}
      />,
    );

    await screen.findByText(/Lucía Gómez/);
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));
    expect(screen.getByText(/cargando detalle/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /semana/i }));
    await screen.findByText(/07\/12\/2026 al 13\/12\/2026/);

    detalle401Deferred.resolve({
      ok: false,
      status: 401,
      codigo: 'SESSION_REQUIRED',
      message: 'Tu sesión expiró o no está activa. Volvé a ingresar.',
    });

    await waitFor(() => {
      expect(getTurnoDetalle).toHaveBeenCalledTimes(1);
    });
    expect(onSessionExpired).not.toHaveBeenCalled();
    expect(screen.queryByText(/cargando detalle/i)).toBeNull();
    expect(screen.queryByRole('region', { name: /detalle del turno/i })).toBeNull();
    expect(screen.getByText(/Lucía Gómez/)).toBeTruthy();
  });

  it('al cambiar de fecha descarta detalle pendiente y si un detalle ya abierto cambio de horario lo actualiza al nuevo periodo', async () => {
    const user = userEvent.setup();
    const detallePendienteDeferred = createDeferred<ApiResult<TurnoDetalleResponse>>();

    const agendaDia1 = sampleAgendaDia;
    const agendaDia2: AgendaResponse = {
      ...sampleAgendaDia,
      desde: '2026-12-11',
      hasta: '2026-12-11',
      turnos: [
        {
          ...sampleAgendaDia.turnos[0]!,
          inicio: '2026-12-11T15:00:00Z',
          fin: '2026-12-11T15:30:00Z',
        },
      ],
    };
    const agendaSemanaReprogramada: AgendaResponse = {
      ...sampleAgendaSemana,
      turnos: [
        {
          ...sampleAgendaDia.turnos[0]!,
          inicio: '2026-12-11T17:00:00Z',
          fin: '2026-12-11T17:30:00Z',
        },
      ],
    };
    const detalleDia2: TurnoDetalleResponse = {
      ...sampleDetalleConfirmado,
      inicio: '2026-12-11T15:00:00Z',
      fin: '2026-12-11T15:30:00Z',
      revision: 1,
    };
    const detalleSemanaReprogramada: TurnoDetalleResponse = {
      ...sampleDetalleConfirmado,
      inicio: '2026-12-11T17:00:00Z',
      fin: '2026-12-11T17:30:00Z',
      revision: 2,
    };

    const getAgenda = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: agendaDia1 })
      .mockResolvedValueOnce({ ok: true, data: agendaDia2 })
      .mockResolvedValueOnce({ ok: true, data: agendaSemanaReprogramada });
    const getTurnoDetalle = vi
      .fn()
      .mockReturnValueOnce(detallePendienteDeferred.promise)
      .mockResolvedValueOnce({ ok: true, data: detalleDia2 })
      .mockResolvedValueOnce({ ok: true, data: detalleSemanaReprogramada });

    render(
      <AgendaSection
        apiClient={makeClient({ getAgenda, getTurnoDetalle })}
        onSessionExpired={vi.fn()}
      />,
    );

    await screen.findByText(/Lucía Gómez/);
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));
    expect(screen.getByText(/cargando detalle/i)).toBeTruthy();

    // Cambiar fecha mientras el detalle anterior esta pendiente
    const dateInput = screen.getByLabelText(/fecha/i);
    fireEvent.change(dateInput, { target: { value: '2026-12-11' } });
    await screen.findByText(/^11\/12\/2026$/);

    // Respuesta vieja descartada
    detallePendienteDeferred.resolve({ ok: true, data: sampleDetalleConfirmado });
    await waitFor(() => {
      expect(getTurnoDetalle).toHaveBeenCalledTimes(1);
    });
    expect(screen.queryByRole('region', { name: /detalle del turno/i })).toBeNull();
    expect(screen.queryByText(/cargando detalle/i)).toBeNull();

    // Abrir detalle vigente en 2026-12-11 (12:00, revision 1)
    await user.click(screen.getByRole('button', { name: /Lucía Gómez/i }));
    const detailPanel = await screen.findByRole('region', { name: /detalle del turno/i });
    expect(await within(detailPanel).findByText(/12:00 a 12:30/)).toBeTruthy();
    expect(within(detailPanel).getByText(/Revisión:\s*1/i)).toBeTruthy();

    // Cambiar a Semana donde el mismo turno fue reprogramado a las 14:00 (17:00Z): refresca detalle vigente
    await user.click(screen.getByRole('button', { name: /semana/i }));
    await waitFor(() => {
      expect(getAgenda).toHaveBeenCalledTimes(3);
      expect(getTurnoDetalle).toHaveBeenCalledTimes(3);
    });
    const updatedDetailPanel = await screen.findByRole('region', { name: /detalle del turno/i });
    expect(await within(updatedDetailPanel).findByText(/14:00 a 14:30/)).toBeTruthy();
    expect(within(updatedDetailPanel).getByText(/Revisión:\s*2/i)).toBeTruthy();
  });
});
