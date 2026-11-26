# Tasks

## 1. Revisión HIGH y configuración local

- [x] 1.1 Registrar la aprobación HIGH y las decisiones de SMTP, remitente, destinatarios, operación y evidencia en el diseño. Confirmar la disponibilidad de contraseña de aplicación para Gmail y el acceso del titular a la sesión web del único buzón habilitado. Registrar la autorización de envíos reales antes de ejecutarlos.
- [x] 1.2 Incorporar Spring Mail y configuración local con TLS, tiempos finitos y emisor deshabilitado por defecto. Probar que el entorno de prueba bloquea destinos no autorizados y que los diagnósticos omiten secretos y enlaces privados. Documentar configuración sin valores sensibles.

## 2. Despacho y contenido

- [x] 2.1 Consumir despachos elegibles con sondeo y reloj controlables. Autorizar el intento durable con coordinación breve y ejecutar SMTP fuera de ella. Probar en PostgreSQL ambos órdenes de la carrera con cancelación/reprogramación, vencimiento durante la espera y exclusión de envíos simultáneos del mismo despacho.
- [x] 2.2 Componer y comprobar con transporte simulado confirmación, cancelación, reprogramación, recordatorio y despacho combinado al borde exacto de 24 horas. Verificar revisión y destinatario persistidos, referencia revocada, y el tratamiento aprobado del aviso de recuperación de C-04.

## 3. Resultados y recuperación

- [x] 3.1 Persistir aceptación SMTP, fallo transitorio, fallo permanente y resultado incierto. Probar con reloj controlado las esperas de 1 y 5 minutos, tres intentos máximos y ausencia de reintentos para vencidos, obsoletos, permanentes o inciertos.
- [x] 3.2 Verificar con reinicio y PostgreSQL avisos futuros, vigentes, vencidos y una interrupción tras posible aceptación. Documentar cómo identificar y revisar fallos persistidos sin reenviar automáticamente los inciertos.

## 4. Aceptación integrada

- [x] 4.1 Verificar el build y las regresiones de C-04/C-05/C-09 y registrar el estado de la aceptación integrada. Pasaron las comprobaciones locales con el JAR de entrega. Fernando autorizó el 2026-11-26 cerrar la tarea y diferir la comprobación de los cuatro avisos recibidos, la apertura de enlaces y el recordatorio con reloj controlado a `CORRECCIONES.md`, fuera del repositorio. [Registro de cierre](verification.md#cierre-autorizado-por-fernando).
