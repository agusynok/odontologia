# Tasks

## 1. Reapertura y concurrencia de la consulta

- [x] 1.1 Agregar regresiones para reabrir dos veces el mismo enlace y para una segunda apertura mientras la primera lectura está pendiente; verificar un segundo GET, limpieza del fragmento, datos distintos vigentes y descarte de la respuesta anterior con la misma credencial.
- [x] 1.2 Hacer que cada apertura reconocida dispare una lectura nueva por su generación de apertura; mantener la credencial solo en memoria y descartar respuestas obsoletas. Verificar primero que 1.1 falla antes del arreglo y luego que los dos casos y la cobertura C-14 existente pasan.

## 2. Compatibilidad de rutas y contratos

- [x] 2.1 Revisar el despacho existente de `App.tsx` y mantener pruebas del acceso interno, reserva pública y autogestión C-14; conservar las pruebas de transporte API público y privado. Verificar con `App.test.tsx` y `apiClient.test.ts`, sin cambiar contratos ni implementar C-15.
- [x] 2.2 Mantener sin cambios el estado y referencias de C-15 en `CHANGES.md`; registrar el seguimiento correctivo de C-14 sin presentarlo como cierre de C-15. Verificar el diff del roadmap.

## 3. Verificación y evidencia

- [x] 3.1 Ejecutar `npm test`, `npm run build`, validación estricta OpenSpec y `git diff --check`; guardar salidas redacted fuera del repositorio.
- [ ] 3.2 Completar la suite unitaria backend en Windows/Java 21. La corrida `test bootJar` construyó el JAR, pero terminó con tres `UnsupportedOperationException` en `DentistCredentialFileTest`, que usa permisos POSIX no disponibles en Windows.
- [x] 3.3 Ejecutar `bootJar` según `README.md` en Windows/Java 21; el artefacto se generó. Se conserva el fallo de la suite unitaria como tarea separada.
- [ ] 3.4 Completar `integrationTest` con PostgreSQL 17.12 según `README.md`, incluyendo C-14. PostgreSQL respondió, pero la corrida Windows falló al recibir la zona horaria local `America/Buenos_Aires`, no reconocida por PostgreSQL; las repeticiones con zona explícita no produjeron una suite verde.
- [ ] 3.5 Repetir en Chromium a 390×844 y 1440×900 con turno ficticio y credencial de prueba; abrir el mismo enlace dos veces, comprobar que es solo lectura y verificar agenda diaria/semanal y detalle C-15 bajo sesión interna.
- [ ] 3.6 Abrir el enlace desde el mensaje recibido en Gmail de prueba autorizado y registrar la evidencia redactada. Una URL local solo comprueba el flujo web; si el mensaje/cuenta no está disponible, mantener esta tarea pendiente para C-11/C-16.

## Workflow follow-up

- Archivar este change cuando todas las tareas verificables estén completas y su evidencia quede registrada.
