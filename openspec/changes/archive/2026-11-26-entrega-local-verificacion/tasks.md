# Tasks

## 1. Revisión del empaquetado

- [x] 1.1 Registrar la aprobación HIGH del usuario para D-01 y D-02 antes de escribir, con la decisión y el alcance en D-04 de [design.md](design.md).

## 2. Construcción y ejecución del JAR integrado

- [x] 2.1 Implementar el modo `-PentregaLocal`. Desde un checkout limpio y sin base, ejecutar el comando documentado e inspeccionar `BOOT-INF/classes/static/`, el índice y los recursos referenciados. Comprobar que los archivos de bloqueo quedan intactos, que el build independiente conserva su artefacto y que un fallo de build web interrumpe la entrega (RB-05).
- [x] 2.2 Incorporar los mapeos de entrada SPA delimitados. Probar navegación directa y recarga de las tres pantallas, recursos estáticos reales y un recurso inexistente. Comprobar que las respuestas y los estados de `/api` conservan el contrato (LR-07).
- [x] 2.3 Documentar requisitos, comandos desde la raíz, ubicación del JAR, configuración por modo sin secretos, preparación de PostgreSQL, arranque, detención y reinicio. Seguir los comandos con un entorno ficticio y comprobar que solo Spring Boot sirve la aplicación integrada y que Vite sigue disponible en desarrollo (RB-05, LR-01, LR-04, LR-05 y LR-07).

## 3. Aceptación local con evidencia

- [x] 3.1 Ejecutar en Chromium la configuración de agenda, la consulta pública, la reserva y la consulta interna con detalle en `390×844` y `1440×900`. Registrar resultados por criterio, consola y solicitudes relevantes (FL-01 a FL-04, CA-VIS-01 y CA-VIS-02).
- [x] 3.2 Recorrer consulta, cancelación y reprogramación por gestión local con turnos ficticios, incluidos un destino ocupado y el límite temporal. Comprobar la vista de agenda y las actualizaciones de disponibilidad, la conservación del turno original ante rechazo y las respuestas previstas de acceso y privacidad (FL-05 a FL-07, CA-VIS-04 y CA-VIS-05, CT-02 y CT-03).
- [x] 3.3 Ejecutar las integraciones con PostgreSQL 17.12 para concurrencia de reserva, configuración afectada y reprogramación. Correlacionar las solicitudes sincronizadas con el resultado y el estado persistido (CA-VIS-03 y CT-01).
- [x] 3.4 Detener el proceso del JAR y volver a arrancarlo sobre la misma base. Tras ingresar con una sesión nueva, comprobar que configuración y turno coinciden con el estado previo. Contrastar las intenciones y los estados de notificación persistidos (FL-09, CA-VIS-07 y CT-04).
- [x] 3.5 Consolidar la matriz de 48 CA-US, siete CA-VIS, seis CT y nueve FL, con entorno, resultado y referencia por criterio. Para FL-08, registrar la evidencia disponible de composición, intentos y reloj controlado con su alcance. Registrar los criterios pendientes por la apertura desde Gmail y la evidencia diferida de C-11 y C-14. Revisar la matriz contra los identificadores de la KB y obtener revisión independiente de la evidencia conforme al flujo OPSX (CT-05 y CT-06).

## Workflow follow-up

- Los checks 4.1 de C-11 y del seguimiento de C-14 se retoman en sus propios changes. Permanecen abiertos por decisión de Fernando.
- Revisar el resultado de C-16 y los criterios pendientes antes de archivar con el CLI. Actualizar `CHANGES.md` después de verificar el estado de archivo.
