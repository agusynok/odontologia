# Verificación C-16

## Alcance y entorno

C-16 usa la excepción al contrato de evidencia que Fernando autorizó en D-04. Los resultados corresponden a Linux POSIX, Eclipse Temurin 21.0.13.1+2, Node.js 24.22.3, npm 12.2.3 y PostgreSQL 17.12 en un contenedor aislado con datos ficticios. Chromium ejecutó el JAR a 390×844 y 1440×900. La reproducción independiente usó otra copia y otra base.

Las comprobaciones de Gmail se aplazaron por instrucción del usuario. C-11 4.1 y el seguimiento de C-14 permanecen abiertos. El transporte local del fixture ejercitó autorización, composición y registro de intentos con los servicios existentes. La recepción real en Gmail y la apertura desde el mensaje recibido conservan sus propios criterios de aceptación y quedan pendientes en C-16. La recepción histórica consta en `openspec/changes/envio-email-recordatorios/verification.md`.

## Requisitos del change

| Requisito | Implementación | Evidencia |
| --- | --- | --- |
| RB-05 | `backend/build.gradle.kts` registra las tareas web cuando se especifica `-PentregaLocal` y empaqueta su salida en el JAR `local`. | Build desde copia limpia sin base, índice y dos recursos iguales a la salida de Vite, bloqueos intactos, JAR independiente sin recursos web y TS2322 inducido que detiene el build antes de empaquetar. Reproducción independiente. |
| LR-07 | `LocalFrontendController` delimita las entradas GET públicas y Spring Boot sirve el índice y los recursos estáticos. | JAR real con raíz, entradas directas y recargas, API 200/401, 404 de rutas y recursos inexistentes, 405 para POST a rutas de interfaz. Lanzamiento de los recorridos desde el puerto 8080. Composición local consistente con el origen del JAR. Reproducción independiente de las rutas HTTP. |

## Evidencia de ejecución

Los registros ordinarios redactados se conservan fuera del repositorio bajo `~/.cache/active-stack/runs/entrega-local-verificacion/`. Esta evidencia usa la excepción aprobada en D-04.

| Registro | Resultado | SHA-256 de la copia redactada |
| --- | --- | --- |
| `c16.Vh4mnr/rb05-red.log` | 1 esperado, faltaba el JAR local. | `f57a0c882cb9328f0d7de9c49d4d2f53368d77ba957c5385494124158f85e118` |
| `c16.Vh4mnr/rb05-clean.log` | 0, build integrado desde una copia limpia. | `41773d1170b5f96cdd9bba4ceb8bd9c7ebbcc7dcdd491f852329cb6acd08e276` |
| `c16.Vh4mnr/rb05-failure.log` | 1 esperado, error TS2322 inducido. | `93f3b7e95120c0c7e02a05732f516901669fb203cacb95c961ed7031fc227e7c` |
| `c16.Vh4mnr/lr07-red.log` | 1 esperado, `/reservar` devolvía 404. | `096b5d8030eb059bc48736a1a6b7d895b515a689257fe3b20d59d79c18b7bac6` |
| `c16.Vh4mnr/lr07-green.log` | 0, rutas y respuestas HTTP del JAR. | `ccf12fc1a2b45ba48a4649d11e84010976df569ae8dc969ee2e8c59a4e03af48` |
| `c16.Vh4mnr/backend-suite.log` | 0, 125 unitarias y 60 integraciones con PostgreSQL. | `908330480b70528aa0fd033143c9b887bc0bb70b74e48968e90785a1a4f3ade4` |
| `c16.Vh4mnr/frontend-suite.log` | 0, 109 pruebas de interfaz. | `7aa37e8661ff6c67fe006b62891a123990318794b95c2fb79478343edcefe468` |
| `c16.Vh4mnr/browser-c16.log` | 0, FL-01 a FL-07 en ambos tamaños. | `ad84b8fa05f0d4876ca3cf2b5338ba4e2e082b0e2b8e00619ba7135e41c7571a` |
| `c16.Vh4mnr/reload-final.log` | 0, navegación directa y recarga explícita de las tres entradas en Chromium. | `7d7063ef8c4caf1aba9b763620958d2710c021ad709b786c423f952e1b5c5a56` |
| `c16.Vh4mnr/restart-final.log` | 0, nueva sesión e igualdad en 11 tablas luego de reiniciar. | `7b6abdce5420ad43d6a670d0f77c666089cccf602f78a49e216726308e73ae4d` |
| `c16.Vh4mnr/vite-c16.log` | 0, modo de desarrollo y proxy de API. | `3eaac99dbcf69c7049412756fbdcb2cf029543eb6a54639f72ea7029f18c7209` |
| `c16-review.O1SQIr/build.log` | 0, verificación independiente del JAR y archivos de bloqueo. | `b036b72d5eda25b73f02fd4636c4ebe360b3fe36c8e3c00a2a108897c80fcdc7` |
| `c16-review.O1SQIr/failed-build-check.log` | 0, verificación independiente del fallo de build inducido. | `8bd86002f8a0b9910f6b862daf6d33fa6b87be75125d5e08234ca2004eb78ee4` |
| `c16-review.O1SQIr/http.log` | 0, verificación independiente de rutas y respuestas HTTP. | `fa5cde0880b9a85aaaee39d1dcb40fd47d16e46642508efd186573bfe1a227a7` |
| `c16-review.O1SQIr/gradle-integration.log` | 0, reejecución independiente de 125 unitarias y 60 integraciones. | `9696888ab09afa1778e4908622dead6d467b594ef41586bcf132d606b2e7bcee` |
| `c16-review.O1SQIr/browser-fl01-fl07.log` | 0, repetición independiente en Chromium con otro PostgreSQL. | `7a533783b2f5fb3626be7d9cce5f6ceeec5bdd5fcc653f5f756e5eedc140567f` |
| `c16-review.O1SQIr/browser-fl09.log` | 0, repetición independiente del reinicio del JAR. | `7b6abdce5420ad43d6a670d0f77c666089cccf602f78a49e216726308e73ae4d` |

