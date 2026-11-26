import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '../api/apiClient';
import { createApiClient } from '../api/apiClient';
import type {
  ApiResult,
  DisponibilidadPublicaResponse,
  Motivo,
  ReservaPublicaResponse,
} from '../types/odontologia';
import { PublicBookingPage } from './PublicBookingPage';

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const sampleMotivos: Motivo[] = [
  { id: '11111111-1111-1111-1111-111111111111', nombre: 'Consulta general', duracionMinutos: 30 },
  { id: '22222222-2222-2222-2222-222222222222', nombre: 'Limpieza', duracionMinutos: 45 },
];

const sampleDisponibilidad: DisponibilidadPublicaResponse = {
  motivoId: '11111111-1111-1111-1111-111111111111',
  duracionMinutos: 30,
  zonaHoraria: 'America/Argentina/Mendoza',
  horarios: [
    { inicio: '2030-01-08T12:00:30.250000Z', fin: '2030-01-08T12:30:30.250000Z' },
    { inicio: '2030-01-08T12:30:30.250000Z', fin: '2030-01-08T13:00:30.250000Z' },
  ],
};

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
    getPublicMotivos: vi.fn().mockResolvedValue({ ok: true, data: sampleMotivos }),
    getPublicDisponibilidad: vi.fn().mockResolvedValue({ ok: true, data: sampleDisponibilidad }),
    createPublicTurno: vi.fn(),
    getGestionTurno: vi.fn(),
    getGestionDisponibilidad: vi.fn(),
    cancelarGestionTurno: vi.fn(),
    reprogramarGestionTurno: vi.fn(),
    clearCsrfToken: vi.fn(),
    getAgenda: vi.fn(),
    getTurnoDetalle: vi.fn(),
    ...overrides,
  };
}

