# Design

## Context

Ver la motivación en [proposal.md](proposal.md) y los contratos en [specs](specs/). C-04 define que la credencial llega en el fragmento de la URL, se retira del historial mediante `history.replaceState`, queda en memoria y se envía en `X-Management-Token`. C-09 ofrece consulta, cancelación y reprogramación con `ETag`/`If-Match`; C-07 calcula horarios y valida los límites inclusivos de PB-01. La interfaz existente de C-13 es una SPA local y no incluye la ruta de autogestión.

## Goals / Non-Goals

**Goals:**
- Agregar una ruta local de autogestión que consuma C-04/C-09 sin alterar la autorización por turno.
- Añadir una consulta protegida de horarios que derive el motivo del turno autorizado y reutilice C-07.
- Mantener confirmación expresa en cancelación y reprogramación y reflejar los resultados reales del servidor.

**Non-Goals:**
- Cambiar credenciales, recuperación asistida, persistencia, reglas temporales o transporte aprobado por C-04.
- Enviar SMTP, crear cuentas de paciente, registrar turnos manualmente o introducir una excepción al plazo.
- Persistir la credencial en almacenamiento del navegador o registrar el secreto.

## Decisions

### D-01 — Ruta local y ciclo de vida de la credencial

Usar `/gestionar-turno` como ruta de la interfaz. Leer la credencial del fragmento inicial, reemplazar de inmediato la entrada del historial para quitar el fragmento, conservarla solo en memoria y enviarla al backend exclusivamente en `X-Management-Token`. No copiarla a query parameters, `localStorage`, `sessionStorage`, logs ni telemetría. Al recargar después de haber quitado el fragmento, pedir al paciente que reabra el enlace original; no reconstruir ni persistir el secreto.

**Alternativa descartada:** mantener el secreto en la URL visible o persistirlo para soportar recargas, porque ampliaría su exposición y contradice el transporte aprobado en el [diseño C-04](../archive/2026-11-23-credenciales-gestion-turno/design.md).

### D-02 — Lectura y escrituras de autogestión

Al entrar, llamar a `GET /api/gestion/turno` y usar su `ETag` vigente. No mutar al cargar, previsualizar ni consultar horarios. Cancelar solo después de confirmación expresa. Para cancelar o reprogramar enviar la credencial en `X-Management-Token` y el `ETag` en `If-Match`; actualizar el estado y la revisión solo tras una respuesta confirmada. En fallo de red o respuesta ilegible, volver a consultar antes de afirmar un resultado.

**Alternativa descartada:** tratar cada visita o selección de horario como autorización de escritura; las operaciones requieren una acción explícita y la revisión vigente de C-09.

### D-03 — Disponibilidad ligada al turno autorizado

Consumir `GET /api/gestion/turno/disponibilidad?desde=YYYY-MM-DD&hasta=YYYY-MM-DD` con `X-Management-Token`; las fechas son opcionales. El backend obtiene el `motivoId` internamente desde el turno autorizado, delega el cálculo a C-07 y responde con `Cache-Control: no-store`, `zonaHoraria` y pares `inicio`/`fin` en `horarios`. El cliente no envía ni elige un motivo. La ruta no devuelve `motivoId`, duración, datos del paciente ni detalles de turnos ocupados. Si no hay horarios, presentar la lista vacía como tal.

**Aprobación CRITICAL del contrato:** el usuario aprobó explícitamente el contrato candidato el 2026-11-25 con «apruebo el contrato». La propuesta original está en [D-04 de C-09](../archive/2026-11-25-correcciones-c09-autogestion-turnos-api/design.md#d-04). Esta aprobación cubre el contrato de la consulta protegida. La aprobación CRITICAL del código frontend quedó registrada por separado abajo.

**Aprobación CRITICAL del código:** Santiago aprobó el 2026-11-25 «apruebo el codigo de C14 para continuar». Esto autoriza la implementación del alcance de C-14 documentado aquí, sin resolver PB-06 ni ampliar el alcance.

**Alternativas descartadas:** aceptar un `motivoId` elegido por el cliente o agregarlo a `GET /api/gestion/turno`, porque permitirían consultar un motivo ajeno o ampliar los datos del turno visible.

### D-04 — Errores y contacto fuera del plazo

Mostrar `404 LINK_NOT_AVAILABLE` como enlace no disponible sin distinguir credencial ausente, inválida, vencida o revocada. Mostrar los rechazos conocidos de C-09 sin afirmar cambios y conservar el turno en pantalla hasta una consulta confirmada. Resolución de PB-06 para C-14 (2026-11-25): ante `409 MANAGEMENT_WINDOW_CLOSED`, la interfaz mantiene el rechazo e indica que el paciente contacte directamente al odontólogo por el canal habitual externo del consultorio. El odontólogo es el responsable operativo; C-14 no configura ni publica teléfono/email, alta manual ni excepción. Esta decisión concreta la regla de visión existente de contacto directo después del plazo.

### D-05 — Mockups según política visual del proyecto

La política visual del proyecto está `off`. La UI se implementará sin mockups; se verificarán la navegación por teclado y los tamaños pequeño y grande.

## Risks / Trade-offs

- [Riesgo] Quitar el fragmento impide recuperar el secreto tras recargar → mantenerlo solo en memoria y pedir reabrir el enlace original.
- [Riesgo] C-14 no dispone de datos de contacto del consultorio → mantener el contacto fuera de la app, por el canal habitual ya conocido por el paciente; no inventar ni publicar teléfono/email.
- [Riesgo] La disponibilidad puede cambiar después de consultarla → C-09 vuelve a validar bajo coordinación de agenda al confirmar la reprogramación; el horario no se retiene.
- [Riesgo] SMTP de C-11 todavía no es parte de esta entrega → validar el flujo con un enlace local y dejar recepción de correos reales para la etapa que habilite C-11/C-16.
- [Riesgo] La aprobación CRITICAL cubre el alcance de C-14 documentado → cualquier ampliación del transporte o los datos visibles requiere una aprobación nueva.

## Migration Plan

No hay migración de datos. Entregar el endpoint backend antes de habilitar `/gestionar-turno`. Para rollback, deshabilitar la nueva ruta y el endpoint añadido; no tocar turnos, credenciales ni intenciones existentes.

## Gates pendientes

No quedan decisiones de producto pendientes para el alcance de C-14. PB-06 quedó resuelta con contacto directo fuera de la app entre el paciente y el odontólogo por el canal habitual del consultorio; el rechazo y la orientación están implementados y probados.

## Limitación administrativa del entorno

La validación local de membresía/asignación de equipo no pudo ejecutarse porque este entorno no tiene Python 3.8 o superior. Se registra como limitación administrativa, separada de las pruebas funcionales de C-14.

## UI Mockups

Decision: no (project policy, mode `off`; 2026-11-25).
Mockups: omitidos por política del proyecto.
