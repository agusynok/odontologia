# Verificación de la reapertura del mismo enlace

## Entorno

Ejecución del 2026-11-26 sobre `6c3d4fb731bde169a001df4cd706860a3ac7eba8`, con Linux y filesystem POSIX, Temurin 21.0.13.1+2, Node 24.22.3, npm 12.2.3 y PostgreSQL 17.12 en un contenedor temporal de loopback. Las pruebas usaron datos ficticios. El JAR integrado sirvió React y la API desde `127.0.0.1:8080` con `APP_MAIL_ENABLED=false`.

## Backend

`./backend/gradlew -p backend --no-daemon --offline --console=plain --rerun-tasks test integrationTest bootJar -PentregaLocal` terminó con `BUILD SUCCESSFUL`. Los reportes de Gradle registraron **125 pruebas unitarias y 60 integraciones aprobadas**, sin fallos ni omisiones. Entre las integraciones pasaron `GestionTurnoIntegrationTest` (8), `GestionTurnoDisponibilidadIntegrationTest` (1) y `DentistAgendaIntegrationTest` (2). Se verificó además la construcción del JAR integrado usado en Chromium.

La tarea 3.4 queda verificada en Linux con PostgreSQL 17.12. La corrida automatizada anterior en Windows terminó con tres `UnsupportedOperationException` en `DentistCredentialFileTest` por el requisito de permisos POSIX del archivo de acceso. El 2026-11-26 Fernando informó que realizaron las pruebas manualmente en Windows, que funcionaron y que autorizaba cerrar 3.2 con esa confirmación. No se aportaron logs ni un conteo de la suite de Windows. Las 125 pruebas unitarias aprobadas corresponden a la ejecución automatizada en Linux. La configuración de archivos de acceso sigue documentada en el [README](../../../../README.md#habilitar-el-acceso-interno-del-odontólogo).

## Reapertura en Chromium

Playwright 1.65.2 ejecutó Chromium 159.0.8154.6 a `390×844` y `1440×900` sobre el JAR integrado y PostgreSQL real. En cada tamaño se reservó un turno ficticio desde la interfaz pública. El compositor de C-11 generó el enlace mediante un transporte local de prueba y lo dejó en un archivo temporal privado.

- Abrir el mismo enlace dos veces en la misma pestaña produjo dos `GET /api/gestion/turno` con `200 OK` y `Cache-Control: no-store`. El cuerpo y el `ETag` coincidieron entre las aperturas. En ambas se retiró el fragmento de la barra de direcciones y se comprobó que la credencial no aparecía en `localStorage` ni en `sessionStorage`.
- Las dos consultas fueron las únicas solicitudes de API de la página de gestión. El detalle interno consultado antes y después fue idéntico, con estado `CONFIRMADO` y revisión `0`. Se comprobó el acceso autenticado a Día, Semana y el detalle de C-15.
- Se revisaron ambas capturas y se comprobó la ausencia de desbordamiento horizontal. El `401` de la consulta inicial de sesión interna fue el resultado esperado antes del ingreso. No hubo otros errores de consola ni solicitudes fallidas.

La tarea 3.5 queda verificada con la reapertura local. La comprobación desde el mensaje recibido en Gmail queda diferida por decisión de Fernando.

## Evidencia local

Los registros y las capturas se conservaron fuera del repositorio en `~/.cache/active-stack/runs/c14-reapertura-enlace-misma-credencial/c14.DMTIK7K8/`. El servidor y el contenedor se detuvieron y se retiraron las credenciales ficticias al terminar. Esta ejecución no produjo un recibo de Active Stack. El CLI instalado carece de `evidence-capture` y `evidence-state`.

| Archivo | SHA-256 |
|---|---|
| `backend-build.log` | `9dd819bc53d10856da98e7d07bfafc77dd14b6d83303ee9e97a599ad143f2de6` |
| `chromium.log` | `1d90f1cf1391481ea13c3a5a80571defd37c80fffb19bdcbb9bd75582e79b031` |
| `reapertura-390x844.png` | `731c65317462bbc4d71b810551a31b55c5e26f7529a620330b6059b0cef46848` |
| `reapertura-1440x900.png` | `1de837891f8111ed7df11516763f6a4722657bf9a4553febfa09c22491dffd83` |

## Cierre autorizado por Fernando

Para el cierre se repitieron el build integrado, las 125 unitarias, las 60 integraciones y la reapertura en ambos tamaños sobre el mismo commit. Pasaron además las 109 pruebas frontend en 11 archivos. El registro `frontend.log` se conserva en `~/.cache/active-stack/runs/c14-reapertura-enlace-misma-credencial/cierre.jOUV1KVT/` con SHA-256 `4ccd3c391b3ffbbc23ee35b8ae9bb85f86dde24b2b188807c9d362795f4c90bc`.

El 2026-11-26 Fernando autorizó cerrar el seguimiento con la verificación manual de Windows informada para 3.2 y diferir la prueba real de Gmail de 3.6 al archivo `CORRECCIONES.md`, en la carpeta padre del repositorio. El resultado en Chromium acredita la reapertura y el efecto de solo lectura con un enlace local. La matriz de C-16 conserva diferida la apertura desde un mensaje recibido.
