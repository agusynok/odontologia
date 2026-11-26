# dentist-agenda-query Specification

## Purpose
Permitir que el odontólogo autenticado consulte su agenda diaria y semanal en la zona horaria del consultorio y acceda al detalle de los turnos con los cinco datos básicos del paciente. La API de solo lectura permite organizar la atención y contactar al paciente cuando sea necesario.

## Requirements

### Requirement: AQ-01 Consulta interna de agenda diaria y semanal en la zona del consultorio
La API interna SHALL exponer `GET /api/odontologo/agenda` con `vista` (`DIA` por defecto o `SEMANA` de lunes a domingo ISO) y `fecha` opcionales. SHALL interpretar el período en `consultorio.zonaHoraria` y devolver `200 OK` con `vista`, `desde`, `hasta`, `zonaHoraria` y `turnos` ordenados por `inicio ASC, id ASC`.

#### Scenario: Consulta diaria y semanal interpretada en la zona horaria del consultorio
- **WHEN** el odontólogo autenticado consulta `GET /api/odontologo/agenda` con `vista=DIA` o `vista=SEMANA` (u omite `vista`) y envía una `fecha` de calendario válida con formato exacto `YYYY-MM-DD`, con año de cuatro dígitos y sin offset ni espacios, o deja `fecha` sin enviar
- **THEN** la API usa `DIA` si se omitió `vista` y obtiene el día actual de `Clock` en `consultorio.zonaHoraria` si se omitió `fecha`. Interpreta los límites de medianoche en esa zona, incluye los turnos cuya duración intersecta `[periodoInicio, periodoFin)` y excluye turnos contiguos donde `fin == periodoInicio` o `inicio == periodoFin`.

#### Scenario: Inclusión de turnos confirmados y cancelados sin borrado físico
- **WHEN** en el período consultado existen turnos en estado `CONFIRMADO` y `CANCELADO`
- **THEN** la API devuelve `200 OK` incluyendo ambos estados ordenados por `inicio ASC, id ASC` con `id`, `motivoId`, `motivoNombre`, `inicio`, `fin`, `duracionReservadaMinutos`, `estado`, `pacienteNombre` y `pacienteApellido`.

#### Scenario: Distinción entre agenda vacía y fallo de consulta
- **WHEN** no existen turnos en el período consultado
- **THEN** la API responde `200 OK` con `turnos: []`; si falta la configuración del consultorio o falla la persistencia, responde `500 TECHNICAL_FAILURE`.

#### Scenario: Rechazo de parámetros de filtro inválidos
- **WHEN** `vista` es distinta de `DIA` o `SEMANA`, o `fecha` presente es vacía, tiene espacios, offset (`2026-11-26Z`, `2026-11-26-03:00`), fecha de calendario inexistente (`2026-02-30`) o año extendido (`+10000-01-01`, `+999999999-12-31`)
- **THEN** la API responde `400` con `{"codigo":"VALIDATION_ERROR"}` antes de invocar al servicio.

### Requirement: AQ-02 Consulta de detalle de turno y cinco datos básicos del paciente
La API interna SHALL devolver el detalle de un turno y los cinco datos básicos del paciente en `GET /api/odontologo/turnos/{turnoId}`. El identificador SHALL ser un UUID hexadecimal estricto `8-4-4-4-12`, en mayúsculas o minúsculas. La respuesta SHALL NOT exponer credenciales, notificaciones, `agendaId`, `consultorioId`, historia clínica ni cobros.

#### Scenario: Consulta exitosa de detalle con los cinco datos básicos del paciente
- **WHEN** el odontólogo autenticado consulta `GET /api/odontologo/turnos/{turnoId}` con un UUID `8-4-4-4-12` (en mayúsculas o minúsculas) de un turno existente (`CONFIRMADO` o `CANCELADO`)
- **THEN** la API responde `200 OK` con `id`, `motivoId`, `motivoNombre`, `inicio`, `fin`, `duracionReservadaMinutos`, `estado`, `revision`, `creadoEn`, `canceladoEn` y `paciente` (`nombre`, `apellido`, `email`, `telefono`, `dni`).

#### Scenario: Turno inexistente o identificador con formato inválido
- **WHEN** `{turnoId}` es un UUID `8-4-4-4-12` válido inexistente en la agenda única
- **THEN** la API responde `404` con `{"codigo":"TURNO_NOT_FOUND"}`; cuando `{turnoId}` no cumple el formato hexadecimal `8-4-4-4-12` (como `1-1-1-1-1` o `no-es-uuid`), responde `400` con `{"codigo":"VALIDATION_ERROR"}` antes de invocar al servicio.

### Requirement: AQ-03 Reutilización estricta del acceso interno del odontólogo
Los endpoints `GET /api/odontologo/agenda` y `GET /api/odontologo/turnos/{turnoId}` SHALL quedar protegidos por la configuración existente de `C-03` (`/api/odontologo/**` con rol `ODONTOLOGO`), rechazando llamadas directas sin sesión válida con `401 SESSION_REQUIRED` sin divulgar datos de agenda ni de pacientes, y SHALL NOT modificar `DentistSecurityConfiguration` ni agregar mecanismos de acceso paralelos.

#### Scenario: Rechazo de llamadas directas sin sesión autenticada
- **WHEN** un cliente sin sesión autenticada solicita `GET /api/odontologo/agenda` o `GET /api/odontologo/turnos/{turnoId}`
- **THEN** la API responde `401` con `{"codigo":"SESSION_REQUIRED"}` sin devolver información de la agenda ni de pacientes.
