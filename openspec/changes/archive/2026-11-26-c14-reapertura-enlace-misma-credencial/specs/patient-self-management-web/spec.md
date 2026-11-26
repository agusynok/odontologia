# Spec Delta

## MODIFIED Requirements

### Requirement: SW-01 Apertura privada y consulta de solo lectura
La interfaz SHALL consultar únicamente el turno autorizado por el enlace privado, SHALL mantener la credencial en memoria y SHALL NOT modificar el turno al abrir o previsualizar la página.

#### Scenario: Apertura de un enlace vigente
- **WHEN** el paciente abre un enlace vigente con credencial en el fragmento de la URL
- **THEN** la interfaz elimina el fragmento del historial, conserva la credencial solo en memoria, la envía a C-09 mediante `X-Management-Token` y muestra fecha, hora, estado y acciones disponibles sin datos de contacto

#### Scenario: Previsualización repetida
- **WHEN** un navegador o escáner previsualiza el enlace una o más veces
- **THEN** cada consulta muestra el estado actual autorizado y no cambia el turno, su revisión, la credencial ni las intenciones de aviso

#### Scenario: Reapertura del mismo enlace
- **WHEN** el paciente vuelve a abrir en la misma pestaña el mismo enlace vigente, incluso mientras su consulta anterior sigue pendiente
- **THEN** la interfaz vuelve a consultar el turno, retira nuevamente el fragmento, conserva la credencial solo en memoria y muestra el resultado de la apertura más reciente; una respuesta tardía anterior no modifica la página

#### Scenario: Enlace no disponible
- **WHEN** C-09 responde `404 LINK_NOT_AVAILABLE` por una credencial ausente, inválida, vencida o revocada
- **THEN** la interfaz muestra un mensaje genérico de enlace no disponible sin distinguir la causa ni revelar datos del turno
