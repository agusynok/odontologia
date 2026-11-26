import type {
  AgendaQueryParams,
  AgendaResponse,
  ApiErrorCode,
  ApiResult,
  Bloqueo,
  BloqueoInput,
  CsrfResponse,
  DisponibilidadGestionParams,
  DisponibilidadGestionResponse,
  DisponibilidadPublicaParams,
  DisponibilidadPublicaResponse,
  GestionTurnoActual,
  GestionTurnoCambio,
  GestionTurnoReprogramacion,
  HorarioResponse,
  Motivo,
  MotivoInput,
  ReservaPublicaInput,
  ReservaPublicaResponse,
  SessionResponse,
  TurnoDetalleResponse,
} from '../types/odontologia';
import {
  isAgendaResponse,
  isBloqueo,
  isBloqueoList,
  isCsrfResponse,
  isDisponibilidadGestionResponse,
  isDisponibilidadPublicaResponse,
  isErrorResponse,
  isHorarioResponse,
  isGestionTurnoCambio,
  isGestionTurnoReprogramacion,
  isGestionTurno,
  isMotivo,
  isMotivoList,
  isReservaPublicaResponse,
  isSessionResponse,
  isTurnoDetalleResponse,
  toApiErrorCode,
} from '../types/odontologia';
import { getErrorMessage } from '../utils/errors';

export interface ApiClient {
  checkSession: () => Promise<ApiResult<SessionResponse>>;
  login: (username: string, password: string) => Promise<ApiResult<void>>;
  logout: () => Promise<ApiResult<void>>;
  getMotivos: () => Promise<ApiResult<Motivo[]>>;
  createMotivo: (input: MotivoInput) => Promise<ApiResult<Motivo>>;
  updateMotivo: (motivoId: string, input: MotivoInput) => Promise<ApiResult<Motivo>>;
  getHorario: () => Promise<ApiResult<HorarioResponse>>;
  replaceHorario: (input: HorarioResponse) => Promise<ApiResult<HorarioResponse>>;
  getBloqueos: () => Promise<ApiResult<Bloqueo[]>>;
  createBloqueo: (input: BloqueoInput) => Promise<ApiResult<Bloqueo>>;
  deleteBloqueo: (bloqueoId: string) => Promise<ApiResult<void>>;
  getAgenda: (params?: AgendaQueryParams) => Promise<ApiResult<AgendaResponse>>;
  getTurnoDetalle: (turnoId: string) => Promise<ApiResult<TurnoDetalleResponse>>;
  getPublicMotivos: () => Promise<ApiResult<Motivo[]>>;
  getPublicDisponibilidad: (
    params: DisponibilidadPublicaParams,
  ) => Promise<ApiResult<DisponibilidadPublicaResponse>>;
  createPublicTurno: (input: ReservaPublicaInput) => Promise<ApiResult<ReservaPublicaResponse>>;
  getGestionTurno: (token: string) => Promise<ApiResult<GestionTurnoActual>>;
  getGestionDisponibilidad: (
    token: string,
    params?: DisponibilidadGestionParams,
  ) => Promise<ApiResult<DisponibilidadGestionResponse>>;
  cancelarGestionTurno: (token: string, etag: string) => Promise<ApiResult<GestionTurnoCambio>>;
  reprogramarGestionTurno: (
    token: string,
    etag: string,
    nuevoInicio: string,
  ) => Promise<ApiResult<GestionTurnoReprogramacion>>;
  clearCsrfToken: () => void;
}

function fail(status: number, codigo: ApiErrorCode): ApiResult<never> {
  return {
    ok: false,
    status,
    codigo,
    message: getErrorMessage(codigo),
  };
}

async function readJsonBody(
  response: Response,
): Promise<{ ok: true; body: unknown } | { ok: false; codigo: 'NETWORK_ERROR' }> {
  let text: string;
  try {
    text = await response.text();
  } catch {
    return { ok: false, codigo: 'NETWORK_ERROR' };
  }
  if (text.trim().length === 0) {
    return { ok: true, body: null };
  }
  try {
    return { ok: true, body: JSON.parse(text) as unknown };
  } catch {
    return { ok: true, body: null };
  }
}

