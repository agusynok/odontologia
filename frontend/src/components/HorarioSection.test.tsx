import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '../api/apiClient';
import type { ApiResult, HorarioResponse } from '../types/odontologia';
import { HorarioSection } from './HorarioSection';

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
    getHorario: vi.fn().mockResolvedValue({ ok: true, data: { franjas: [] } }),
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

const initialHorario: HorarioResponse = {
  franjas: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      diaSemana: 1,
      horaInicio: '09:00:00',
      horaFin: '13:00:00',
      tipo: 'ATENCION',
    },
  ],
};

describe('HorarioSection', () => {
  it('carga franjas y guarda reemplazo completo con UUID no vacio en cada nueva franja', async () => {
    const user = userEvent.setup();
    const replaceHorario = vi.fn().mockImplementation(async (payload: HorarioResponse) => ({
      ok: true as const,
      data: payload,
    }));
    const client = makeClient({
      getHorario: vi.fn().mockResolvedValue({ ok: true, data: initialHorario }),
      replaceHorario,
    });

    render(<HorarioSection apiClient={client} onSessionExpired={vi.fn()} />);

    await screen.findByDisplayValue('09:00:00');
    await user.click(screen.getByRole('button', { name: /agregar franja/i }));
    await user.click(screen.getByRole('button', { name: /guardar horario/i }));

    expect(replaceHorario).toHaveBeenCalledTimes(1);
    const sent = replaceHorario.mock.calls[0]?.[0] as HorarioResponse;
    expect(sent.franjas).toHaveLength(2);
    expect(sent.franjas[1]?.id.length).toBeGreaterThan(0);
    expect(sent.franjas[1]?.id).not.toBe(sent.franjas[0]?.id);
    expect((await screen.findByRole('status')).textContent).toMatch(/guardado/i);
  });

  it('conserva la edicion pendiente ante 409 CONFIGURATION_CONFLICT', async () => {
    const user = userEvent.setup();
    const replaceHorario = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      codigo: 'CONFIGURATION_CONFLICT',
      message: 'El cambio entra en conflicto con turnos confirmados vigentes.',
    });
    const client = makeClient({
      getHorario: vi.fn().mockResolvedValue({ ok: true, data: initialHorario }),
      replaceHorario,
    });

    render(<HorarioSection apiClient={client} onSessionExpired={vi.fn()} />);
    await screen.findByDisplayValue('09:00:00');

    await user.click(screen.getByRole('button', { name: /agregar franja/i }));
    await user.click(screen.getByRole('button', { name: /guardar horario/i }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/conflicto/i);
    // Ambas filas siguen en pantalla para que el odontologo corrija sin perder su edicion
    expect(screen.getAllByRole('button', { name: /quitar/i })).toHaveLength(2);
  });

  it('valida horaInicio < horaFin antes de enviar', async () => {
    const user = userEvent.setup();
    const replaceHorario = vi.fn();
    const client = makeClient({
      getHorario: vi.fn().mockResolvedValue({
        ok: true,
        data: {
          franjas: [
            {
              id: '11111111-1111-1111-1111-111111111111',
              diaSemana: 2,
              horaInicio: '14:00:00',
              horaFin: '12:00:00',
              tipo: 'ATENCION',
            },
          ],
        },
      }),
      replaceHorario,
    });

    render(<HorarioSection apiClient={client} onSessionExpired={vi.fn()} />);
    await screen.findByDisplayValue('14:00:00');

    await user.click(screen.getByRole('button', { name: /guardar horario/i }));
    expect(replaceHorario).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toMatch(/anterior a la hora de fin/i);
  });

  it('si falla GET /api/odontologo/horario bloquea edicion y guardado, permite reintentar y habilita crear si devuelve []', async () => {
    const user = userEvent.setup();
    const getHorario = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        codigo: 'TECHNICAL_FAILURE',
        message: 'Ocurrió un error técnico en el servidor. No se guardaron cambios.',
      })
      .mockResolvedValueOnce({
        ok: true,
        data: { franjas: [] },
      });
    const replaceHorario = vi.fn();

    render(
      <HorarioSection
        apiClient={makeClient({ getHorario, replaceHorario })}
        onSessionExpired={vi.fn()}
      />,
    );

    expect((await screen.findByRole('alert')).textContent).toMatch(/error técnico/i);
    // Jamás debe habilitar edición ni un PUT con lista vacía tras fallo de GET
    expect(screen.queryByRole('button', { name: /agregar franja/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /guardar horario/i })).toBeNull();
    expect(replaceHorario).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(getHorario).toHaveBeenCalledTimes(2);
    expect(await screen.findByText(/no hay franjas configuradas/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /agregar franja/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /guardar horario/i })).toBeTruthy();
  });

  it('conserva 09:00:30 y 12:00:45 en PUT al guardar sin editar y al editar otra franja', async () => {
    const user = userEvent.setup();
    const preciseHorario: HorarioResponse = {
      franjas: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          diaSemana: 1,
          horaInicio: '09:00:30',
          horaFin: '12:00:45',
          tipo: 'ATENCION',
        },
      ],
    };
    const replaceHorario = vi.fn().mockImplementation(async (payload: HorarioResponse) => ({
      ok: true as const,
      data: payload,
    }));

    render(
      <HorarioSection
        apiClient={makeClient({
          getHorario: vi.fn().mockResolvedValue({ ok: true, data: preciseHorario }),
          replaceHorario,
        })}
        onSessionExpired={vi.fn()}
      />,
    );

    await screen.findByDisplayValue('09:00:30');
    await user.click(screen.getByRole('button', { name: /guardar horario/i }));

    expect(replaceHorario).toHaveBeenCalledTimes(1);
    expect(replaceHorario.mock.calls[0]?.[0]).toEqual(preciseHorario);

    await user.click(screen.getByRole('button', { name: /agregar franja/i }));
    await user.click(screen.getByRole('button', { name: /guardar horario/i }));

    expect(replaceHorario).toHaveBeenCalledTimes(2);
    const secondPayload = replaceHorario.mock.calls[1]?.[0] as HorarioResponse;
    expect(secondPayload.franjas[0]).toEqual(preciseHorario.franjas[0]);
    expect(secondPayload.franjas).toHaveLength(2);
  });

  it('descarta respuestas de consultas fuera de orden y conserva 09:00 en pantalla y en PUT', async () => {
    const user = userEvent.setup();
    const firstGet = createDeferred<ApiResult<HorarioResponse>>();
    const secondGet = createDeferred<ApiResult<HorarioResponse>>();
    const retryGet = createDeferred<ApiResult<HorarioResponse>>();

    const getHorario = vi
      .fn<ApiClient['getHorario']>()
      .mockReturnValueOnce(firstGet.promise)
      .mockReturnValueOnce(secondGet.promise)
      .mockReturnValueOnce(retryGet.promise);

    const replaceHorario = vi.fn().mockImplementation(async (payload: HorarioResponse) => ({
      ok: true as const,
      data: payload,
    }));

    render(
      <StrictMode>
        <HorarioSection apiClient={makeClient({ getHorario, replaceHorario })} onSessionExpired={vi.fn()} />
      </StrictMode>,
    );

    secondGet.resolve({
      ok: false,
      status: 500,
      codigo: 'TECHNICAL_FAILURE',
      message: 'Ocurrió un error técnico en el servidor. No se guardaron cambios.',
    });

    await screen.findByRole('button', { name: /reintentar/i });
    await user.click(screen.getByRole('button', { name: /reintentar/i }));

    const expectedHorario: HorarioResponse = {
      franjas: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          diaSemana: 1,
          horaInicio: '09:00:00',
          horaFin: '12:00:00',
          tipo: 'ATENCION',
        },
      ],
    };
    retryGet.resolve({ ok: true, data: expectedHorario });

    await screen.findByDisplayValue('09:00:00');

    // Llega tarde la primera consulta con 08:00:00; debe descartarse
    firstGet.resolve({
      ok: true,
      data: {
        franjas: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            diaSemana: 1,
            horaInicio: '08:00:00',
            horaFin: '10:00:00',
            tipo: 'ATENCION',
          },
        ],
      },
    });
    await Promise.resolve();

    expect(screen.getByDisplayValue('09:00:00')).toBeTruthy();
    expect(screen.queryByDisplayValue('08:00:00')).toBeNull();

    await user.click(screen.getByRole('button', { name: /guardar horario/i }));
    expect(replaceHorario).toHaveBeenCalledWith(expectedHorario);
  });

  it('descarta respuesta pendiente si el componente se desmonta', async () => {
    const pendingGet = createDeferred<ApiResult<HorarioResponse>>();
    const onSessionExpired = vi.fn();
    const { unmount } = render(
      <HorarioSection
        apiClient={makeClient({ getHorario: vi.fn().mockReturnValue(pendingGet.promise) })}
        onSessionExpired={onSessionExpired}
      />,
    );

    unmount();
    pendingGet.resolve({
      ok: false,
      status: 401,
      codigo: 'SESSION_REQUIRED',
      message: 'Tu sesión expiró o no está activa. Volvé a ingresar.',
    });
    await Promise.resolve();

    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it('muestra HH:mm:ss y fraccion .123456 en microsegundos y conserva valor exacto en PUT', async () => {
    const user = userEvent.setup();
    const microHorario: HorarioResponse = {
      franjas: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          diaSemana: 1,
          horaInicio: '09:00:30.123456',
          horaFin: '12:00:45.654321',
          tipo: 'ATENCION',
        },
      ],
    };
    const replaceHorario = vi.fn().mockImplementation(async (payload: HorarioResponse) => ({
      ok: true as const,
      data: payload,
    }));

    render(
      <HorarioSection
        apiClient={makeClient({
          getHorario: vi.fn().mockResolvedValue({ ok: true, data: microHorario }),
          replaceHorario,
        })}
        onSessionExpired={vi.fn()}
      />,
    );

    expect(await screen.findByDisplayValue('09:00:30')).toBeTruthy();
    expect(screen.getByDisplayValue('12:00:45')).toBeTruthy();
    expect(screen.getByText('.123456')).toBeTruthy();
    expect(screen.getByText('.654321')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /guardar horario/i }));
    expect(replaceHorario).toHaveBeenNthCalledWith(1, microHorario);

    await user.click(screen.getByRole('button', { name: /agregar franja/i }));
    await user.click(screen.getByRole('button', { name: /guardar horario/i }));
    const secondPayload = replaceHorario.mock.calls[1]?.[0] as HorarioResponse;
    expect(secondPayload.franjas[0]).toEqual(microHorario.franjas[0]);
  });

  it('compara dos horas del mismo segundo usando precision completa de microsegundos', async () => {
    const user = userEvent.setup();
    const validSameSecond: HorarioResponse = {
      franjas: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          diaSemana: 1,
          horaInicio: '09:00:30.123456',
          horaFin: '09:00:30.654321',
          tipo: 'ATENCION',
        },
      ],
    };
    const invalidSameSecond: HorarioResponse = {
      franjas: [
        {
          id: '22222222-2222-2222-2222-222222222222',
          diaSemana: 2,
          horaInicio: '09:00:30.654321',
          horaFin: '09:00:30.123456',
          tipo: 'ATENCION',
        },
      ],
    };

    const replaceHorarioValid = vi.fn().mockResolvedValue({ ok: true, data: validSameSecond });
    const { unmount } = render(
      <HorarioSection
        apiClient={makeClient({
          getHorario: vi.fn().mockResolvedValue({ ok: true, data: validSameSecond }),
          replaceHorario: replaceHorarioValid,
        })}
        onSessionExpired={vi.fn()}
      />,
    );
    await screen.findByText('.123456');
    await user.click(screen.getByRole('button', { name: /guardar horario/i }));
    expect(replaceHorarioValid).toHaveBeenCalledTimes(1);
    unmount();

    const replaceHorarioInvalid = vi.fn();
    render(
      <HorarioSection
        apiClient={makeClient({
          getHorario: vi.fn().mockResolvedValue({ ok: true, data: invalidSameSecond }),
          replaceHorario: replaceHorarioInvalid,
        })}
        onSessionExpired={vi.fn()}
      />,
    );
    await screen.findByText('.654321');
    await user.click(screen.getByRole('button', { name: /guardar horario/i }));
    expect(replaceHorarioInvalid).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toMatch(/anterior a la hora de fin/i);
  });
});
