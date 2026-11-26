# Verificación C-11

## Recepción manual en Gmail

Ignacio confirmó el 2026-11-25 que vio los cinco mensajes en **Recibidos** y que sus identificadores coincidían con los intentos. La captura fue descrita por Ignacio. La confirmación de recepción se atribuye al titular del buzón. El resultado SMTP se contrastó aparte en PostgreSQL.

Reloj de la campaña: 2027-01-05 10:00 UTC. Base aislada con datos ficticios.

| Caso | Intento | Resultado SMTP | Recepción manual |
|---|---|---|---|
| Confirmación | e2d97775-5f29-4f32-ad7a-b4cccfaf1b8b | ACEPTADA_SMTP | Recibido |
| Cancelación | 6885260b-224b-4119-b377-6e58f41f9503 | ACEPTADA_SMTP | Recibido |
| Reprogramación | c8ab13f2-5875-4629-bb74-f98c9d0bb1a4 | ACEPTADA_SMTP | Recibido |
| Recordatorio | 00e8d727-a69d-4c35-a274-b23d6fed925e | ACEPTADA_SMTP | Recibido |
| Combinado a 24 horas exactas | e78eb08a-57f4-4788-a715-813b23f3e513 | ACEPTADA_SMTP | Recibido |

La campaña registró un solo intento para el despacho combinado, con tipos `CONFIRMACION+RECORDATORIO`. En ese momento seguía pendiente la integración de C-14 y faltaba abrir los enlaces recibidos en navegador.

## Corrección de la ruta de autogestión

Con el compositor original, la prueba focalizada ejecutó 7 casos y falló en los 6 que esperaban un enlace. El informe mostró `/gestion#credencial-ficticia` donde se esperaba `/gestionar-turno#credencial-ficticia`. El caso sin material de gestión pasó.

Tras corregir la ruta, los 7 casos de composición pasaron. Se comprobó la URL completa para confirmación, reprogramación, recordatorio, combinado y recuperación. Una segunda URL base confirmó que el host y el puerto provienen de la configuración. La cancelación y la confirmación sin material quedaron sin enlace. El combinado conservó un único aviso con un único enlace.

La ejecución directa en WSL usó Temurin 21.0.13.1+2, PostgreSQL 17.12 en un contenedor temporal con puerto de loopback, `APP_BASE_URL=http://127.0.0.1:5173` y `APP_MAIL_ENABLED=false`. Pasaron `test` (118 casos), `integrationTest` (57 casos) y `bootJar`, con salida 0. No se enviaron correos.

| Ejecución directa | Directorio bajo `~/.cache/` en WSL | Salida | SHA-256 de `result.log` redactado |
|---|---|---|---|
| Regresión con la ruta anterior | `c11-ruta.KBnoGDYD` | 1 | `75389a339b588df831ce9d5eec878e81048768cb8b3431fb896ad6fc86d59ab6` |
| Suite con la ruta corregida | `c11-ruta.ACYQdaGu` | 0 | `6f17500e98c7ee501dbf37975fbab064f41a10dd850c62a30e767b26ad41b1fd` |

La comprobación de esta corrección cubre la composición. Una revisión independiente confirmó el alcance del diff, las huellas de ambos registros y que los dos archivos Java coinciden byte a byte con los de la ejecución exitosa. Las ejecuciones quedaron registradas con captura directa. El ejecutable Active Stack disponible carece de `evidence-capture` y `evidence-state`, por lo que sigue pendiente la corroboración formal de la procedencia de esas ejecuciones. En esa revisión quedaron pendientes EM-04 y la tarea 4.1 por la apertura desde un mensaje recibido con C-14 integrado.

## Estado anterior a la integración de C-14

- El 2026-11-25 el main de upstream y el HEAD de `ignacio/c11` estaban en `4120042ce23782ab2d85ad75dab6e7a96cf754ce`. En ese momento, la integración de C-14 y la apertura funcional desde el mensaje seguían pendientes en la tarea 4.1.

## SMTP AUTH y revisión independiente

La regresión reprodujo el fallo con AUTH 454 (recibo `815161fcf6bbaadc823c2a1b29485e0b`). La corrección conserva 454 como transitorio y 535 como permanente. También conserva como permanente un rechazo que solo menciona 454 en el texto. La suite Linux `test integrationTest bootJar` terminó con código 0 (recibo `771090f6e3a08eb9fd6ab4b8de4e0fb3`).

