# local-runtime Specification

## Purpose
Definir una ejecución local explícita y comprobable para desarrollar el sistema y conectar el backend a PostgreSQL de prueba preservando datos y decisiones pendientes del dominio.

## Requirements

### Requirement: LR-01 Configuración local explícita

La aplicación SHALL obtener de configuración explícita la URL base, direcciones de escucha, puertos y conexión a PostgreSQL. Los servidores de desarrollo SHALL escuchar únicamente en loopback por defecto y fallar si el puerto elegido está ocupado, sin escoger otro silenciosamente.

#### Scenario: Arranque con configuración local válida
- **WHEN** se inicia el entorno con la configuración local documentada y sus puertos disponibles
- **THEN** los procesos escuchan en las direcciones y puertos acordados y la URL de navegación coincide con el modo de ejecución documentado.

#### Scenario: Puerto ocupado
- **WHEN** otro proceso ocupa el puerto configurado del backend o frontend
- **THEN** el arranque correspondiente informa el conflicto sin cambiar automáticamente a un puerto diferente.

### Requirement: LR-02 Conexión PostgreSQL comprobable

El backend SHALL permitir comprobar su arranque y conexión contra PostgreSQL real mediante una consulta de solo lectura. Una conexión inválida o indisponible SHALL producir un resultado fallido identificable y nunca sustituirse por una base en memoria.

#### Scenario: Base de prueba accesible
- **WHEN** se ejecuta la comprobación documentada con credenciales y una base de prueba explícitamente habilitadas
- **THEN** se abre una conexión real, se ejecuta una consulta de solo lectura y se informa un resultado exitoso sin registrar las credenciales.

#### Scenario: Base inaccesible
- **WHEN** la base configurada no está disponible o rechaza la conexión
- **THEN** la comprobación termina como fallida dentro de un tiempo finito e identifica el problema sin exponer secretos.

### Requirement: LR-03 Conservación del estado existente

Desde C-02, el arranque SHALL aplicar únicamente migraciones versionadas e inicialización revisadas, sin recrear el esquema, borrar registros ni sobrescribir configuración existente. Repetir el arranque SHALL conservar los datos y no reaplicar migraciones ya registradas. Un esquema no reconocido o una migración incompatible SHALL producir un error sin limpieza, reparación ni adopción automática.

#### Scenario: Comprobaciones repetidas
- **WHEN** se repiten el arranque y la comprobación de conexión sobre una base ya migrada e inicializada
- **THEN** no se reaplican migraciones y el esquema y los registros existentes permanecen sin cambios.

#### Scenario: Primera instalación revisada
- **WHEN** se inicia sobre una base vacía explícitamente habilitada con la configuración inicial acordada
- **THEN** se aplican las migraciones versionadas y se inicializa la configuración necesaria sin cargar ejemplos optativos.

#### Scenario: Esquema no reconocido o migración incompatible
- **WHEN** el arranque encuentra un esquema no reconocido o una migración cuyo historial no coincide con los archivos vigentes
- **THEN** informa el fallo y no limpia, repara ni sobrescribe automáticamente el estado previo.

### Requirement: LR-04 Proxy de desarrollo

Durante el desarrollo, el frontend SHALL reenviar las solicitudes de `/api` al backend local configurado y conservar su ruta y respuesta. SHALL permitir observar la indisponibilidad del backend sin presentar una página HTML o datos ficticios como una respuesta exitosa de API.

#### Scenario: Solicitud reenviada
- **WHEN** el navegador solicita una ruta `/api` desde el origen de desarrollo y el backend está disponible
- **THEN** el backend recibe esa ruta y el navegador recibe su estado y respuesta a través del proxy, incluso si la ruta todavía responde 404 en C-01.

#### Scenario: Backend detenido
- **WHEN** se solicita una ruta `/api` mientras el backend está detenido
- **THEN** el fallo de conexión resulta observable y no se convierte en una respuesta exitosa del frontend.

### Requirement: LR-05 Configuración sin secretos versionados

El proyecto SHALL proporcionar una plantilla documentada sin credenciales reales y excluir los valores locales sensibles del control de versiones. La ausencia de credenciales requeridas SHALL impedir presentar como exitosa una comprobación de conexión; no SHALL existir una contraseña predeterminada de la aplicación.

#### Scenario: Configuración compartida con el equipo
- **WHEN** un integrante consulta la plantilla y documentación versionadas
- **THEN** identifica qué valores aportar localmente y cómo cargarlos sin encontrar credenciales reales ni valores sensibles en ejemplos o registros.

#### Scenario: Falta una credencial requerida
- **WHEN** se ejecuta la comprobación sin la configuración de conexión requerida
- **THEN** se informa el dato de configuración ausente, sin conectarse con una identidad predeterminada implícita.

### Requirement: LR-06 Zona horaria sin inferencias

El contrato local SHALL exigir una zona IANA explícita para el tiempo del consultorio, sin derivarla del equipo ni adoptar un fixture de prueba por omisión. La zona configurada SHALL coincidir con la persistida; una diferencia SHALL impedir completar el arranque sin modificar la zona existente. Las zonas de pruebas aisladas SHALL identificarse como fixtures y no aprobar la zona del consultorio.

#### Scenario: Zona de prueba explícita
- **WHEN** una comprobación aislada utiliza una zona de prueba indicada por el ejecutor
- **THEN** su resultado identifica el contexto de prueba y no crea configuración persistida en la instalación del consultorio.

#### Scenario: Zona inválida o ausente
- **WHEN** el arranque o comprobación exige una zona y su configuración está ausente o no es un identificador IANA válido
- **THEN** se informa el error sin sustituirla silenciosamente por la zona del sistema ni por Etc/UTC.

#### Scenario: Diferencia respecto de la zona persistida
- **WHEN** el arranque recibe una zona válida diferente de la del consultorio ya inicializado
- **THEN** falla de forma identificable y conserva la zona persistida y los intervalos de todos los registros.

### Requirement: LR-07 Aplicación web y API desde el JAR local

El JAR integrado SHALL servir las pantallas existentes y la API desde el origen local configurado, con Spring Boot como único servidor HTTP de la aplicación. La navegación directa y la recarga de las rutas de interfaz SHALL funcionar y las solicitudes de API SHALL conservar sus contratos y controles de acceso.

#### Scenario: Entrada directa y recarga de pantallas

- **WHEN** se inicia el JAR integrado con PostgreSQL y se abre o recarga `/`, `/reservar` o `/gestionar-turno` desde el equipo de demostración
- **THEN** se carga la pantalla correspondiente con sus recursos y peticiones al mismo origen, sin iniciar un servidor de frontend.

#### Scenario: Enlace de gestión correspondiente al origen del JAR

- **WHEN** se compone un aviso con un enlace de gestión y la URL base es el origen del JAR local
- **THEN** el enlace apunta a `/gestionar-turno` en ese origen y la pantalla utiliza el fragmento mediante el flujo de gestión existente.

#### Scenario: Solicitud de API o recurso inexistente

- **WHEN** se llama a una ruta de API con un error de contrato o de acceso, o se solicita un recurso estático inexistente
- **THEN** se conserva el estado HTTP que corresponde a la API o al recurso y el índice de la aplicación no sustituye la respuesta.
