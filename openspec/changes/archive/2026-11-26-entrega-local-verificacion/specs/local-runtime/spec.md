# Spec Delta

## ADDED Requirements

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