describe('PublicBookingPage', () => {
  it('recorre motivo, horario con precision exacta, 5 datos por teclado y separa CONFIRMADO de correo PENDIENTE', async () => {
    const user = userEvent.setup();
    const createPublicTurno = vi.fn().mockResolvedValue({
      ok: true,
      data: {
        turnoId: '99999999-9999-9999-9999-999999999999',
        motivoId: sampleMotivos[0]!.id,
        inicio: '2030-01-08T12:00:30.250000Z',
        fin: '2030-01-08T12:30:30.250000Z',
        duracionReservadaMinutos: 30,
        estado: 'CONFIRMADO',
        notificacionEstado: 'PENDIENTE',
      },
    } satisfies ApiResult<ReservaPublicaResponse>);

    const client = makeClient({ createPublicTurno });
    render(<PublicBookingPage apiClient={client} />);

    // Selecciona el primer horario ofrecido (09:00:30 en Mendoza)
    const slotBtn = await screen.findByRole('button', { name: /09:00:30/i });
    slotBtn.focus();
    await user.keyboard('{Enter}');

    // Completa los 5 datos obligatorios
    await user.type(screen.getByLabelText(/^nombre/i), 'Ana');
    await user.type(screen.getByLabelText(/^apellido/i), 'Pérez');
    await user.type(screen.getByLabelText(/^email/i), 'ana@example.com');
    await user.type(screen.getByLabelText(/teléfono/i), '+54 261 555-1234');
    await user.type(screen.getByLabelText(/^dni/i), '30123456');

    await user.click(screen.getByRole('button', { name: /confirmar reserva/i }));

    expect(createPublicTurno).toHaveBeenCalledTimes(1);
    expect(createPublicTurno).toHaveBeenCalledWith({
      motivoId: '11111111-1111-1111-1111-111111111111',
      inicio: '2030-01-08T12:00:30.250000Z',
      nombre: 'Ana',
      apellido: 'Pérez',
      email: 'ana@example.com',
      telefono: '+54 261 555-1234',
      dni: '30123456',
    });

    // Verifica separacion explicita entre reserva confirmada y notificacion pendiente (PB-10)
    expect(await screen.findByText(/reserva confirmada/i)).toBeTruthy();
    expect(screen.getByText(/estado del correo de confirmación:\s*PENDIENTE/i)).toBeTruthy();
    expect(screen.getByText(/no requiere verificar/i)).toBeTruthy();
  });

  it('valida campos obligatorios y bloquea doble envio mientras POST /api/public/turnos esta en curso (PB-08)', async () => {
    const user = userEvent.setup();
    const deferred = createDeferred<ApiResult<ReservaPublicaResponse>>();
    const createPublicTurno = vi.fn().mockReturnValue(deferred.promise);
    render(<PublicBookingPage apiClient={makeClient({ createPublicTurno })} />);

    await user.click(await screen.findByRole('button', { name: /09:00:30/i }));

    // Intenta enviar sin completar campos
    await user.click(screen.getByRole('button', { name: /confirmar reserva/i }));
    expect(createPublicTurno).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toMatch(/obligatorios|completá/i);

    // Completa todos los campos y hace clic dos veces seguidas
    await user.type(screen.getByLabelText(/^nombre/i), 'Juan');
    await user.type(screen.getByLabelText(/^apellido/i), 'Gomez');
    await user.type(screen.getByLabelText(/^email/i), 'juan@example.com');
    await user.type(screen.getByLabelText(/teléfono/i), '2615550000');
    await user.type(screen.getByLabelText(/^dni/i), '28999888');

    const submitBtn = screen.getByRole('button', { name: /confirmar reserva/i });
    await user.click(submitBtn);
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true);
    await user.click(submitBtn);
    expect(createPublicTurno).toHaveBeenCalledTimes(1);

    deferred.resolve({
      ok: true,
      data: {
        turnoId: '88888888-8888-8888-8888-888888888888',
        motivoId: sampleMotivos[0]!.id,
        inicio: '2030-01-08T12:00:30.250000Z',
        fin: '2030-01-08T12:30:30.250000Z',
        duracionReservadaMinutos: 30,
        estado: 'CONFIRMADO',
        notificacionEstado: 'PENDIENTE',
      },
    });
    expect(await screen.findByText(/reserva confirmada/i)).toBeTruthy();
  });

  it('ante 409 SLOT_UNAVAILABLE conserva los 5 datos, limpia el horario vencido y recarga disponibilidad', async () => {
    const user = userEvent.setup();
    const getPublicDisponibilidad = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleDisponibilidad })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          ...sampleDisponibilidad,
          horarios: [{ inicio: '2030-01-08T12:30:30.250000Z', fin: '2030-01-08T13:00:30.250000Z' }],
        },
      });
    const createPublicTurno = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      codigo: 'SLOT_UNAVAILABLE',
      message: 'El horario elegido ya no está disponible. Seleccioná otra opción libre.',
    });

    render(
      <PublicBookingPage
        apiClient={makeClient({ getPublicDisponibilidad, createPublicTurno })}
      />,
    );

    await user.click(await screen.findByRole('button', { name: /09:00:30/i }));
    await user.type(screen.getByLabelText(/^nombre/i), 'Lucia');
    await user.type(screen.getByLabelText(/^apellido/i), 'Diaz');
    await user.type(screen.getByLabelText(/^email/i), 'lucia@example.com');
    await user.type(screen.getByLabelText(/teléfono/i), '2614443322');
    await user.type(screen.getByLabelText(/^dni/i), '33444555');

    await user.click(screen.getByRole('button', { name: /confirmar reserva/i }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/no está disponible/i);
    await waitFor(() => {
      expect(getPublicDisponibilidad).toHaveBeenCalledTimes(2);
    });
    expect(screen.queryByRole('button', { name: /09:00:30 a 09:30:30/i })).toBeNull();

    // Selecciona el nuevo horario libre y verifica que sus datos siguen cargados
    await user.click(await screen.findByRole('button', { name: /09:30:30/i }));
    expect((screen.getByLabelText(/^nombre/i) as HTMLInputElement).value).toBe('Lucia');
    expect((screen.getByLabelText(/^dni/i) as HTMLInputElement).value).toBe('33444555');
  });

  it('distingue indisponibilidad vacia, fallo de consulta con reintento y resultado incierto de red en POST', async () => {
    const user = userEvent.setup();
    const getPublicDisponibilidad = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        codigo: 'TECHNICAL_FAILURE',
        message: 'Ocurrió un error técnico en el servidor. No se guardaron cambios.',
      })
      .mockResolvedValueOnce({
        ok: true,
        data: { ...sampleDisponibilidad, horarios: [] },
      })
      .mockResolvedValueOnce({ ok: true, data: sampleDisponibilidad });

    const createPublicTurno = vi.fn().mockResolvedValue({
      ok: false,
      status: 0,
      codigo: 'NETWORK_ERROR',
      message: 'No se pudo conectar con el servidor. Verificá la conexión e intentá nuevamente.',
    });

    render(
      <PublicBookingPage
        apiClient={makeClient({ getPublicDisponibilidad, createPublicTurno })}
      />,
    );

    // 1. Fallo de consulta muestra error y boton Reintentar (no agenda vacia)
    expect((await screen.findByRole('alert')).textContent).toMatch(/error técnico/i);
    expect(screen.queryByText(/no hay horarios disponibles/i)).toBeNull();

    // 2. Al reintentar, recibe horarios: [] y muestra mensaje de indisponibilidad
    await user.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(await screen.findByText(/no hay horarios disponibles/i)).toBeTruthy();

    // 3. Cambia filtro de fecha para obtener horarios y provocar NETWORK_ERROR en POST
    await user.type(screen.getByLabelText(/desde/i), '2030-01-08');
    await user.click(await screen.findByRole('button', { name: /09:00:30/i }));
    await user.type(screen.getByLabelText(/^nombre/i), 'Mario');
    await user.type(screen.getByLabelText(/^apellido/i), 'Ruiz');
    await user.type(screen.getByLabelText(/^email/i), 'mario@example.com');
    await user.type(screen.getByLabelText(/teléfono/i), '2617778899');
    await user.type(screen.getByLabelText(/^dni/i), '25111222');

    await user.click(screen.getByRole('button', { name: /confirmar reserva/i }));

    const alertText = (await screen.findByRole('alert')).textContent ?? '';
    expect(alertText).toMatch(/incierto|no se pudo confirmar si la reserva/i);
    expect(screen.queryByText(/^reserva confirmada$/i)).toBeNull();
  });

  it('invalida el horario elegido al cambiar fechas, descarta respuestas tardias incluso con periodo invalido y conserva los 5 datos', async () => {
    const user = userEvent.setup();
    const pendingPeriod = createDeferred<ApiResult<DisponibilidadPublicaResponse>>();
    const thirdPeriod: DisponibilidadPublicaResponse = {
      motivoId: sampleMotivos[0]!.id,
      duracionMinutos: 30,
      zonaHoraria: 'America/Argentina/Mendoza',
      horarios: [{ inicio: '2030-01-12T14:00:00Z', fin: '2030-01-12T14:30:00Z' }],
    };

    const getPublicDisponibilidad = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, data: sampleDisponibilidad })
      .mockReturnValueOnce(pendingPeriod.promise)
      .mockResolvedValue({ ok: true, data: thirdPeriod });
    const createPublicTurno = vi.fn();

    render(
      <PublicBookingPage
        apiClient={makeClient({ getPublicDisponibilidad, createPublicTurno })}
      />,
    );

    // Selecciona horario del primer periodo y completa los 5 datos del paciente
    await user.click(await screen.findByRole('button', { name: /09:00:30/i }));
    await user.type(screen.getByLabelText(/^nombre/i), 'Carla');
    await user.type(screen.getByLabelText(/^apellido/i), 'Mendez');
    await user.type(screen.getByLabelText(/^email/i), 'carla@example.com');
    await user.type(screen.getByLabelText(/teléfono/i), '2616667788');
    await user.type(screen.getByLabelText(/^dni/i), '31222333');

    // Cambia "Desde" dejando la nueva consulta pendiente -> el horario previo queda invalidado y no se puede confirmar
    await user.type(screen.getByLabelText(/desde/i), '2030-01-10');
    expect(screen.queryByRole('button', { name: /confirmar reserva/i })).toBeNull();
    expect(createPublicTurno).not.toHaveBeenCalled();

    // Cambia "Hasta" a una fecha anterior (periodo invalido): la respuesta tardia pendiente debe descartarse
    await user.type(screen.getByLabelText(/hasta/i), '2030-01-09');
    expect((await screen.findByRole('alert')).textContent).toMatch(/posterior/i);

    pendingPeriod.resolve({ ok: true, data: sampleDisponibilidad });
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /09:00:30/i })).toBeNull();
    });
    expect(screen.getByRole('alert').textContent).toMatch(/posterior/i);
    expect(createPublicTurno).not.toHaveBeenCalled();

    // Corrige "Hasta" a un periodo valido, elige el nuevo horario y verifica que los 5 datos se conservaron
    const hastaInput = screen.getByLabelText(/hasta/i);
    await user.clear(hastaInput);
    await user.type(hastaInput, '2030-01-12');
    await user.click(await screen.findByRole('button', { name: /11:00 a 11:30/i }));

    expect((screen.getByLabelText(/^nombre/i) as HTMLInputElement).value).toBe('Carla');
    expect((screen.getByLabelText(/^apellido/i) as HTMLInputElement).value).toBe('Mendez');
    expect((screen.getByLabelText(/^email/i) as HTMLInputElement).value).toBe('carla@example.com');
    expect((screen.getByLabelText(/teléfono/i) as HTMLInputElement).value).toBe('2616667788');
    expect((screen.getByLabelText(/^dni/i) as HTMLInputElement).value).toBe('31222333');
  });

  it('ante 201 cuyo cuerpo falla al leerse sale del estado de envio, muestra resultado incierto y conserva los datos', async () => {
    const user = userEvent.setup();
    const broken201 = new Response('', { status: 201 });
    vi.spyOn(broken201, 'text').mockRejectedValueOnce(new TypeError('stream interrupted'));

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(sampleMotivos), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(sampleDisponibilidad), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(broken201);

    render(<PublicBookingPage apiClient={createApiClient(fetchMock)} />);

    await user.click(await screen.findByRole('button', { name: /09:00:30/i }));
    await user.type(screen.getByLabelText(/^nombre/i), 'Sofia');
    await user.type(screen.getByLabelText(/^apellido/i), 'Vega');
    await user.type(screen.getByLabelText(/^email/i), 'sofia@example.com');
    await user.type(screen.getByLabelText(/teléfono/i), '2613334455');
    await user.type(screen.getByLabelText(/^dni/i), '34555666');

    await user.click(screen.getByRole('button', { name: /confirmar reserva/i }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/resultado incierto/i);
    expect(alert.textContent).toMatch(/correo|disponibilidad/i);

    const submitBtn = screen.getByRole('button', { name: /confirmar reserva/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(false);
    expect(screen.queryByText(/confirmando reserva/i)).toBeNull();
    expect((screen.getByLabelText(/^nombre/i) as HTMLInputElement).value).toBe('Sofia');
    expect((screen.getByLabelText(/^dni/i) as HTMLInputElement).value).toBe('34555666');
  });
});
