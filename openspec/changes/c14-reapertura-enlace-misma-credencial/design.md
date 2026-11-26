# Design

## Context

Ver [proposal.md](proposal.md) para el motivo y [specs/patient-self-management-web/spec.md](specs/patient-self-management-web/spec.md) para el escenario agregado. `GestionTurnoPage` ya retira el fragmento, conserva el token en memoria y descarta respuestas cuyo contador de apertura quedó atrás. El defecto es que el efecto que inicia la lectura depende del valor del token: reabrir exactamente el mismo enlace no cambia ese valor y no inicia otra consulta. La integración se aplica sobre `upstream/main` `00cfec5`, que ya contiene la agenda web C-15 y el código de C-11; esta corrección conserva ambos y no amplía su alcance. La revisión CRITICAL del ciclo de credencial está aprobada para C-14 en [design archivado](../archive/2026-11-25-autogestion-paciente-web/design.md#d-03-disponibilidad-ligada-al-turno-autorizado), y esta corrección sigue el transporte existente sin ampliar lo que se expone.

## Goals / Non-Goals

**Goals:**
- Disparar una lectura por cada apertura reconocida, aun cuando la credencial sea idéntica.
- Descartar lecturas previas por generación de apertura, no solo por valor de credencial.
- Comprobar que las rutas públicas existentes y el acceso interno coexisten en `App`.

**Non-Goals:**
- Cambiar generación, validación, persistencia o transporte de la credencial, endpoints, API o autorización.
- Implementar el change C-15; su estado y referencias del roadmap permanecen como están.
- Cambiar reglas o resultados de cancelación, reprogramación o disponibilidad.

## Decisions

### Una generación por apertura

Mantener un identificador monotónico de apertura separado del estado de la credencial. El manejador de `hashchange` incrementa esa generación y la expone al efecto de consulta; así, React ejecuta una nueva lectura aunque el token no cambie. Cada lectura captura su generación y aplica estado solo si sigue vigente. Una nueva apertura retira el fragmento, mantiene el token exclusivamente en memoria y reinicia el estado visible antes de consultar.

Se descarta usar el cambio del token como señal de apertura: falla cuando el mismo enlace se vuelve a abrir. No se persistirá el identificador ni la credencial.

### Convivencia de rutas

Conservar el despacho de la ruta interna, `/reservar` y `/gestionar-turno`, y las pruebas de transporte de C-13/C-14. C-15 ya está implementado en el baseline `00cfec5`; mantener su agenda, pruebas, cierre y referencias del roadmap sin cambiar su alcance. Esta corrección no añade funcionalidad a C-15. No copiar la versión antigua de `origin/main`, que quitaría rutas y pruebas posteriores.

## Risks / Trade-offs

- [Riesgo] Un `hashchange` obsoleto podría afectar la carga actual → comparar la generación capturada antes de aplicar cualquier resultado y probar respuestas fuera de orden con la misma credencial.
- [Riesgo] La sustitución de URL podría conservar el fragmento → comprobar el historial después de ambas aperturas en prueba y navegador.
- [Riesgo] Resolver la convivencia de rutas podría iniciar el chequeo de sesión interno al abrir C-14 → probar que `/gestionar-turno` abre en público sin `checkSession`, y que agenda/detalle C-15 siguen accesibles desde la sesión interna.

## Migration Plan

Sin migración ni cambios de API. Si falla la verificación, revertir el cambio frontend y sus pruebas/evidencias sin modificar C-04, C-09, C-13 o C-15.

## UI Mockups

Decision: no (no UI; 2026-11-25).
