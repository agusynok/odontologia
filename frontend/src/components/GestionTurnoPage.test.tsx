import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '../api/apiClient';
import { GestionTurnoPage } from './GestionTurnoPage';

const currentTurn = {
  turno: {
    fecha: '2030-01-08',
    horaInicio: '09:00:00',
    horaFin: '09:30:00',
    estado: 'CONFIRMADO' as const,
    acciones: ['CANCELAR', 'REPROGRAMAR'],
  },
  etag: '"turno-r1"',
};

function setManagementUrl(fragment = '#private-token') {
  window.history.replaceState(null, '', `/gestionar-turno${fragment}`);
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
    getPublicMotivos: vi.fn(),
    getPublicDisponibilidad: vi.fn(),
    createPublicTurno: vi.fn(),
    getGestionTurno: vi.fn().mockResolvedValue({ ok: true, data: currentTurn }),
    getGestionDisponibilidad: vi.fn(),
    cancelarGestionTurno: vi.fn(),
    reprogramarGestionTurno: vi.fn(),
    getAgenda: vi.fn(),
    getTurnoDetalle: vi.fn(),
    clearCsrfToken: vi.fn(),
    ...overrides,
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

afterEach(() => {
  window.history.replaceState(null, '', '/');
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('GestionTurnoPage', () => {
  const staleQueryCases: Array<[
    string,
    Awaited<ReturnType<ApiClient['getGestionDisponibilidad']>>,
  ]> = [
    ['respuesta exitosa obsoleta', {
      ok: true,
      data: {
        zonaHoraria: 'America/Argentina/Mendoza',
        horarios: [{ inicio: '2030-01-23T15:00:00Z', fin: '2030-01-23T15:30:00Z' }],
      },
    }],
    ['un error obsoleto', {
      ok: false,
      status: 400,
      codigo: 'VALIDATION_ERROR',
      message: 'Error del período anterior.',
    }],
  ];

  it('vuelve a consultar y actualiza los datos al reabrir el mismo enlace', async () => {
    setManagementUrl();
    const updatedTurn = {
      turno: { ...currentTurn.turno, fecha: '2030-01-10' },
      etag: '"turno-r2"',
    };
    const getTurn = vi.fn()
      .mockResolvedValueOnce({ ok: true, data: currentTurn })
      .mockResolvedValueOnce({ ok: true, data: updatedTurn });
    const client = makeClient({ getGestionTurno: getTurn });

    render(<GestionTurnoPage apiClient={client} />);
    expect(await screen.findByText('08/01/2030')).toBeTruthy();
    expect(window.location.hash).toBe('');

    const oldUrl = window.location.href;
    window.history.pushState(null, '', '/gestionar-turno#private-token');
    await act(async () => {
      window.dispatchEvent(new HashChangeEvent('hashchange', {
        oldURL: oldUrl,
        newURL: window.location.href,
      }));
    });

    expect(window.location.hash).toBe('');
    expect(getTurn).toHaveBeenCalledTimes(2);
    expect(getTurn).toHaveBeenNthCalledWith(1, 'private-token');
    expect(getTurn).toHaveBeenNthCalledWith(2, 'private-token');
    expect(await screen.findByText('10/01/2030')).toBeTruthy();
    expect(screen.queryByText('08/01/2030')).toBeNull();
  });

  it('ignora la primera respuesta pendiente cuando reabre el mismo enlace', async () => {
    setManagementUrl();
    const previousOpening = createDeferred<Awaited<ReturnType<ApiClient['getGestionTurno']>>>();
    const updatedTurn = {
      turno: { ...currentTurn.turno, fecha: '2030-01-10' },
      etag: '"turno-r2"',
    };
    const getTurn = vi.fn()
      .mockReturnValueOnce(previousOpening.promise)
      .mockResolvedValueOnce({ ok: true, data: updatedTurn });
    const client = makeClient({ getGestionTurno: getTurn });

    render(<GestionTurnoPage apiClient={client} />);
    expect(await screen.findByText('Consultando el turno…')).toBeTruthy();

    const oldUrl = window.location.href;
    window.history.pushState(null, '', '/gestionar-turno#private-token');
    await act(async () => {
      window.dispatchEvent(new HashChangeEvent('hashchange', {
        oldURL: oldUrl,
        newURL: window.location.href,
      }));
    });

    expect(getTurn).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('10/01/2030')).toBeTruthy();
    await act(async () => {
      previousOpening.resolve({ ok: true, data: currentTurn });
    });

    expect(screen.getByText('10/01/2030')).toBeTruthy();
    expect(screen.queryByText('08/01/2030')).toBeNull();
    expect(window.location.hash).toBe('');
  });

  it('procesa un segundo enlace en la misma pestaña, limpia el flujo previo e ignora su respuesta tardía', async () => {
    setManagementUrl();
    const previousRefresh = createDeferred<Awaited<ReturnType<ApiClient['getGestionTurno']>>>();
    const nextTurn = createDeferred<Awaited<ReturnType<ApiClient['getGestionTurno']>>>();
    const getTurn = vi.fn()
      .mockResolvedValueOnce({ ok: true, data: currentTurn })
      .mockReturnValueOnce(previousRefresh.promise)
      .mockReturnValueOnce(nextTurn.promise);
    const client = makeClient({
      getGestionTurno: getTurn,
      getGestionDisponibilidad: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          zonaHoraria: 'America/Argentina/Mendoza',
          horarios: [{ inicio: '2030-01-09T12:00:00Z', fin: '2030-01-09T12:30:00Z' }],
        },
      }),
    });

    render(<GestionTurnoPage apiClient={client} />);
    await screen.findByText('08/01/2030');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Cancelar turno' }));
    await user.click(screen.getByRole('button', { name: 'Ver horarios disponibles' }));
    await user.click(screen.getByRole('button', { name: 'Consultar horarios' }));
    await user.click(await screen.findByRole('radio', { name: /09:00 a 09:30/i }));
    expect(screen.getByRole('group', { name: 'Confirmación de cancelación' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Confirmación de reprogramación' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Actualizar estado del turno' }));
    expect(getTurn).toHaveBeenCalledTimes(2);
    const oldUrl = window.location.href;
    window.history.pushState(null, '', '/gestionar-turno#second-private-token');
    window.dispatchEvent(new HashChangeEvent('hashchange', {
      oldURL: oldUrl,
      newURL: window.location.href,
    }));

    expect(await screen.findByText('Consultando el turno…')).toBeTruthy();
    expect(window.location.hash).toBe('');
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(screen.queryByText('08/01/2030')).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.queryByRole('group', { name: 'Confirmación de cancelación' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Confirmación de reprogramación' })).toBeNull();
    expect(getTurn).toHaveBeenLastCalledWith('second-private-token');

    await act(async () => {
      nextTurn.resolve({
        ok: true,
        data: {
          turno: { ...currentTurn.turno, fecha: '2030-02-04' },
          etag: '"turno-r2"',
        },
      });
    });
    expect(await screen.findByText('04/02/2030')).toBeTruthy();

    await act(async () => {
      previousRefresh.resolve({
        ok: true,
        data: {
          turno: { ...currentTurn.turno, fecha: '2030-01-10' },
          etag: '"turno-r-old"',
        },
      });
    });
    expect(screen.getByText('04/02/2030')).toBeTruthy();
    expect(screen.queryByText('10/01/2030')).toBeNull();
  });

  it('orienta al contacto directo al abrir un turno confirmado sin acciones', async () => {
    setManagementUrl();
    const noActionsTurn = {
      turno: { ...currentTurn.turno, acciones: [] },
      etag: currentTurn.etag,
    };
    const client = makeClient({
      getGestionTurno: vi.fn().mockResolvedValue({ ok: true, data: noActionsTurn }),
    });

    render(<GestionTurnoPage apiClient={client} />);

    expect(await screen.findByText(/contactá directamente al odontólogo por el canal habitual del consultorio/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Cancelar turno' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Ver horarios disponibles' })).toBeNull();
  });

  it.each(staleQueryCases)(
    'ignora %s del 23 de enero después de consultar el 24 y mantiene la carga vigente',
    async (_description, staleResponse) => {
      setManagementUrl();
      const previousQuery = createDeferred<Awaited<ReturnType<ApiClient['getGestionDisponibilidad']>>>();
      const currentQuery = createDeferred<Awaited<ReturnType<ApiClient['getGestionDisponibilidad']>>>();
      const availability = vi.fn()
        .mockReturnValueOnce(previousQuery.promise)
        .mockReturnValueOnce(currentQuery.promise);
      const client = makeClient({ getGestionDisponibilidad: availability });
      const user = userEvent.setup();

      render(<GestionTurnoPage apiClient={client} />);
      await screen.findByRole('heading', { name: 'Tu turno' });
      await user.click(screen.getByRole('button', { name: 'Ver horarios disponibles' }));
      fireEvent.change(screen.getByLabelText('Desde (opcional)'), { target: { value: '2030-01-23' } });
      fireEvent.change(screen.getByLabelText('Hasta (opcional)'), { target: { value: '2030-01-23' } });
      await user.click(screen.getByRole('button', { name: 'Consultar horarios' }));

      fireEvent.change(screen.getByLabelText('Desde (opcional)'), { target: { value: '2030-01-24' } });
      fireEvent.change(screen.getByLabelText('Hasta (opcional)'), { target: { value: '2030-01-24' } });
      expect(screen.getByRole('button', { name: 'Consultar horarios' })).toBeTruthy();
      await user.click(screen.getByRole('button', { name: 'Consultar horarios' }));
      expect(availability).toHaveBeenNthCalledWith(1, 'private-token', {
        desde: '2030-01-23',
        hasta: '2030-01-23',
      });
      expect(availability).toHaveBeenNthCalledWith(2, 'private-token', {
        desde: '2030-01-24',
        hasta: '2030-01-24',
      });
      expect(screen.getByRole('button', { name: 'Buscando…' })).toBeTruthy();

      await act(async () => {
        previousQuery.resolve(staleResponse);
      });

      expect(screen.getByRole('button', { name: 'Buscando…' })).toBeTruthy();
      expect((screen.getByRole('button', { name: 'Buscando…' }) as HTMLButtonElement).disabled).toBe(true);
      expect(screen.queryByRole('alert')).toBeNull();
      expect(screen.queryByRole('radio')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Confirmar reprogramación' })).toBeNull();
      expect(screen.queryByText('Error del período anterior.')).toBeNull();

      await act(async () => {
        currentQuery.resolve({
          ok: true,
          data: {
            zonaHoraria: 'America/Argentina/Mendoza',
            horarios: [{ inicio: '2030-01-24T12:00:00Z', fin: '2030-01-24T12:30:00Z' }],
          },
        });
      });
      const currentSlot = await screen.findByRole('radio', { name: /09:00 a 09:30/i });
      expect(currentSlot).toBeTruthy();
      expect(screen.queryByRole('radio', { name: /12:00 a 12:30/i })).toBeNull();
      await user.click(currentSlot);
      expect(screen.getByRole('button', { name: 'Confirmar reprogramación' })).toBeTruthy();
    },
  );

  it('quita el fragmento, consulta solo con la credencial en memoria y no ofrece datos de contacto', async () => {
    setManagementUrl();
    const client = makeClient();

    const { unmount } = render(<GestionTurnoPage apiClient={client} />);

    expect(await screen.findByRole('heading', { name: 'Tu turno' })).toBeTruthy();
    expect(window.location.hash).toBe('');
    expect(client.getGestionTurno).toHaveBeenCalledWith('private-token');
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    expect(screen.queryByText(/@/)).toBeNull();

    unmount();
    const reloadedClient = makeClient();
    render(<GestionTurnoPage apiClient={reloadedClient} />);
    expect((await screen.findByRole('status')).textContent).toMatch(/no incluye una credencial/i);
    expect(reloadedClient.getGestionTurno).not.toHaveBeenCalled();
  });

  it('muestra el error generico cuando C-09 no encuentra un enlace vigente', async () => {
    setManagementUrl();
    const client = makeClient({
      getGestionTurno: vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        codigo: 'LINK_NOT_AVAILABLE',
        message: 'Este enlace de autogestión no está disponible. Volvé a abrir el enlace original.',
      }),
    });

    render(<GestionTurnoPage apiClient={client} />);

    expect((await screen.findByRole('alert')).textContent).toMatch(/enlace de autogestión no está disponible/i);
    expect(screen.queryByRole('heading', { name: 'Tu turno' })).toBeNull();
  });

  it('requiere confirmacion expresa antes de cancelar y no promete recepcion del correo', async () => {
    setManagementUrl();
    const user = userEvent.setup();
    const cancel = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        fecha: '2030-01-08',
        horaInicio: '09:00:00',
        horaFin: '09:30:00',
        estado: 'CANCELADO',
        notificacionEstado: 'PENDIENTE',
      },
    });
    const client = makeClient({ cancelarGestionTurno: cancel });

    render(<GestionTurnoPage apiClient={client} />);
    await screen.findByRole('heading', { name: 'Tu turno' });
    await user.click(screen.getByRole('button', { name: 'Cancelar turno' }));
    expect(cancel).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));
    expect(cancel).toHaveBeenCalledWith('private-token', '"turno-r1"');
    expect(await screen.findByText(/notificación está PENDIENTE/i)).toBeTruthy();
    expect(screen.getByText(/no confirma la recepción del correo/i)).toBeTruthy();
  });

  it('muestra horarios en la zona devuelta y confirma el inicio exacto seleccionado', async () => {
    setManagementUrl();
    const user = userEvent.setup();
    const availability = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        zonaHoraria: 'America/Argentina/Mendoza',
        horarios: [{ inicio: '2030-01-09T12:00:00Z', fin: '2030-01-09T12:30:00Z' }],
      },
    });
    const reschedule = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        turnoId: '22222222-2222-2222-2222-222222222222',
        fecha: '2030-01-09',
        horaInicio: '09:00:00',
        horaFin: '09:30:00',
        estado: 'CONFIRMADO',
        notificacionEstado: 'PENDIENTE',
        etag: '"turno-r2"',
      },
    });
    const client = makeClient({
      getGestionDisponibilidad: availability,
      reprogramarGestionTurno: reschedule,
    });

    render(<GestionTurnoPage apiClient={client} />);
    await screen.findByRole('heading', { name: 'Tu turno' });
    await user.click(screen.getByRole('button', { name: 'Ver horarios disponibles' }));
    await user.click(screen.getByRole('button', { name: 'Consultar horarios' }));
    const slot = await screen.findByRole('radio', { name: /09:00 a 09:30/i });
    await user.click(slot);
    expect(screen.getByText(/America\/Argentina\/Mendoza/)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Confirmar reprogramación' }));
    expect(availability).toHaveBeenCalledWith('private-token', {});
    expect(reschedule).toHaveBeenCalledWith(
      'private-token',
      '"turno-r1"',
      '2030-01-09T12:00:00Z',
    );
    expect(await screen.findByText(/El turno fue reprogramado/i)).toBeTruthy();
  });

  it('mantiene el turno visible y orienta al contacto directo ante MANAGEMENT_WINDOW_CLOSED', async () => {
    setManagementUrl();
    const user = userEvent.setup();
    const cancel = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      codigo: 'MANAGEMENT_WINDOW_CLOSED',
      message: 'El plazo para gestionar este turno en línea está cerrado. Para solicitar un cambio, contactá directamente al odontólogo por el canal habitual del consultorio.',
    });
    const client = makeClient({ cancelarGestionTurno: cancel });

    render(<GestionTurnoPage apiClient={client} />);
    await screen.findByRole('heading', { name: 'Tu turno' });
    await user.click(screen.getByRole('button', { name: 'Cancelar turno' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Para solicitar un cambio, contactá directamente al odontólogo por el canal habitual del consultorio.',
    );
    expect(screen.getByText('Confirmado')).toBeTruthy();
    expect(screen.queryByText(/alta manual|excepción|teléfono|email/i)).toBeNull();
  });

  it('conserva el turno original y orienta al contacto directo si la reprogramación queda fuera de plazo', async () => {
    setManagementUrl();
    const user = userEvent.setup();
    const availability = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        zonaHoraria: 'America/Argentina/Mendoza',
        horarios: [{ inicio: '2030-01-09T12:00:00Z', fin: '2030-01-09T12:30:00Z' }],
      },
    });
    const reprogram = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      codigo: 'MANAGEMENT_WINDOW_CLOSED',
      message: 'El plazo para gestionar este turno en línea está cerrado. Para solicitar un cambio, contactá directamente al odontólogo por el canal habitual del consultorio.',
    });
    const client = makeClient({
      getGestionDisponibilidad: availability,
      reprogramarGestionTurno: reprogram,
    });

    render(<GestionTurnoPage apiClient={client} />);
    await screen.findByRole('heading', { name: 'Tu turno' });
    await user.click(screen.getByRole('button', { name: 'Ver horarios disponibles' }));
    await user.click(screen.getByRole('button', { name: 'Consultar horarios' }));
    await user.click(await screen.findByRole('radio', { name: /09:00 a 09:30/i }));
    await user.click(screen.getByRole('button', { name: 'Confirmar reprogramación' }));

    expect(reprogram).toHaveBeenCalledWith(
      'private-token',
      '"turno-r1"',
      '2030-01-09T12:00:00Z',
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Para solicitar un cambio, contactá directamente al odontólogo por el canal habitual del consultorio.',
    );
    expect(screen.getByText('Confirmado')).toBeTruthy();
    expect(screen.queryByText(/alta manual|excepción|teléfono|email/i)).toBeNull();
  });

  it('ante una escritura de resultado incierto vuelve a consultar antes de afirmar el estado', async () => {
    setManagementUrl();
    const user = userEvent.setup();
    const reload = vi.fn()
      .mockResolvedValueOnce({ ok: true, data: currentTurn })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          ...currentTurn,
          turno: { ...currentTurn.turno, fecha: '2030-01-10' },
          etag: '"turno-r2"',
        },
      });
    const cancel = vi.fn().mockResolvedValue({
      ok: false,
      status: 0,
      codigo: 'NETWORK_ERROR',
      message: 'No se pudo conectar con el servidor.',
    });
    const client = makeClient({ getGestionTurno: reload, cancelarGestionTurno: cancel });

    render(<GestionTurnoPage apiClient={client} />);
    await screen.findByRole('heading', { name: 'Tu turno' });
    await user.click(screen.getByRole('button', { name: 'Cancelar turno' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar cancelación' }));

    expect(await screen.findByText(/No pudimos confirmar la respuesta/i)).toBeTruthy();
    expect(screen.getByText('10/01/2030')).toBeTruthy();
    expect(reload).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(/La cancelación quedó registrada/i)).toBeNull();
  });

  it('permite llegar y abrir las acciones con teclado', async () => {
    setManagementUrl();
    const user = userEvent.setup();
    const client = makeClient();

    render(<GestionTurnoPage apiClient={client} />);
    await screen.findByRole('heading', { name: 'Tu turno' });
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Actualizar estado del turno' }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancelar turno' }));
    await user.keyboard('{Enter}');
    expect(screen.getByRole('group', { name: 'Confirmación de cancelación' })).toBeTruthy();
  });

  it.each([
    ['SLOT_UNAVAILABLE', 409, /horario elegido ya no está disponible/i],
    ['SAME_INTERVAL', 409, /coincide con el turno actual/i],
    ['TURN_VERSION_MISMATCH', 412, /turno cambió desde la última consulta/i],
  ] as const)(
    'mantiene el turno y permite actualizarlo tras %s',
    async (codigo, status, mensaje) => {
      setManagementUrl();
      const user = userEvent.setup();
      const reschedule = vi.fn().mockResolvedValue({
        ok: false,
        status,
        codigo,
        message: {
          SLOT_UNAVAILABLE: 'El horario elegido ya no está disponible. Seleccioná otra opción libre.',
          SAME_INTERVAL: 'El horario elegido coincide con el turno actual. Seleccioná otro horario.',
          TURN_VERSION_MISMATCH: 'El turno cambió desde la última consulta. Actualizá el estado antes de reintentar.',
        }[codigo],
      });
      const client = makeClient({
        getGestionDisponibilidad: vi.fn().mockResolvedValue({
          ok: true,
          data: {
            zonaHoraria: 'America/Argentina/Mendoza',
            horarios: [{ inicio: '2030-01-09T12:00:00Z', fin: '2030-01-09T12:30:00Z' }],
          },
        }),
        reprogramarGestionTurno: reschedule,
      });

      render(<GestionTurnoPage apiClient={client} />);
      await screen.findByRole('heading', { name: 'Tu turno' });
      await user.click(screen.getByRole('button', { name: 'Ver horarios disponibles' }));
      await user.click(screen.getByRole('button', { name: 'Consultar horarios' }));
      await user.click(await screen.findByRole('radio', { name: /09:00 a 09:30/i }));
      await user.click(screen.getByRole('button', { name: 'Confirmar reprogramación' }));

      expect((await screen.findByRole('alert')).textContent).toMatch(mensaje);
      expect(screen.getByText('Confirmado')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Actualizar estado del turno' })).toBeTruthy();
      expect(reschedule).toHaveBeenCalledTimes(1);
    },
  );
});
