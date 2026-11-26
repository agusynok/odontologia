# Proposal

## Why

Al volver a abrir en la misma pestaña el mismo enlace de C-14, el navegador genera una apertura nueva, pero React conserva el mismo valor de credencial y no repite el `GET /api/gestion/turno`. La página queda vacía aunque C-09 siga disponible; el comportamiento debe reflejar cada apertura y descartar resultados de consultas anteriores.

## What Changes

- Hacer que cada apertura del enlace, incluso con la misma credencial, dispare una nueva consulta de solo lectura.
- Ignorar respuestas tardías de aperturas anteriores y verificar regresión de URL, estado y credencial efímera.
- Mantener compatibles la reserva pública, el acceso interno y la ruta pública de autogestión al convivir con C-15; no implementar ni cambiar el alcance de C-15.
- Registrar evidencia de regresión y validación en el change C-14 correctivo, sin cambiar endpoints ni contratos de API.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `patient-self-management-web`: precisar en SW-01 que cada reapertura del enlace vigente vuelve a consultar el turno y que solo la respuesta de la apertura más reciente actualiza la página.

## Impact

- Interfaz y pruebas: `frontend/src/components/GestionTurnoPage.tsx`, `frontend/src/components/GestionTurnoPage.test.tsx`, `frontend/src/App.tsx`, `frontend/src/App.test.tsx` y `frontend/src/api/apiClient.test.ts`.
- Roadmap y evidencia: `CHANGES.md` y la verificación archivada de C-14; conservar las referencias y estado vigentes de C-15.
- No modifica backend, credenciales de C-04, contratos de API ni límites de autorización.
