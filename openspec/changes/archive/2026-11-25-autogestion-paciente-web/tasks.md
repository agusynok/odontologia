# Tasks

## 1. Gobernanza y decisiones operativas

- [x] 1.1 Resolver PB-06 para C-14 conforme a la regla de contacto directo de la visión: responsable operativo, el odontólogo; contacto por el canal habitual del consultorio fuera de la app. Registrar la decisión en la KB y `design.md`, sin inventar ni exponer datos de contacto.
- [x] 1.2 Registrar y verificar la aprobación CRITICAL del código para el alcance de C-14; evidencia: respuesta de Santiago del 2026-11-25 en `design.md`.

## 2. Consulta protegida de horarios

- [x] 2.1 Implementar `GET /api/gestion/turno/disponibilidad` derivando el motivo de la credencial autorizada y reutilizando C-07; verificar con pruebas HTTP/unitarias el período, el cuerpo mínimo, `Cache-Control: no-store` y `404 LINK_NOT_AVAILABLE` genérico.
- [x] 2.2 Agregar integración con PostgreSQL que compruebe que la consulta devuelve horarios solo del motivo autorizado, ignora un `motivoId` de cliente y no modifica el turno ni sus avisos; verificar que el test pase contra PostgreSQL 17.12. Límite: `CredencialesGestion` se sustituye por un doble en la integración; no prueba la validación criptográfica real de C-04.

## 3. Transporte privado del navegador

- [x] 3.1 Agregar la ruta local `/gestionar-turno` y el ciclo de vida de la credencial aprobado por C-04; verificar con pruebas frontend que se elimina el fragmento del historial, la credencial queda solo en memoria y una recarga no la recupera de almacenamiento.
- [x] 3.2 Extender el cliente API con consultas protegidas y escrituras tipadas; verificar que las solicitudes usan `X-Management-Token`, `If-Match` cuando corresponde y no incluyen un `motivoId` elegido por el cliente.

## 4. Flujos visibles de autogestión

- [x] 4.1 Mostrar el turno autorizado y estados de enlace inválido con mensajes genéricos; verificar por prueba que carga y previsualización no disparan cancelación ni reprogramación.
- [x] 4.2 Implementar cancelación con confirmación expresa y errores de C-09; verificar con pruebas que solo se escribe tras confirmar y que éxito informa `CANCELADO` y `PENDIENTE` sin prometer recepción del correo.
- [x] 4.3 Implementar elección y confirmación del horario exacto; verificar con pruebas el uso de la zona horaria devuelta, el envío del inicio exacto, la actualización por `ETag` y los rechazos `SLOT_UNAVAILABLE`, `SAME_INTERVAL` y `TURN_VERSION_MISMATCH`.
- [x] 4.4 Mostrar la resolución PB-06 para `409 MANAGEMENT_WINDOW_CLOSED`; prueba de interfaz verifica que orienta al contacto directo con el odontólogo por el canal habitual externo, conserva el turno y no ofrece alta manual ni excepciones.
- [x] 4.5 Verificar el flujo con teclado y en viewport pequeño (390×844) y grande (1440×900); registrar estados, foco y observaciones en `verification.md` y las capturas locales enlazadas allí.

## 5. Verificación de integración y entrega

- [x] 5.1 Registrar la verificación pendiente para el cierre conjunto de C-16: cuando C-11 habilite emails locales, abrir un enlace real y comprobar que su previsualización no modifica el turno. Estado actual y limitación en `verification.md`.
- [x] 5.2 Ejecutar las pruebas unitarias focalizadas, integración PostgreSQL, build frontend, `bootJar`, validación estricta OpenSpec y `git diff --check`; registrar comandos, resultados y límites en `verification.md`.

## Workflow follow-up

- [x] Archivar el change con OpenSpec después de completar y revisar las tareas y sus gates (2026-11-25; `2026-11-25-autogestion-paciente-web`).
