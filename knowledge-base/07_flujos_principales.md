# Flujos principales

**Estado del documento**: aprobado por el usuario el 2026-11-18.
**Confirmación**: «si apruebo y trabaja en modo silencioso, avance con todos los siguientes documentos».
**Fecha**: 2026-11-18.
**Base**: documentos aprobados [01 — Visión](01_vision_y_objetivos.md), [02 — Descripción](02_descripcion_general.md), [03 — Actores](03_actores_y_roles.md), [04 — Datos](04_modelo_de_datos.md), [05 — Reglas](05_reglas_de_negocio.md) y [06 — Funcionalidades](06_funcionalidades.md).

El usuario aprobó las secuencias observables de las historias, con errores y límites explícitos. No hay código ni pruebas ejecutadas. Una rama que dependa de una pregunta PB permanece pendiente; aprobar el flujo no elige por omisión su política. La misma respuesta autorizó redactar los documentos 08–10 en bloque, sin nuevas pausas de revisión por archivo.

## Participantes y convenciones

La **interfaz** es la aplicación React en el navegador local. El **backend** es el proceso Spring Boot que aplica reglas y permisos. La **persistencia** es PostgreSQL local. El **proceso de comunicaciones** forma parte del backend y envía mediante el servidor SMTP por seleccionar.

Los identificadores `FL-NN` permiten citar flujos. Las referencias US y CT pertenecen al documento 06; RN y PB pertenecen al 05. Los pasos describen responsabilidades, no clases, endpoints definitivos ni límites de transacciones ya implementados.

## FL-01 — Acceder como odontólogo y consultar la agenda

**Disparador**: el odontólogo solicita acceso a su agenda.
**Actor**: odontólogo.
**Precondiciones**: configuración única del consultorio disponible; mecanismo de ingreso interno por diseñar en arquitectura.

**Pasos**:

1. La interfaz inicia el acceso interno mediante el mecanismo que se acuerde; no se presume registro público, contraseña, JWT ni proveedor externo.
2. El backend comprueba la identidad y autorización del odontólogo antes de consultar recursos internos.
3. El odontólogo solicita una vista diaria o semanal. El backend interpreta el período en la zona del consultorio acordada y consulta los turnos de su agenda.
4. La interfaz muestra la información devuelta. Al consultar un turno, el backend vuelve a comprobar el permiso y devuelve motivo, intervalo, estado y datos básicos asociados.

**Resultado**: consulta autorizada de agenda y turnos, sin modificaciones.
**Casos de error**: acceso ausente o no válido → no se devuelve información interna; período inválido o persistencia no disponible → se informa la imposibilidad de completar la consulta, sin presentar datos no recuperados como actuales. Ingreso, recuperación y cierre del acceso requieren diseño posterior.
**Referencias**: US-006, CT-02, CT-03; RN-CO-01, RN-CO-02, RN-AU-03, RN-PA-03; PB-02. No incluye alta manual ni corrección de pacientes: PB-04 y PB-06.

## FL-02 — Configurar motivos, horario, pausas y bloqueos

**Disparador**: el odontólogo solicita crear o modificar configuración de disponibilidad.
**Actor**: odontólogo.
**Precondiciones**: acceso interno válido, consultorio y agenda únicos inicializados.

**Pasos**:

1. El backend comprueba el permiso y obtiene la configuración actual para su consulta.
2. El odontólogo solicita crear o modificar un motivo y duración, cambiar franjas semanales o agregar o retirar un bloqueo concreto.
3. El backend valida la operación: nombre y duración positiva en motivos; día y horas en franjas; inicio anterior al fin en bloqueos. Las validaciones de detalle pendientes se aplicarán después de acordarlas.
4. Si existen reservas afectadas, se requiere la política de conflictos de PB-05. El flujo no decide cancelar, mover o rechazar esos cambios automáticamente.
5. Para una operación admitida según las reglas, el backend guarda la configuración y la interfaz permite consultar el resultado. La disponibilidad posterior se calcula con los valores vigentes.

