import { isValidIsoCalendarDate } from '../utils/timezone';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_LOGIN_REQUEST'
  | 'INVALID_CREDENTIALS'
  | 'SESSION_REQUIRED'
  | 'CSRF_INVALID'
  | 'ACCESS_DENIED'
  | 'ACCESS_NOT_CONFIGURED'
  | 'ACCESS_UNAVAILABLE'
  | 'MOTIVO_NOT_FOUND'
  | 'BLOQUEO_NOT_FOUND'
  | 'TURNO_NOT_FOUND'
  | 'CONFIGURATION_CONFLICT'
  | 'SLOT_UNAVAILABLE'
  | 'LINK_NOT_AVAILABLE'
  | 'MANAGEMENT_WINDOW_CLOSED'
  | 'SAME_INTERVAL'
  | 'TURN_VERSION_MISMATCH'
  | 'PRECONDITION_REQUIRED'
  | 'AGENDA_BUSY'
  | 'TECHNICAL_FAILURE'
  | 'NETWORK_ERROR'
  | 'INVALID_RESPONSE';

export interface CsrfResponse {
  token: string;
  headerName: string;
}

export interface SessionResponse {
  autenticado: boolean;
}

export interface Motivo {
  id: string;
  nombre: string;
  duracionMinutos: number;
}

export interface MotivoInput {
  nombre: string;
  duracionMinutos: number;
}

export type FranjaTipo = 'ATENCION' | 'PAUSA';

export interface FranjaSemanal {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  tipo: FranjaTipo;
}

export interface HorarioResponse {
  franjas: FranjaSemanal[];
}

export interface Bloqueo {
  id: string;
  inicio: string;
  fin: string;
  descripcion: string | null;
}

export interface BloqueoInput {
  inicio: string;
  fin: string;
  descripcion: string | null;
}

export interface HorarioDisponible {
  inicio: string;
  fin: string;
}

export interface DisponibilidadPublicaParams {
  motivoId: string;
  desde?: string;
  hasta?: string;
}

export interface DisponibilidadPublicaResponse {
  motivoId: string;
  duracionMinutos: number;
  zonaHoraria: string;
  horarios: HorarioDisponible[];
}

export interface GestionTurno {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: 'CONFIRMADO' | 'CANCELADO';
  acciones: string[];
}

export interface GestionTurnoActual {
  turno: GestionTurno;
  etag: string;
}

export interface GestionTurnoCambio {
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: 'CONFIRMADO' | 'CANCELADO';
  notificacionEstado: 'PENDIENTE';
}

export interface GestionTurnoReprogramacion extends GestionTurnoCambio {
  turnoId: string;
  etag: string;
}

export interface DisponibilidadGestionParams {
  desde?: string;
  hasta?: string;
}

export interface DisponibilidadGestionResponse {
  zonaHoraria: string;
  horarios: HorarioDisponible[];
}

export interface ReservaPublicaInput {
  motivoId: string;
  inicio: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
}

export interface ReservaPublicaResponse {
  turnoId: string;
  motivoId: string;
  inicio: string;
  fin: string;
  duracionReservadaMinutos: number;
  estado: 'CONFIRMADO';
  notificacionEstado: 'PENDIENTE';
}

export type AgendaVista = 'DIA' | 'SEMANA';
export type TurnoEstado = 'CONFIRMADO' | 'CANCELADO';

export interface AgendaQueryParams {
  vista?: AgendaVista;
  fecha?: string;
}

export interface AgendaTurnoResumen {
  id: string;
  motivoId: string;
  motivoNombre: string;
  inicio: string;
  fin: string;
  duracionReservadaMinutos: number;
  estado: TurnoEstado;
  pacienteNombre: string;
  pacienteApellido: string;
}

export interface AgendaResponse {
  vista: AgendaVista;
  desde: string;
  hasta: string;
  zonaHoraria: string;
  turnos: AgendaTurnoResumen[];
}

export interface PacienteBasico {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  dni: string;
}