El revisor independiente comprobó el manejo de la excepción de autenticación, el reconocimiento del código de respuesta inicial y la cobertura de regresión. Su revisión de código fue favorable para esta corrección. La suite y su recibo se registran aparte de la revisión de código y de la confirmación manual en Gmail.

## Recuperación después de aceptación SMTP local

El arnés de prueba arrancó el backend en Linux con Temurin 21 y PostgreSQL 17.12 descartable. Usó un transporte JavaMail hacia un servidor SMTP de loopback. El servidor respondió `250` al terminar DATA, el cliente volvió de la llamada SMTP y la JVM terminó abruptamente con código 86 aún dentro del transporte, antes de que `EmisionAviso` pudiera registrar el resultado. Se ejercitaron la cola, la autorización y la persistencia de producción con el transporte de prueba.

Una JVM nueva encontró un único intento abierto en la misma base. Después del sondeo inicial y de otro seis minutos después en el reloj de prueba, quedó un único intento `INCIERTO` con hora de finalización y cero conexiones SMTP. Un intento de reenvío hubiera hecho fallar la prueba. No se usaron credenciales de Gmail ni se enviaron mensajes externos.

| Ejecución | Recibo Active Stack | Salida | SHA-256 de salida redactada |
|---|---|---|---|
| Principal | 3645c3d6d7f342fd71e47476202acb2a | 0 | fbcbd7152414a4bda4d5b9da6c3e99fa434b798f5d6cc1cda8013bc366fc177e |
| Repetición independiente, base propia | b1a5cadc2ca1037f0e76c026dea0803d | 0 | b6b1364e19f199744bb026f26702a053dbf74644524d287b2eb2dc28bd94d087 |

Ambos recibos identifican el árbol `dfaf59df2945197cbaa0624e98d926852564eb6f2fbf652b391dc67c443c22aa` anterior a esta actualización documental. Gradle comprobó los códigos de la JVM 86 y 0 en sus fases respectivas. El redactor ocultó esos valores en las líneas de diagnóstico. El revisor independiente contrastó el SHA-256 de su salida, el punto del corte y los contadores de recuperación. Veredicto favorable para este escenario de EM-02.

Arnés local conservado en WSL `/tmp/c11-recuperacion.Oj7tiwXr`. SHA-256 de `RecuperacionSmtpFixture.java`: `853b2f546e0f33cb5b25288d2b46cfe6723757ed42ccda96b238077064daa925`.

## Revisión final de la rama

Se contrastaron AGENTS.md, CHANGES.md, los artefactos de C-11 y los contratos de C-04/C-05/C-09. Se confirmó que el emisor está deshabilitado por defecto, restringe remitente y destinatario al buzón de prueba, exige STARTTLS con verificación del servidor y recibe el secreto por variable de entorno. La autorización revalida el vencimiento y la revisión bajo el coordinador de agenda. PostgreSQL excluye emisores simultáneos y los intentos inciertos no se reenvían.

La revisión independiente encontró que un fallo explícito al establecer conexión SMTP se trataba como incierto antes de enviar datos. La prueba reprodujo el fallo (recibo `c34125799b8fa4afab660ef1ed95b885`). Ahora `MailConnectException` se clasifica como transitorio y conserva los reintentos de C-05. Un timeout genérico sigue siendo incierto. El revisor dio su conformidad a la corrección y ejecutó en limpio `test integrationTest bootJar` con Temurin 21, PostgreSQL 17.12 aislado, filesystem POSIX y el emisor deshabilitado.

Recibo independiente final `0cbf82d5a590a92353e52b0248c52498`, salida 0. Huella del árbol probado `9c788e20f64dd11d1dde2c86c3be763f1988e3122189afd632140d5f01cf8337`, previa a este registro documental. SHA-256 de salida redactada `3125227a32002264342b1eecaa634ee04a32771f8cce73160053a512d30d7312`. La prueba de corte y la comprobación manual de Gmail se mantienen como evidencia de sus respectivos escenarios. Al finalizar esa revisión, C-11 tenía 6/7 tareas.

## Fallo conocido al recuperar el enlace antes de SMTP

La regresión reservó un turno ficticio con credencial real de prueba e intención de confirmación. Movió temporalmente el archivo de claves y ejecutó el sondeo con un transporte instrumentado. Con el código anterior observó cero llamadas y los estados `[null, INCIERTO]` en los dos sondeos. El segundo se ejecutó seis minutos después, con la clave restaurada.

