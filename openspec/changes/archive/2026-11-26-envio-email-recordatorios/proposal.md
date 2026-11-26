# Proposal

## Why

C-05 y C-09 dejan avisos durables al confirmar operaciones de turno. C-11 completa US-010 a US-012 con envío SMTP y evidencia de recepción en buzones autorizados.

## What Changes

- Procesar confirmación, cancelación, reprogramación y recordatorio usando los destinatarios, revisiones, referencias y ventanas vigentes.
- Registrar autorización y resultado SMTP por intento. Recuperar trabajo vigente tras reinicio y conservar los resultados inciertos para revisión operativa.
- Verificar los cuatro mensajes en buzones autorizados, la apertura local de los enlaces aplicables y el recordatorio con reloj controlado.
- Alcance HIGH pendiente de revisión antes de aplicar. Se mantienen los contratos de C-04, C-05 y C-09 y las respuestas HTTP existentes.

## Capabilities

### New Capabilities

- `appointment-email-delivery` — despacho SMTP y recuperación operativa de avisos de turnos.

### Modified Capabilities

## Impact

Backend local, Spring Mail, configuración SMTP y persistencia de intentos existente. La cuenta dedicada de Gmail será el remitente y el único buzón de prueba. La recepción se verificará mediante una sesión web autorizada por el titular. La revisión de la propuesta y la autorización de envíos de prueba se registran antes de su ejecución.
