# Verificación de C-14 — 2026-11-25

## Resultado

La implementación principal quedó aplicada dentro del contrato aprobado. El endpoint y el flujo web pasan las comprobaciones técnicas registradas abajo. PB-06 quedó resuelta para C-14 con contacto directo fuera de la app y el rechazo `409` conservado. OpenSpec archivó el change el 2026-11-25 como `2026-11-25-autogestion-paciente-web` y actualizó las especificaciones principales. La verificación de apertura de enlace desde email se dejó para C-16 cuando C-11 habilite ese flujo.

## API protegida de horarios

- `GET /api/gestion/turno/disponibilidad` deriva el motivo del turno autorizado, reutiliza C-07, no toma `motivoId` del cliente y responde solo `zonaHoraria`/`horarios` con `Cache-Control: no-store`.
- Las pruebas de controlador y servicio pasaron (Active Stack receipt `083727bbb9006a7dd4a6626602ab9787`). La integración contra PostgreSQL 17.12 pasó 1/1 (receipt `b6afbb68af03b191a3faaa13d1eb0967`); comprueba el motivo autorizado, ignora un `motivoId` hostil y no cambia turno ni avisos.
- **Límite de esa integración:** usa un doble de `CredencialesGestion`; no ejercita la verificación criptográfica real de C-04.
- `bootJar` pasó en Windows/Java 21 (receipt `2210f9dd4025ddc623dc9432ca38f63e`).

## Interfaz y transporte

- La ruta `/gestionar-turno` quita el fragmento con `history.replaceState`, mantiene el token solo en estado de React y lo envía en `X-Management-Token`. Una recarga sin el fragmento no recupera el secreto de `localStorage` ni `sessionStorage`.
- Las consultas usan `cache: no-store`; cancelación y reprogramación envían `If-Match`. La reprogramación solo envía el inicio exacto de un horario devuelto por la API protegida, sin `motivoId` del cliente.
- La cancelación requiere una segunda confirmación visible. El éxito comunica `CANCELADO`/`PENDIENTE` sin afirmar que el correo se recibió. Ante respuesta de escritura incierta, la página consulta el estado antes de comunicarlo como exitoso.
- Los errores `LINK_NOT_AVAILABLE`, `MANAGEMENT_WINDOW_CLOSED`, `SLOT_UNAVAILABLE`, `SAME_INTERVAL` y `TURN_VERSION_MISMATCH` se muestran sin distinguir causas privadas ni ofrecer excepciones manuales.
- Para `MANAGEMENT_WINDOW_CLOSED`, la interfaz indica contacto directo con el odontólogo por el canal habitual externo del consultorio, sin teléfono/email configurado o expuesto. Las pruebas verifican que tanto cancelación como reprogramación conservan el estado `Confirmado` y no ofrecen alta manual ni excepciones.
- Pruebas frontend finales: `npm test -- --maxWorkers=1`, Node 24.20.0/npm 11.19.0; 10 archivos, 69/69 pruebas aprobadas. Incluyen ambos flujos fuera de plazo: cancelación y reprogramación conservan el turno y muestran el contacto directo, sin datos de contacto ni excepciones.
- Build y TypeScript finales: `npm run build`; `tsc -b` y Vite build aprobados con el mismo toolchain.

## Revisión visual y teclado

La política visual del proyecto es `off`, así que no se generaron mockups. Se abrió la página con un mock API local de solo prueba, sin usar turnos ni credenciales reales, y se revisaron capturas de 390×844 y 1440×900. La medición móvil dio `innerWidth=390` y `documentElement.scrollWidth=390`, sin desborde horizontal. La prueba de teclado recorre con Tab las acciones y abre la confirmación con Enter.

- Captura móvil: [verification-mobile.png](verification-mobile.png).
- Captura escritorio: [verification-desktop.png](verification-desktop.png).

## Gates cerrados y límites

- PB-06 queda resuelta para C-14: ante `409 MANAGEMENT_WINDOW_CLOSED`, impedir la autogestión e indicar contacto directo con el odontólogo por el canal habitual externo del consultorio. El odontólogo es el responsable operativo; la app no publica teléfono/email ni ofrece alta manual o excepciones. Las tareas 1.1 y 4.4 están completas.
- C-11 todavía no habilita emails locales; no se pudo abrir un enlace real desde un mensaje. La tarea 5.1 se cierra registrando esa evidencia pendiente para el cierre conjunto C-16; la apertura del enlace y la comprobación de que su previsualización no modifica el turno aún no se ejecutaron.
- La validación local de membresía/asignación de equipo no pudo ejecutarse porque el entorno no tiene Python 3.8 o superior; queda como limitación administrativa no funcional.
- Antes del archivo, `openspec validate autogestion-paciente-web --strict` pasó: `Change 'autogestion-paciente-web' is valid`. Después del archivo, `openspec validate appointment-self-management --type spec --strict` y `openspec validate patient-self-management-web --type spec --strict` pasaron.
- `openspec validate --archived --strict` pasó en los 19 changes archivados, incluido C-14. `git diff --check` pasó sin errores.
- OpenSpec reportó sus cuatro artefactos de planificación y 13/13 tareas completas antes del archivo. Después del archivo no queda un change activo.
- `openspec validate --all --strict` reportó un fallo ajeno a C-14 en `spec/dentist-agenda-query`: falta un propósito no-placeholder y una requirement supera 500 caracteres. Las dos especificaciones de C-14 son válidas; el spec ajeno no se modificó para conservar el alcance.