`EmisionAviso` reconoce el diagnóstico de material no disponible de C-04 únicamente durante la recuperación del enlace. Persiste `PERMANENTE` y `terminado_en` mediante el registro del intento autorizado. C-05 deriva el material irrecuperable a atención operativa y reserva los reintentos para fallos transitorios conocidos. La prueba confirma un solo intento finalizado y cero llamadas, incluso al restaurar la clave. Una referencia ausente o revocada conserva el fallo permanente cuando el aviso requiere enlace. Una cancelación puede componerse sin enlace.

La variante de interrupción conserva el intento abierto hasta el siguiente sondeo. En la repetición del arnés local, el servidor SMTP respondió `250` al completar DATA y la JVM se detuvo con código 86 antes de persistir el resultado. La JVM siguiente conservó un solo intento `INCIERTO` finalizado, con cero conexiones SMTP en dos sondeos.

Las ejecuciones Gradle usaron Temurin 21.0.13.1+2, PostgreSQL 17.12 descartable y una copia en filesystem POSIX de WSL con el emisor Gmail deshabilitado. El estado de código parte de `f434399eee1aaee9e9be0e5e645159aa0abf8e06`. La suite final y el arnés compartieron la huella SHA-256 `7d1f63f15a671d50f2d7df8e517590e72ecd2b1fce1f9ca410603eb44d075372` del manifiesto ordenado de archivos en `backend/src`, antes de copiar el arnés. Su código coincide con la huella del arnés anterior.

| Ejecución directa | Directorio bajo `~/.cache/` en WSL | Salida | SHA-256 de `result.log` redactado |
|---|---|---|---|
| Regresión previa a la corrección | `c11-composicion.eD85nKUZ` | 1, solo falló el caso sin acceso a claves | `7394b95a50b5122580339d1fe86e9148c872ddbbf48353cdd4b56de3a3e4bd61` |
| `test integrationTest bootJar` | `c11-composicion.54Ri9QCX` | 0, 119 unitarias y 59 integraciones | `774b8772bd17c2b103055e6a8695b346569ebfdff837478c38cb83118ee9fe5d` |
| Corte tras `250` y reinicio | `c11-composicion.XVyL40fm` | 0 | `cdde066892401d9d74a718c5c187041e79bf0d644aa93c8e4fb8ce47e032c565` |

`openspec validate envio-email-recordatorios --strict` también salió con código 0 con el CLI de Windows sobre la copia alojada en el filesystem POSIX de WSL. SHA-256 de `openspec-strict.log` en `c11-composicion.54Ri9QCX`: `9cb6e93b6e70b8e83bcc71d9d7c582b2bda08a01cd4e69b4c22589206930463d`.

Un agente distinto revisó el diff y contrastó las cuatro huellas de los archivos Java. Su dictamen fue favorable y señaló la dependencia del diagnóstico literal de C-04, cubierta por la regresión. La captura de las ejecuciones fue directa. El ejecutable Active Stack instalado no ofrece `evidence-state`, por lo que la corroboración formal de procedencia queda pendiente.

Tras consultar ambos remotos en esa revisión, `upstream/main` quedó en `32c9128` con C-15 integrado y C-14 pendiente. La rama `ignacio/c11` quedó en `f434399` y divergía de upstream. Faltaba correlacionar y abrir un enlace desde una copia recibida en Gmail con C-14 integrado. En esa verificación no se enviaron correos externos.

## Cierre autorizado por Fernando

El 2026-11-26 Fernando autorizó el cierre de C-11 con la evidencia local del JAR integrado y difirió la campaña de Gmail de la tarea 4.1 al archivo `CORRECCIONES.md`, en la carpeta padre del repositorio. El último intento de la campaña integrada se detuvo en la autenticación SMTP con `534 5.7.9`. Los mensajes de la campaña histórica de C-11 conservan su evidencia de recepción. La comprobación de EM-04 con el JAR integrado queda diferida, incluidos los cuatro tipos de aviso, la apertura desde Recibidos y el reloj controlado para el recordatorio.

La repetición del cierre en `6c3d4fb` aprobó el build del JAR, las 125 unitarias y las 60 integraciones con PostgreSQL 17.12. También se comprobó la generación local del enlace y su reapertura a dos tamaños en Chromium con el transporte de prueba. [Evidencia de la entrega integrada](../2026-11-26-c14-reapertura-enlace-misma-credencial/verification.md).
