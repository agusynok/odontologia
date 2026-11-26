import { describe, expect, it, vi } from 'vitest';
import { createApiClient } from './apiClient';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function emptyResponse(status: number): Response {
  return new Response(null, { status });
}

describe('apiClient', () => {
  it('checkSession devuelve ok true en 200 y SESSION_REQUIRED en 401', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(200, { autenticado: true }))
      .mockResolvedValueOnce(jsonResponse(401, { codigo: 'SESSION_REQUIRED' }));

    const client = createApiClient(fetchMock);

    const active = await client.checkSession();
    expect(active).toEqual({ ok: true, data: { autenticado: true } });
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/odontologo/sesion', {
      method: 'GET',
      credentials: 'same-origin',
    });

    const inactive = await client.checkSession();
    expect(inactive.ok).toBe(false);
    if (!inactive.ok) {
      expect(inactive.status).toBe(401);
      expect(inactive.codigo).toBe('SESSION_REQUIRED');
    }
  });

  it('obtiene CSRF antes de login, envia form-urlencoded y renueva estado CSRF en 204', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(200, { token: 'csrf-anon', headerName: 'X-CSRF-TOKEN' }))
      .mockResolvedValueOnce(emptyResponse(204))
      .mockResolvedValueOnce(jsonResponse(200, { token: 'csrf-auth', headerName: 'X-CSRF-TOKEN' }))
      .mockResolvedValueOnce(
        jsonResponse(201, {
          id: '11111111-1111-1111-1111-111111111111',
          nombre: 'Consulta',
          duracionMinutos: 30,
        }),
      );

    const client = createApiClient(fetchMock);

    const loginResult = await client.login('carlos', 'clave-segura-12345');
    expect(loginResult).toEqual({ ok: true, data: undefined });

    const loginCall = fetchMock.mock.calls[1];
    expect(loginCall?.[0]).toBe('/api/odontologo/sesion');
    const loginInit = loginCall?.[1];
    expect(loginInit?.method).toBe('POST');
    expect(loginInit?.credentials).toBe('same-origin');
    const loginHeaders = new Headers(loginInit?.headers);
    expect(loginHeaders.get('X-CSRF-TOKEN')).toBe('csrf-anon');
    expect(loginHeaders.get('Content-Type')).toContain('application/x-www-form-urlencoded');
    expect(String(loginInit?.body)).toContain('username=carlos');
    expect(String(loginInit?.body)).toContain('password=clave-segura-12345');

    // Al hacer una escritura posterior tras el login, debe pedir un CSRF nuevo (descarto csrf-anon)
    const createResult = await client.createMotivo({ nombre: 'Consulta', duracionMinutos: 30 });
    expect(createResult.ok).toBe(true);
    const createHeaders = new Headers(fetchMock.mock.calls[3]?.[1]?.headers);
    expect(createHeaders.get('X-CSRF-TOKEN')).toBe('csrf-auth');
  });

  it('ante 403 CSRF_INVALID con sesion activa descarta el token, consulta sesion sin reenviar y permite reintento manual', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(200, { token: 'csrf-1', headerName: 'X-CSRF-TOKEN' }))
      .mockResolvedValueOnce(jsonResponse(403, { codigo: 'CSRF_INVALID' }))
      .mockResolvedValueOnce(jsonResponse(200, { autenticado: true }))
      .mockResolvedValueOnce(jsonResponse(200, { token: 'csrf-2', headerName: 'X-CSRF-TOKEN' }))
      .mockResolvedValueOnce(
        jsonResponse(201, {
          id: '11111111-1111-1111-1111-111111111111',
          nombre: 'Limpieza',
          duracionMinutos: 45,
        }),
      );

    const client = createApiClient(fetchMock);

    const failed = await client.createMotivo({ nombre: 'Limpieza', duracionMinutos: 45 });
    expect(failed.ok).toBe(false);
    if (!failed.ok) {
      expect(failed.status).toBe(403);
      expect(failed.codigo).toBe('CSRF_INVALID');
    }
    // 3 llamadas: GET csrf + POST motivo + GET sesion. No reenvio automatico.
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2]?.[0]).toBe('/api/odontologo/sesion');

    // En el reintento manual del usuario, solicita un token nuevo y envia la escritura una sola vez
    const retried = await client.createMotivo({ nombre: 'Limpieza', duracionMinutos: 45 });
    expect(retried.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(5);
    const retryHeaders = new Headers(fetchMock.mock.calls[4]?.[1]?.headers);
    expect(retryHeaders.get('X-CSRF-TOKEN')).toBe('csrf-2');
  });

  it('ante 403 CSRF_INVALID con sesion expirada (401 SESSION_REQUIRED) devuelve SESSION_REQUIRED sin reenviar', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(200, { token: 'csrf-1', headerName: 'X-CSRF-TOKEN' }))
      .mockResolvedValueOnce(jsonResponse(403, { codigo: 'CSRF_INVALID' }))
      .mockResolvedValueOnce(jsonResponse(401, { codigo: 'SESSION_REQUIRED' }));

    const client = createApiClient(fetchMock);

    const failed = await client.createMotivo({ nombre: 'Limpieza', duracionMinutos: 45 });
    expect(failed.ok).toBe(false);
    if (!failed.ok) {
      expect(failed.status).toBe(401);
      expect(failed.codigo).toBe('SESSION_REQUIRED');
    }
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/odontologo/motivos');
    expect(fetchMock.mock.calls[2]?.[0]).toBe('/api/odontologo/sesion');
  });

  it('mapea errores de dominio (409, 404, 503, 500) y fallos de red sin lanzar', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(200, { token: 't', headerName: 'X-CSRF-TOKEN' }))
      .mockResolvedValueOnce(jsonResponse(409, { codigo: 'AGENDA_BUSY' }))
      .mockResolvedValueOnce(jsonResponse(500, { codigo: 'TECHNICAL_FAILURE' }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const client = createApiClient(fetchMock);

    const busy = await client.replaceHorario({ franjas: [] });
    expect(busy.ok).toBe(false);
    if (!busy.ok) {
      expect(busy.codigo).toBe('AGENDA_BUSY');
      expect(busy.status).toBe(409);
    }

    const tech = await client.deleteBloqueo('11111111-1111-1111-1111-111111111111');
    expect(tech.ok).toBe(false);
    if (!tech.ok) {
      expect(tech.codigo).toBe('TECHNICAL_FAILURE');
      expect(tech.status).toBe(500);
    }

    const net = await client.getMotivos();
    expect(net.ok).toBe(false);
    if (!net.ok) {
      expect(net.codigo).toBe('NETWORK_ERROR');
    }
  });

  it('consulta disponibilidad y crea reserva publica sin solicitar CSRF interno y mapea 409 SLOT_UNAVAILABLE', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(200, [
          { id: '11111111-1111-1111-1111-111111111111', nombre: 'Consulta', duracionMinutos: 30 },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          motivoId: '11111111-1111-1111-1111-111111111111',
          duracionMinutos: 30,
          zonaHoraria: 'America/Argentina/Mendoza',
          horarios: [{ inicio: '2030-01-08T12:00:30Z', fin: '2030-01-08T12:30:30Z' }],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(201, {
          turnoId: '22222222-2222-2222-2222-222222222222',
          motivoId: '11111111-1111-1111-1111-111111111111',
          inicio: '2030-01-08T12:00:30Z',
          fin: '2030-01-08T12:30:30Z',
          duracionReservadaMinutos: 30,
          estado: 'CONFIRMADO',
          notificacionEstado: 'PENDIENTE',
        }),
      )
      .mockResolvedValueOnce(jsonResponse(409, { codigo: 'SLOT_UNAVAILABLE' }));

    const client = createApiClient(fetchMock);

    const motivos = await client.getPublicMotivos();
    expect(motivos.ok).toBe(true);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/public/motivos');

    const disp = await client.getPublicDisponibilidad({
      motivoId: '11111111-1111-1111-1111-111111111111',
      desde: '2030-01-08',
      hasta: '2030-01-10',
    });
    expect(disp.ok).toBe(true);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      '/api/public/disponibilidad?motivoId=11111111-1111-1111-1111-111111111111&desde=2030-01-08&hasta=2030-01-10',
    );

    const bookingInput = {
      motivoId: '11111111-1111-1111-1111-111111111111',
      inicio: '2030-01-08T12:00:30Z',
      nombre: 'Ana',
      apellido: 'Perez',
      email: 'ana@example.com',
      telefono: '2615551234',
      dni: '30123456',
    };
    const booked = await client.createPublicTurno(bookingInput);
    expect(booked.ok).toBe(true);
    expect(fetchMock.mock.calls[2]?.[0]).toBe('/api/public/turnos');

    const conflict = await client.createPublicTurno(bookingInput);
    expect(conflict.ok).toBe(false);
    if (!conflict.ok) {
      expect(conflict.status).toBe(409);
      expect(conflict.codigo).toBe('SLOT_UNAVAILABLE');
    }

    // Ninguna llamada debe haber ido a /api/odontologo/csrf
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('captura fallo al leer el cuerpo de una respuesta 201 en createPublicTurno y devuelve NETWORK_ERROR sin lanzar', async () => {
    const broken201 = new Response('', { status: 201 });
    vi.spyOn(broken201, 'text').mockRejectedValueOnce(new TypeError('Body stream aborted'));
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(broken201);

    const client = createApiClient(fetchMock);
    const result = await client.createPublicTurno({
      motivoId: '11111111-1111-1111-1111-111111111111',
      inicio: '2030-01-08T12:00:30Z',
      nombre: 'Ana',
      apellido: 'Perez',
      email: 'ana@example.com',
      telefono: '2615551234',
      dni: '30123456',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(0);
      expect(result.codigo).toBe('NETWORK_ERROR');
    }
  });

  it('getAgenda sin parametros y con parametros consulta /api/odontologo/agenda sin pedir CSRF', async () => {
    const agendaDia = {
      vista: 'DIA',
      desde: '2026-11-25',
      hasta: '2026-11-25',
      zonaHoraria: 'America/Argentina/Mendoza',
      turnos: [],
    };
    const agendaSemana = {
      vista: 'SEMANA',
      desde: '2026-11-23',
      hasta: '2026-11-29',
      zonaHoraria: 'America/Argentina/Mendoza',
      turnos: [
        {
          id: '22222222-2222-2222-2222-222222222222',
          motivoId: '11111111-1111-1111-1111-111111111111',
          motivoNombre: 'Limpieza',
          inicio: '2026-11-25T12:00:00Z',
          fin: '2026-11-25T12:30:00Z',
          duracionReservadaMinutos: 30,
          estado: 'CONFIRMADO',
          pacienteNombre: 'Ana',
          pacienteApellido: 'Perez',
        },
      ],
    };

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(200, agendaDia))
      .mockResolvedValueOnce(jsonResponse(200, agendaSemana));

    const client = createApiClient(fetchMock);

    const res1 = await client.getAgenda();
    expect(res1).toEqual({ ok: true, data: agendaDia });
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/odontologo/agenda', {
      method: 'GET',
      credentials: 'same-origin',
    });

    const res2 = await client.getAgenda({ vista: 'SEMANA', fecha: '2026-11-25' });
    expect(res2).toEqual({ ok: true, data: agendaSemana });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/odontologo/agenda?vista=SEMANA&fecha=2026-11-25', {
      method: 'GET',
      credentials: 'same-origin',
    });

    expect(fetchMock.mock.calls.some((call) => call[0] === '/api/odontologo/csrf')).toBe(false);
  });

  it('getTurnoDetalle consulta /api/odontologo/turnos/:id y valida TurnoDetalleResponse', async () => {
    const detalle = {
      id: '22222222-2222-2222-2222-222222222222',
      motivoId: '11111111-1111-1111-1111-111111111111',
      motivoNombre: 'Limpieza',
      inicio: '2030-01-08T12:00:00Z',
      fin: '2030-01-08T12:30:00Z',
      duracionReservadaMinutos: 30,
      estado: 'CONFIRMADO',
      revision: 0,
      creadoEn: '2030-01-01T10:00:00Z',
      canceladoEn: null,
      paciente: {
        nombre: 'Ana',
        apellido: 'Perez',
        email: 'ana@example.com',
        telefono: '2615551234',
        dni: '30123456',
      },
    };
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(jsonResponse(200, detalle));
    const client = createApiClient(fetchMock);

    const res = await client.getTurnoDetalle('22222222-2222-2222-2222-222222222222');
    expect(res).toEqual({ ok: true, data: detalle });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/odontologo/turnos/22222222-2222-2222-2222-222222222222',
      {
        method: 'GET',
        credentials: 'same-origin',
      },
    );
  });

  it('getAgenda y getTurnoDetalle mapean 400, 401 (limpiando CSRF), 403 ACCESS_DENIED, 404 TURNO_NOT_FOUND, 500, INVALID_RESPONSE y NETWORK_ERROR', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      // 1-2: obtener CSRF previo via createMotivo para verificar que 401 lo limpia
      .mockResolvedValueOnce(jsonResponse(200, { token: 'csrf-previo', headerName: 'X-CSRF-TOKEN' }))
      .mockResolvedValueOnce(
        jsonResponse(201, {
          id: '11111111-1111-1111-1111-111111111111',
          nombre: 'Consulta',
          duracionMinutos: 30,
        }),
      )
      // 3: 400 VALIDATION_ERROR
      .mockResolvedValueOnce(jsonResponse(400, { codigo: 'VALIDATION_ERROR' }))
      // 4: 401 SESSION_REQUIRED
      .mockResolvedValueOnce(jsonResponse(401, { codigo: 'SESSION_REQUIRED' }))
      // 5-6: siguiente mutacion debe volver a pedir /api/odontologo/csrf porque 401 limpio el token
      .mockResolvedValueOnce(jsonResponse(200, { token: 'csrf-nuevo', headerName: 'X-CSRF-TOKEN' }))
      .mockResolvedValueOnce(
        jsonResponse(201, {
          id: '11111111-1111-1111-1111-111111111111',
          nombre: 'Consulta 2',
          duracionMinutos: 30,
        }),
      )
      // 7: 403 ACCESS_DENIED
      .mockResolvedValueOnce(jsonResponse(403, { codigo: 'ACCESS_DENIED' }))
      // 8: 404 TURNO_NOT_FOUND
      .mockResolvedValueOnce(jsonResponse(404, { codigo: 'TURNO_NOT_FOUND' }))
      // 9: 500 TECHNICAL_FAILURE
      .mockResolvedValueOnce(jsonResponse(500, { codigo: 'TECHNICAL_FAILURE' }))
      // 10: 200 INVALID_RESPONSE
      .mockResolvedValueOnce(jsonResponse(200, { vista: 'MES', turnos: [] }))
      // 11: NETWORK_ERROR
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const client = createApiClient(fetchMock);

    await client.createMotivo({ nombre: 'Consulta', duracionMinutos: 30 });

    const err400 = await client.getAgenda({ vista: 'DIA', fecha: 'invalida' });
    expect(err400.ok).toBe(false);
    if (!err400.ok) {
      expect(err400.status).toBe(400);
      expect(err400.codigo).toBe('VALIDATION_ERROR');
    }

    const err401 = await client.getAgenda();
    expect(err401.ok).toBe(false);
    if (!err401.ok) {
      expect(err401.status).toBe(401);
      expect(err401.codigo).toBe('SESSION_REQUIRED');
    }

    await client.createMotivo({ nombre: 'Consulta 2', duracionMinutos: 30 });
    expect(fetchMock.mock.calls[4]?.[0]).toBe('/api/odontologo/csrf');

    const err403 = await client.getAgenda();
    expect(err403.ok).toBe(false);
    if (!err403.ok) {
      expect(err403.status).toBe(403);
      expect(err403.codigo).toBe('ACCESS_DENIED');
    }

    const err404 = await client.getTurnoDetalle('99999999-9999-9999-9999-999999999999');
    expect(err404.ok).toBe(false);
    if (!err404.ok) {
      expect(err404.status).toBe(404);
      expect(err404.codigo).toBe('TURNO_NOT_FOUND');
    }

    const err500 = await client.getTurnoDetalle('22222222-2222-2222-2222-222222222222');
    expect(err500.ok).toBe(false);
    if (!err500.ok) {
      expect(err500.status).toBe(500);
      expect(err500.codigo).toBe('TECHNICAL_FAILURE');
    }

    const errInvalid = await client.getAgenda();
    expect(errInvalid.ok).toBe(false);
    if (!errInvalid.ok) {
      expect(errInvalid.status).toBe(200);
      expect(errInvalid.codigo).toBe('INVALID_RESPONSE');
    }

    const errNet = await client.getTurnoDetalle('22222222-2222-2222-2222-222222222222');
    expect(errNet.ok).toBe(false);
    if (!errNet.ok) {
      expect(errNet.status).toBe(0);
      expect(errNet.codigo).toBe('NETWORK_ERROR');
    }
  });

  it('consulta varias veces el turno y la disponibilidad protegida sin motivoId ni cache', async () => {
    const token = 'private-management-token';
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        fecha: '2030-01-08',
        horaInicio: '09:00:00',
        horaFin: '09:30:00',
        estado: 'CONFIRMADO',
        acciones: ['CANCELAR', 'REPROGRAMAR'],
      }), { status: 200, headers: { ETag: '"turno-r1"' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        fecha: '2030-01-10',
        horaInicio: '09:00:00',
        horaFin: '09:30:00',
        estado: 'CONFIRMADO',
        acciones: ['CANCELAR', 'REPROGRAMAR'],
      }), { status: 200, headers: { ETag: '"turno-r2"' } }))
      .mockResolvedValueOnce(jsonResponse(200, {
        zonaHoraria: 'America/Argentina/Mendoza',
        horarios: [{ inicio: '2030-01-09T12:00:00Z', fin: '2030-01-09T12:30:00Z' }],
      }));

    const client = createApiClient(fetchMock);
    const appointment = await client.getGestionTurno(token);
    const repeatedAppointment = await client.getGestionTurno(token);
    const availability = await client.getGestionDisponibilidad(token, {
      desde: '2030-01-09',
      hasta: '2030-01-20',
    });

    expect(appointment.ok).toBe(true);
    if (appointment.ok) {
      expect(appointment.data.etag).toBe('"turno-r1"');
      expect(appointment.data.turno.estado).toBe('CONFIRMADO');
    }
    expect(repeatedAppointment).toMatchObject({
      ok: true,
      data: { turno: { fecha: '2030-01-10' }, etag: '"turno-r2"' },
    });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/gestion/turno');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/gestion/turno');
    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      '/api/gestion/turno/disponibilidad?desde=2030-01-09&hasta=2030-01-20',
    );
    for (const [, init] of fetchMock.mock.calls) {
      const headers = new Headers(init?.headers);
      expect(headers.get('X-Management-Token')).toBe(token);
      expect(init?.credentials).toBe('same-origin');
      expect(init?.cache).toBe('no-store');
      expect(String(init?.body ?? '')).not.toContain('motivoId');
    }
    expect(availability.ok).toBe(true);
  });

  it('envia If-Match en cancelacion y reprogramacion y conserva el inicio exacto', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(200, {
        fecha: '2030-01-08',
        horaInicio: '09:00:00',
        horaFin: '09:30:00',
        estado: 'CANCELADO',
        notificacionEstado: 'PENDIENTE',
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        turnoId: '22222222-2222-2222-2222-222222222222',
        fecha: '2030-01-09',
        horaInicio: '09:00:00',
        horaFin: '09:30:00',
        estado: 'CONFIRMADO',
        notificacionEstado: 'PENDIENTE',
      }), { status: 200, headers: { ETag: '"turno-r2"' } }));

    const client = createApiClient(fetchMock);
    const cancelled = await client.cancelarGestionTurno('secret-a', '"turno-r1"');
    const newStart = '2030-01-09T12:00:00Z';
    const rescheduled = await client.reprogramarGestionTurno('secret-b', '"turno-r2"', newStart);

    expect(cancelled.ok).toBe(true);
    expect(rescheduled.ok).toBe(true);
    if (rescheduled.ok) {
      expect(rescheduled.data.etag).toBe('"turno-r2"');
    }
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/gestion/turno/cancelacion');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/gestion/turno/reprogramacion');
    const cancelInit = fetchMock.mock.calls[0]?.[1];
    const rescheduleInit = fetchMock.mock.calls[1]?.[1];
    expect(new Headers(cancelInit?.headers).get('If-Match')).toBe('"turno-r1"');
    expect(new Headers(cancelInit?.headers).get('X-Management-Token')).toBe('secret-a');
    expect(new Headers(rescheduleInit?.headers).get('If-Match')).toBe('"turno-r2"');
    expect(new Headers(rescheduleInit?.headers).get('X-Management-Token')).toBe('secret-b');
    expect(rescheduleInit?.body).toBe(JSON.stringify({ nuevoInicio: newStart }));
  });

  it('reconoce los errores de enlace y de gestion de C-09', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse(404, { codigo: 'LINK_NOT_AVAILABLE' }))
      .mockResolvedValueOnce(jsonResponse(409, { codigo: 'MANAGEMENT_WINDOW_CLOSED' }));
    const client = createApiClient(fetchMock);

    const missing = await client.getGestionTurno('secret');
    const closed = await client.cancelarGestionTurno('secret', '"turno-r1"');

    expect(missing).toMatchObject({ ok: false, status: 404, codigo: 'LINK_NOT_AVAILABLE' });
    expect(closed).toMatchObject({ ok: false, status: 409, codigo: 'MANAGEMENT_WINDOW_CLOSED' });
  });
});