## Regresiones del flujo web verificadas después del archivo — 2026-11-25

- **Prueba roja antes del arreglo:** `npm test -- --maxWorkers=1 src/components/GestionTurnoPage.test.tsx` ejecutó 15 pruebas y fallaron 4: segundo enlace en la misma pestaña, turno confirmado con `acciones: []` y las dos variantes de respuesta tardía del período anterior (éxito y error).
- Se agregaron pruebas con dos credenciales ficticias en la misma pestaña; un turno confirmado sin acciones; y consultas demoradas para el 23 y el 24 de enero. Comprueban limpieza de datos, horarios y confirmaciones anteriores, descarte de respuestas de turno obsoletas, indicador de carga vigente, ausencia de errores/horarios obsoletos y confirmación solo para los horarios actuales.
- **Pruebas verdes:** `npm test` pasó con 10 archivos y 73/73 pruebas. **Build:** `npm run build` pasó con `tsc -b` y Vite, usando Node 24.20.0/npm 11.19.0.
- Los cambios se limitaron a `GestionTurnoPage.tsx`, su prueba, el texto de error compartido del flujo web y esta evidencia. No se modificaron rutas, parámetros, cuerpos ni contratos de la API.
- Sigue pendiente abrir el enlace desde un correo recibido cuando C-11 habilite ese flujo; esta comprobación permanece asignada a C-16.

## Seguimiento correctivo: reapertura de la misma credencial — 2026-11-25

### Resultado y alcance

La causa era que la consulta inicial dependía del valor de `token`: volver a abrir la misma URL cambiaba el historial de fragmento y aumentaba la generación de enlace, pero React recibía el mismo token y no ejecutaba otra lectura. La pantalla quedaba en carga, y la respuesta anterior se descartaba correctamente, dejando el estado sin resultado.

`GestionTurnoPage` ahora conserva un contador de aperturas aparte del token. Cada `hashchange` reconocido incrementa ese contador, vuelve a retirar el fragmento y hace que el efecto consulte el turno; las respuestas de generaciones anteriores continúan descartándose. El token sigue solo en memoria y el `apiClient` mantiene `X-Management-Token`, `cache: no-store` y los mismos endpoints. No se cambió ningún contrato de API.

### Regresiones y rutas

- Baseline focalizado previo a editar: `GestionTurnoPage.test.tsx`, `App.test.tsx` y `apiClient.test.ts`, 35/35 pruebas.
- **Rojo antes del arreglo:** las dos regresiones del mismo enlace fallaron: ambas esperaban dos llamadas y recibían una.
- **Verde después del arreglo:** 2/2 regresiones; luego 3 archivos focalizados, 38/38. Se cubrió el resultado nuevo del segundo GET y una primera consulta pendiente que responde al final.
- Suite frontend completa: 10 archivos, 76/76 pruebas aprobadas con `npm test -- --maxWorkers=1`. Una repetición sin limitar workers tuvo 3 fallas transitorias en `PublicBookingPage.test.tsx` (dos timeouts y una validación de campos antes de continuar); otra corrida paralela completa también pasó 76/76. `npm run build` terminó con `tsc -b` y Vite aprobados. Se usó Node 24.20.0/npm 11.19.0, distinto de Node 24.22.3/npm 12.2.3 indicados por el proyecto.
- `App.tsx` integra `/gestionar-turno` junto con el acceso interno C-15 y `/reservar`; la ruta pública C-14 omite `checkSession`. `App.test.tsx` conserva la cobertura de sesión, agenda, reserva y agrega pruebas de apertura/reapertura. `apiClient.test.ts` conserva agenda/detalle C-15 y comprueba dos lecturas consecutivas con el mismo token y encabezados privados.
- **C-15:** la integración objetivo `00cfec5` conserva `[x]` y sus referencias de implementación, verificación y seguimientos en `CHANGES.md`. Se preservan agenda, sesión y detalle, sin cambiar su alcance.

### Verificación del entorno

