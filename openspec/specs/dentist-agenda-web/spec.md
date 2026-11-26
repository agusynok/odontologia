# dentist-agenda-web Specification

## Purpose
Proveer la interfaz web interna de solo lectura para que el odontólogo autenticado consulte su agenda diaria y semanal y el detalle completo de cada turno con los cinco datos básicos del paciente sobre la API local existente (`C-10`).

## Requirements

### Requirement: AW-01 Consulta web de agenda diaria y semanal en la zona del consultorio

La interfaz SHALL consultar `GET /api/odontologo/agenda` con `vista` (`DIA` o `SEMANA`) y `fecha` opcional (`YYYY-MM-DD`). Al montar y en «Hoy», SHALL omitir `fecha` para usar el `Clock` del backend; al navegar períodos, SHALL usar aritmética calendario pura sin reloj del navegador. SHALL formatear intervalos en `zonaHoraria` devuelta, respetar el orden recibido y distinguir `CONFIRMADO` de `CANCELADO` (`CA-US-006-01`, `CA-US-006-03`).

#### Scenario: Carga inicial diaria y cambio a vista semanal en la zona del consultorio

- **WHEN** el odontólogo abre la pestaña «Agenda» por primera vez y luego cambia el selector de vista a semanal
- **THEN** la carga inicial solicita `GET /api/odontologo/agenda?vista=DIA` sin parámetro `fecha`, muestra los turnos en el orden recibido formateados en la `zonaHoraria` devuelta por el backend, y al cambiar a semanal solicita `GET /api/odontologo/agenda?vista=SEMANA` con la fecha del período activo (o sin `fecha` si aún no se fijó)

#### Scenario: Navegación por fecha específica, período anterior/siguiente y retorno a «Hoy»

- **WHEN** el odontólogo selecciona una fecha `YYYY-MM-DD`, acciona «Siguiente» o «Anterior» (avanzando o retrocediendo 1 día en `DIA` o 7 días en `SEMANA`) y luego acciona «Hoy»
- **THEN** las navegaciones calculan el nuevo `YYYY-MM-DD` con aritmética calendario pura sin deriva de zona horaria del navegador, y «Hoy» vuelve a consultar `GET /api/odontologo/agenda` omitiendo `fecha` para usar la fecha resuelta por el backend

#### Scenario: Visualización conjunta de turnos confirmados y cancelados sin presuponer borrado

- **WHEN** la respuesta de `GET /api/odontologo/agenda` incluye turnos en estado `CONFIRMADO` y `CANCELADO`
- **THEN** la lista muestra ambos respetando el orden recibido (`inicio ASC, id ASC`) y los diferencia visualmente indicando que los turnos `CANCELADO` liberaron el intervalo pero conservan su registro histórico

### Requirement: AW-02 Consulta de detalle de turno y cinco datos básicos del paciente

Al seleccionar un turno, la interfaz SHALL consultar `GET /api/odontologo/turnos/{turnoId}` y mostrar su detalle y los cinco datos básicos del paciente (`CA-US-006-02`). La `Revisión` SHALL estar siempre visible, incluso cuando vale `0`. La interfaz SHALL NOT mostrar estado `REPROGRAMADO` ni campos clínicos.

#### Scenario: Apertura exitosa de detalle con los cinco datos básicos del paciente

- **WHEN** el odontólogo selecciona un turno de la agenda (incluido un turno recién reservado con `revision: 0`) y `GET /api/odontologo/turnos/{turnoId}` responde `200 OK`
- **THEN** la interfaz muestra `motivoNombre`, intervalo en `zonaHoraria`, `duracionReservadaMinutos`, `estado` (`CONFIRMADO` o `CANCELADO`), `Revisión` (incluido `0`), `creadoEn`, `canceladoEn` cuando corresponde y los cinco campos de `paciente` (`nombre`, `apellido`, `email`, `telefono`, `dni`). El panel se puede cerrar.

#### Scenario: Turno reprogramado o cancelado reflejado fielmente según su estado y metadatos

- **WHEN** corresponde a un turno reprogramado (`estado: CONFIRMADO`, `revision > 0`, `canceladoEn: null`) o cancelado (`estado: CANCELADO`, `canceladoEn` presente)
- **THEN** muestra «Confirmado» con la revisión actualizada sin estado `REPROGRAMADO` en el primer caso, y «Cancelado» con `canceladoEn` formateado en `zonaHoraria` en el segundo caso

#### Scenario: Turno inexistente al consultar detalle

- **WHEN** `GET /api/odontologo/turnos/{turnoId}` responde `404 TURNO_NOT_FOUND`
- **THEN** informa que el turno no se encontró y mantiene operativa la lista de agenda

### Requirement: AW-03 Recarga manual de cambios persistidos sin tiempo real obligatorio

La interfaz SHALL ofrecer un botón «Actualizar» para volver a consultar `GET /api/odontologo/agenda` con el filtro activo sin usar WebSocket ni polling periódico. Si hay un detalle abierto, SHALL refrescar también `GET /api/odontologo/turnos/{turnoId}` (o cerrarlo si salió del período o responde `404`), reflejando altas, cancelaciones y reprogramaciones confirmadas (`CA-US-006-03`).

#### Scenario: Recarga manual refleja nuevas reservas, cancelaciones y reprogramaciones en la agenda y en el detalle abierto

