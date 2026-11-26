# CHANGES — Secuencia de Implementación

> Índice canónico de los changes del proyecto `odontologia` para la primera entrega local.
> Fecha: 2026-11-19. Los changes se delimitan como unidades de trabajo revisables; su duración se estimará al especificarlos.
> **Leer este archivo antes de proponer cualquier change con OpenSpec.**

---

## Cómo usar este documento

1. Identificar un change pendiente cuyas dependencias estén terminadas. Las dependencias de este índice son de implementación; las decisiones pendientes indicadas también deben resolverse antes del comportamiento afectado.
2. Leer los archivos de KB indicados y revisar sus estados. 01–07 están aprobados; 08–10 contienen PT y preguntas pendientes. Presentar las alternativas necesarias y registrar la decisión explícita sin convertir una propuesta en aprobación por inferencia.
3. Crear la propuesta mediante el flujo OpenSpec disponible, usando el nombre kebab-case del change. Invocar `$sdd-orchestrator` solo por pedido explícito del usuario. El CLI administra el estado de artefactos; este índice no crea changes ni directorios dentro de `openspec/`. Especificar contratos, alcance, errores y verificación; obtener las aprobaciones de dominio antes de escribir su código.
4. Implementar y verificar el alcance autorizado; archivar el change con el CLI cuando corresponda. Conservar evidencia de aceptación y pendientes. No declarar completa una historia porque se implementó solo su backend o porque SMTP aceptó un mensaje.
5. Marcar la casilla de este índice solamente después de verificar y archivar. Actualizar las decisiones y referencias afectadas, sin alterar silenciosamente contratos consumidos por otro change.

### Alcance y precedencia

- Entrega: un consultorio, un odontólogo, una agenda, PostgreSQL local, frontend compilado servido por Spring Boot y emails reales a destinatarios habilitados para pruebas. Se utilizan pacientes ficticios y no se incorporan datos clínicos.
- Stack aprobado: Java 21 Temurin, Spring Boot, Gradle Wrapper, React, TypeScript, Vite, CSS, PostgreSQL y Spring Mail/SMTP. C-01 fijó versiones y el contrato local. C-02 activó Flyway, implementó el esquema inicial con Spring JDBC y estableció la coordinación por agenda. Ver [README](README.md).
- **Decisión posterior del usuario, 2026-11-19:** saltear diseño visual e ir al roadmap. Política `off`, persistida en [design-system/README.md](design-system/README.md) y en el estado de fundación. AT-11 queda resuelto respecto de esa política; no bloquea las pantallas. Se omiten sistema visual y revisión obligatoria de mockups. AP-01, nombre comercial, permanece pendiente; usar el identificador provisional `odontologia` sin crear una marca.
- No se incluyen clínica, pagos, suscripciones, WhatsApp, recepción, múltiples consultorios, despliegue público, auditoría completa ni procedimientos de backup/restore. PB-12 y AT-09 deben resolverse antes de usar datos reales; la prueba de reinicio de esta entrega no equivale a restaurar un respaldo.
- La semana es un objetivo sin fechas ni capacidad acordadas (AP-03). Este orden no promete terminar en siete días ni demuestra viabilidad del plazo. AP-04 y SU-01/SU-04/SU-05 siguen pendientes de validación con personas; una demostración técnica no acredita demanda ni reducción de trabajo. AP-02, AP-05 y AP-06 se mantienen fuera de este plan de MVP.
- Los 16 changes del roadmap y el seguimiento correctivo de C-14 están archivados. C-16 comprobó el JAR de entrega, los recorridos locales y el reinicio. Fernando autorizó el cierre con la campaña integrada de Gmail diferida. La matriz de aceptación de C-16 conserva esos criterios. C-09 tiene registrada la aprobación CRITICAL de Fernando para usar internamente el email confirmado de recuperación al preparar avisos futuros. La disputa de AG-05 por el mismo horario tiene prueba de integración con PostgreSQL.

### Gobernanza aplicable

Prevalece la tabla suministrada por el usuario sobre heurísticas de las skills. El nivel de cada change es el máximo de su alcance: **CRITICO** (CRITICAL), análisis sin código hasta aprobación humana explícita; **ALTO** (HIGH), propuesta y revisión antes de escribir configuración que afecte datos; **MEDIO** (MEDIUM), implementación autorizada con checkpoints y decisiones visibles; **BAJO** (LOW), autonomía con las comprobaciones pertinentes. Consumir un mecanismo de acceso ya aprobado no autoriza modificarlo: cualquier ampliación de seguridad vuelve a revisión CRITICAL. No se rebaja la gobernanza para cumplir el plazo.

### Cobertura de la entrega

Cada US tiene cuatro CA-US en el documento 06; la columna de cierre incluye la verificación de sus cuatro criterios en C-16, además de las comprobaciones locales del change.

| Historia | Backend / capacidad | Interfaz | Flujo | Cierre |
|---|---|---|---|---|
| US-001 — Motivos | C-02, C-03, C-06, C-07 | C-12, C-13 | FL-02 | C-16 |
| US-002 — Horario y pausas | C-02, C-03, C-06, C-07 | C-12, C-13 | FL-02 | C-16 |
| US-003 — Bloqueos | C-02, C-03, C-06, C-07 | C-12, C-13 | FL-02 | C-16 |
| US-004 — Disponibilidad | C-07 | C-13 | FL-03 | C-16 |
| US-005 — Reserva | C-02, C-04, C-05, C-08 | C-13 | FL-04 | C-16 |
| US-006 — Agenda interna | C-03, C-10 | C-12, C-15 | FL-01 | C-16 |
| US-007 — Consulta por enlace | C-04, C-09 | C-14 | FL-05 | C-16 |
| US-008 — Cancelación | C-04, C-05, C-09 | C-14 | FL-06 | C-16 |
| US-009 — Reprogramación | C-04, C-05, C-07, C-09 | C-14 | FL-07 | C-16 |
| US-010 — Confirmación y enlaces | C-04, C-05, C-08, C-11 | C-13, C-14 | FL-04, FL-08 | C-16 |
| US-011 — Avisos de cambios | C-05, C-09, C-11 | C-14 | FL-06, FL-07, FL-08 | C-16 |
| US-012 — Recordatorio | C-05, C-11 | C-14 para abrir el enlace | FL-08 | C-16 |

| Criterio transversal | Responsables principales y evidencia esperada |
|---|---|
| CT-01 — Concurrencia | C-02, C-06, C-08 y C-09; C-16 comprueba colisión de intervalos y conservación del original ante fallo. |
| CT-02 — Acceso limitado | C-03 y C-04 implementan controles tras aprobación; C-09/C-10 los consumen; C-16 comprueba llamadas directas sin permiso. |
| CT-03 — Datos públicos limitados | C-04, C-07 y C-08; C-16 comprueba respuestas y que coincidencias de DNI/email no conceden acceso. |
| CT-04 — Persistencia | C-02, C-04 y C-05; C-11 recupera según política; C-16 verifica FL-09 sin recrear ni sobrescribir datos. |
| CT-05 — Entrega local | C-01 y C-16: artefacto con React servido por Spring Boot, PostgreSQL local, enlaces locales y recepción real de emails. |
| CT-06 — Evidencia | Cada change registra sus comprobaciones; C-16 consolida 48 CA-US, siete CA-VIS, seis CT y nueve FL con resultados y pendientes. |

