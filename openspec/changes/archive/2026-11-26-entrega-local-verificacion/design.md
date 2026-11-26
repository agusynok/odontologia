# Design

## Context

Gradle construye el JAR de backend con `bootJar` y Vite genera `frontend/dist` con `npm run build`. En desarrollo, Vite sirve React en `127.0.0.1:5173` y reenvía `/api` a Spring Boot en `127.0.0.1:8080`. `App.tsx` despacha la entrada interna, `/reservar` y `/gestionar-turno`. `ComposicionAvisos` usa `APP_BASE_URL` para construir la URL de gestión. Ver [propuesta](proposal.md).

## Goals / Non-Goals

**Goals:**

- Entregar el JAR de demostración desde un checkout limpio y abrir las pantallas con un único origen HTTP de aplicación.
- Comprobar el entorno integrado con datos ficticios e identificar por criterio el resultado observado y la evidencia disponible.

**Non-Goals:**

- Cambios en contratos de API, autenticación, credenciales de gestión, lógica de notificaciones, esquema o reglas de agenda.
- Cierre de C-11 o del seguimiento de C-14, despliegue público, carga de datos reales o respaldo y restauración.

## Decisions

### D-01 Build optativo de entrega

Agregar el modo `./backend/gradlew -p backend bootJar -PentregaLocal` desde la raíz. Este modo encadena `npm ci` y `npm run build` con Node.js 24.22.3 y npm 12.2.3 en `frontend/`. El `bootJar` de entrega toma el índice y los recursos de esa compilación y los incluye bajo `BOOT-INF/classes/static/` con un clasificador `local`. Un fallo de npm detiene la ejecución y la documentación solo identifica como entregable el JAR de una ejecución exitosa. La fuente de recursos se limita a la salida de producción y no se copia a los directorios versionados. `bootJar` sin esa opción sigue disponible con Java y el build de backend, y Vite conserva su proxy de desarrollo. Separar la opción permite construir y probar el backend sin instalar las herramientas web.

### D-02 Rutas de interfaz delimitadas y origen local

Dejar que Spring Boot sirva el índice y los recursos compilados. Añadir mapeos de entrada SPA delimitados para `/reservar` y `/gestionar-turno`, incluyendo las variantes con barra final y las rutas subordinadas que reconoce el frontend. Los mapeos solo sirven navegación GET y quedan fuera de `/api` y `/assets`. Se validará la apertura directa, la recarga, un recurso inexistente y los estados representativos de la API. Evitar el fallback global impide que el índice sustituya excepciones o respuestas de API. La demostración usa `SERVER_ADDRESS=127.0.0.1`, `SERVER_PORT=8080` y `APP_BASE_URL=http://127.0.0.1:8080`. El modo Vite conserva la URL base de desarrollo en `5173`. La API, la sesión y los enlaces usan los mecanismos existentes.

### D-03 Evidencia y límites acordados

Usar PostgreSQL 17.12 aislado, datos ficticios y dos tamaños de Chromium, `390×844` y `1440×900`. Reutilizar pruebas de integración pertinentes para concurrencia y corroborar los flujos de usuario contra el JAR. Ejecutar reinicio con el mismo almacenamiento y comparar configuración, turno y estado de notificaciones antes y después. Una nueva sesión interna permite comprobar la agenda tras el reinicio. Las verificaciones de acceso ejercitan los contratos vigentes y cualquier corrección de seguridad requiere una aprobación CRITICAL aparte.

La matriz incluye los 48 CA-US, los siete CA-VIS, los seis CT y FL-01 a FL-09. Cada fila indica resultado, entorno y referencia de evidencia redactada o motivo concreto de pendiente. El usuario autorizó avanzar mientras C-11 4.1 y el seguimiento C-14 permanecen pendientes. Registrar la evidencia local que se obtenga para FL-08, conservando pendientes los aspectos de recepción y apertura que no tengan evidencia suficiente, incluidos CA-VIS-06 y la aceptación completa de CT-05 si faltan sus comprobaciones de correo. La evidencia anterior sobre C-11 y C-14 debe conservar su atribución y alcance. Cualquier prueba SMTP real se hará solo si se retoma con el buzón de prueba autorizado y el reloj controlado para el recordatorio.

### D-04 Revisión HIGH

**Estado de revisión:** aprobado por Fernando el 2026-11-26 mediante «si apruebo los diseños», en respuesta al pedido explícito de aprobar D-01 y D-02. La aprobación cubre el empaquetado Gradle, los mapeos de entrada de Spring MVC y la configuración local de ejecución descritos en esas decisiones. Su instrucción de dejar pendientes C-11 y C-14 está registrada en D-03.

Fernando autorizó para C-16 la misma excepción al contrato de evidencia de Active Stack usada en C-01 a C-03. La revisión usa ejecuciones reales, registros redactados y una comprobación por un revisor distinto del implementador.

## Risks / Trade-offs

- Recursos antiguos dentro de un JAR → enlazar el empaquetado a la compilación del mismo checkout y comprobar el contenido del JAR integrado desde un estado limpio.
- Ruta incorrecta en emails locales → documentar y comprobar que el origen definido para el JAR coincide con el navegador. Una comprobación de composición conserva su alcance cuando Gmail queda pendiente.
- Evidencia incompleta de recuperación → comparar los mismos registros antes y después de reiniciar y consultar la agenda desde una nueva sesión.

## Migration Plan

Construir el artefacto local con las herramientas fijadas. Arrancar con una base de prueba explícita y los archivos privados de acceso y gestión que describe el README. Detener Spring Boot y volver a ejecutar con la misma configuración para la comprobación de persistencia. El modo de desarrollo con Vite permite seguir trabajando con la misma base compatible si se retira el JAR integrado. Se reutilizan las migraciones y la inicialización vigentes.

## UI Mockups

Decision: no (no UI)
