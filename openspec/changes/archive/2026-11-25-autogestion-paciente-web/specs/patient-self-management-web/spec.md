# Spec Delta

## Purpose

Permitir que el paciente consulte y gestione su turno vigente desde el enlace privado en la interfaz local, sin crear una cuenta y sin exponer datos de otros turnos.

## ADDED Requirements

### Requirement: SW-01 Apertura privada y consulta de solo lectura
La interfaz SHALL consultar únicamente el turno autorizado por el enlace privado, SHALL mantener la credencial en memoria y SHALL NOT modificar el turno al abrir o previsualizar la página.

#### Scenario: Apertura de un enlace vigente
- **WHEN** el paciente abre un enlace vigente con credencial en el fragmento de la URL
- **THEN** la interfaz elimina el fragmento del historial, conserva la credencial solo en memoria, la envía a C-09 mediante `X-Management-Token` y muestra fecha, hora, estado y acciones disponibles sin datos de contacto

#### Scenario: Previsualización repetida
- **WHEN** un navegador o escáner previsualiza el enlace una o más veces
- **THEN** cada consulta muestra el estado actual autorizado y no cambia el turno, su revisión, la credencial ni las intenciones de aviso

#### Scenario: Enlace no disponible
- **WHEN** C-09 responde `404 LINK_NOT_AVAILABLE` por una credencial ausente, inválida, vencida o revocada
- **THEN** la interfaz muestra un mensaje genérico de enlace no disponible sin distinguir la causa ni revelar datos del turno

### Requirement: SW-02 Cancelación expresamente confirmada
La interfaz SHALL solicitar confirmación explícita antes de cancelar y SHALL enviar la revisión vigente en `If-Match` junto con la credencial privada.

#### Scenario: Cancelación confirmada
- **WHEN** el paciente confirma la cancelación y C-09 responde `200 OK`
- **THEN** la interfaz informa el estado `CANCELADO` y la notificación `PENDIENTE`, sin afirmar que el correo fue recibido

#### Scenario: Cancelación fuera de plazo
- **WHEN** C-09 responde `409 MANAGEMENT_WINDOW_CLOSED`
- **THEN** la interfaz conserva el estado conocido del turno e indica que el paciente debe contactar directamente al odontólogo por el canal habitual externo del consultorio, sin mostrar datos de contacto ni ofrecer una excepción o alta manual

### Requirement: SW-03 Reprogramación expresa con horarios autorizados
La interfaz SHALL obtener horarios solo para el turno autorizado, SHALL solicitar confirmación expresa y SHALL enviar a C-09 el inicio exacto seleccionado junto con la revisión vigente en `If-Match`.

#### Scenario: Reprogramación confirmada
- **WHEN** el paciente elige un horario devuelto para el turno autorizado y confirma la operación
- **THEN** la interfaz envía el inicio exacto sin permitir elegir otro motivo y, al recibir `200 OK`, muestra el nuevo intervalo en la zona horaria del consultorio

#### Scenario: Previsualización de horario
- **WHEN** el paciente consulta horarios o cambia el período antes de confirmar una reprogramación
- **THEN** la interfaz solo consulta disponibilidad y no modifica el turno, la revisión, la credencial ni las intenciones de aviso

#### Scenario: Reprogramación fuera de plazo
- **WHEN** C-09 responde `409 MANAGEMENT_WINDOW_CLOSED` al confirmar una reprogramación
- **THEN** la interfaz conserva el turno conocido e indica el contacto directo con el odontólogo por el canal habitual externo del consultorio, sin ofrecer alta manual ni excepción

### Requirement: SW-04 Errores de escritura y resultados inciertos
La interfaz SHALL presentar los errores de C-09 sin afirmar cambios no confirmados y SHALL distinguir los rechazos conocidos de una respuesta de escritura incierta.

#### Scenario: Horario ocupado, intervalo idéntico o revisión obsoleta
- **WHEN** C-09 responde `409 SLOT_UNAVAILABLE`, `409 SAME_INTERVAL` o `412 TURN_VERSION_MISMATCH`
- **THEN** la interfaz informa el rechazo, mantiene visible el estado confirmado del turno y permite consultar el estado vigente antes de reintentar

#### Scenario: Resultado de escritura incierto
- **WHEN** se pierde la conexión o la respuesta de una cancelación o reprogramación no puede validarse
- **THEN** la interfaz indica que no pudo confirmar el resultado y vuelve a consultar el estado antes de presentar una cancelación o reprogramación como exitosa

### Requirement: SW-05 Uso con teclado y pantallas pequeñas y grandes
La interfaz SHALL permitir completar la consulta, cancelación y reprogramación con teclado y SHALL mantener legibles las acciones y los estados en pantallas pequeñas y grandes.

#### Scenario: Navegación de autogestión
- **WHEN** el paciente completa los flujos usando teclado o una pantalla pequeña o grande
- **THEN** puede identificar la acción enfocada, confirmar o cancelar la operación y leer su resultado sin perder el estado del flujo