**Resultado**: configuración persistida y disponible para calcular horarios, sin reescritura silenciosa de reservas existentes.
**Casos de error**: datos inválidos → no guardar configuración inválida; conflicto con turnos o cambio simultáneo de configuración y reserva → aplicar política y mecanismo aún pendientes. Retirar un bloqueo no elimina turnos.
**Referencias**: US-001, US-002, US-003; RN-CO-01, RN-AG-01, RN-AG-02, RN-AG-04, RN-AG-06, RN-AG-07, RN-AG-08, RN-AU-03, RN-EX-02; PB-02, PB-03 y PB-05.

## FL-03 — Consultar motivos y disponibilidad

**Disparador**: el paciente abre la página local de reserva y elige un motivo y período.
**Actor**: paciente, sin cuenta.
**Precondiciones**: motivo y horario de atención configurados; zona, ventanas y paso de horarios por acordar.

**Pasos**:

1. La interfaz solicita al backend los motivos ofrecidos y el paciente selecciona uno.
2. El backend obtiene su duración, horario semanal, pausas, bloqueos y ocupación de turnos confirmados para el período permitido.
3. Calcula inicios que permiten completar el turno sin invadir indisponibilidad, respetando la ventana de 24 horas a 30 días y la granularidad que se acuerde.
4. Devuelve opciones de reserva sin nombres, datos personales ni detalles de turnos ocupados. La interfaz las presenta al paciente.

**Resultado**: opciones calculadas, sin retener ni reservar un horario.
**Casos de error**: motivo inexistente o parámetros inválidos → no ofrecer opciones basadas en esos datos; ningún horario disponible → informar esa situación sin inventar huecos; fallo de consulta → no tratarlo como disponibilidad confirmada. Otro paciente puede reservar una opción después de mostrarse.
**Referencias**: US-004, CT-03; RN-AG-02, RN-AG-03, RN-AG-04, RN-AG-08, RN-RE-01, RN-RE-02, RN-AU-01; PB-01, PB-02 y PB-03.

## FL-04 — Reservar y originar la confirmación por email

**Disparador**: el paciente envía la solicitud de reserva de un horario elegido.
**Actor**: paciente, sin cuenta ni verificación previa del email.
**Precondiciones**: motivo y horario seleccionados; para el recorrido nominal de correo, SMTP y destinatario de prueba habilitados. La disponibilidad mostrada antes no constituye una reserva.

**Pasos**:

1. La interfaz recoge nombre, apellido, email, teléfono y DNI, y envía la solicitud al backend.
2. El backend valida campos, referencias, ventana temporal y duración. La creación o reutilización del registro de paciente sigue la política pendiente de PB-04; una coincidencia no autoriza sobrescritura ni divulgación de datos previos.
3. Vuelve a comprobar la disponibilidad y obtiene el intervalo mediante el control de concurrencia que se diseñe. Si el intento pierde el horario, no crea una segunda reserva superpuesta.
4. Para la operación válida, persiste el turno `CONFIRMADO` con intervalo y duración reservada. Prepara la credencial lógica de gestión y el origen de las notificaciones según el diseño de persistencia y acceso pendiente.
5. La interfaz recibe el resultado de reserva confirmada en el caso nominal, sin pedir aprobación del odontólogo ni una segunda confirmación del paciente. Se procesa el correo de confirmación mediante FL-08 y se prevé el recordatorio correspondiente.

**Resultado**: turno confirmado visible en agenda; correo de confirmación y enlaces originados para el destinatario previsto. La coordinación entre persistencia de turno, credencial e intención de notificación se concretará en arquitectura; no se presume una transacción que incluya SMTP.
**Casos de error**: datos incompletos o horario inválido → no confirmar una reserva inválida; conflicto concurrente → informar la pérdida del horario; persistencia fallida o resultado de la solicitud incierto → tratamiento y repetición pendientes de PB-08. Si el turno ya quedó guardado y falla el correo, la respuesta operativa sigue pendiente de PB-10; no se inventa una cancelación, reversión o nuevo estado de turno.
**Referencias**: US-005, US-010, CT-01; RN-CO-03, RN-AG-05, RN-AG-06, RN-PA-01, RN-PA-02, RN-PA-03, RN-RE-01, RN-RE-02, RN-RE-03, RN-RE-04, RN-NO-01, RN-NO-02, RN-EX-01; PB-01, PB-02, PB-04, PB-07, PB-08, PB-09 y PB-10.

