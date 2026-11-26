# Proposal

## Why

El equipo ya puede ejecutar la interfaz y el backend por separado. Para la demostración local necesita un JAR que sirva la aplicación completa y una matriz que muestre qué flujos están comprobados y cuáles requieren evidencia adicional.

## What Changes

- Incorporar una compilación integrada y reproducible que incluya React en el JAR de Spring Boot. Documentar construcción, arranque, detención y reinicio con PostgreSQL local y datos ficticios.
- Servir la entrada de odontólogo, la reserva y la autogestión desde el mismo origen que la API. Mantener el flujo de desarrollo con Vite y el build independiente del backend.
- Comprobar los flujos disponibles en navegador, la concurrencia en PostgreSQL real y la persistencia después de reiniciar. Consolidar los 48 CA-US, siete CA-VIS, seis CT y nueve FL con evidencia y estado por criterio.
- Por instrucción de Fernando, avanzar C-16 con la tarea 4.1 de C-11 y el seguimiento de reapertura de C-14 abiertos. Registrar como pendientes los criterios de C-16 que dependan de la evidencia aún faltante de Gmail, en particular la apertura desde el mensaje recibido. Conservar los estados de ambos changes.

## Capabilities

### New Capabilities

### Modified Capabilities

- `reproducible-builds` incorpora la construcción reproducible del JAR integrado.
- `local-runtime` incorpora la navegación y el servicio de API desde el JAR integrado en loopback.

## Impact

- Build Gradle y build fijado de Vite, recursos web del JAR, rutas de entrada SPA en Spring MVC y documentación local.
- Verificación en un entorno de prueba con PostgreSQL 17.12 y Chromium. Las reglas de agenda y correo, los contratos de API y los controles de acceso quedan fuera del alcance de implementación.
- El empaquetado y la configuración tienen gobernanza HIGH. La propuesta queda sujeta a revisión antes de editar código o configuración ejecutable.
