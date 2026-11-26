# Tasks

## 1. Reapertura y concurrencia de la consulta

- [x] 1.1 Agregar regresiones para reabrir dos veces el mismo enlace y para una segunda apertura mientras la primera lectura está pendiente; verificar un segundo GET, limpieza del fragmento, datos distintos vigentes y descarte de la respuesta anterior con la misma credencial.
- [x] 1.2 Hacer que cada apertura reconocida dispare una lectura nueva por su generación de apertura; mantener la credencial solo en memoria y descartar respuestas obsoletas. Verificar primero que 1.1 falla antes del arreglo y luego que los dos casos y la cobertura C-14 existente pasan.

## 2. Compatibilidad de rutas y contratos

- [x] 2.1 Revisar el despacho existente de `App.tsx` y mantener pruebas del acceso interno, reserva pública y autogestión C-14; conservar las pruebas de transporte API público y privado. Verificar con `App.test.tsx` y `apiClient.test.ts`, sin cambiar contratos ni implementar C-15.
- [x] 2.2 Mantener sin cambios el estado y referencias de C-15 en `CHANGES.md`; registrar el seguimiento correctivo de C-14 sin presentarlo como cierre de C-15. Verificar el diff del roadmap.

## 3. Verificación y evidencia

- [x] 3.1 Ejecutar `npm test`, `npm run build`, validación estricta OpenSpec y `git diff --check`; guardar salidas redacted fuera del repositorio.
- [x] 3.2 Completar la verificación del backend en Windows/Java 21. Fernando confirmó el 2026-11-26 que realizaron las pruebas manualmente en Windows y que funcionaron, y autorizó cerrar la tarea con esa confirmación. La [verificación](verification.md#backend) conserva el alcance de esa confirmación y los resultados automatizados previos.
- [x] 3.3 Ejecutar `bootJar` según `README.md` en Windows/Java 21; el artefacto se generó. Se conserva el fallo de la suite unitaria como tarea separada.
- [x] 3.4 Completar `integrationTest` con PostgreSQL 17.12 según `README.md`, incluyendo C-14. Pasaron 60/60 integraciones en Linux con PostgreSQL aislado de loopback, incluidas las de gestión, disponibilidad y agenda. La corrida previa en Windows quedó bloqueada por la zona `America/Buenos_Aires`. [Evidencia](verification.md#backend).
- [x] 3.5 Repetir en Chromium a 390×844 y 1440×900 con turno ficticio y credencial de prueba. Se abrió el mismo enlace dos veces en cada tamaño, con dos lecturas y el turno intacto. También se verificaron agenda diaria, semanal y detalle C-15 bajo sesión interna. [Evidencia](verification.md#reapertura-en-chromium).
- [x] 3.6 Registrar el aplazamiento autorizado de la prueba de apertura desde un mensaje recibido en Gmail. Fernando autorizó el cierre de la tarea el 2026-11-26 y dejó la ejecución real para `CORRECCIONES.md`, fuera del repositorio. La evidencia disponible acredita la reapertura local de 3.5. [Registro de cierre](verification.md#cierre-autorizado-por-fernando).

## Workflow follow-up

- Se autorizó archivar el seguimiento con la confirmación manual de Windows y la comprobación de Gmail diferida. La matriz de C-16 conserva el estado de la aceptación por correo.
