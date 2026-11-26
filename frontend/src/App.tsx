import { useCallback, useEffect, useState } from 'react';
import { apiClient as defaultApiClient } from './api/apiClient';
import type { ApiClient } from './api/apiClient';
import { AgendaSection } from './components/AgendaSection';
import { BloqueosSection } from './components/BloqueosSection';
import { HorarioSection } from './components/HorarioSection';
import { LoginForm } from './components/LoginForm';
import { MotivosSection } from './components/MotivosSection';
import { PublicBookingPage } from './components/PublicBookingPage';
import { GestionTurnoPage } from './components/GestionTurnoPage';

export type SectionTab = 'agenda' | 'motivos' | 'horario' | 'bloqueos';
type AuthState = 'checking' | 'unauthenticated' | 'authenticated';

interface AppProps {
  client?: ApiClient;
  initialPath?: string;
  initialTab?: SectionTab;
}

function isPublicBookingPath(pathname: string): boolean {
  return pathname === '/reservar' || pathname.startsWith('/reservar/');
}

function isManagementPath(pathname: string): boolean {
  return pathname === '/gestionar-turno' || pathname.startsWith('/gestionar-turno/');
}

function isPublicPath(pathname: string): boolean {
  return isPublicBookingPath(pathname) || isManagementPath(pathname);
}

export function App({ client = defaultApiClient, initialPath, initialTab }: AppProps) {
  const [currentPath, setCurrentPath] = useState<string>(
    () => initialPath ?? window.location.pathname,
  );
  const [authState, setAuthState] = useState<AuthState>(() =>
    isPublicPath(initialPath ?? window.location.pathname) ? 'unauthenticated' : 'checking',
  );
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SectionTab>(initialTab ?? 'motivos');
  const [sectionBusy, setSectionBusy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isBookingRoute = isPublicBookingPath(currentPath);
  const isManagementRoute = isManagementPath(currentPath);

  const navigateTo = useCallback((nextPath: string) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, '', nextPath);
    }
    setCurrentPath(nextPath);
    if (!isPublicPath(nextPath)) {
      setAuthState('checking');
    }
  }, []);

  useEffect(() => {
    function handlePopState(): void {
      const next = window.location.pathname;
      setCurrentPath(next);
      if (!isPublicPath(next)) {
        setAuthState('checking');
      }
    }
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleSessionExpired = useCallback(
    (message: string) => {
      client.clearCsrfToken();
      setSectionBusy(false);
      setLogoutError(null);
      setAuthNotice(message);
      setAuthState('unauthenticated');
    },
    [client],
  );

  useEffect(() => {
    if (isBookingRoute || isManagementRoute) {
      return;
    }
    let active = true;
    async function verifyInitialSession(): Promise<void> {
      const result = await client.checkSession();
      if (!active) {
        return;
      }
      if (result.ok && result.data.autenticado) {
        setAuthNotice(null);
        setAuthState('authenticated');
        return;
      }
      setAuthState('unauthenticated');
    }
    void verifyInitialSession();
    return () => {
      active = false;
    };
  }, [client, isBookingRoute, isManagementRoute]);

  async function handleLogout(): Promise<void> {
    setLoggingOut(true);
    setLogoutError(null);
    const result = await client.logout();
    setLoggingOut(false);
    if (!result.ok) {
      if (result.codigo === 'SESSION_REQUIRED') {
        handleSessionExpired(result.message);
        return;
      }
      setLogoutError(result.message);
      return;
    }
    setSectionBusy(false);
    setAuthNotice(null);
    setAuthState('unauthenticated');
  }

  return (
    <div className="app-shell">
      <main className="app-container">
        {isManagementRoute ? (
          <GestionTurnoPage apiClient={client} />
        ) : isBookingRoute ? (
          <PublicBookingPage apiClient={client} onGoToDentist={() => navigateTo('/')} />
        ) : (
          <>
            {authState === 'checking' ? (
              <section className="card" aria-busy="true">
                <p>Verificando sesión…</p>
              </section>
            ) : null}

            {authState === 'unauthenticated' ? (
              <div className="stack">
                <LoginForm
                  apiClient={client}
                  initialMessage={authNotice}
                  onAuthenticated={() => {
                    setAuthNotice(null);
                    setAuthState('authenticated');
                  }}
                />
                <div className="card login-card public-link-box">
                  <p className="muted">¿Sos paciente y querés solicitar un turno?</p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigateTo('/reservar')}
                  >
                    Ir a reserva de pacientes
                  </button>
                </div>
              </div>
            ) : null}

            {authState === 'authenticated' ? (
              <div className="workspace">
                <header className="topbar">
                  <div>
                    <h1>Configuración de agenda</h1>
                    <p className="subtitle">Consultorio local · Odontólogo</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => void handleLogout()}
                    disabled={loggingOut}
                  >
                    {loggingOut ? 'Cerrando…' : 'Cerrar sesión'}
                  </button>
                </header>

                {logoutError !== null ? (
                  <p className="feedback feedback-error" role="alert" aria-live="assertive">
                    {logoutError}
                  </p>
                ) : null}

                <nav className="tabs" role="tablist" aria-label="Secciones de configuración">
                  <button
                    type="button"
                    role="tab"
                    id="tab-agenda"
                    aria-selected={activeTab === 'agenda'}
                    aria-controls="panel-agenda"
                    className={activeTab === 'agenda' ? 'tab tab-active' : 'tab'}
                    onClick={() => setActiveTab('agenda')}
                    disabled={sectionBusy || loggingOut}
                  >
                    Agenda
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="tab-motivos"
                    aria-selected={activeTab === 'motivos'}
                    aria-controls="panel-motivos"
                    className={activeTab === 'motivos' ? 'tab tab-active' : 'tab'}
                    onClick={() => setActiveTab('motivos')}
                    disabled={sectionBusy || loggingOut}
                  >
                    Motivos de consulta
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="tab-horario"
                    aria-selected={activeTab === 'horario'}
                    aria-controls="panel-horario"
                    className={activeTab === 'horario' ? 'tab tab-active' : 'tab'}
                    onClick={() => setActiveTab('horario')}
                    disabled={sectionBusy || loggingOut}
                  >
                    Horario semanal
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="tab-bloqueos"
                    aria-selected={activeTab === 'bloqueos'}
                    aria-controls="panel-bloqueos"
                    className={activeTab === 'bloqueos' ? 'tab tab-active' : 'tab'}
                    onClick={() => setActiveTab('bloqueos')}
                    disabled={sectionBusy || loggingOut}
                  >
                    Bloqueos
                  </button>
                </nav>

                <div
                  id={`panel-${activeTab}`}
                  role="tabpanel"
                  aria-labelledby={`tab-${activeTab}`}
                  className="panel"
                >
                  {activeTab === 'agenda' ? (
                    <AgendaSection apiClient={client} onSessionExpired={handleSessionExpired} />
                  ) : null}
                  {activeTab === 'motivos' ? (
                    <MotivosSection
                      apiClient={client}
                      onSessionExpired={handleSessionExpired}
                      onBusyChange={setSectionBusy}
                    />
                  ) : null}
                  {activeTab === 'horario' ? (
                    <HorarioSection
                      apiClient={client}
                      onSessionExpired={handleSessionExpired}
                      onBusyChange={setSectionBusy}
                    />
                  ) : null}
                  {activeTab === 'bloqueos' ? (
                    <BloqueosSection
                      apiClient={client}
                      onSessionExpired={handleSessionExpired}
                      onBusyChange={setSectionBusy}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