El CLI validó C-16 en modo estricto antes del archivo. Después del archivo validó individualmente `local-runtime` y `reproducible-builds` en modo estricto. La validación global informó 17 aprobados y un fallo en `dentist-agenda-query` por un propósito provisional y dos requisitos largos. El resultado coincide byte a byte con la misma validación sobre una copia limpia de la base `8048c2d`, según `strict-original.log` y `strict-final.log`.

Se verificó el build en Linux. La rama de invocación de npm para Windows queda fuera del entorno ensayado. En Chromium se comprobó el origen único, el ancho de las pantallas, los errores de página y las solicitudes fallidas. El HTTP 409 de negocio fue la respuesta esperada al intento de reprogramar hacia un destino ocupado.

La réplica independiente partió de `8048c2d73d899e1350e71c4e06deae8be4721dba` y usó las mismas entradas productivas del cambio. Comparó `backend/build.gradle.kts` (SHA-256 `11178bc77e45b43dbfbc1221dd0ce669457761fbfeb776cb1da5de4bb2117ed0`) y `LocalFrontendController.java` (SHA-256 `4b1a7657c0cfd0ed8a9f02920d086c356af97678d73d97b65c56de898d666e75`) antes y después de las ejecuciones.

## Matriz de historias

Las referencias de clases corresponden a las suites anteriores. Las referencias de navegador corresponden al JAR integrado sobre PostgreSQL 17.12.

