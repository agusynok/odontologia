# Spec Delta

## ADDED Requirements

### Requirement: AG-09 Consulta protegida de horarios del turno autorizado
La API SHALL exponer `GET /api/gestion/turno/disponibilidad`, exigir credencial vigente en `X-Management-Token`, derivar el motivo del turno autorizado y aplicar C-07 con `desde` y `hasta` opcionales e inclusivos. SHALL responder `200 OK` con `Cache-Control: no-store`, `zonaHoraria` y `horarios`; SHALL NOT usar ni devolver `motivoId` ni datos personales.

#### Scenario: Consulta autorizada de horarios
- **WHEN** se consultan horarios con una credencial vigente y un período válido
- **THEN** la API devuelve únicamente la zona horaria del consultorio y los horarios disponibles para el motivo del turno autorizado, sin modificar datos persistidos

#### Scenario: Motivo enviado por el cliente
- **WHEN** la solicitud incluye un `motivoId` correspondiente a otro motivo
- **THEN** la API no usa ese valor, calcula disponibilidad solo para el motivo del turno autorizado y no devuelve ningún `motivoId`

#### Scenario: Credencial no disponible
- **WHEN** la credencial está ausente, es inválida, venció o fue revocada
- **THEN** la API responde `404 LINK_NOT_AVAILABLE` de forma genérica y no revela datos del turno ni de motivos

#### Scenario: Período inválido o sin horarios
- **WHEN** las fechas tienen formato inválido, `desde` es posterior a `hasta` o el período válido no tiene horarios
- **THEN** la API devuelve `400 VALIDATION_ERROR` para fechas inválidas o `200 OK` con `horarios: []` cuando no hay opciones, aplicando los valores por defecto y límites de C-07