## FL-05 — Abrir el enlace privado de autogestión

**Disparador**: el paciente abre el enlace recibido por email en la computadora de demostración.
**Actor**: paciente con enlace privado.
**Precondiciones**: credencial válida para un turno; formato, transporte y vigencia por diseñar.

**Pasos**:

1. La interfaz presenta la solicitud de consulta y la credencial según el mecanismo que se acuerde.
2. El backend valida la credencial y su alcance sobre el turno; nombre, email, teléfono, DNI o identificador no la sustituyen.
3. Recupera el turno y devuelve solo la información necesaria de autogestión que se acuerde. La interfaz permite reconocer el turno y las acciones aplicables.
4. Consultar no cambia el turno. Cancelar o reprogramar requieren una nueva solicitud expresa de escritura, con nueva comprobación de permiso y reglas.

**Resultado**: consulta limitada al turno autorizado, sin cuenta de paciente ni cambio por apertura o previsualización del enlace.
**Casos de error**: credencial ausente, inválida o sin permiso sobre el turno → no devolver datos protegidos ni ejecutar cambios; enlace perdido, reenviado, vencido o dirigido a un email incorrecto → recuperación e invalidación pendientes de PB-07. Un enlace a `localhost` no habilita acceso desde una computadora ajena a la ejecución local.
**Referencias**: US-007, CT-02, CT-03; RN-AU-02, RN-AU-04, RN-AU-05, RN-EX-01; PB-07.

## FL-06 — Cancelar por autogestión

**Disparador**: el paciente solicita expresamente cancelar desde la gestión de su turno.
**Actor**: paciente con credencial privada.
**Precondiciones**: turno confirmado, credencial válida y cancelación dentro del plazo permitido.

**Pasos**:

1. La interfaz envía la solicitud de cancelación al backend, sin ejecutar el cambio por solo abrir el enlace.
2. El backend valida credencial, turno vigente y plazo de hasta 24 horas antes, con los extremos que se acuerden.
3. Para una operación válida, cambia el turno a `CANCELADO` y libera su ocupación sin borrar al paciente ni el turno.
4. Registra el origen del aviso de cambio y coordina los recordatorios anteriores según PB-11. La interfaz informa el resultado y el correo se procesa mediante FL-08.

**Resultado**: cancelación persistida, horario liberado y aviso de cambio originado.
**Casos de error**: credencial no válida → no ejecutar; fuera de plazo → impedir autogestión e indicar contacto directo con el odontólogo por el canal habitual externo del consultorio; no hay alta manual ni excepción desde la app. Turno ya cancelado o cambio simultáneo → PB-08; fallas de correo → PB-10, sin derivar una transición de turno adicional. Conservación y eliminación siguen en PB-12.
**Referencias**: US-008, US-011; RN-AU-02, RN-AU-04, RN-AU-05, RN-CA-01, RN-CA-02, RN-CA-03, RN-NO-01, RN-NO-04; PB-01, PB-06, PB-07, PB-08, PB-10, PB-11 y PB-12.

## FL-07 — Reprogramar sin perder el turno original ante fallo

**Disparador**: el paciente elige un nuevo horario y solicita expresamente la reprogramación.
**Actor**: paciente con credencial privada.
**Precondiciones**: turno confirmado, credencial válida y reprogramación dentro del plazo permitido.

**Pasos**:

1. Desde la gestión autorizada, la interfaz consulta opciones de nuevo horario mediante FL-03 y envía la solicitud de cambio.
2. El backend valida la credencial, el plazo sobre el turno vigente y las condiciones del nuevo intervalo. La duración aplicable si cambió la configuración del motivo se resolverá en PB-05.
3. Aplica el cambio de intervalo de forma indivisible con la obtención del nuevo horario. No libera primero el original para después intentar obtener el nuevo.
4. Si el cambio se admite, conserva el identificador, actualiza intervalo y revisión, y mantiene el estado `CONFIRMADO`.
5. Origina el aviso de cambio, coordina los recordatorios para la revisión vigente y devuelve el resultado. El efecto sobre credenciales anteriores se definirá en PB-07; el envío sigue FL-08.