export interface TurnoDetalleResponse {
  id: string;
  motivoId: string;
  motivoNombre: string;
  inicio: string;
  fin: string;
  duracionReservadaMinutos: number;
  estado: TurnoEstado;
  revision: number;
  creadoEn: string;
  canceladoEn: string | null;
  paciente: PacienteBasico;
}

export interface ErrorResponse {
  codigo: string;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; codigo: ApiErrorCode; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidDuration(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 15 &&
    value <= 240 &&
    value % 15 === 0
  );
}

export function isCsrfResponse(value: unknown): value is CsrfResponse {
  if (!isRecord(value)) {
    return false;
  }
  return isNonEmptyString(value.token) && isNonEmptyString(value.headerName);
}

export function isSessionResponse(value: unknown): value is SessionResponse {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.autenticado === 'boolean';
}

export function isMotivo(value: unknown): value is Motivo {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.nombre) &&
    isValidDuration(value.duracionMinutos)
  );
}

export function isMotivoList(value: unknown): value is Motivo[] {
  return Array.isArray(value) && value.every(isMotivo);
}

export function isFranjaSemanal(value: unknown): value is FranjaSemanal {
  if (!isRecord(value)) {
    return false;
  }
  const dia = value.diaSemana;
  const tipo = value.tipo;
  return (
    isNonEmptyString(value.id) &&
    typeof dia === 'number' &&
    Number.isInteger(dia) &&
    dia >= 1 &&
    dia <= 7 &&
    isNonEmptyString(value.horaInicio) &&
    isNonEmptyString(value.horaFin) &&
    (tipo === 'ATENCION' || tipo === 'PAUSA')
  );
}

export function isHorarioResponse(value: unknown): value is HorarioResponse {
  if (!isRecord(value)) {
    return false;
  }
  return Array.isArray(value.franjas) && value.franjas.every(isFranjaSemanal);
}

export function isBloqueo(value: unknown): value is Bloqueo {
  if (!isRecord(value)) {
    return false;
  }
  const desc = value.descripcion;
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.inicio) &&
    isNonEmptyString(value.fin) &&
    (desc === null || typeof desc === 'string')
  );
}

export function isBloqueoList(value: unknown): value is Bloqueo[] {
  return Array.isArray(value) && value.every(isBloqueo);
}

export function isErrorResponse(value: unknown): value is ErrorResponse {
  if (!isRecord(value)) {
    return false;
  }
  return isNonEmptyString(value.codigo);
}

export function isHorarioDisponible(value: unknown): value is HorarioDisponible {
  if (!isRecord(value)) {
    return false;
  }
  return isNonEmptyString(value.inicio) && isNonEmptyString(value.fin);
}

export function isGestionTurno(value: unknown): value is GestionTurno {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isNonEmptyString(value.fecha) &&
    isNonEmptyString(value.horaInicio) &&
    isNonEmptyString(value.horaFin) &&
    (value.estado === 'CONFIRMADO' || value.estado === 'CANCELADO') &&
    Array.isArray(value.acciones) &&
    value.acciones.every((accion) => typeof accion === 'string')
  );
}

export function isGestionTurnoCambio(value: unknown): value is GestionTurnoCambio {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isNonEmptyString(value.fecha) &&
    isNonEmptyString(value.horaInicio) &&
    isNonEmptyString(value.horaFin) &&
    (value.estado === 'CONFIRMADO' || value.estado === 'CANCELADO') &&
    value.notificacionEstado === 'PENDIENTE'
  );
}

export function isGestionTurnoReprogramacion(
  value: unknown,
): value is Omit<GestionTurnoReprogramacion, 'etag'> {
  return (
    isGestionTurnoCambio(value) &&
    isRecord(value) &&
    isNonEmptyString(value.turnoId)
  );
}

export function isDisponibilidadGestionResponse(
  value: unknown,
): value is DisponibilidadGestionResponse {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isNonEmptyString(value.zonaHoraria) &&
    Array.isArray(value.horarios) &&
    value.horarios.every(isHorarioDisponible)
  );
}

export function isDisponibilidadPublicaResponse(
  value: unknown,
): value is DisponibilidadPublicaResponse {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isNonEmptyString(value.motivoId) &&
    isValidDuration(value.duracionMinutos) &&
    isNonEmptyString(value.zonaHoraria) &&
    Array.isArray(value.horarios) &&
    value.horarios.every(isHorarioDisponible)
  );
}