| Criterio de visión | Changes que lo habilitan; todos se aceptan en C-16 |
|---|---|
| CA-VIS-01 — Configuración y disponibilidad | C-06, C-07, C-12, C-13 y C-15. |
| CA-VIS-02 — Reserva y agenda | C-08, C-10, C-11, C-13 y C-15. |
| CA-VIS-03 — Sin superposición concurrente | C-02, C-06, C-08 y C-09. |
| CA-VIS-04 — Cancelar/reprogramar con aviso | C-04, C-05, C-09, C-11 y C-14. |
| CA-VIS-05 — Impedir autogestión fuera de plazo | C-04, C-09 y C-14. |
| CA-VIS-06 — Recepción de email y enlaces locales | C-04, C-05, C-11 y C-14. |
| CA-VIS-07 — Persistencia después de reiniciar | C-02, C-04, C-05 y C-11, comprobados en FL-09. |

### Decisiones que habilitan la implementación

AT-01, AT-02 para el esquema inicial, AT-05 para el protocolo común y AT-08 para la demostración local se concretaron en C-01 y C-02. AT-11 ya estaba resuelto. C-06 resolvió PB-02 (franjas del mismo día, sin duplicados ni solapes; pausas dentro de una franja), PB-03 (inicios cada 15 minutos anclados al comienzo de cada franja y duraciones múltiplos de 15 entre 15 y 240 minutos) y PB-05 (rechazar cambios que afecten turnos confirmados; usar la duración actualmente configurada al reprogramar). PB-01 quedó resuelta en C-07/C-08/C-09. Las tablas siguientes identifican los alcances y pendientes restantes. Consultar las actualizaciones en `knowledge-base/10_preguntas_abiertas.md`.