**Resultado**: el mismo turno confirmado ocupa el nuevo intervalo; si el cambio falla, la reserva original permanece.
**Casos de error**: nuevo horario ocupado, fuera de disponibilidad o fuera de ventana → rechazar el cambio sin perder la reserva; fuera del plazo de autogestión → mantener el rechazo e indicar contacto directo con el odontólogo por el canal habitual externo del consultorio, sin alta manual ni excepción; repetición o cambios simultáneos del mismo turno → PB-08; fallo de correo tras el cambio → PB-10. El mecanismo transaccional concreto se diseñará en arquitectura.
**Referencias**: US-009, US-011, CT-01; RN-AG-03, RN-AG-05, RN-RE-01, RN-AU-02, RN-AU-04, RN-AU-05, RN-RP-01, RN-RP-02, RN-RP-03, RN-RP-04, RN-RP-05, RN-EX-01; PB-01, PB-02, PB-03, PB-05, PB-06, PB-07, PB-08, PB-10 y PB-11.

```mermaid
sequenceDiagram
    participant P as Paciente
    participant I as Interfaz
    participant B as Backend
    participant D as Persistencia
    P->>I: Solicitar nuevo horario
    I->>B: Solicitud de reprogramación y credencial
    B->>B: Validar acceso y reglas
    B->>D: Obtener nuevo intervalo y aplicar cambio indivisible
    alt Cambio admitido
        D-->>B: Mismo turno, nuevo intervalo y revisión
        B->>B: Originar aviso y coordinar recordatorios
        B-->>I: Reprogramación confirmada
    else Conflicto o fallo del cambio
        D-->>B: Cambio no aplicado; original conservado
        B-->>I: Cambio no realizado
    end
    I-->>P: Mostrar resultado conocido
```

El diagrama muestra la rama con acceso y reglas válidos; sus rechazos se describen arriba. Es una secuencia lógica: no selecciona bloqueo, aislamiento, motor de reintentos ni entrega de correo dentro de la transacción.

## FL-08 — Enviar confirmaciones, cambios y recordatorios

**Disparador**: reserva o cambio válido que origina un aviso, o llegada del momento previsto para el recordatorio.
**Actor**: paciente como destinatario; la ejecución la inicia el backend o su tarea programada.
**Precondiciones**: notificación persistida, remitente y SMTP configurados, backend ejecutándose y conectividad. Evento único, reintentos y coordinación todavía requieren diseño.

**Pasos**:

1. El proceso de comunicaciones obtiene el aviso previsto: confirmación inmediata, cambio o recordatorio 24 horas antes.
2. Comprueba su correspondencia con turno, revisión y destinatario guardados. Un turno cancelado o reprogramado exige tratar avisos anteriores según la política pendiente de PB-11.
3. Para el aviso vigente y admisible según esa política, prepara el mensaje y sus enlaces autorizados cuando corresponda y solicita el envío al servidor SMTP.
4. Registra el intento y el resultado conocido. `ACEPTADA_SMTP` significa aceptación SMTP; no recepción ni lectura. Un resultado incierto requiere la política de PB-10 y PB-11.
5. En las pruebas, el destinatario comprueba recepción de confirmación, aviso de cancelación, aviso de reprogramación y recordatorio. Los enlaces se abren en el entorno local; el recordatorio se prueba con el mecanismo controlado de tiempo aprobado.

**Resultado**: intento y resultado persistidos; recepción real comprobada solo cuando existe esa evidencia de prueba. Los avisos conservan el destinatario previsto, sin cambiarlo silenciosamente por una edición del paciente.
**Casos de error**: SMTP rechaza, demora o no responde → registrar el hecho conocido, sin declarar entrega ni decidir reintento automático por omisión; aviso vencido, duplicado o de revisión anterior → PB-10 y PB-11; reserva exactamente a 24 horas → PB-09. Un cambio del turno coincidente con un envío en curso requiere coordinación específica, no solo leer una revisión antes de enviar.
**Referencias**: US-010, US-011, US-012; RN-RE-04, RN-NO-01, RN-NO-02, RN-NO-03, RN-NO-04, RN-NO-05, RN-NO-06; PB-04, PB-07, PB-09, PB-10 y PB-11. La deduplicación local no garantiza entrega SMTP exactamente una vez.

