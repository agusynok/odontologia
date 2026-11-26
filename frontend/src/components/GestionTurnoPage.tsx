import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ApiClient } from '../api/apiClient';
import type {
  ApiResult,
  DisponibilidadGestionResponse,
  GestionTurno,
  GestionTurnoActual,
} from '../types/odontologia';
import { MANAGEMENT_WINDOW_CLOSED_MESSAGE } from '../utils/errors';
import { formatSlotRangeInZone } from '../utils/timezone';

interface GestionTurnoPageProps {
  apiClient: ApiClient;
}

type Feedback = { kind: 'success' | 'warning'; text: string } | null;

function readTokenFromFragment(fragment: string): string | null {
  return fragment.length > 1 ? fragment.slice(1) : null;
}

function removeCredentialFragment(): void {
  if (window.location.hash.length > 0) {
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}`,
    );
  }
}

function displayDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match === null ? value : `${match[3]}/${match[2]}/${match[1]}`;
}

function isUncertainWrite(result: Exclude<ApiResult<unknown>, { ok: true }>): boolean {
  return result.codigo === 'NETWORK_ERROR' || result.codigo === 'INVALID_RESPONSE';
}

export function GestionTurnoPage({ apiClient }: GestionTurnoPageProps) {
  const [token, setToken] = useState(() => readTokenFromFragment(window.location.hash));
  const [apertura, setApertura] = useState(0);
  const linkGenerationRef = useRef(0);
  const availabilityRequestRef = useRef(0);
  const [turno, setTurno] = useState<GestionTurno | null>(null);
  const [etag, setEtag] = useState<string | null>(null);
  const [loading, setLoading] = useState(token !== null);
  const [refreshing, setRefreshing] = useState(false);
  const [writing, setWriting] = useState<'cancelacion' | 'reprogramacion' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
  const [mostrarReprogramacion, setMostrarReprogramacion] = useState(false);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadGestionResponse | null>(null);
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState<string | null>(null);

  useLayoutEffect(() => {
    removeCredentialFragment();

    const handleHashChange = (event: HashChangeEvent) => {
      const url = event.newURL.length > 0 ? new URL(event.newURL) : new URL(window.location.href);
      const nextToken = readTokenFromFragment(url.hash);
      removeCredentialFragment();

      const nextGeneration = ++linkGenerationRef.current;
      setApertura(nextGeneration);
      availabilityRequestRef.current += 1;
      setToken(nextToken);
      setTurno(null);
      setEtag(null);
      setLoading(nextToken !== null);
      setRefreshing(false);
      setWriting(null);
      setError(null);
      setFeedback(null);
      setConfirmarCancelacion(false);
      setMostrarReprogramacion(false);
      setDesde('');
      setHasta('');
      setDisponibilidad(null);
      setCargandoDisponibilidad(false);
      setHorarioSeleccionado(null);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      linkGenerationRef.current += 1;
      availabilityRequestRef.current += 1;
    };
  }, []);

  const actualizarTurno = useCallback(async (
    reportarError = true,
  ): Promise<ApiResult<GestionTurnoActual> | null> => {
    if (token === null) {
      return null;
    }
    const linkGeneration = linkGenerationRef.current;
    setRefreshing(true);
    const result = await apiClient.getGestionTurno(token);
    if (linkGeneration !== linkGenerationRef.current) {
      return result;
    }
    if (result.ok) {
      availabilityRequestRef.current += 1;
      setCargandoDisponibilidad(false);
      setTurno(result.data.turno);
      setEtag(result.data.etag);
      setError(null);
      setDisponibilidad(null);
      setHorarioSeleccionado(null);
      setConfirmarCancelacion(false);
    } else {
      if (result.codigo === 'LINK_NOT_AVAILABLE') {
        availabilityRequestRef.current += 1;
        setCargandoDisponibilidad(false);
        setTurno(null);
        setEtag(null);
        setDisponibilidad(null);
        setHorarioSeleccionado(null);
        setConfirmarCancelacion(false);
        setMostrarReprogramacion(false);
      }
      if (reportarError) {
        setError(result.message);
      }
    }
    setLoading(false);
    setRefreshing(false);
    return result;
  }, [apiClient, token]);

  useEffect(() => {
    if (token !== null) {
      void actualizarTurno();
    } else {
      setLoading(false);
    }
  }, [token, apertura, actualizarTurno]);

  function invalidarConsultaDisponibilidad(): void {
    availabilityRequestRef.current += 1;
    setCargandoDisponibilidad(false);
    setDisponibilidad(null);
    setHorarioSeleccionado(null);
    setError(null);
    setFeedback(null);
  }

  async function consultarDisponibilidad(): Promise<void> {
    if (token === null) {
      return;
    }
    const requestId = ++availabilityRequestRef.current;
    const linkGeneration = linkGenerationRef.current;
    setCargandoDisponibilidad(true);
    setError(null);
    setFeedback(null);
    setHorarioSeleccionado(null);
    setDisponibilidad(null);
    const result = await apiClient.getGestionDisponibilidad(token, {
      ...(desde.length > 0 ? { desde } : {}),
      ...(hasta.length > 0 ? { hasta } : {}),
    });
    if (requestId !== availabilityRequestRef.current || linkGeneration !== linkGenerationRef.current) {
      return;
    }
    setCargandoDisponibilidad(false);
    if (!result.ok) {
      setDisponibilidad(null);
      setError(result.message);
      return;
    }
    setDisponibilidad(result.data);
  }

  async function cancelarTurno(): Promise<void> {
    if (token === null || etag === null || turno === null) {
      return;
    }
    const linkGeneration = linkGenerationRef.current;
    setWriting('cancelacion');
    setError(null);
    setFeedback(null);
    const result = await apiClient.cancelarGestionTurno(token, etag);
    if (linkGeneration !== linkGenerationRef.current) {
      return;
    }
    if (result.ok) {
      setTurno({
        fecha: result.data.fecha,
        horaInicio: result.data.horaInicio,
        horaFin: result.data.horaFin,
        estado: result.data.estado,
        acciones: [],
      });
      setEtag(null);
      setConfirmarCancelacion(false);
      setFeedback({
        kind: 'success',
        text: 'La cancelación quedó registrada. La notificación está PENDIENTE; eso no confirma la recepción del correo.',
      });
      setWriting(null);
      return;
    }
    if (isUncertainWrite(result)) {
      const refreshed = await actualizarTurno(false);
      if (linkGeneration !== linkGenerationRef.current) {
        return;
      }
      setError(null);
      setFeedback({
        kind: 'warning',
        text: refreshed?.ok
          ? `No pudimos confirmar la respuesta. Consultamos el estado vigente: el turno figura ${refreshed.data.turno.estado.toLowerCase()}.`
          : 'No pudimos confirmar la respuesta ni consultar el estado vigente. Volvé a abrir el enlace original para revisar el turno.',
      });
    } else {
      setError(result.message);
    }
    setWriting(null);
  }

  async function reprogramarTurno(): Promise<void> {
    if (token === null || etag === null || horarioSeleccionado === null || turno === null) {
      return;
    }
    const linkGeneration = linkGenerationRef.current;
    setWriting('reprogramacion');
    setError(null);
    setFeedback(null);
    const result = await apiClient.reprogramarGestionTurno(token, etag, horarioSeleccionado);
    if (linkGeneration !== linkGenerationRef.current) {
      return;
    }
    if (result.ok) {
      setTurno((actual) => actual === null ? actual : {
        ...actual,
        fecha: result.data.fecha,
        horaInicio: result.data.horaInicio,
        horaFin: result.data.horaFin,
        estado: result.data.estado,
      });
      setEtag(result.data.etag);
      setDisponibilidad(null);
      setHorarioSeleccionado(null);
      setMostrarReprogramacion(false);
      setFeedback({
        kind: 'success',
        text: 'El turno fue reprogramado. La notificación está PENDIENTE; eso no confirma la recepción del correo.',
      });
      setWriting(null);
      return;
    }
    if (isUncertainWrite(result)) {
      const refreshed = await actualizarTurno(false);
      if (linkGeneration !== linkGenerationRef.current) {
        return;
      }
      setError(null);
      setFeedback({
        kind: 'warning',
        text: refreshed?.ok
          ? `No pudimos confirmar la respuesta. Consultamos el estado vigente: el turno figura el ${displayDate(refreshed.data.turno.fecha)} de ${refreshed.data.turno.horaInicio} a ${refreshed.data.turno.horaFin}.`
          : 'No pudimos confirmar la respuesta ni consultar el estado vigente. Volvé a abrir el enlace original para revisar el turno.',
      });
    } else {
      setError(result.message);
    }
    setWriting(null);
  }

  const puedeCancelar = turno?.estado === 'CONFIRMADO' && turno.acciones.includes('CANCELAR');
  const puedeReprogramar = turno?.estado === 'CONFIRMADO' && turno.acciones.includes('REPROGRAMAR');

  return (
    <section className="card management-card" aria-busy={loading || writing !== null}>
      <header className="management-header">
        <div>
          <h1>Gestionar turno</h1>
          <p className="subtitle">Consultá o cambiá el turno vinculado a este enlace privado.</p>
        </div>
      </header>

      {token === null ? (
        <p className="feedback feedback-warning" role="status">
          Este enlace no incluye una credencial de autogestión. Volvé a abrir el enlace original.
        </p>
      ) : null}

      {loading ? <p role="status">Consultando el turno…</p> : null}
      {error !== null ? <p className="feedback feedback-error" role="alert">{error}</p> : null}
      {feedback !== null ? (
        <p className={`feedback feedback-${feedback.kind}`} role="status" aria-live="polite">
          {feedback.text}
        </p>
      ) : null}

      {turno !== null ? (
        <div className="stack">
          <section className="management-turn card" aria-labelledby="management-turn-heading">
            <h2 id="management-turn-heading">Tu turno</h2>
            <dl className="summary-grid">
              <div>
                <dt>Fecha</dt>
                <dd>{displayDate(turno.fecha)}</dd>
              </div>
              <div>
                <dt>Horario del consultorio</dt>
                <dd>{turno.horaInicio} a {turno.horaFin}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{turno.estado === 'CONFIRMADO' ? 'Confirmado' : 'Cancelado'}</dd>
              </div>
            </dl>
            {refreshing ? <p role="status">Actualizando estado…</p> : null}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => void actualizarTurno()}
              disabled={refreshing || writing !== null}
            >
              Actualizar estado del turno
            </button>
          </section>

          {turno.estado === 'CONFIRMADO' && !puedeCancelar && !puedeReprogramar ? (
            <p className="feedback feedback-warning" role="status" aria-live="polite">
              {MANAGEMENT_WINDOW_CLOSED_MESSAGE}
            </p>
          ) : null}

          {puedeCancelar ? (
            <section className="card stack" aria-labelledby="cancel-title">
              <h2 id="cancel-title">Cancelar turno</h2>
              {!confirmarCancelacion ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setConfirmarCancelacion(true)}
                  disabled={writing !== null}
                >
                  Cancelar turno
                </button>
              ) : (
                <div className="stack" role="group" aria-label="Confirmación de cancelación">
                  <p>¿Confirmás la cancelación de este turno?</p>
                  <div className="actions">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => void cancelarTurno()}
                      disabled={writing !== null}
                    >
                      {writing === 'cancelacion' ? 'Cancelando…' : 'Confirmar cancelación'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setConfirmarCancelacion(false)}
                      disabled={writing !== null}
                    >
                      Volver
                    </button>
                  </div>
                </div>
              )}
            </section>
          ) : null}

          {puedeReprogramar ? (
            <section className="card stack" aria-labelledby="reschedule-title">
              <h2 id="reschedule-title">Reprogramar turno</h2>
              {!mostrarReprogramacion ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setMostrarReprogramacion(true);
                    setError(null);
                    setFeedback(null);
                  }}
                  disabled={writing !== null}
                >
                  Ver horarios disponibles
                </button>
              ) : (
                <>
                  <form
                    className="management-period form-grid"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void consultarDisponibilidad();
                    }}
                  >
                    <div className="field">
                      <label htmlFor="availability-from">Desde (opcional)</label>
                      <input
                        id="availability-from"
                        type="date"
                        value={desde}
                        onChange={(event) => {
                          setDesde(event.target.value);
                          invalidarConsultaDisponibilidad();
                        }}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="availability-until">Hasta (opcional)</label>
                      <input
                        id="availability-until"
                        type="date"
                        value={hasta}
                        onChange={(event) => {
                          setHasta(event.target.value);
                          invalidarConsultaDisponibilidad();
                        }}
                      />
                    </div>
                    <div className="field management-period-action">
                      <button type="submit" className="btn btn-primary" disabled={cargandoDisponibilidad}>
                        {cargandoDisponibilidad ? 'Buscando…' : 'Consultar horarios'}
                      </button>
                    </div>
                  </form>

                  {disponibilidad !== null ? (
                    <div className="stack" aria-live="polite">
                      <p className="muted">
                        Horarios en la zona del consultorio: {disponibilidad.zonaHoraria}
                      </p>
                      {disponibilidad.horarios.length === 0 ? (
                        <p role="status">No hay horarios disponibles para el período consultado.</p>
                      ) : (
                        <fieldset className="management-slots">
                          <legend>Elegí un horario</legend>
                          <div className="management-slot-list">
                            {disponibilidad.horarios.map((horario) => (
                              <label
                                className={horarioSeleccionado === horario.inicio
                                  ? 'management-slot management-slot-selected'
                                  : 'management-slot'}
                                key={`${horario.inicio}-${horario.fin}`}
                              >
                                <input
                                  type="radio"
                                  name="management-slot"
                                  value={horario.inicio}
                                  checked={horarioSeleccionado === horario.inicio}
                                  onChange={() => setHorarioSeleccionado(horario.inicio)}
                                />
                                <span>{formatSlotRangeInZone(
                                  horario.inicio,
                                  horario.fin,
                                  disponibilidad.zonaHoraria,
                                )}</span>
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      )}

                      {horarioSeleccionado !== null ? (
                        <div className="stack" role="group" aria-label="Confirmación de reprogramación">
                          <p>Vas a cambiar el horario del turno. Confirmá solo si querés continuar.</p>
                          <div className="actions">
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => void reprogramarTurno()}
                              disabled={writing !== null}
                            >
                              {writing === 'reprogramacion' ? 'Reprogramando…' : 'Confirmar reprogramación'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setHorarioSeleccionado(null)}
                              disabled={writing !== null}
                            >
                              Elegir otro horario
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </>
              )}
            </section>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