- Validación estricta del change correctivo: aprobada. Validación estricta archivada: 19/19. `git diff --check`: aprobado (Git solo informó conversión de finales LF/CRLF).
- Backend pendiente: el primer wrapper no pudo crear el lock en `%USERPROFILE%\\.gradle`; con la distribución/caché local en una ruta externa y `--offline --no-daemon`, Gradle terminó con `Could not connect to the Gradle daemon`. Por eso no se ejecutaron las pruebas backend ni `bootJar`.
- PostgreSQL no estaba escuchando en 5433; WSL devolvió `Wsl/E_ACCESSDENIED` y Docker no pudo acceder a `dockerDesktopLinuxEngine`.
- Chromium pendiente: el navegador integrado devolvió `net::ERR_CONNECTION_TIMED_OUT` al abrir el servidor local. Edge mostró interacción concurrente del usuario y no se navegó a la aplicación. No se obtuvieron capturas a 390×844 ni 1440×900 ni se comprobó el GET desde navegador. La API local ficticia se detuvo sin recibir consultas. Una tentativa posterior de preparar Edge headless quedó bloqueada: el sandbox denegó la apertura del mock API en `127.0.0.1:8080` y la solicitud de comprobación a Vite en `127.0.0.1:5173`; no se obtuvieron nuevas capturas.
- Apertura desde correo recibido sigue pendiente de C-11/C-16; no se sustituyó por una apertura local.
- **Recibos de ejecución:** `active-stack evidence-capture` no pudo finalizar la escritura del recibo redacted: falló al renombrar el archivo temporal a `output.redacted.txt` con `Access is denied`, incluso tras conceder escritura a su directorio de runs. Hay salidas redacted directas fuera del repositorio, pero no recibo Active Stack ni una repetición independiente; por el contrato de `evidence.md`, la proveniencia de los resultados queda **sin verificar**.

### Estado OPSX

La implementación y sus pruebas frontend están listas. Las tareas de backend/`bootJar` y Chromium quedan abiertas en [el change correctivo](../../c14-reapertura-enlace-misma-credencial/tasks.md); este seguimiento no se archiva hasta completar esas verificaciones en un entorno habilitado.

## Integración sobre `00cfec5` — 2026-11-25

- El branch `codex/c14-integracion-00cfec5` parte de `upstream/main` `00cfec52b118c748a6f6f771ba96f51b0b40f4ea`, con C-15 `[x]` y sus referencias intactas, y el código/pruebas de C-11 presentes. Se mantuvieron juntos el acceso interno, la agenda C-15, `/reservar` y `/gestionar-turno`.
- Suite frontend integrada: `npm test -- --maxWorkers=1`, **11 archivos, 109/109 pruebas aprobadas**. `npm run build`: **TypeScript `tsc -b` y Vite aprobados**. Las regresiones automáticas cubren la ruta pública, la reapertura del mismo enlace, datos vigentes, descarte de respuestas viejas, contratos API y conservar cobertura de agenda/sesión/reserva; no sustituyen la comprobación visual en Chromium.
- OpenSpec del seguimiento: `openspec validate c14-reapertura-enlace-misma-credencial --strict` pasó. `openspec validate --archived --strict` pasó en los **22 changes**. `git diff --check` pasó.
- Windows usa Temurin Java `21.0.13.1+2`. La corrida `test bootJar` alcanzó `:bootJar` y generó `backend/build/libs/odontologia-0.0.1-SNAPSHOT.jar`, luego `:test` terminó con tres fallos en `DentistCredentialFileTest`: `UnsupportedOperationException` en las comprobaciones de permisos/archivos POSIX. Por eso la suite unitaria completa no se da por aprobada. La repetición solo de unitarias no alcanzó a conectarse con el daemon Gradle.
- PostgreSQL 17.12 fue iniciado para pruebas. Una ejecución sobre el volumen Compose existente falló por la contraseña distinta a la conservada en ese volumen. Una base temporal aislada sí aceptó conexiones; la suite de integración en Windows no pasó porque el driver envió `TimeZone=America/Buenos_Aires`, valor que PostgreSQL rechazó. La repetición con zona horaria IANA explícita no generó una suite verde antes de detenerse. No se afirma que la integración C-14 haya pasado; debe repetirse en Linux/WSL2 o un runner con zona horaria IANA. Después el contenedor dejó de responder en 5433; el revisor automático rechazó una acción Docker posterior por alcanzar su límite de aprobaciones, de modo que no se pudo reintentar/restaurar el servicio en esta sesión.
- Chromium integrado y dimensiones 390×844/1440×900 no se verificaron: la superficie del navegador informó `Local browser access is unavailable for this chat`; no se hicieron capturas ni se comprobó el flujo C-15 en navegador sobre esta integración. La suite de frontend sí cubre esos componentes de forma automatizada.
- Gmail permanece pendiente: el conector figura disponible pero no instalado/conectado. No se abrió ningún mensaje ni se consideró una URL local como sustituto. Mantener la tarea de apertura desde correo en C-11/C-16.
- `active-stack evidence-capture` no pudo renombrar el recibo redactado (`Access is denied`). Aunque hay salidas redactadas fuera del repositorio, la proveniencia Active Stack de estos resultados queda sin verificar.