| Criterio | Resultado | Evidencia o pendiente |
| --- | --- | --- |
| CA-US-001-01 | Comprobado | Navegador y AvailabilityConfigurationControllerTest, alta, consulta y edición. |
| CA-US-001-02 | Comprobado | AvailabilityRulesTest y AvailabilityConfigurationIntegrationTest, validación sin cambio persistido. |
| CA-US-001-03 | Comprobado | PublicAvailabilityIntegrationTest y PublicBookingIntegrationTest, duración y grilla. |
| CA-US-001-04 | Comprobado | AvailabilityConfigurationIntegrationTest y GestionTurnoServiceTest, duración vigente y conflicto con reserva. |
| CA-US-002-01 | Comprobado | Navegador, configuración de atención y pausa. AvailabilityConfigurationControllerTest. |
| CA-US-002-02 | Comprobado | Navegador y PublicAvailabilityIntegrationTest, intervalos compatibles con pausa. |
| CA-US-002-03 | Comprobado | Navegador, respuesta con zona IANA y suites de disponibilidad y agenda. |
| CA-US-002-04 | Comprobado | AvailabilityRulesTest y AvailabilityConfigurationIntegrationTest, bordes y conservación. |
| CA-US-003-01 | Comprobado | Navegador, alta, consulta y retiro de bloqueo. |
| CA-US-003-02 | Comprobado | Navegador y PublicBookingIntegrationTest, bloqueo primero impide confirmar. |
| CA-US-003-03 | Comprobado | Navegador, disponibilidad recuperada al retirar el bloqueo. |
| CA-US-003-04 | Comprobado | AvailabilityConfigurationIntegrationTest, rechazo de un bloqueo que afecta un turno. |
| CA-US-004-01 | Comprobado | Navegador, consulta pública desde el JAR. |
| CA-US-004-02 | Comprobado | Navegador y PublicAvailabilityIntegrationTest, exclusión de pausa, bloqueo y ocupación. |
| CA-US-004-03 | Comprobado | AvailabilityRulesTest y PublicBookingIntegrationTest, ventana y grilla comunes. |
| CA-US-004-04 | Comprobado | PublicAvailabilityIntegrationTest, respuesta mínima y consulta de lectura. |
| CA-US-005-01 | Comprobado | Navegador, formulario de cinco datos. AvailabilityRulesTest, ausencias y formatos. |
| CA-US-005-02 | Comprobado | Navegador, HTTP 201 e ingreso interno con el turno visible. |
| CA-US-005-03 | Comprobado | PublicBookingIntegrationTest, reservas superpuestas sincronizadas. |
| CA-US-005-04 | Comprobado | PublicBookingIntegrationTest, reutilización exacta y preservación de datos. |
| CA-US-006-01 | Comprobado | Navegador, vistas día y semana. DentistAgendaIntegrationTest, zona de consulta. |
| CA-US-006-02 | Comprobado | Navegador y DentistAgendaControllerTest, detalle con contrato acotado. |
| CA-US-006-03 | Comprobado | Navegador, cambios visibles en el detalle y liberación de la disponibilidad. |
| CA-US-006-04 | Comprobado | HTTP del JAR devuelve 401. DentistAgendaIntegrationTest, acceso interno requerido. |
| CA-US-007-01 | Comprobado | Navegador y GestionTurnoControllerTest, consulta válida y campos acotados. |
| CA-US-007-02 | Comprobado | GestionTurnoControllerTest, GestionTurnoServiceTest y GestionTurnoDisponibilidadIntegrationTest, validación de credencial y alcance. |
| CA-US-007-03 | Comprobado | Navegador, apertura con igualdad del turno antes y después. El seguimiento de reapertura C-14 conserva su estado. |
| CA-US-007-04 | Comprobado | CredencialesGestionTest, DentistAccessTest y RecuperacionIntencionesTest, credencial y recuperación. |
| CA-US-008-01 | Comprobado | Navegador, escritura expresa y disponibilidad liberada. |
| CA-US-008-02 | Comprobado | GestionTurnoIntegrationTest, estado cancelado y aviso durable en la misma operación. |
| CA-US-008-03 | Comprobado | GestionTurnoServiceTest, límites de 24 horas con reloj fijo. Pruebas de GestionTurnoPage, mensaje de contacto. |
| CA-US-008-04 | Comprobado | Navegador, igualdad tras abrir y cancelación solo al confirmar. |
| CA-US-009-01 | Comprobado | Navegador, reprogramación. GestionTurnoServiceTest, duración vigente y ventana. |
| CA-US-009-02 | Comprobado | Navegador, mismo ID, nueva revisión y estado confirmado. GestionTurnoIntegrationTest, aviso. |
| CA-US-009-03 | Comprobado | Navegador, conflicto y original intacto. GestionTurnoIntegrationTest, caso concurrente y rollback. |
| CA-US-009-04 | Comprobado en suites | Regla de 24 horas compartida por las dos operaciones, con prueba directa de cancelación. GestionTurnoPage prueba específicamente reprogramación fuera de plazo, conservación del turno y contacto directo. Apertura de solo lectura comprobada en Chromium. |
| CA-US-010-01 | Comprobado | PublicBookingIntegrationTest y fixture de composición C-11, intención ligada al turno. |
| CA-US-010-02 | Pendiente | Apertura desde el mensaje real recibido en Gmail, C-11 4.1 y seguimiento C-14. |
| CA-US-010-03 | Comprobado | Navegador, confirmación inmediata y consulta por enlace ficticio. |
| CA-US-010-04 | Comprobado | ColaDespachosIntegrationTest, RecuperacionIntencionesTest y aviso UI de estado pendiente. |
| CA-US-011-01 | Comprobado | Navegador y GestionTurnoIntegrationTest, cancelación y reprogramación. |
| CA-US-011-02 | Pendiente en C-16 | C-11 registró recepción histórica manual de ambos tipos. La campaña C-16 con mensajes reales queda diferida. |
| CA-US-011-03 | Comprobado | GestionTurnoIntegrationTest, aviso e historial ligados a turno y destinatario. |
| CA-US-011-04 | Comprobado | RecuperacionIntencionesTest y ColaDespachosIntegrationTest, vigencia y unicidad de intentos. |
| CA-US-012-01 | Comprobado | RecuperacionIntencionesTest, recordatorio y combinación exacta a 24 horas con reloj fijo. |
| CA-US-012-02 | Pendiente en C-16 | La recepción histórica de C-11 tiene su registro propio. Falta la comprobación en el buzón para esta entrega. |
| CA-US-012-03 | Comprobado | GestionTurnoIntegrationTest y RecuperacionIntencionesTest, reemplazo y supresión de obsoletos. |
| CA-US-012-04 | Comprobado | Reinicio del JAR y ColaDespachosIntegrationTest y RecuperacionIntencionesTest, estados, reintentos y vencimiento. |