## FL-09 — Retomar la operación local tras un reinicio

**Disparador**: se inicia de nuevo la aplicación después de detener el proceso.
**Actor**: odontólogo al volver a utilizarla; inicialización a cargo del backend.
**Precondiciones**: PostgreSQL local conserva los datos; configuración del entorno disponible.

**Pasos**:

1. El backend se conecta a la persistencia y recupera la configuración existente para operar la agenda única.
2. La inicialización debe respetar los registros ya guardados; no se presume recrear consultorio, perfil, agenda o datos de demostración sobre información existente.
3. El odontólogo vuelve a obtener acceso según el mecanismo acordado y consulta la agenda. Se comprueba que configuración y turnos persistidos siguen disponibles.
4. Se comprueba que los estados de notificación también permanecen. El envío o descarte de pendientes y vencidos se aplicará solo según la política que se defina en PB-10 y PB-11.

**Resultado**: continuidad sobre datos persistidos y evidencia del criterio de reinicio; sin afirmar restauración desde un respaldo ni recuperación automática de correos.
**Casos de error**: base no disponible o configuración incompleta → informar imposibilidad de operar, sin crear disponibilidad ficticia ni considerar vacía una agenda no consultada; pérdida o corrupción de datos → recuperación pendiente de PB-12. La continuidad de una sesión interna a través del reinicio no está decidida.
**Referencias**: CT-04, CT-05, CT-06, CA-VIS-07; RN-CO-01, RN-RE-04, RN-NO-02, RN-EX-03; PB-10, PB-11 y PB-12.

## Decisiones que condicionan los flujos

| Tema pendiente | Referencias | Punto afectado |
|---|---|---|
| Límites, zona, franjas y paso de horarios. | PB-01, PB-02, PB-03. | Disponibilidad, reserva, plazo de autogestión y recordatorios. |
| Identificación y corrección de pacientes. | PB-04. | Registro o reutilización de paciente y destinatarios de avisos. |
| Cambios de configuración con reservas existentes. | PB-05. | Configuración, disponibilidad y duración al reprogramar. |
| Gestión manual y contacto fuera de plazo. | PB-06. | El odontólogo atiende el contacto directo fuera de la app por el canal habitual del consultorio; no se agrega un flujo de excepción manual. |
| Acceso por enlace y operaciones repetidas. | PB-07, PB-08. | Consulta privada, invalidación, recuperación y cambios simultáneos. |
| Coincidencia a 24 horas y fallas de comunicaciones. | PB-09, PB-10, PB-11. | Preparación, envío, reintentos, avisos obsoletos y recuperación tras reinicios. |
| Conservación y recuperación de datos. | PB-12. | No se infiere borrado ni procedimiento de restauración. |

El mecanismo de ingreso interno, las credenciales privadas, los límites transaccionales, la concurrencia y la coordinación de envíos se desarrollarán en el documento 08. La aprobación de estas secuencias acepta su intención, no elige mecanismos de seguridad ni respuestas a las doce PB. No hay un flujo implícito de clínica, cobros, alta comercial pública o múltiples consultorios.

## Cobertura de historias

| Historia aprobada | Flujo principal |
|---|---|
| US-001, US-002, US-003 — Motivos, horario y bloqueos. | FL-02. |
| US-004 — Disponibilidad. | FL-03. |
| US-005 — Reserva. | FL-04. |
| US-006 — Agenda interna. | FL-01. |
| US-007 — Consulta por enlace. | FL-05. |
| US-008 — Cancelación. | FL-06. |
| US-009 — Reprogramación. | FL-07. |
| US-010, US-011, US-012 — Comunicaciones. | FL-08, originadas desde FL-04, FL-06 y FL-07 cuando corresponde. |

Los criterios transversales CT-01 a CT-06 se comprueban sobre estos recorridos; FL-09 desarrolla persistencia entre reinicios. El [índice](README.md) conserva los estados de revisión. Las verificaciones de aplicación y las capturas de interfaz corresponderán a implementación; este documento no crea diseños visuales ni acredita pruebas realizadas.
