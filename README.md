# odontologia

Aplicación local para la agenda de un odontólogo independiente. Incluye acceso
interno, configuración de disponibilidad, reserva y autogestión de turnos. El
nombre del repositorio es provisional. Usar datos ficticios en la demostración.

## Herramientas

| Herramienta | Versión |
|---|---|
| Eclipse Temurin | JDK 21.0.13.1+2 |
| Gradle | 9.9.2, mediante Wrapper |
| Spring Boot | 4.2.0 |
| Node.js | 24.22.3 |
| npm | 12.2.3, mediante `npx` |
| React / React DOM | 19.3.1 |
| TypeScript | 7.0.2 |
| Vite / plugin React | 8.3.8 / 6.3.0 |
| PostgreSQL de prueba | 17.12 |

Usar distribuciones oficiales de [Temurin](https://adoptium.net/temurin/releases/?version=21)
y [Node](https://nodejs.org/dist/v24.22.3/), comprobando sus checksums publicados.
El Wrapper descarga Gradle y comprueba el SHA-256 fijado en
`backend/gradle/wrapper/gradle-wrapper.properties`.

No hace falta reemplazar Java/Node globales ni editar perfiles personales. Si se
extraen las distribuciones Linux x64 en `.tools/`, desde la raíz del repositorio:

```bash
export JAVA_HOME="$PWD/.tools/jdk-21.0.13.1+2"
export PATH="$JAVA_HOME/bin:$PWD/.tools/node-v24.22.3-linux-x64/bin:$PATH"
export GRADLE_USER_HOME="$PWD/.tools/gradle-cache"
export npm_config_cache="$PWD/.tools/npm-cache"
java -version
node --version
npx --yes npm@12.2.3 --version
```

También se pueden seleccionar instalaciones propias de esas versiones. `.tools/`
es local y no se versiona. El backend rechaza Java distinto de 21 o un proveedor
distinto de Eclipse Adoptium. El frontend exige Node y npm mediante `engine-strict`;
el npm incluido con Node puede ser diferente: usar los comandos `npx` indicados.

## Compilar y comprobar sin base de datos

Desde `backend/`:

```bash
./gradlew test bootJar
```

Ejecuta las pruebas de configuración sin PostgreSQL y genera
`build/libs/odontologia-0.0.1-SNAPSHOT.jar`. Las pruebas de integración están
separadas: `test`, `build` y `bootJar` no las ejecutan. En Windows existe
`gradlew.bat`; las comprobaciones documentadas en C-01 se ejecutan en Linux.

Desde `frontend/`:

```bash
npx --yes npm@12.2.3 ci
npx --yes npm@12.2.3 run typecheck
npx --yes npm@12.2.3 run build
```

`ci` respeta `package-lock.json` y falla si no coincide con `package.json`.
`build` comprueba tipos antes de producir los archivos estáticos en `dist/`.
No se instala npm globalmente. La primera resolución necesita internet; los
builds posteriores pueden reutilizar las cachés locales.

`backend/gradle.lockfile` fija las dependencias resolubles del backend. Una
actualización deliberada se hace con `./gradlew resolveAndLockAll --write-locks`;
para el frontend, con la versión fijada de npm y `install`. Revisar y compartir
los cambios de los bloqueos. No usar estos comandos para instalar rutinariamente.

## Construir y ejecutar el JAR de la demostración

Desde la raíz, con Java, Node.js y npm seleccionados según la tabla de herramientas:

```bash
./backend/gradlew -p backend bootJar -PentregaLocal
```

Este modo instala las dependencias web con `npm ci`, ejecuta `npm run build` y
empaqueta React en `backend/build/libs/odontologia-0.0.1-SNAPSHOT-local.jar`.
Usar el JAR de una ejecución que termine con `BUILD SUCCESSFUL`. PostgreSQL se
requiere al ejecutar la aplicación. `bootJar` sin `-PentregaLocal` sigue siendo
el build independiente del backend y Vite sigue disponible para desarrollo.

Para iniciar la demostración, [poner en marcha PostgreSQL](#iniciar-postgresql-con-docker),
[habilitar el acceso interno](#habilitar-el-acceso-interno-del-odontólogo) y
[configurar las claves de gestión](#configurar-las-claves-de-los-enlaces-de-gestión).
Mantener los dos archivos privados fuera del checkout y exportar sus rutas con
`APP_DENTIST_CREDENTIAL_FILE` y `APP_GESTION_KEY_FILE`. Desde la raíz:

```bash
export SERVER_ADDRESS=127.0.0.1 SERVER_PORT=8080
export APP_BASE_URL=http://127.0.0.1:8080
export APP_TIME_ZONE=America/Argentina/Mendoza
export APP_CONSULTORIO_NOMBRE=Grupo13
export APP_ODONTOLOGO_NOMBRE='Carlos Garcia'
export APP_MAIL_ENABLED=false
python3 scripts/with-local-db.py java -jar backend/build/libs/odontologia-0.0.1-SNAPSHOT-local.jar
```

Para [otra instancia local](#configurar-otra-instancia-local), exportar las tres
variables JDBC de esa sección y ejecutar directamente el `java -jar` anterior.
En una base ya inicializada, usar los nombres y la zona que se guardaron al
crearla. La URL base de esta demostración es la de Spring Boot en el puerto 8080.
En desarrollo con Vite se mantiene el origen del puerto 5173.

Abrir `http://127.0.0.1:8080/` para ingresar a la agenda o
`http://127.0.0.1:8080/reservar` para reservar. Los enlaces de autogestión abren
`/gestionar-turno` en el mismo origen y funcionan en el equipo donde corre la
aplicación. El JAR sirve las pantallas y la API usando solamente Java y PostgreSQL.

Detener Spring Boot con `Ctrl+C`. Para verificar persistencia, repetir el mismo
comando sobre la misma base, volver a ingresar y consultar la configuración y el
turno guardado. Conservar el volumen y la configuración local al reiniciar.
El correo está deshabilitado en este recorrido. La comprobación desde el buzón
Gmail autorizado queda pendiente en C-11 y en el seguimiento de C-14.

## Iniciar PostgreSQL con Docker

Desde la raíz del repositorio, con Docker y Compose disponibles:

```bash
python3 scripts/init-local-env.py
docker compose up -d --wait --wait-timeout 60 db
docker compose ps db
```

El primer comando crea `.env` con una contraseña aleatoria local, sin mostrarla ni
sobrescribir un archivo existente. Compose usa PostgreSQL **17.12** en
`127.0.0.1:5433`, con base `odontologia_test` y usuario `odontologia`. La imagen
está fijada por digest y los datos se conservan en el volumen del proyecto
`odontologia-local`. No se toca el PostgreSQL instalado en el sistema ni otros
contenedores.

Para ejecutar las pruebas con esa conexión, después de seleccionar Java como se
indicó arriba, desde la raíz:

```bash
python3 scripts/with-local-db.py --integration ./backend/gradlew -p backend integrationTest
```

El script obtiene la configuración de Compose y pasa la conexión al comando hijo.
`--integration` habilita la creación de bases efímeras para las pruebas. Para
iniciar el backend con los datos aprobados de la demostración:

```bash
export APP_TIME_ZONE=America/Argentina/Mendoza
export APP_CONSULTORIO_NOMBRE=Grupo13
export APP_ODONTOLOGO_NOMBRE='Carlos Garcia'
python3 scripts/with-local-db.py ./backend/gradlew -p backend bootRun
```

### Si la base no está corriendo

El script de conexión falla con un mensaje que indica los comandos para iniciarla.
Desde la raíz, tanto si el contenedor está detenido como si todavía no existe:

```bash
python3 scripts/init-local-env.py
docker compose up -d --wait --wait-timeout 60 db
docker compose ps db
```

Si Docker tampoco está iniciado, abrir Docker Desktop o, en Linux con systemd:

```bash
sudo systemctl start docker
docker info
```

Después repetir `docker compose up -d --wait --wait-timeout 60 db`. Si falla el
arranque, consultar `docker compose logs --tail=50 db`; si el puerto 5433 está
ocupado, resolver ese conflicto antes de reintentar, sin cambiarlo silenciosamente.

Para detener y volver a iniciar conservando los datos:

```bash
docker compose stop db
docker compose up -d --wait --wait-timeout 60 db
```

Conservar `.env` junto con el volumen local. Cambiar `POSTGRES_PASSWORD` en el
archivo no modifica la contraseña de una base ya inicializada. Los comandos
anteriores no eliminan el volumen ni reinicializan los datos.

## Configurar otra instancia local

[.env.example](.env.example) enumera las variables. Es una plantilla de referencia:
Spring Boot no la carga automáticamente. Exportar las variables en la terminal
que iniciará el backend, usando una base de prueba habilitada. No compartir sus
credenciales ni pegarlas en el chat. Esta alternativa es para una instancia propia;
con Compose se puede usar directamente `scripts/with-local-db.py`.

```bash
export SERVER_ADDRESS=127.0.0.1
export SERVER_PORT=8080
export APP_BASE_URL=http://127.0.0.1:5173
export APP_TIME_ZONE=America/Argentina/Mendoza
export APP_CONSULTORIO_NOMBRE=Grupo13
export APP_ODONTOLOGO_NOMBRE='Carlos Garcia'
read -r -p 'URL JDBC de PostgreSQL de prueba: ' SPRING_DATASOURCE_URL
read -r -p 'Usuario de prueba: ' SPRING_DATASOURCE_USERNAME
read -r -s -p 'Contraseña de prueba: ' SPRING_DATASOURCE_PASSWORD
export SPRING_DATASOURCE_URL SPRING_DATASOURCE_USERNAME SPRING_DATASOURCE_PASSWORD
```

El backend requiere URL base, zona IANA, nombres visibles y las tres variables
de conexión. Para una instancia propia, preparar una base PostgreSQL vacía
habilitada para el proyecto y usar una URL JDBC como
`jdbc:postgresql://127.0.0.1:5432/odontologia_test`. La identidad de conexión debe
poder instalar `btree_gist` y aplicar las migraciones. Pasar las credenciales
mediante sus variables.

Desde `backend/`, `./gradlew bootRun` inicia Spring Boot en `127.0.0.1:8080`.
Desde otra terminal, en `frontend/`, `npx --yes npm@12.2.3 run dev` inicia Vite en
`127.0.0.1:5173`. Abrir `http://127.0.0.1:5173` para acceder a la aplicación
en modo desarrollo. Cada proceso se detiene con Ctrl+C. Si un puerto está
ocupado, el servidor correspondiente informa el conflicto.

Vite reenvía `/api` a `http://127.0.0.1:8080` sin cambiar la ruta. En C-01,
`curl -i http://127.0.0.1:5173/api/c01-probe` debe conservar el 404 del backend;
no existe un endpoint de negocio. Con el backend detenido, debe observarse un
error de proxy, nunca una respuesta HTML exitosa de la interfaz.

El arranque valida la configuración antes de conectar. Flyway aplica las
migraciones pendientes y valida su historial. El inicializador crea solo el
consultorio, el odontólogo y la agenda faltantes en una transacción. Si los
nombres o la zona difieren de lo persistido, informa el conflicto y conserva los
valores existentes. Usar una migración nueva para evolucionar un esquema ya
migrado. Si el historial o el esquema inicial son incompatibles, revisar la
causa antes de volver a arrancar.

## Habilitar el acceso interno del odontólogo

Desde la raíz, con Java 21 seleccionado, generar el archivo en un directorio
privado POSIX fuera del repositorio. La utilidad pide el usuario y la contraseña
en la terminal. El archivo guarda un verificador con sal y permisos `0600`.

```bash
install -d -m 700 "$HOME/.local/share/odontologia"
export APP_DENTIST_CREDENTIAL_FILE="$HOME/.local/share/odontologia/acceso"
./backend/gradlew -p backend bootJar
"$JAVA_HOME/bin/java" -jar backend/build/libs/odontologia-0.0.1-SNAPSHOT.jar \
  credencial-odontologo "$APP_DENTIST_CREDENTIAL_FILE"
```

Usar un usuario de hasta 64 caracteres con letras, números, punto, guion o guion
bajo y una contraseña de 15 a 128 caracteres. Arrancar el backend desde la
terminal que exportó la ruta. Si el archivo falta, es ilegible o es inválido, el
backend puede iniciar y la API de ingreso responde `503 ACCESS_NOT_CONFIGURED`.

Para recuperar el acceso, detener el backend, repetir el comando de credencial
y volver a iniciar. La agenda queda en PostgreSQL. Reiniciar o pasar 30 minutos
sin actividad de sesión requiere ingresar nuevamente. En HTTP, usar el origen y
las direcciones de loopback documentados arriba. C-12 agrega la pantalla de
ingreso. Mientras tanto, el contrato HTTP se puede comprobar con las pruebas de
integración del backend.

## Configurar las claves de los enlaces de gestión

Configurar `app.gestion-key-file` mediante `APP_GESTION_KEY_FILE` con la ruta
absoluta a un archivo privado, fuera de cualquier checkout Git y de PostgreSQL.
Usar un sistema de archivos POSIX con soporte para `SecureDirectoryStream`
(por ejemplo, el sistema de archivos Linux de WSL). El archivo y su directorio
inmediato deben pertenecer al usuario que ejecuta Java. El directorio requiere
permisos `0700` o `0500`. El archivo debe ser regular, con permisos `0600` o
`0400`, y su entrada no puede ser un enlace simbólico.

El formato es Java Properties en UTF-8. `activa` identifica la versión que se
usará para cifrar las próximas credenciales. Cada propiedad `clave.<versión>`
contiene 32 bytes aleatorios codificados en Base64 estándar.

```bash
install -d -m 700 "$HOME/.local/share/odontologia-claves"
export APP_GESTION_KEY_FILE="$HOME/.local/share/odontologia-claves/gestion.properties"
# Ejecutar una vez para crear el archivo inicial.
(
  umask 077
  set -o noclobber
  {
    printf 'activa=v1\nclave.v1='
    openssl rand -base64 32
  } > "$APP_GESTION_KEY_FILE"
)
```

Arrancar el backend desde esa terminal. Para rotar, agregar una nueva
`clave.<versión>` y cambiar `activa`. Conservar las claves anteriores mientras
haya enlaces vigentes cuyo material se deba recuperar. Si el archivo falta o
es inválido, la emisión y la composición afectadas fallan. Los enlaces ya
emitidos se pueden seguir validando mediante su verificador en PostgreSQL.

## Comprobar PostgreSQL real

Desde la raíz, con PostgreSQL de Compose en marcha:

```bash
python3 scripts/with-local-db.py --integration ./backend/gradlew -p backend integrationTest
```

La tarea abre conexiones reales, aplica Flyway en bases efímeras
`odontologia_c02_*` y prueba integridad, arranque, reinicialización y
concurrencia. Se ejecuta cada vez y elimina las bases que crea. Los resultados
JUnit quedan en `backend/build/test-results/` y `backend/build/reports/tests/`.

Las escrituras futuras de motivos, franjas, bloqueos y turnos usarán
`AgendaWriteCoordinator`. Dentro de su transacción se relee el estado vigente
después de adquirir el bloqueo de agenda. Los cambios relacionados se confirman
juntos, y llamadas como SMTP se hacen fuera de la transacción. PostgreSQL
protege los turnos confirmados por intervalo `[inicio, fin)`. Los turnos
cancelados liberan su intervalo. Los horarios semanales se expresan en hora
local y los turnos y bloqueos en instantes con precisión de microsegundos.

## Alcance y estado

**C-01 completado y archivado**, con 21/21 tareas. El
[change C-01](openspec/changes/archive/2026-11-22-foundation-setup/proposal.md), sus
[tareas](openspec/changes/archive/2026-11-22-foundation-setup/tasks.md) y el
[informe de comprobaciones](openspec/changes/archive/2026-11-22-foundation-setup/verification.md)
registran resultados, límites y excepciones autorizadas. La reproducción adicional
por otra persona fue reemplazada por reproducción propia a pedido del usuario.
La excepción al contrato incompleto de evidencia SDD se registró en el change.

**C-02 completado y archivado**, con 22/22 tareas. El modelo, las migraciones y
la coordinación por agenda se comprobaron con PostgreSQL real. La extensión
de la excepción de evidencia a C-02 y la reproducción independiente figuran en
sus [comprobaciones](openspec/changes/archive/2026-11-22-core-models/verification.md).

**C-03, C-04 y C-05 archivados.** El backend incluye el acceso interno, la
recuperación asistida de enlaces y la persistencia de intenciones e intentos.
C-11 integra el envío por SMTP, C-14 incorpora el enlace en el navegador y C-16
integra React en Spring Boot para comprobar la entrega local completa.