## Matriz de visión, criterios transversales y flujos

| Criterio | Resultado | Evidencia o pendiente |
| --- | --- | --- |
| CA-VIS-01 | Comprobado | Navegador con agenda por día y semana, atención y pausa, motivo y bloqueo. |
| CA-VIS-02 | Comprobado | Reserva por formulario, HTTP 201 y detalle interno. |
| CA-VIS-03 | Comprobado | PostgreSQL real, dos reservas sincronizadas y un solo turno confirmado. |
| CA-VIS-04 | Comprobado | Cancelación y reprogramación en Chromium. GestionTurnoIntegrationTest acredita avisos persistidos. |
| CA-VIS-05 | Comprobado | Suites de Gestión con reloj fijo y el mensaje de contacto del frontend. |
| CA-VIS-06 | Pendiente | Recepción y apertura desde Gmail en la entrega con el JAR. C-11 y C-14 siguen abiertos. |
| CA-VIS-07 | Comprobado | Reinicio del JAR y comparación de estado persistido con nueva sesión. |
| CT-01 | Comprobado | PostgreSQL con carreras de reserva, configuración y reprogramación. |
| CT-02 | Comprobado | HTTP del JAR sin sesión y suites de acceso interno y gestión por credencial. |
| CT-03 | Comprobado | PublicAvailabilityIntegrationTest, PublicBookingIntegrationTest y GestionTurnoControllerTest. |
| CT-04 | Comprobado | FL-09, igualdad de configuración, turnos y estado de notificaciones luego del reinicio. |
| CT-05 | Parcial | JAR, PostgreSQL y navegación comprobados. Gmail difiere la aceptación completa. |
| CT-06 | Comprobado | Matriz con evidencias y pendientes. Revisión independiente de ejecución y alcance. |
| FL-01 | Comprobado | Ingreso, día, semana y detalle en ambos tamaños. |
| FL-02 | Comprobado | Creación de motivo, horario semanal y pausa, alta y retiro de bloqueo. |
| FL-03 | Comprobado | Consulta pública, filtro de bloqueos, pausas y ocupación. |
| FL-04 | Comprobado localmente | Reserva y creación de aviso. La parte Gmail sigue pendiente en FL-08. |
| FL-05 | Comprobado localmente | Enlace del compositor con transporte local, inicio en el origen del JAR y turno sin cambios. |
| FL-06 | Comprobado | Confirmación de cancelación, estado del turno y horario liberado. |
| FL-07 | Comprobado | Destino disputado con original intacto, cambio exitoso que conserva ID y mueve el intervalo. |
| FL-08 | Parcial | Composición, intentos y reloj fijo en suites locales. Evidencia de mensaje real de esta entrega diferida. |
| FL-09 | Comprobado | Dos procesos sucesivos del JAR, misma base y reingreso al reiniciar. |

## Límites de la demostración

La aplicación se ejecuta en loopback sobre datos ficticios. Las comprobaciones cubren continuidad tras reinicio y los límites locales del producto. Uso con datos reales, respaldo y restauración, validación con odontólogos y disponibilidad pública pertenecen al alcance posterior registrado en la base de conocimiento.