export function createApiClient(fetchImpl: typeof fetch = fetch): ApiClient {
  let csrfState: CsrfResponse | null = null;

  function clearCsrfToken(): void {
    csrfState = null;
  }

  async function ensureCsrfToken(): Promise<ApiResult<CsrfResponse>> {
    if (csrfState !== null) {
      return { ok: true, data: csrfState };
    }
    let response: Response;
    try {
      response = await fetchImpl('/api/odontologo/csrf', {
        method: 'GET',
        credentials: 'same-origin',
      });
    } catch {
      return fail(0, 'NETWORK_ERROR');
    }

    const parsed = await readJsonBody(response);
    if (!parsed.ok) {
      return fail(0, parsed.codigo);
    }
    const body = parsed.body;
    if (!response.ok) {
      const codigo = isErrorResponse(body) ? toApiErrorCode(body.codigo) : 'TECHNICAL_FAILURE';
      return fail(response.status, codigo);
    }
    if (!isCsrfResponse(body)) {
      return fail(response.status, 'INVALID_RESPONSE');
    }
    csrfState = body;
    return { ok: true, data: body };
  }

  async function parseErrorResponse(response: Response): Promise<ApiResult<never>> {
    const parsed = await readJsonBody(response);
    if (!parsed.ok) {
      return fail(0, parsed.codigo);
    }
    const body = parsed.body;
    let codigo: ApiErrorCode;
    if (isErrorResponse(body)) {
      codigo = toApiErrorCode(body.codigo);
    } else if (response.status === 401) {
      codigo = 'SESSION_REQUIRED';
    } else if (response.status === 403) {
      codigo = 'CSRF_INVALID';
    } else {
      codigo = 'TECHNICAL_FAILURE';
    }

    if (codigo === 'CSRF_INVALID' || codigo === 'SESSION_REQUIRED') {
      clearCsrfToken();
    }
    return fail(response.status, codigo);
  }

  async function getJson<T>(url: string, guard: (value: unknown) => value is T): Promise<ApiResult<T>> {
    let response: Response;
    try {
      response = await fetchImpl(url, {
        method: 'GET',
        credentials: 'same-origin',
      });
    } catch {
      return fail(0, 'NETWORK_ERROR');
    }

    if (!response.ok) {
      return parseErrorResponse(response);
    }

    const parsed = await readJsonBody(response);
    if (!parsed.ok) {
      return fail(0, parsed.codigo);
    }
    const body = parsed.body;
    if (!guard(body)) {
      return fail(response.status, 'INVALID_RESPONSE');
    }
    return { ok: true, data: body };
  }

  async function mutateJson<T>(
    method: 'POST' | 'PUT' | 'DELETE',
    url: string,
    payload: unknown,
    guard: ((value: unknown) => value is T) | null,
  ): Promise<ApiResult<T>> {
    const csrf = await ensureCsrfToken();
    if (!csrf.ok) {
      return csrf;
    }

    const headers: Record<string, string> = {
      [csrf.data.headerName]: csrf.data.token,
    };
    const init: RequestInit = {
      method,
      credentials: 'same-origin',
      headers,
    };
    if (payload !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(payload);
    }

    let response: Response;
    try {
      response = await fetchImpl(url, init);
    } catch {
      return fail(0, 'NETWORK_ERROR');
    }

    if (!response.ok) {
      const errorResult = await parseErrorResponse(response);
      if (!errorResult.ok && errorResult.codigo === 'CSRF_INVALID') {
        const sessionCheck = await getJson('/api/odontologo/sesion', isSessionResponse);
        if (!sessionCheck.ok && sessionCheck.codigo === 'SESSION_REQUIRED') {
          return sessionCheck;
        }
        if (sessionCheck.ok && !sessionCheck.data.autenticado) {
          return fail(401, 'SESSION_REQUIRED');
        }
      }
      return errorResult;
    }

    if (guard === null) {
      return { ok: true, data: undefined as T };
    }

    const parsed = await readJsonBody(response);
    if (!parsed.ok) {
      return fail(0, parsed.codigo);
    }
    if (!guard(parsed.body)) {
      return fail(response.status, 'INVALID_RESPONSE');
    }
    return { ok: true, data: parsed.body };
  }

  async function managedJson(
    url: string,
    token: string,
    method: 'GET' | 'POST',
    etag?: string,
    payload?: unknown,
  ): Promise<ApiResult<{ response: Response; body: unknown }>> {
    const headers: Record<string, string> = { 'X-Management-Token': token };
    const init: RequestInit = {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers,
    };
    if (etag !== undefined) {
      headers['If-Match'] = etag;
    }
    if (payload !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(payload);
    }

    let response: Response;
    try {
      response = await fetchImpl(url, init);
    } catch {
      return fail(0, 'NETWORK_ERROR');
    }
    if (!response.ok) {
      return parseErrorResponse(response);
    }
    const parsed = await readJsonBody(response);
    if (!parsed.ok) {
      return fail(0, parsed.codigo);
    }
    return { ok: true, data: { response, body: parsed.body } };
  }

  function responseEtag(response: Response): string | null {
    const value = response.headers.get('ETag');
    return value !== null && value.trim().length > 0 ? value : null;
  }

  return {
    clearCsrfToken,
    checkSession: () => getJson('/api/odontologo/sesion', isSessionResponse),
    login: async (username: string, password: string) => {
      const csrf = await ensureCsrfToken();
      if (!csrf.ok) {
        return csrf;
      }

      const params = new URLSearchParams();
      params.set('username', username);
      params.set('password', password);

      let response: Response;
      try {
        response = await fetchImpl('/api/odontologo/sesion', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            [csrf.data.headerName]: csrf.data.token,
          },
          body: params.toString(),
        });
      } catch {
        return fail(0, 'NETWORK_ERROR');
      }

      if (!response.ok) {
        return parseErrorResponse(response);
      }

      // C-03 D-04: descartar el token anterior al cambiar la sesión.
      clearCsrfToken();
      return { ok: true, data: undefined };
    },
    logout: async () => {
      const result = await mutateJson<void>('POST', '/api/odontologo/sesion/cierre', undefined, null);
      if (result.ok) {
        clearCsrfToken();
      }
      return result;
    },
    getMotivos: () => getJson('/api/odontologo/motivos', isMotivoList),
    createMotivo: (input: MotivoInput) =>
      mutateJson('POST', '/api/odontologo/motivos', input, isMotivo),
    updateMotivo: (motivoId: string, input: MotivoInput) =>
      mutateJson('PUT', `/api/odontologo/motivos/${encodeURIComponent(motivoId)}`, input, isMotivo),
    getHorario: () => getJson('/api/odontologo/horario', isHorarioResponse),
    replaceHorario: (input: HorarioResponse) =>
      mutateJson('PUT', '/api/odontologo/horario', input, isHorarioResponse),
    getBloqueos: () => getJson('/api/odontologo/bloqueos', isBloqueoList),
    createBloqueo: (input: BloqueoInput) =>
      mutateJson('POST', '/api/odontologo/bloqueos', input, isBloqueo),
    deleteBloqueo: (bloqueoId: string) =>
      mutateJson<void>('DELETE', `/api/odontologo/bloqueos/${encodeURIComponent(bloqueoId)}`, undefined, null),
    getAgenda: (params?: AgendaQueryParams) => {
      const search = new URLSearchParams();
      if (params?.vista !== undefined) {
        search.set('vista', params.vista);
      }
      if (typeof params?.fecha === 'string' && params.fecha.trim().length > 0) {
        search.set('fecha', params.fecha.trim());
      }
      const query = search.toString();
      const url = query.length > 0 ? `/api/odontologo/agenda?${query}` : '/api/odontologo/agenda';
      return getJson(url, isAgendaResponse);
    },
    getTurnoDetalle: (turnoId: string) =>
      getJson(`/api/odontologo/turnos/${encodeURIComponent(turnoId)}`, isTurnoDetalleResponse),
    getPublicMotivos: () => getJson('/api/public/motivos', isMotivoList),
    getPublicDisponibilidad: (params: DisponibilidadPublicaParams) => {
      const search = new URLSearchParams();
      search.set('motivoId', params.motivoId);
      if (typeof params.desde === 'string' && params.desde.trim().length > 0) {
        search.set('desde', params.desde.trim());
      }
      if (typeof params.hasta === 'string' && params.hasta.trim().length > 0) {
        search.set('hasta', params.hasta.trim());
      }
      return getJson(`/api/public/disponibilidad?${search.toString()}`, isDisponibilidadPublicaResponse);
    },
    createPublicTurno: async (input: ReservaPublicaInput) => {
      let response: Response;
      try {
        response = await fetchImpl('/api/public/turnos', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        });
      } catch {
        return fail(0, 'NETWORK_ERROR');
      }

      if (!response.ok) {
        return parseErrorResponse(response);
      }

      const parsed = await readJsonBody(response);
      if (!parsed.ok) {
        return fail(0, parsed.codigo);
      }
      if (!isReservaPublicaResponse(parsed.body)) {
        return fail(response.status, 'INVALID_RESPONSE');
      }
      return { ok: true, data: parsed.body };
    },
    getGestionTurno: async (token: string) => {
      const result = await managedJson('/api/gestion/turno', token, 'GET');
      if (!result.ok) {
        return result;
      }
      const etag = responseEtag(result.data.response);
      if (etag === null || !isGestionTurno(result.data.body)) {
        return fail(result.data.response.status, 'INVALID_RESPONSE');
      }
      return { ok: true, data: { turno: result.data.body, etag } };
    },
    getGestionDisponibilidad: async (token: string, params: DisponibilidadGestionParams = {}) => {
      const search = new URLSearchParams();
      if (typeof params.desde === 'string' && params.desde.trim().length > 0) {
        search.set('desde', params.desde.trim());
      }
      if (typeof params.hasta === 'string' && params.hasta.trim().length > 0) {
        search.set('hasta', params.hasta.trim());
      }
      const query = search.toString();
      const url = `/api/gestion/turno/disponibilidad${query.length > 0 ? `?${query}` : ''}`;
      const result = await managedJson(url, token, 'GET');
      if (!result.ok) {
        return result;
      }
      if (!isDisponibilidadGestionResponse(result.data.body)) {
        return fail(result.data.response.status, 'INVALID_RESPONSE');
      }
      return { ok: true, data: result.data.body };
    },
    cancelarGestionTurno: async (token: string, etag: string) => {
      const result = await managedJson('/api/gestion/turno/cancelacion', token, 'POST', etag);
      if (!result.ok) {
        return result;
      }
      if (!isGestionTurnoCambio(result.data.body) || result.data.body.estado !== 'CANCELADO') {
        return fail(result.data.response.status, 'INVALID_RESPONSE');
      }
      return { ok: true, data: result.data.body };
    },
    reprogramarGestionTurno: async (token: string, etag: string, nuevoInicio: string) => {
      const result = await managedJson(
        '/api/gestion/turno/reprogramacion',
        token,
        'POST',
        etag,
        { nuevoInicio },
      );
      if (!result.ok) {
        return result;
      }
      const responseEtagValue = responseEtag(result.data.response);
      if (
        responseEtagValue === null ||
        !isGestionTurnoReprogramacion(result.data.body) ||
        result.data.body.estado !== 'CONFIRMADO'
      ) {
        return fail(result.data.response.status, 'INVALID_RESPONSE');
      }
      return { ok: true, data: { ...result.data.body, etag: responseEtagValue } };
    },
  };
}

export const apiClient = createApiClient();