export function isReservaPublicaResponse(value: unknown): value is ReservaPublicaResponse {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isNonEmptyString(value.turnoId) &&
    isNonEmptyString(value.motivoId) &&
    isNonEmptyString(value.inicio) &&
    isNonEmptyString(value.fin) &&
    isValidDuration(value.duracionReservadaMinutos) &&
    value.estado === 'CONFIRMADO' &&
    value.notificacionEstado === 'PENDIENTE'
  );
}

function isTurnoEstado(value: unknown): value is TurnoEstado {
  return value === 'CONFIRMADO' || value === 'CANCELADO';
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

export function isAgendaTurnoResumen(value: unknown): value is AgendaTurnoResumen {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.motivoId) &&
    isNonEmptyString(value.motivoNombre) &&
    isNonEmptyString(value.inicio) &&
    isNonEmptyString(value.fin) &&
    isPositiveInteger(value.duracionReservadaMinutos) &&
    isTurnoEstado(value.estado) &&
    isNonEmptyString(value.pacienteNombre) &&
    isNonEmptyString(value.pacienteApellido)
  );
}

export function isAgendaResponse(value: unknown): value is AgendaResponse {
  if (!isRecord(value)) {
    return false;
  }
  return (
    (value.vista === 'DIA' || value.vista === 'SEMANA') &&
    typeof value.desde === 'string' &&
    isValidIsoCalendarDate(value.desde) &&
    typeof value.hasta === 'string' &&
    isValidIsoCalendarDate(value.hasta) &&
    isNonEmptyString(value.zonaHoraria) &&
    Array.isArray(value.turnos) &&
    value.turnos.every(isAgendaTurnoResumen)
  );
}

export function isPacienteBasico(value: unknown): value is PacienteBasico {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isNonEmptyString(value.nombre) &&
    isNonEmptyString(value.apellido) &&
    isNonEmptyString(value.email) &&
    isNonEmptyString(value.telefono) &&
    isNonEmptyString(value.dni)
  );
}

export function isTurnoDetalleResponse(value: unknown): value is TurnoDetalleResponse {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.motivoId) &&
    isNonEmptyString(value.motivoNombre) &&
    isNonEmptyString(value.inicio) &&
    isNonEmptyString(value.fin) &&
    isPositiveInteger(value.duracionReservadaMinutos) &&
    isTurnoEstado(value.estado) &&
    isNonNegativeInteger(value.revision) &&
    isNonEmptyString(value.creadoEn) &&
    (value.canceladoEn === null || isNonEmptyString(value.canceladoEn)) &&
    isPacienteBasico(value.paciente)
  );
}

const KNOWN_ERROR_CODES: ReadonlySet<string> = new Set<ApiErrorCode>([
  'VALIDATION_ERROR',
  'INVALID_LOGIN_REQUEST',
  'INVALID_CREDENTIALS',
  'SESSION_REQUIRED',
  'CSRF_INVALID',
  'ACCESS_DENIED',
  'ACCESS_NOT_CONFIGURED',
  'ACCESS_UNAVAILABLE',
  'MOTIVO_NOT_FOUND',
  'BLOQUEO_NOT_FOUND',
  'TURNO_NOT_FOUND',
  'CONFIGURATION_CONFLICT',
  'SLOT_UNAVAILABLE',
  'LINK_NOT_AVAILABLE',
  'MANAGEMENT_WINDOW_CLOSED',
  'SAME_INTERVAL',
  'TURN_VERSION_MISMATCH',
  'PRECONDITION_REQUIRED',
  'AGENDA_BUSY',
  'TECHNICAL_FAILURE',
  'NETWORK_ERROR',
  'INVALID_RESPONSE',
]);

export function toApiErrorCode(raw: string): ApiErrorCode {
  if (KNOWN_ERROR_CODES.has(raw)) {
    return raw as ApiErrorCode;
  }
  return 'TECHNICAL_FAILURE';
}
