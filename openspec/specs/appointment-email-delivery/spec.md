# appointment-email-delivery Specification

## Purpose
Entregar por SMTP los avisos durables de turnos y conservar resultados que permitan recuperar y verificar la operación local.

## Requirements

### Requirement: EM-01 Despacho de avisos vigentes
El emisor SHALL procesar los despachos elegibles con la identidad, revisión, destinatario y material de gestión del contrato C-04/C-05. Los resultados de correo SHALL mantenerse separados del estado del turno.

#### Scenario: Confirmación y recordatorio en el borde de 24 horas
- **WHEN** una reserva exactamente a 24 horas origina dos intenciones con el mismo despacho
- **THEN** se envía un único mensaje válido para ambas y cada resultado se vincula a las dos intenciones.

#### Scenario: Avisos de cambio
- **WHEN** se despacha un aviso de cancelación o reprogramación
- **THEN** el contenido identifica el evento, incluye los datos autorizados correspondientes y respeta la vigencia de la referencia de gestión.

#### Scenario: Recordatorio programado
- **WHEN** llega la hora prevista del recordatorio de un turno confirmado y vigente
- **THEN** se procesa el aviso con los datos de esa revisión y su destinatario persistido.

### Requirement: EM-02 Coordinación y recuperación
La emisión SHALL respetar NO-07 y el vencimiento persistido. El sistema SHALL registrar la autorización y el resultado conocido de cada intento y recuperar los despachos vigentes tras reiniciar.

#### Scenario: Cambio o expiración antes de autorización
- **WHEN** se sustituye la revisión o vence el aviso antes de autorizar el intento
- **THEN** el emisor omite el despacho sin iniciar SMTP.

#### Scenario: Cambio después de autorización
- **WHEN** se confirma un cambio después de autorizar un intento anterior
- **THEN** el intento conserva su propio resultado y la revisión anterior no se vuelve a intentar. Si la referencia necesaria se revocó antes de componer, se registra el fallo de composición sin enviar.

#### Scenario: Fallo conocido y reinicio
- **WHEN** el proceso retoma un despacho vigente tras un fallo transitorio conocido
- **THEN** aplica el máximo de tres intentos y las esperas de 1 y 5 minutos. Los avisos vencidos, fallos permanentes y resultados inciertos quedan fuera del reintento automático.

#### Scenario: Resultado SMTP desconocido
- **WHEN** el proceso se interrumpe tras autorizar un intento y no puede determinar si SMTP aceptó el mensaje
- **THEN** el resultado queda incierto y disponible para revisión, sin reenvío automático.

### Requirement: EM-03 Envíos de prueba autorizados
En el entorno de prueba el emisor SHALL restringir los envíos reales a los destinatarios habilitados explícitamente y SHALL proteger los datos de acceso SMTP y los enlaces privados.

#### Scenario: Destinatario fuera de alcance
- **WHEN** el destinatario persistido no figura entre los buzones de prueba autorizados
- **THEN** no se realiza la llamada SMTP ni se sustituye el destinatario.

### Requirement: EM-04 Evidencia de entrega
El sistema SHALL registrar `ACEPTADA_SMTP` como resultado del servidor. La aceptación del recorrido local SHALL requerir comprobación en buzón para las cuatro clases de mensaje.

#### Scenario: Aceptación y recepción verificables
- **WHEN** se validan confirmación, cancelación, reprogramación y recordatorio con buzones autorizados
- **THEN** se correlaciona cada mensaje observado con su despacho, se comprueban los enlaces aplicables desde la aplicación local y se usa reloj controlado para el recordatorio sin cambiar la regla de producción.
