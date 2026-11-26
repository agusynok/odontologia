import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ApiClient } from '../api/apiClient';
import { LoginForm } from './LoginForm';

function makeClient(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    checkSession: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    getMotivos: vi.fn(),
    createMotivo: vi.fn(),
    updateMotivo: vi.fn(),
    getHorario: vi.fn(),
    replaceHorario: vi.fn(),
    getBloqueos: vi.fn(),
    createBloqueo: vi.fn(),
    deleteBloqueo: vi.fn(),
    getAgenda: vi.fn(),
    getTurnoDetalle: vi.fn(),
    getPublicMotivos: vi.fn(),
    getPublicDisponibilidad: vi.fn(),
    createPublicTurno: vi.fn(),
    getGestionTurno: vi.fn(),
    getGestionDisponibilidad: vi.fn(),
    cancelarGestionTurno: vi.fn(),
    reprogramarGestionTurno: vi.fn(),
    clearCsrfToken: vi.fn(),
    ...overrides,
  };
}

describe('LoginForm', () => {
  it('envia usuario y contrasena e invoca onAuthenticated en 204', async () => {
    const user = userEvent.setup();
    const login = vi.fn().mockResolvedValue({ ok: true, data: undefined });
    const onAuthenticated = vi.fn();

    render(<LoginForm apiClient={makeClient({ login })} onAuthenticated={onAuthenticated} />);

    await user.type(screen.getByLabelText(/usuario/i), 'carlos');
    await user.type(screen.getByLabelText(/contraseña/i), 'mi-clave-segura-15');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    expect(login).toHaveBeenCalledWith('carlos', 'mi-clave-segura-15');
    expect(onAuthenticated).toHaveBeenCalledTimes(1);
  });

  it('muestra error ante 401 INVALID_CREDENTIALS y 503 ACCESS_NOT_CONFIGURED', async () => {
    const user = userEvent.setup();
    const login = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        codigo: 'INVALID_CREDENTIALS',
        message: 'Usuario o contraseña incorrectos.',
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        codigo: 'ACCESS_NOT_CONFIGURED',
        message: 'El acceso interno del odontólogo no está configurado en este entorno.',
      });
    const onAuthenticated = vi.fn();

    render(<LoginForm apiClient={makeClient({ login })} onAuthenticated={onAuthenticated} />);

    await user.type(screen.getByLabelText(/usuario/i), 'carlos');
    await user.type(screen.getByLabelText(/contraseña/i), 'otra');
    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/incorrectos/i);
    expect(onAuthenticated).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /ingresar/i }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/no está configurado/i);
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it('valida campos vacios antes de enviar', async () => {
    const user = userEvent.setup();
    const login = vi.fn();

    render(<LoginForm apiClient={makeClient({ login })} onAuthenticated={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /ingresar/i }));
    expect(login).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toMatch(/completá usuario y contraseña/i);
  });
});
