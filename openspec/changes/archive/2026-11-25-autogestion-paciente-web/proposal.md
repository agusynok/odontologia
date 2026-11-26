# Proposal

## Why

C-09 ya ofrece consulta, cancelación y reprogramación por API, pero el paciente todavía no dispone de una interfaz web local para usar el enlace privado. C-14 debe habilitar esa autogestión sin crear cuentas, alterar el turno al abrir o previsualizar el enlace, ni ampliar los datos visibles más allá de lo autorizado.

## What Changes

- Incorporar una interfaz local para consultar el turno autorizado y solicitar expresamente su cancelación o reprogramación.
- Consumir C-04/C-09 según el transporte aprobado: extraer la credencial del fragmento de la URL, retirarla del historial con `history.replaceState`, conservarla solo en memoria y enviarla mediante `X-Management-Token`; no persistirla ni incluirla en logs.
- Permitir elegir horarios solo para el motivo del turno autorizado. La consulta protegida propuesta en [D-04 del diseño archivado de C-09](../2026-11-25-correcciones-c09-autogestion-turnos-api/design.md#d-04) y aprobada CRITICAL por Santiago el 2026-11-25 se especifica en este change.
- Mostrar los errores de enlace, conflicto y ventana cerrada conservando el resultado real de la API. Para `409 MANAGEMENT_WINDOW_CLOSED`, conservar el rechazo y orientar al paciente a contactar directamente al odontólogo por el canal habitual externo del consultorio, sin publicar o configurar datos de contacto.
- Mantener el alcance local y sin cuenta. No cambiar la generación, validación, almacenamiento o recuperación de credenciales, no enviar SMTP desde C-14 y no agregar alta manual ni excepciones fuera de plazo.
- Aplicar el código solo bajo la aprobación CRITICAL explícita registrada en el diseño de C-14.

## Capabilities

### New Capabilities

- `patient-self-management-web`: interfaz del paciente para consultar y gestionar su turno por enlace privado.

### Modified Capabilities

- `appointment-self-management`: consulta protegida de horarios limitada al motivo del único turno autorizado, condicionada a la aprobación CRITICAL de su contrato.

## Impact

- Frontend React: rutas locales, cliente API, tipos, validación de respuestas y estados de consulta, cancelación y reprogramación.
- Backend: consumo de las operaciones C-09 existentes; posible incorporación de la consulta protegida de disponibilidad con C-07 solo tras aprobación CRITICAL.
- Gobernanza y producto: las aprobaciones CRITICAL del contrato protegido y del código de C-14 constan en `design.md`; PB-06 se concreta como contacto directo fuera de la app con el odontólogo, sin alta manual ni excepciones.
- Persistencia: sin cambios de esquema. Comunicaciones SMTP permanecen en C-11.