- **WHEN** el odontólogo acciona «Actualizar» con un detalle de turno abierto que sigue dentro del período devuelto
- **THEN** la interfaz consulta nuevamente `GET /api/odontologo/agenda` y `GET /api/odontologo/turnos/{turnoId}`, actualizando tanto la lista como el detalle con las nuevas reservas, cancelaciones o reprogramaciones persistidas

#### Scenario: Turno reprogramado fuera del período activo al actualizar cierra el detalle obsoleto

- **WHEN** el odontólogo acciona «Actualizar» con un detalle abierto y el turno ya no integra los `turnos` del período devuelto o `GET /api/odontologo/turnos/{turnoId}` responde `404 TURNO_NOT_FOUND`
- **THEN** la interfaz actualiza la lista con el período vigente y cierra el panel de detalle obsoleto

### Requirement: AW-04 Distinción de agenda vacía, carga, fallos de consulta y expiración de sesión

La interfaz SHALL distinguir carga (`aria-busy`), agenda vacía (`turnos: []`), errores y `401 SESSION_REQUIRED`. Al cambiar fecha o vista (`DIA`/`SEMANA`), SHALL conservar el detalle solo si pertenece al resultado, cerrarlo si queda fuera, vacío o falla, invalidar respuestas demoradas al cambiar período o cerrar detalle, y SHALL invalidar consultas en vuelo si se borra o invalida la fecha, apagando carga y conservando el mensaje.

#### Scenario: Período sin turnos muestra estado vacío y no error

- **WHEN** `GET /api/odontologo/agenda` responde `200 OK` con `turnos: []`
- **THEN** la interfaz muestra un mensaje informativo de agenda vacía para el período seleccionado sin alertas de error y cierra cualquier detalle abierto

#### Scenario: Cambio de período mantiene o cierra el detalle según pertenencia

- **WHEN** el odontólogo tiene un detalle abierto y cambia fecha o alterna entre `DIA` y `SEMANA`
- **THEN** el detalle solo permanece visible si el turno seleccionado pertenece al nuevo resultado de `GET /api/odontologo/agenda`, cerrándose en caso contrario

#### Scenario: Respuesta demorada de detalle tras cambiar de período o cerrar manualmente no reabre el panel

- **WHEN** una consulta `GET /api/odontologo/turnos/{turnoId}` en vuelo resuelve después de cambiar de período o de accionar «Cerrar detalle»
- **THEN** la respuesta demorada se descarta y no reabre el panel de detalle ni pisa el estado vigente

#### Scenario: Fallo de consulta informa imposibilidad con reintento sin presentar datos previos no recuperados como actuales

- **WHEN** el odontólogo cambia de período o reintenta una consulta de agenda y el backend responde con error (`400`, `403`, `500`, `NETWORK_ERROR`, `INVALID_RESPONSE` o fecha inválida)
- **THEN** la interfaz limpia los turnos y el detalle previos para no mostrarlos como actuales, informa el error de consulta y ofrece un botón «Reintentar»

#### Scenario: Respuestas de consultas fuera de orden se descartan

- **WHEN** una primera solicitud de agenda o detalle tarda más que una segunda solicitud posterior y resuelve después
- **THEN** la interfaz ignora la respuesta obsoleta de la primera solicitud y conserva exclusivamente los datos de la última solicitud emitida

#### Scenario: Respuesta 401 SESSION_REQUIRED redirige al formulario de ingreso

- **WHEN** `GET /api/odontologo/agenda` o `GET /api/odontologo/turnos/{turnoId}` responde `401 SESSION_REQUIRED`
- **THEN** la interfaz ejecuta el manejador de sesión expirada de `C-12`, limpia el estado autenticado y vuelve a mostrar el formulario de ingreso

#### Scenario: Borrar o invalidar la fecha durante una consulta en curso descarta la respuesta pendiente

- **WHEN** hay una consulta `GET /api/odontologo/agenda` en curso (con o sin detalle abierto), el odontólogo borra o invalida la fecha antes de que termine y luego se resuelve esa solicitud pendiente
- **THEN** la interfaz descarta la respuesta pendiente, mantiene la lista vacía, el detalle cerrado, `loadingAgenda` desactivado y el mensaje de fecha inválida visible, dejando habilitado elegir otra fecha o reintentar

### Requirement: AW-05 Interfaz de solo lectura, accesibilidad por teclado y diseño adaptable

La vista de agenda SHALL ser de solo lectura sin edición de pacientes, clínica, cobros ni operaciones manuales (`RN-PA-03`, `RN-EX-03`, `PB-06`). Nombres, apellidos y motivos largos sin espacios SHALL partirse en varias líneas sin ocultar texto ni controles y sin desbordamiento horizontal en `390×844` y `1440×900`, manteniendo operación completa por teclado.

#### Scenario: Ausencia de controles de edición de pacientes u operaciones manuales pendientes

- **WHEN** el odontólogo navega por la lista de agenda y abre el detalle de un turno
- **THEN** no existen controles ni formularios para modificar pacientes, cargar historia clínica o cobros, ni crear, cancelar o reprogramar turnos manualmente

#### Scenario: Operación por teclado y legibilidad en pantallas pequeña y grande

- **WHEN** el usuario opera los controles de vista, fecha, actualización y selección/cierre de detalle con teclado en resoluciones `390×844` y `1440×900`, incluyendo apellidos de 100 caracteres sin espacios y motivos largos con detalle abierto o cerrado
- **THEN** todos los botones y entradas son alcanzables con foco visible y etiquetas accesibles, los textos largos se parten en varias líneas sin ocultar texto ni controles y no aparece desplazamiento horizontal (`scrollWidth <= innerWidth`)