| Pendiente | Resolver antes de | Límite que debe quedar explícito |
|---|---|---|
| PB-04 | C-02 para esquema de pacientes y C-08 | Crear/reutilizar, validar y corregir; no añadir unicidad natural, fusión ni sobrescritura automática por DNI/email. |
| PB-06 | Resuelta para C-14 el 2026-11-25 a pedido de Santiago, basada en la regla vigente de contacto directo con el odontólogo. | Ante `409 MANAGEMENT_WINDOW_CLOSED`, el paciente contacta al odontólogo del consultorio por su canal habitual fuera de la app. La app no publica ni configura teléfono/email, no ofrece alta manual ni excepciones. Ver [C-14 archivado](openspec/changes/archive/2026-11-25-autogestion-paciente-web/design.md#d-04-errores-y-contacto-fuera-del-plazo). |
| PB-07 | C-14 consume el contrato resuelto en C-04/C-09 | Vigencia, invalidación, datos visibles y recuperación; sin cuenta ni verificación previa obligatoria del email. El email recuperado solo se usa internamente para avisos futuros; no se expone en respuestas HTTP. |
| PB-08 | C-05, C-08 y C-09 | Repeticiones, resultados inciertos y cambios simultáneos; no inferir reactivación de cancelados. |
| PB-09 | C-05 y C-11 | Confirmación y recordatorio al reservar exactamente a 24 horas. |
| PB-10, PB-11 | C-04/C-05 para el contrato durable, C-08/C-09 para respuestas y C-11 para envío | Tolerancias, reintentos, eventos únicos, avisos obsoletos, envío en curso y SMTP incierto; persistencia no garantiza entrega exactamente una vez. |
| PB-12 | Antes de datos reales | Conservación, corrección, eliminación y recuperación; no bloquea documentar ni demostrar con datos ficticios, no habilita borrado automático. |

| Pendiente técnico | Changes afectados y condición |
|---|---|
| AT-01 / PT-05 | C-01 fija compatibilidad y versiones tras verificarlas en fuentes oficiales; C-16 verifica el empaquetado. |
| AT-02 / PT-01 | C-02 implementó el modelo inicial y sus restricciones con Spring JDBC y Flyway. C-04 y C-05 añadirán sus entidades. |
| AT-03 / PT-04 | C-03 resolvió y verificó el acceso interno con aprobación CRITICAL. La credencial de pacientes sigue en C-04. |
| AT-04 / PT-04 | C-04: material de credencial y correo recuperable tras reiniciar; aprobación de código CRITICAL separada. |
| AT-05 / PT-02 | C-02 implementó el bloqueo por agenda con relectura posterior y exclusión de turnos superpuestos. C-06, C-08 y C-09 lo aplican y prueban en sus operaciones. |
| AT-06 / PT-03 | C-05 y C-11: contrato de intención persistida y coordinación con cambios concurrentes; C-04 acuerda cómo reconstruir los enlaces. |
| AT-07 / SU-03 | C-11: elegir y habilitar SMTP/remitente/destinatarios; verificar condiciones oficiales y recepción. No contratar ni solicitar secretos en el chat. |
| AT-08 | C-01/C-02: URL, puertos, escucha y zona consistentes; C-04/C-11 construyen enlaces con ese contrato y C-16 lo verifica. |
| AT-09 | Fuera de esta entrega ficticia; requisito previo a un piloto con datos reales. |
| AT-10 / PT-06 | C-01 propone herramientas; C-08/C-09/C-11 prueban riesgos y C-16 conserva evidencia. No hay herramienta adicional seleccionada por este roadmap. |
| AT-11 | Resuelto en su política: `off`, por instrucción del usuario del 2026-11-19. No se exige sistema visual ni mockups para C-12 a C-15. |

---

## Árbol de dependencias

El árbol muestra la rama principal de cada change; `+` enumera sus otras dependencias directas. El cuadro posterior es la referencia exacta para programar el trabajo; no se usa la apariencia del árbol para omitir un prerequisito.

```text
C-01 foundation-setup
└── C-02 core-models
    ├── C-03 acceso-interno-odontologo
    │   └── C-06 configuracion-disponibilidad-api (+ C-02)
    │       ├── C-07 consulta-disponibilidad-api
    │       │   └── C-08 reserva-confirmada-api (+ C-04, C-05)
    │       │       ├── C-09 autogestion-turnos-api
    │       │       │   ├── C-11 envio-email-recordatorios (+ C-05)
    │       │       │   └── C-14 autogestion-paciente-web
    │       │       ├── C-10 consulta-agenda-api (+ C-03)
    │       │       │   └── C-15 agenda-odontologo-web (+ C-12)
    │       │       └── C-13 reserva-paciente-web
    │       └── C-12 acceso-configuracion-web (+ C-03)
    └── C-04 credenciales-gestion-turno
        └── C-05 intenciones-notificacion

C-11 + C-12 + C-13 + C-14 + C-15
└── C-16 entrega-local-verificacion
```

| Change | Dependencias directas |
|---|---|
| C-01 | Ninguna |
| C-02 | C-01 |
| C-03 | C-02 |
| C-04 | C-02 |
| C-05 | C-04 |
| C-06 | C-02, C-03 |
| C-07 | C-06 |
| C-08 | C-04, C-05, C-07 |
| C-09 | C-08 |
| C-10 | C-03, C-08 |
| C-11 | C-05, C-09 |
| C-12 | C-03, C-06 |
| C-13 | C-08 |
| C-14 | C-09 |
| C-15 | C-10, C-12 |
| C-16 | C-11, C-12, C-13, C-14, C-15 |

C-06/C-07 pueden desarrollarse mientras se implementa el contrato durable de C-04/C-05, pero ninguna reserva de C-08 se publica sin credencial e intención de aviso. C-09 consume la disponibilidad de C-07 y las capacidades de C-04/C-05 por la dependencia transitiva de C-08. C-10 no necesita esperar C-09: consulta estados/intervalos del modelo y después se verifica sobre cambios reales en C-16.

### Paralelismo por fase

Son posibilidades de trabajo, no ejecuciones autorizadas. Cada gate requiere completar sus prerequisitos y resolver las decisiones del change; las aprobaciones HIGH/CRITICAL siguen vigentes.

```text
GATE 0: proyecto documentado; infraestructura todavía pendiente
  → C-01 foundation-setup                         [Agente A]

GATE 1: C-01 ✓
  → C-02 core-models                              [Agente A]

GATE 2: C-02 ✓ — primer fork
  → C-03 acceso-interno-odontologo                [Agente A]
  → C-04 credenciales-gestion-turno               [Agente B]

GATE 3: ramas con dependencias independientes
  → C-06 configuracion-disponibilidad-api         [Agente A — C-02 y C-03 ✓]
  → C-05 intenciones-notificacion                 [Agente B — C-04 ✓]

GATE 4: C-06 ✓
  → C-07 consulta-disponibilidad-api              [Agente A]
  → C-12 acceso-configuracion-web                 [Agente C — C-03 ✓]
  → C-05 si aún no terminó                        [Agente B — C-04 ✓]

GATE 5: C-04, C-05 y C-07 ✓
  → C-08 reserva-confirmada-api                   [Agente A]

GATE 6: C-08 ✓ ← FORK
  → C-09 autogestion-turnos-api                   [Agente A]
  → C-10 consulta-agenda-api                      [Agente B — C-03 ✓]
  → C-13 reserva-paciente-web                     [Agente C]

GATE 7: C-09 y C-10 ✓ ← FORK
  → C-11 envio-email-recordatorios               [Agente B — C-05 ✓]
  → C-14 autogestion-paciente-web                 [Agente C]
  → C-15 agenda-odontologo-web                    [Agente C — C-12 ✓; después de C-14 si está ocupado]

GATE 8: C-11, C-12, C-13, C-14 y C-15 ✓
  → C-16 entrega-local-verificacion              [Agente A; revisión de B y C]
```

Compartir el esquema y acordar contratos antes de bifurcar. C-03/C-04 deben coordinar archivos de seguridad y esquema; las migraciones de cada rama tienen identificadores únicos acordados, sin inventar aquí una convención numérica. Asignar propiedad de archivos y sincronizar cambios compartidos antes de integrar; paralelismo de capacidades no elimina conflictos de edición.

### Camino crítico (9 changes — mínimo irreducible de precedencias)

Con duración unitaria por change, una cadena máxima de dependencias hasta el cierre es:

`C-01 → C-02 → C-03 → C-06 → C-07 → C-08 → C-09 → C-11 → C-16`.

También tienen nueve nodos las variantes que pasan de C-09 a C-14, o de C-08 a C-10 y C-15, antes de C-16. Se llama crítico a la cadena **más larga** de precedencias; una cadena más corta por otra rama no acredita la entrega porque omite prerequisitos de los joins. Los **16 changes son necesarios** para el alcance descrito; C-03, C-04, todas las pantallas y el correo real siguen siendo obligatorios aunque no aparezcan en una cadena concreta. No hay refactor visual ni dashboard opcional agregado.

Sin estimaciones de duración ni tiempos de revisión, este cálculo no es un compromiso de calendario. La capacidad de tres agentes agrega restricciones: en la propuesta siguiente hay diez pasos porque C-14 y C-15 comparten Agente C. El plazo real depende además de AP-03, decisiones PB/AT y habilitación de SMTP.

### Plan óptimo con 3 agentes

Propuesta de distribución por especialidad, sin afirmar optimalidad temporal antes de estimar. Cada celda se inicia después de completar el paso anterior y sus aprobaciones. No se lanzaron estos agentes ni se implementaron changes al generar el plan.

| Paso | Agente A (Backend Core) | Agente B (Backend Aux) | Agente C (Frontend) |
|---|---|---|---|
| 1 | C-01 | — | — |
| 2 | C-02 | — | — |
| 3 | C-03 | C-04 | — |
| 4 | C-06 | C-05 | — |
| 5 | C-07 | — | C-12 |
| 6 | C-08 | — | — |
| 7 | C-09 | C-10 | C-13 |
| 8 | — | C-11 | C-14 |
| 9 | — | — | C-15 |
| 10 | C-16 | Revisión de correo y reinicio en C-16 | Recorrido de navegador en C-16 |

Un solo agente puede seguir el orden topológico del cuadro de dependencias; la tabla de tres agentes no es requisito del producto. No se necesitan cambios extra para llenar tiempos ociosos.

---

## FASE 1 — Entorno local y modelo persistente

### [C-01] `foundation-setup`

- **Estado**: `[x]` completado y archivado el 2026-11-22. [Archivo](openspec/changes/archive/2026-11-22-foundation-setup/proposal.md), [21/21 tareas](openspec/changes/archive/2026-11-22-foundation-setup/tasks.md) y [comprobaciones](openspec/changes/archive/2026-11-22-foundation-setup/verification.md). El usuario autorizó omitir el contrato incompleto de evidencia SDD y sustituir la reproducción humana adicional por reproducción propia; se conservaron las revisiones independientes ya realizadas.
- **Scope**:
  - Verificar y proponer versiones estables compatibles del stack aprobado, DSL de Gradle, acceso a datos, herramienta de migración y herramientas de prueba; cerrar AT-01 y el contrato inicial de AT-02/AT-08/AT-10 antes de generar configuración.
  - Crear estructura backend/frontend, Gradle Wrapper y archivos de bloqueo; preparar compilación de Spring Boot y React/TypeScript/Vite sin incorporar bibliotecas de calendario o componentes por omisión.
  - Preparar contrato de entorno local, conexión a base de prueba, proxy de desarrollo y plantilla sin secretos. Presentar para revisión URL, puertos, escucha y cualquier configuración que afecte datos antes de escribirla; no editar dotfiles ni instalar servicios globales.
  - Verificar build y conexión a PostgreSQL local sin publicar endpoints de negocio ni cargar datos sobre una base existente. El empaquetado integrado definitivo se comprueba en C-16. No seleccionar una zona del consultorio a partir de la zona de la computadora.
- **Dependencias**: ninguna.
- **Governance**: ALTO — configuración de persistencia/entorno; propuesta revisable antes de escribir los archivos afectados. Este roadmap no es esa revisión.
- **Leer antes**:
  - `knowledge-base/01_vision_y_objetivos.md` §Entorno y restricciones.
  - `knowledge-base/02_descripcion_general.md` §Stack tecnológico y §Ejecución local acordada.
  - `knowledge-base/08_arquitectura_propuesta.md` §Variables de entorno y §Compilación, ejecución y verificación.
  - `knowledge-base/10_preguntas_abiertas.md` §Preguntas técnicas abiertas (AT-01, AT-02, AT-08, AT-10).

### [C-02] `core-models`

- **Estado**: `[x]` completado y archivado el 2026-11-22. [Diseño](openspec/changes/archive/2026-11-22-core-models/design.md), [22/22 tareas](openspec/changes/archive/2026-11-22-core-models/tasks.md) y [comprobaciones](openspec/changes/archive/2026-11-22-core-models/verification.md). Desbloquea C-03 y C-04.
- **Scope**:
  - Proponer esquema físico, migraciones versionadas e índices para Consultorio, Odontologo, Agenda, MotivoConsulta, FranjaSemanal, BloqueoAgenda, Paciente y Turno. Revisar PB-02/PB-04 y AT-02; las entidades de credencial y aviso se agregan en C-04/C-05.
  - Materializar relaciones, configuración única, UUID, duración reservada y estados `CONFIRMADO`/`CANCELADO`. Definir reloj controlable y tratamiento de instantes, zona persistida e intervalos `[inicio, fin)` sin cerrar por inferencia PB-01/PB-03.
  - Concretar y revisar AT-05/PT-02: protocolo compartido para todas las escrituras de disponibilidad, orden de lecturas/bloqueos, rollback y conflictos. No adoptar bloqueo por agenda o exclusión PostgreSQL sin registrar la decisión y sus pruebas.
  - Preparar inicialización que respete registros existentes, con consultorio/perfil/agenda acordados y ejemplos ficticios optativos; sin contraseña ni enlace fijo. Verificar restricciones e inicialización repetida en PostgreSQL real, sin recrear datos al reiniciar.
- **Dependencias**: C-01.
- **Governance**: ALTO — esquema, migraciones e inicialización de datos sujetos a revisión; no incluye código de autenticación.
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §Tipos y convenciones, §Entidades, §Restricciones e integridad entre entidades y §Seed data inicial.
  - `knowledge-base/05_reglas_de_negocio.md` §Dominio: Consultorio y agenda (RN-CO) y §Dominio: Motivos y disponibilidad (RN-AG).
  - `knowledge-base/08_arquitectura_propuesta.md` §Persistencia y transacciones.
  - `knowledge-base/10_preguntas_abiertas.md` §Preguntas técnicas abiertas (AT-02, AT-05, AT-08).

---

## FASE 2 — Acceso e intenciones durables

### [C-03] `acceso-interno-odontologo`

- **Estado**: `[x]` completado y archivado el 2026-11-22. [Diseño](openspec/changes/archive/2026-11-22-acceso-interno-odontologo/design.md), [11/11 tareas](openspec/changes/archive/2026-11-22-acceso-interno-odontologo/tasks.md) y [comprobaciones](openspec/changes/archive/2026-11-22-acceso-interno-odontologo/verification.md). Desbloquea C-06.
- **Scope**:
  - Analizar AT-03/PT-04 y presentar diseño de alta inicial, ingreso, recuperación, cierre, expiración y efecto del reinicio para el único odontólogo; sin registro público ni cuentas de pacientes.
  - Después de aprobación explícita de código CRITICAL, implementar el mecanismo elegido, proteger familias `/api/odontologo/*` e integrar escrituras del navegador con la protección acordada. Las rutas concretas de acceso se especifican aquí; no se inventan como contrato aprobado en este índice.
  - Spring Security mantiene una sesión en memoria con 30 minutos de inactividad, cookie de sesión y protección CSRF. El alta y la recuperación usan un archivo privado local con un verificador de contraseña.
  - Comprobar llamadas directas sin acceso, cierre y expiración; dejar contrato de frontend para C-12 y de autorización para C-06/C-10. CT-02 y parte de FL-01; US-006 se completa con agenda e interfaz.
- **Dependencias**: C-02.
- **Governance**: CRITICO — análisis permitido; no escribir código de acceso sin aprobación humana explícita, separada de aprobar el roadmap o su diseño.
- **Leer antes**:
  - `knowledge-base/03_actores_y_roles.md` §Rutas internas del odontólogo y §Condiciones de autorización.
  - `knowledge-base/05_reglas_de_negocio.md` §Dominio: Acceso y autorización (RN-AU).
  - `knowledge-base/07_flujos_principales.md` §FL-01 — Acceder como odontólogo y consultar la agenda.
  - `knowledge-base/08_arquitectura_propuesta.md` §Autenticación del odontólogo — propuesta PT-04.
  - `knowledge-base/10_preguntas_abiertas.md` §Preguntas técnicas abiertas (AT-03).

### [C-04] `credenciales-gestion-turno`

- **Estado**: `[x]` completado y archivado el 2026-11-23. [Diseño](openspec/changes/archive/2026-11-23-credenciales-gestion-turno/design.md), [5/5 tareas](openspec/changes/archive/2026-11-23-credenciales-gestion-turno/tasks.md) y [revisión independiente](openspec/changes/archive/2026-11-23-credenciales-gestion-turno/revision-independiente.md).
- **Scope**:
  - Resolver PB-07/AT-04 mediante diseño revisable de credencial limitada a un turno, datos visibles, generación, transporte, almacenamiento, vigencia, invalidación y recuperación. Mantener reserva sin cuenta ni verificación previa de email.
  - Acordar con AT-06/PT-03 cómo conservar el material necesario para construir enlaces en emails pendientes después de reiniciar, sin exponerlos en logs o respuestas públicas. No asumir que guardar solo un verificador permite reconstruir un enlace.
  - Tras autorización explícita de código, materializar CredencialGestion y las capacidades de emisión/validación/invalidación que consumirán C-05/C-08/C-09. El contrato con notificaciones debe definirse antes de implementar C-05, incluyendo las partes aplicables de PB-10/PB-11.
  - Comprobar credencial inválida/vencida, alcance a otro turno e imposibilidad de usar DNI/email/UUID como secreto. Definir transporte y tratamiento de enlaces también en el navegador para C-14. CT-02/CT-03; la consulta completa US-007 llega en C-09/C-14.
- **Dependencias**: C-02.
- **Governance**: CRITICO — diseño y aprobación explícita de código de enlaces; incluye su persistencia sensible.
- **Leer antes**:
  - `knowledge-base/03_actores_y_roles.md` §Autogestión sin cuenta, con enlace privado.
  - `knowledge-base/04_modelo_de_datos.md` §CredencialGestion.
  - `knowledge-base/07_flujos_principales.md` §FL-05 — Abrir el enlace privado de autogestión.
  - `knowledge-base/08_arquitectura_propuesta.md` §Autogestión del paciente — propuesta PT-04.
  - `knowledge-base/10_preguntas_abiertas.md` §Preguntas abiertas de negocio — priorizadas y §Preguntas técnicas abiertas (PB-07, AT-04, AT-06).

### [C-05] `intenciones-notificacion`

- **Estado**: `[x]` completado y archivado el 2026-11-23. [Diseño](openspec/changes/archive/2026-11-23-intenciones-notificacion/design.md), [5/5 tareas](openspec/changes/archive/2026-11-23-intenciones-notificacion/tasks.md) y [revisión independiente compartida](openspec/changes/archive/2026-11-23-credenciales-gestion-turno/revision-independiente.md).
- **Scope**:
  - Resolver el contrato de PB-08 a PB-11 y AT-06/PT-03 para identidad del evento, creación de avisos, destinatario/revisión persistidos, sustitución/anulación y coordinación posterior con el emisor. No decidir tolerancias o reintentos por valores de ejemplo.
  - Añadir Notificacion y capacidades para preparar `CONFIRMACION`, `CAMBIO` y `RECORDATORIO` junto al cambio de turno, según el límite transaccional revisado; no introducir SMTP dentro de esa transacción.
  - Incorporar al contrato el caso exacto de reserva a 24 horas y el material de enlaces acordado en C-04; exponer funciones que C-08/C-09 usarán sin duplicar decisiones. No agregar estados de turno por fallas de correo.
  - Verificar rollback conjunto de cambio/intención y prevención de creación repetida del mismo evento; comprobar que el destinatario guardado no cambia al editar datos de otra entidad. Sin envío real en este change; la entrega se verifica en C-11/C-16.
- **Dependencias**: C-04.
- **Governance**: ALTO — migración/configuración persistente de avisos requiere revisión; lógica de comunicaciones con checkpoints. Material privado reutiliza exclusivamente el mecanismo aprobado de C-04.
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §Notificacion.
  - `knowledge-base/05_reglas_de_negocio.md` §Dominio: Comunicaciones (RN-NO).
  - `knowledge-base/07_flujos_principales.md` §FL-08 — Enviar confirmaciones, cambios y recordatorios.
  - `knowledge-base/08_arquitectura_propuesta.md` §Comunicaciones y recordatorios — PT-03.
  - `knowledge-base/10_preguntas_abiertas.md` §Preguntas abiertas de negocio — priorizadas y §Preguntas técnicas abiertas (PB-08 a PB-11, AT-06).

---

## FASE 3 — Configuración y consulta de disponibilidad

### [C-06] `configuracion-disponibilidad-api`

- **Estado**: `[x]` completado y archivado por OpenSpec; 9/9 tareas.
- **Verificación**: suite unitaria e integración con PostgreSQL real, bootJar, validación estricta de OpenSpec y git diff --check pasaron; evidencia en `openspec/changes/archive/2026-11-24-configuracion-disponibilidad-api/verification.md`.
- **Seguimiento**: `correcciones-c06-configuracion-disponibilidad-api` completado y archivado el 2026-11-24 en [2026-11-24-correcciones-c06-configuracion-disponibilidad-api](openspec/changes/archive/2026-11-24-correcciones-c06-configuracion-disponibilidad-api/proposal.md) (6/6 tareas). Todas las pruebas unitarias, HTTP/PostgreSQL y concurrencia de C-06, `bootJar`, `openspec validate --strict --no-interactive` y `git diff --check` pasaron; en Windows NTFS los tests POSIX preexistentes de C-03/C-04 requieren Linux/WSL.
- **Scope**:
  - Aplicar las decisiones PB-02/PB-03/PB-05 sobre franjas, duraciones y cambios con reservas; implementar US-001/US-002/US-003 en backend mediante las familias orientativas `GET, POST, PUT /api/odontologo/motivos`, `GET, PUT /api/odontologo/horario` y `GET, POST, DELETE /api/odontologo/bloqueos`.
  - Validar nombres/duración, franjas `ATENCION`/`PAUSA` y bloqueos; aplicar autorización de C-03 y protocolo común de escritura de C-02. No incorporar borrado de motivos ni desplazamiento/cancelación automática de turnos.
  - Preservar intervalos y duración reservada de turnos existentes; aplicar la política revisada de conflictos ante cambios simultáneos de disponibilidad y reserva.
  - Verificar los casos de US-001 a US-003 que dependen de reservas mediante fixtures ficticios en PostgreSQL y concurrencia sincronizada; registrar qué criterios esperan interfaz y recorrido completo en C-16.
- **Dependencias**: C-02, C-03.
- **Governance**: MEDIO — reglas de negocio con checkpoints; no modifica controles de seguridad ni configuración de instalación.
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §MotivoConsulta, §FranjaSemanal y §BloqueoAgenda.
  - `knowledge-base/05_reglas_de_negocio.md` §Dominio: Motivos y disponibilidad (RN-AG).
  - `knowledge-base/06_funcionalidades.md` §Épica 1: Configuración de disponibilidad.
  - `knowledge-base/07_flujos_principales.md` §FL-02 — Configurar motivos, horario, pausas y bloqueos.
  - `knowledge-base/08_arquitectura_propuesta.md` §Control de concurrencia propuesto — PT-02.

### [C-07] `consulta-disponibilidad-api`

- **Estado**: `[x]` completado y archivado el 2026-11-24 en [2026-11-24-consulta-disponibilidad-api](openspec/changes/archive/2026-11-24-consulta-disponibilidad-api/proposal.md); 6/6 tareas. PB-01 resuelta el 2026-11-24 (24 h inclusivo, 30 días calendario inclusivo en zona del consultorio). Verificado con `AvailabilityRulesTest`, `PublicAvailabilityControllerTest`, `PublicAvailabilityIntegrationTest` (PostgreSQL 17.12), `bootJar` y `openspec validate --strict --no-interactive`.
- **Scope**:
  - Resolver PB-01 y precisar entradas/salidas de `GET /api/public/motivos` y `GET /api/public/disponibilidad` a partir del mapa orientativo de la KB; consumir las reglas PB-02/PB-03 ya definidas en C-06.
  - Implementar US-004 calculando el intervalo completo por duración, horario, pausas, bloqueos, ocupación confirmada, zona y ventana de 24 horas a 30 días; conservar intervalos contiguos permitidos y reloj controlable.
  - Devolver únicamente opciones de reserva, sin datos de pacientes ni detalles de citas ocupadas; sin retención del horario. Seguir RN-AU-01 y revisar como CRITICAL cualquier control de seguridad nuevo que hiciera falta; C-07 no implementa el mecanismo de enlaces de C-04.
  - Comprobar bordes temporales acordados, turnos parcialmente superpuestos, pausas/bloqueos y período vacío/error de consulta; usar fixtures de Turno para demostrar ocupación antes de C-08. La pantalla llega en C-13.
- **Dependencias**: C-06.
- **Governance**: MEDIO — cálculo de disponibilidad; ninguna nueva política de acceso queda aprobada por este alcance.
- **Leer antes**:
  - `knowledge-base/02_descripcion_general.md` §API REST propuesta.
  - `knowledge-base/04_modelo_de_datos.md` §Tipos y convenciones y §Restricciones e integridad entre entidades.
  - `knowledge-base/05_reglas_de_negocio.md` §Dominio: Motivos y disponibilidad (RN-AG) y §Dominio: Reserva y confirmación (RN-RE).
  - `knowledge-base/06_funcionalidades.md` §US-004 — Consultar horarios disponibles.
  - `knowledge-base/07_flujos_principales.md` §FL-03 — Consultar motivos y disponibilidad.

---

## FASE 4 — Reserva, autogestión y comunicaciones

### [C-08] `reserva-confirmada-api`

- **Estado**: `[x]` completado y archivado el 2026-11-24 en [2026-11-24-reserva-confirmada-api](openspec/changes/archive/2026-11-24-reserva-confirmada-api/proposal.md); 6/6 tareas. PB-04 (reutilización exacta de 5 campos), PB-08 (sin idempotencia; `409 SLOT_UNAVAILABLE` ante solapamiento) y PB-10 (`notificacionEstado: "PENDIENTE"` en `201 Created`) aplicadas según aprobación del usuario del 2026-11-24. Verificado con `AvailabilityRulesTest`, `PublicBookingControllerTest`, `PublicBookingIntegrationTest` (PostgreSQL 17.12), `bootJar` y `openspec validate --strict --no-interactive`.
- **Scope**:
  - Resolver partes aplicables de PB-01/PB-04/PB-08/PB-10; consumir PB-02/PB-03 definidas en C-06; precisar `POST /api/public/turnos` con nombre, apellido, email, teléfono y DNI obligatorios, entradas/salidas y resultado de conflicto o solicitud incierta.
  - Implementar US-005/FL-04: validar nuevamente motivo, referencias, tiempo y disponibilidad después de adquirir la coordinación de escritura; persistir paciente según política, Turno `CONFIRMADO`, duración reservada, credencial e intención de confirmación/recordatorio conforme a C-02/C-04/C-05.
  - No sobrescribir ni divulgar registros por coincidir DNI/email, no exigir cuenta o verificación previa y no cancelar por inferencia ante falla SMTP. Consumir los mecanismos de seguridad aprobados sin modificarlos.
  - Comprobar reservas simultáneas con intervalos iguales y parcialmente solapados mediante solicitudes sincronizadas contra PostgreSQL real: como máximo una confirmada, rollback sin turno parcial y resultado observable del perdedor. Incluir carrera con cambio de bloqueo/configuración y repetición según PB-08. CT-01/CT-03; email real US-010 se completa en C-11.
- **Dependencias**: C-04, C-05, C-07.
- **Governance**: MEDIO — transacción y reglas con checkpoints; las dependencias CRITICAL deben estar previamente aprobadas e implementadas.
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §Paciente, §Turno y §Restricciones e integridad entre entidades.
  - `knowledge-base/05_reglas_de_negocio.md` §Dominio: Pacientes y datos básicos (RN-PA) y §Dominio: Reserva y confirmación (RN-RE).
  - `knowledge-base/06_funcionalidades.md` §US-005 — Reservar con confirmación automática y §US-010 — Recibir confirmación y enlaces por email.
  - `knowledge-base/07_flujos_principales.md` §FL-04 — Reservar y originar la confirmación por email.
  - `knowledge-base/08_arquitectura_propuesta.md` §Persistencia y transacciones.

### [C-09] `autogestion-turnos-api`

- **Estado**: `[x]` implementación, correcciones y verificación de C-09 completadas y archivadas el 2026-11-25. Fernando aprobó explícitamente —según informó Santiago el 2026-11-25 y quedó registrado junto con la pregunta exacta— que `CredencialesGestion.validar` entregue internamente a C-09 el email confirmado en la recuperación asistida únicamente para preparar avisos futuros. No se expone en HTTP ni se modifica el email del paciente o el historial de envíos. Ver [registro de gobernanza y verificación C-09](openspec/changes/archive/2026-11-25-correcciones-c09-autogestion-turnos-api/verification.md). Pasaron 20/20 pruebas unitarias focalizadas, 8/8 integraciones con PostgreSQL 17.12, `bootJar` y validación estricta de la especificación. La disputa de AG-05 por el mismo horario también está verificada. PB-06 conserva `409 MANAGEMENT_WINDOW_CLOSED`; C-14 indica contacto directo con el odontólogo por el canal habitual externo, sin alta manual ni excepción. C-11 registra el estado de SMTP. La suite completa, incluidas las pruebas POSIX, pasó en Linux durante la [verificación de C-16](openspec/changes/archive/2026-11-26-entrega-local-verificacion/verification.md).
- **Scope**:
  - Precisar contratos orientativos `GET /api/gestion/turno`, `POST /api/gestion/turno/cancelacion` y `POST /api/gestion/turno/reprogramacion`; resolver PB-01/PB-07 y PB-08 aplicables; conservar `409 MANAGEMENT_WINDOW_CLOSED`. PB-06 se resuelve para C-14 con contacto directo externo al odontólogo por el canal habitual del consultorio, sin canal específico ni alta manual en la app. Usar PB-05 ya definida en C-06.
  - Implementar consulta limitada de US-007 y operaciones de US-008/US-009 consumiendo validación de C-04. Abrir/previsualizar el enlace solo consulta; cancelación y reprogramación requieren escritura expresa, autorización y plazo vigentes.
  - Cancelar sin borrado físico; reprogramar conservando identificador y estado `CONFIRMADO`, con nuevo intervalo y revisión. Coordinar intención de aviso y recordatorio según C-05; el original debe conservarse ante cualquier rechazo o fallo del cambio.
  - Verificar plazo, rechazo `409 MANAGEMENT_WINDOW_CLOSED`, destino ocupado, fallo transaccional, cambios simultáneos/repetidos y disputa por el nuevo intervalo. La integración PostgreSQL real de C-09 comprobó que el turno perdedor conserva intervalo, revisión, credencial e intenciones. No se agrega contacto fuera de plazo ni excepción manual. Fernando aprobó el uso interno del email recuperado para avisos futuros; ver la pregunta y respuesta registradas en el informe de verificación. CT-01 y FL-05/FL-06/FL-07.
- **Dependencias**: C-08.
- **Governance**: MEDIO — estados y reglas con checkpoints; no autoriza cambiar generación/transporte/validación de enlaces de C-04.
- **Leer antes**:
  - `knowledge-base/03_actores_y_roles.md` §Autogestión sin cuenta, con enlace privado y §Condiciones de autorización.
  - `knowledge-base/04_modelo_de_datos.md` §Turno y §Restricciones e integridad entre entidades.
  - `knowledge-base/05_reglas_de_negocio.md` §Dominio: Cancelación (RN-CA) y §Dominio: Reprogramación (RN-RP).
  - `knowledge-base/06_funcionalidades.md` §Épica 4: Autogestión del turno por enlace.
  - `knowledge-base/07_flujos_principales.md` §FL-05 — Abrir el enlace privado de autogestión, §FL-06 — Cancelar por autogestión y §FL-07 — Reprogramar sin perder el turno original ante fallo.

### [C-10] `consulta-agenda-api`

- **Estado**: `[x]` completado y archivado el 2026-11-24. [Propuesta](openspec/changes/archive/2026-11-24-consulta-agenda-api/proposal.md), [6/6 tareas](openspec/changes/archive/2026-11-24-consulta-agenda-api/tasks.md), [verificación](openspec/changes/archive/2026-11-24-consulta-agenda-api/verification.md) y [seguimiento de validación estricta](openspec/changes/archive/2026-11-24-correcciones-c10-validacion-parametros/verification.md). Verificado en Windows con 9/9 `DentistAgendaServiceTest`, 21/21 `DentistAgendaControllerTest`, `compileIntegrationTestJava`, `bootJar`, `openspec validate --strict` y `git diff --check`; las dos integraciones de `DentistAgendaIntegrationTest` pasaron después con PostgreSQL 17.12 en Linux. [Evidencia integrada](openspec/changes/archive/2026-11-26-c14-reapertura-enlace-misma-credencial/verification.md#backend). Desbloquea C-15.
- **Scope**:
  - Precisar `GET /api/odontologo/agenda` y `GET /api/odontologo/turnos/{id}` para US-006: filtros día/semana en zona acordada, datos mínimos de turno y los cinco datos básicos del paciente.
  - Consultar exclusivamente la agenda única usando el acceso previamente implementado en C-03; sin directorio público, historia clínica, edición de pacientes ni alta manual.
  - Mostrar estados/intervalos persistidos y distinguir una consulta fallida de una agenda vacía. Probar períodos y zona, y llamada directa sin acceso conforme al contrato existente; la actualización tras C-09 se verifica con datos reales de prueba en C-16.
- **Dependencias**: C-03, C-08.
- **Governance**: BAJO — consulta acotada usando autorización existente; cualquier modificación de seguridad queda fuera y exige revisión CRITICAL.
- **Leer antes**:
  - `knowledge-base/03_actores_y_roles.md` §Rutas internas del odontólogo.
  - `knowledge-base/04_modelo_de_datos.md` §Paciente y §Turno.
  - `knowledge-base/06_funcionalidades.md` §US-006 — Consultar agenda y datos básicos de turnos.
  - `knowledge-base/07_flujos_principales.md` §FL-01 — Acceder como odontólogo y consultar la agenda.

### [C-11] `envio-email-recordatorios`

- **Estado** `[x]` archivado el 2026-11-26, con 7/7 tareas registradas. Se conserva la recepción histórica y se verificaron el build y las regresiones locales. Fernando autorizó cerrar 4.1 con la campaña de Gmail sobre el JAR integrado diferida a `CORRECCIONES.md`. [Verificación de C-11](openspec/changes/archive/2026-11-26-envio-email-recordatorios/verification.md).
- **Scope**:
  - Resolver AT-07: proponer proveedor/cuenta, remitente y destinatarios habilitados; verificar condiciones oficiales gratuitas al elegirlos. Revisar configuración SMTP, tiempos finitos y secretos aportados por canal local; no crear cuentas, contratar ni enviar desde esta fase de roadmap.
  - Implementar US-010/US-011/US-012 y FL-08: componer confirmación con enlaces, cambio por cancelación, cambio por reprogramación y recordatorio 24 horas antes; emisor/tarea internos consumen intenciones durables y la política PB-09/PB-10/PB-11 acordada.
  - Persistir intentos y resultados conocidos, diferenciando `ACEPTADA_SMTP` de recepción. Aplicar política de reinicio, vencidos, errores e incertidumbre tras aceptación SMTP antes de registrar resultado; sin prometer exactamente una entrega.
  - Coordinar cambio de turno con envío en curso conforme al diseño AT-06; una lectura de revisión antes de SMTP no basta. Probar cancelación/reprogramación coincidente con emisión, avisos obsoletos, resultados inciertos y reserva exacta a 24 horas según política. No retener bloqueo de agenda durante SMTP sin decisión expresa.
  - Con autorización de destinatarios y envío cuando se implemente, comprobar recepción real de cada uno de los cuatro casos y apertura local de enlaces; usar reloj controlado para recordatorio sin alterar la regla de producción. Registrar evidencia de FL-08/FL-09 y casos pendientes para C-16.
- **Dependencias**: C-05, C-09.
- **Governance**: ALTO — configuración SMTP/destinatarios y estado persistente bajo revisión; cualquier modificación del mecanismo de secretos o enlaces exige aprobación CRITICAL específica.
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §Notificacion.
  - `knowledge-base/05_reglas_de_negocio.md` §Dominio: Comunicaciones (RN-NO).
  - `knowledge-base/06_funcionalidades.md` §Épica 5: Comunicaciones por email.
  - `knowledge-base/07_flujos_principales.md` §FL-08 — Enviar confirmaciones, cambios y recordatorios y §FL-09 — Retomar la operación local tras un reinicio.
  - `knowledge-base/08_arquitectura_propuesta.md` §Comunicaciones y recordatorios — PT-03.

---

## FASE 5 — Pantallas funcionales del MVP

> Política visual `off`: estas pantallas se implementan sin sistema de diseño ni gate de mockups. Las comprobaciones funcionales, de accesibilidad básica y de errores en navegador siguen siendo parte de la verificación. No se crea una marca ni se añade una librería visual sin justificarla.

### [C-12] `acceso-configuracion-web`

- **Estado**: `[x]` completado y archivado el 2026-11-24. [Diseño](openspec/changes/archive/2026-11-24-acceso-configuracion-web/design.md), [9/9 tareas](openspec/changes/archive/2026-11-24-acceso-configuracion-web/tasks.md), [verificación](openspec/changes/archive/2026-11-24-acceso-configuracion-web/verification.md), [seguimiento de revisión de PR](openspec/changes/archive/2026-11-24-correcciones-c12-acceso-configuracion-web/verification.md) y [seguimiento de horario](openspec/changes/archive/2026-11-24-correcciones-c12-horario-concurrencia-precision/verification.md). También se verificó el recorrido autenticado sobre el JAR y PostgreSQL en Chromium en C-16. En Windows habían pasado 42/42 pruebas de Vitest/RTL, build, proxy `/api` en vivo y visualización de ingreso. [Verificación de C-16](openspec/changes/archive/2026-11-26-entrega-local-verificacion/verification.md).
- **Scope**:
  - Implementar pantalla de ingreso/cierre conforme al contrato de C-03 y formularios de motivos, duraciones, horario semanal, pausas y bloqueos consumiendo C-06. Cubrir interfaz de US-001 a US-003 y la entrada a FL-01.
  - Integrar manejo de sesión/CSRF según el mecanismo aprobado, sin nuevas políticas ni desactivación global de controles; revisar explícitamente el código de integración de acceso antes de escribirlo.
  - Mostrar validaciones, conflictos con turnos, carga, fallo de consulta y pérdida de acceso. Verificar navegación local con teclado y en tamaños de pantalla pequeño/grande; no asumir éxito si no se guardó el cambio.
- **Dependencias**: C-03, C-06.
- **Governance**: CRITICO — integración frontend del acceso requiere aprobación explícita de código; formularios de negocio se implementan dentro de ese alcance revisado.
- **Leer antes**:
  - `knowledge-base/03_actores_y_roles.md` §Condiciones de autorización.
  - `knowledge-base/06_funcionalidades.md` §Épica 1: Configuración de disponibilidad.
  - `knowledge-base/07_flujos_principales.md` §FL-01 — Acceder como odontólogo y consultar la agenda y §FL-02 — Configurar motivos, horario, pausas y bloqueos.
  - `knowledge-base/08_arquitectura_propuesta.md` §Autenticación del odontólogo — propuesta PT-04.

### [C-13] `reserva-paciente-web`

- **Estado**: `[x]` completado y archivado el 2026-11-25 en [2026-11-25-reserva-paciente-web](openspec/changes/archive/2026-11-25-reserva-paciente-web/proposal.md); 5/5 tareas y [verificación](openspec/changes/archive/2026-11-25-reserva-paciente-web/verification.md). Verificado con 9/9 archivos (51/51 tests Vitest/RTL), `tsc -b` estricto (`TS-01`), `vite build`, `openspec validate --all --strict --no-interactive` y `git diff --check`. C-16 verificó la reserva con el frontend servido por Spring Boot. La comprobación del correo real queda diferida en su matriz de aceptación.
- **Scope**:
  - Crear recorrido React de motivo/período/horario, formulario de los cinco datos obligatorios y resultado de reserva, consumiendo C-07/C-08; interfaz de US-004/US-005 y resultado de US-010.
  - Mantener acceso sin cuenta y sin verificación previa. Mostrar indisponibilidad, conflicto concurrente, validación y resultado incierto de acuerdo al backend, evitando presentar como libre o confirmado un resultado que no se obtuvo.
  - Informar por separado estado conocido de reserva y situación del correo conforme PB-10; sin prometer recepción por recibir una respuesta HTTP. Comprobar recorrido local, doble solicitud según PB-08 y navegación en pantalla pequeña/grande con teclado.
- **Dependencias**: C-08.
- **Governance**: MEDIO — flujo de reserva y tratamiento de resultados con checkpoints; consume las respuestas públicas aprobadas.
- **Leer antes**:
  - `knowledge-base/01_vision_y_objetivos.md` §Reserva y autogestión y §Comunicaciones.
  - `knowledge-base/02_descripcion_general.md` §API REST propuesta.
  - `knowledge-base/06_funcionalidades.md` §Épica 2: Reserva web del paciente y §US-010 — Recibir confirmación y enlaces por email.
  - `knowledge-base/07_flujos_principales.md` §FL-03 — Consultar motivos y disponibilidad y §FL-04 — Reservar y originar la confirmación por email.

### [C-14] `autogestion-paciente-web`

- **Estado** `[x]` implementación base archivada el 2026-11-25 con 13/13 tareas. El seguimiento de reapertura, integrado en `09ed228` junto con C-15 y C-11, se archivó el 2026-11-26 con 10/10 tareas registradas. Pasaron 109 pruebas de frontend, 125 unitarias, 60 integraciones con PostgreSQL y la reapertura en Chromium a dos tamaños. Fernando informó la verificación manual de Windows y autorizó diferir la apertura desde Gmail. PB-06 conserva el contacto directo externo con el odontólogo. [Implementación base](openspec/changes/archive/2026-11-25-autogestion-paciente-web/proposal.md) · [Verificación del seguimiento](openspec/changes/archive/2026-11-26-c14-reapertura-enlace-misma-credencial/verification.md).
- **Scope**:
  - Implementar apertura de enlace, consulta mínima del turno, solicitud expresa de cancelación y elección/confirmación de nuevo horario; consumir C-04/C-09 sin mutaciones al cargar o previsualizar.
  - Integrar transporte y manejo de material privado exclusivamente conforme al contrato revisado de C-04. La aprobación explícita del código CRITICAL quedó registrada el 2026-11-25; no guardar enlaces en logs ni añadir persistencia de credenciales por conveniencia.
  - Consultar horarios únicamente para el motivo del turno autorizado mediante el contrato protegido aprobado; no aceptar `motivoId` elegido por el cliente ni ampliar los datos de `GET /api/gestion/turno`.
  - Mostrar enlace inválido/vencido, destino ocupado y original conservado si falla; para `409 MANAGEMENT_WINDOW_CLOSED`, conservar el rechazo y orientar al paciente a contactar directamente al odontólogo por el canal habitual externo del consultorio. No publicar teléfono/email ni ofrecer alta manual o excepciones. Recuperación según PB-07, sin agregar cuenta o verificación previa.
  - Verificar US-007/US-008/US-009, teclado y pantallas pequeña/grande sin solicitar mockups. Queda pendiente abrir el enlace desde el mensaje recibido de C-11 y confirmar que la previsualización no modifica el turno con C-14 integrada; registrar esa evidencia en C-16 sin sustituirla por una URL local.
- **Dependencias**: C-09.
- **Governance**: CRITICO — manejo frontend de credenciales/enlaces y datos protegidos; aprobación de código registrada por Santiago el 2026-11-25 en [design.md archivado](openspec/changes/archive/2026-11-25-autogestion-paciente-web/design.md).
- **Leer antes**:
  - `knowledge-base/03_actores_y_roles.md` §Autogestión sin cuenta, con enlace privado.
  - `knowledge-base/06_funcionalidades.md` §Épica 4: Autogestión del turno por enlace.
  - `knowledge-base/07_flujos_principales.md` §FL-05 — Abrir el enlace privado de autogestión, §FL-06 — Cancelar por autogestión y §FL-07 — Reprogramar sin perder el turno original ante fallo.
  - `knowledge-base/08_arquitectura_propuesta.md` §Autogestión del paciente — propuesta PT-04.

### [C-15] `agenda-odontologo-web`

- **Estado**: `[x]` completado y archivado el 2026-11-25 en [2026-11-25-agenda-odontologo-web](openspec/changes/archive/2026-11-25-agenda-odontologo-web/proposal.md); 6/6 tareas, [verificación](openspec/changes/archive/2026-11-25-agenda-odontologo-web/verification.md), [seguimiento de correcciones](openspec/changes/archive/2026-11-25-correcciones-c15-agenda-odontologo-web/verification.md) y [seguimiento de fecha inválida en concurrencia](openspec/changes/archive/2026-11-25-correcciones-c15-fecha-invalida-concurrencia/verification.md). Verificado en Windows con 10/10 archivos (84/84 tests Vitest/RTL), `tsc -b` estricto (`TS-01`), `vite build` y Chromium headless (`msedge.exe`) a `390×844` y `1440×900` (cambio de período, agenda vacía, apellido de 100 caracteres sin espacios con detalle abierto y cerrado, revisión `0` y `2`, y navegación por teclado sin desbordamiento horizontal ni errores de consola). El recorrido autenticado de día, semana y detalle se verificó luego sobre el JAR y PostgreSQL en Chromium. [Verificación de C-16](openspec/changes/archive/2026-11-26-entrega-local-verificacion/verification.md).
- **Scope**:
  - Crear consulta diaria/semanal y detalle de turno de US-006 sobre C-10, con motivo, intervalo, estado y cinco datos básicos; reutilizar la integración de acceso frontend de C-12 y la zona acordada, sin edición de pacientes ni botones de operaciones manuales pendientes.
  - Diferenciar agenda vacía, carga, error y acceso no válido; actualizar la información tras consultar nuevamente cambios persistidos, sin añadir WebSocket ni tiempo real obligatorio.
  - Comprobar día/semana, detalle y estados cancelados/reprogramados con fixtures o turnos creados por los flujos; verificar legibilidad y navegación local pequeña/grande. La protección real de la API se verifica en C-03/C-10/C-16, no por ocultar esta pantalla.
- **Dependencias**: C-10, C-12.
- **Governance**: BAJO — interfaz de consulta sobre mecanismos de acceso existentes; no incluye cambios en autenticación/autorización.
- **Leer antes**:
  - `knowledge-base/03_actores_y_roles.md` §RBAC — Matriz de permisos.
  - `knowledge-base/04_modelo_de_datos.md` §Paciente y §Turno.
  - `knowledge-base/06_funcionalidades.md` §US-006 — Consultar agenda y datos básicos de turnos.
  - `knowledge-base/07_flujos_principales.md` §FL-01 — Acceder como odontólogo y consultar la agenda.

---

## FASE 6 — Empaquetado y aceptación local

### [C-16] `entrega-local-verificacion`

- **Estado** `[x]` implementado y archivado el 2026-11-26, con 9/9 tareas. El JAR integrado, las regresiones con PostgreSQL 17.12, los recorridos en Chromium y el reinicio cuentan con reproducción independiente bajo la excepción aprobada por Fernando. La aceptación integrada por Gmail quedó diferida a `CORRECCIONES.md`, fuera del repositorio. [Matriz y verificación de C-16](openspec/changes/archive/2026-11-26-entrega-local-verificacion/verification.md).
- **Scope**:
  - Completar integración reproducible del build frontend/backend conforme a PT-05 revisada: servir React compilado y sus rutas desde Spring Boot sin servidor Node.js para la demostración; documentar comandos reales, requisitos, variables sin secretos y pasos de inicio/detención.
  - Recorrer FL-01 a FL-09 desde un entorno limpio de prueba y después de reiniciar sobre los datos persistidos, sin recrear consultorio/configuración/pacientes/turnos/avisos. Verificar CT-04/CT-05 y CA-VIS-07; no ejecutar restauraciones ni añadir backup como requisito.
  - Consolidar matriz de los 48 CA-US, CT-01 a CT-06 y CA-VIS-01 a CA-VIS-07 con evidencia, resultado y pendientes. Comprobar reserva/configuración/reprogramación concurrentes en PostgreSQL real, fallos conservando el original, límites temporales acordados y llamadas directas sin permisos.
  - Comprobar recepción en buzón de confirmación, cancelación, reprogramación y recordatorio a destinatarios de prueba habilitados, además de apertura de sus enlaces en la computadora local. Aceptación SMTP o simulación no satisface CA-VIS-06; si falta habilitación, dejar el criterio pendiente.
  - Abrir todas las pantallas en navegador a tamaños pequeño/grande, revisar errores de consola y solicitudes fallidas y registrar evidencia de flujos/estados. No se exige comparación con mockups porque la política es `off`; informar qué se comprobó y qué quedó manual o sin ejecutar.
  - Entregar instrucciones y límites de la demostración, pendientes PB/AT que impidan aceptación y pasos de validación posterior del producto; no declarar disponibilidad pública, producción comercial, cumplimiento normativo ni validación con odontólogos.
- **Dependencias**: C-11, C-12, C-13, C-14, C-15.
- **Governance**: ALTO — revisión del empaquetado/configuración antes de escribirla; las pruebas son sobre datos ficticios. Cualquier defecto que exija cambiar seguridad se corrige bajo aprobación CRITICAL, sin ampliar este alcance por inferencia.
- **Leer antes**:
  - `knowledge-base/01_vision_y_objetivos.md` §Criterios de aceptación aprobados para la entrega local y §Límites de la demostración y pendientes.
  - `knowledge-base/06_funcionalidades.md` §Criterios transversales aprobados y §Condiciones para considerar completa una historia.
  - `knowledge-base/07_flujos_principales.md` §FL-08 — Enviar confirmaciones, cambios y recordatorios y §FL-09 — Retomar la operación local tras un reinicio.
  - `knowledge-base/08_arquitectura_propuesta.md` §Compilación, ejecución y verificación.
  - `knowledge-base/10_preguntas_abiertas.md` §Orden recomendado de resolución y §Preguntas de producto y operación posterior.
