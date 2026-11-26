# Spec Delta

## ADDED Requirements

### Requirement: RB-05 JAR integrado reproducible

El proyecto SHALL proporcionar una construcción documentada que compile el frontend con sus dependencias bloqueadas y empaque sus recursos con el backend en un JAR ejecutable. La construcción SHALL funcionar sin PostgreSQL y producir un artefacto distinguible del JAR del backend independiente.

#### Scenario: Construcción desde un checkout limpio

- **WHEN** un integrante ejecuta la construcción integrada documentada con las herramientas fijadas
- **THEN** obtiene un JAR con el índice y los recursos web que corresponden a ese checkout y los archivos de bloqueo quedan intactos.

#### Scenario: Construcción del frontend fallida

- **WHEN** falla la instalación reproducible del frontend o su compilación
- **THEN** la construcción integrada informa el fallo y no presenta un JAR de una compilación anterior como resultado de esa ejecución.

#### Scenario: Compilación independiente del backend

- **WHEN** un integrante ejecuta la compilación independiente del backend
- **THEN** obtiene su artefacto habitual con Java y las dependencias de backend, sin ejecutar el build web.
