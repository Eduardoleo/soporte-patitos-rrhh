import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Login from './components/Login';

const { mockLogin, mockNavigate } = vi.hoisted(() => ({ mockLogin: vi.fn(), mockNavigate: vi.fn() }));
vi.mock('./context/AuthContext', () => ({ useAuth: () => ({ login: mockLogin }) }));
// Prueba unitaria de Login: navegación aislada del router.
vi.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));

beforeEach(() => vi.clearAllMocks());

function submit(email = 'admin.demo@patitos.sa') {
  render(<Login />);
  fireEvent.change(screen.getByLabelText(/Correo Empresarial/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'clave-de-prueba' } });
  fireEvent.submit(screen.getByRole('button', { name: /Iniciar Sesión/i }).closest('form'));
}

test('login válido navega después de autenticar', async () => {
  mockLogin.mockResolvedValue({});
  submit();
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/home'));
  expect(mockLogin).toHaveBeenCalledWith('admin.demo@patitos.sa', 'clave-de-prueba');
});

test('login fallido muestra error y conserva la pantalla', async () => {
  mockLogin.mockRejectedValue(new Error('Usuario o contraseña incorrecta'));
  submit();
  expect(await screen.findByText('Usuario o contraseña incorrecta')).toBeInTheDocument();
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('correo de dominio distinto no realiza solicitud', () => {
  submit('persona@ejemplo.test');
  expect(mockLogin).not.toHaveBeenCalled();
  expect(screen.getByText(/Solo se permiten correos corporativos/)).toBeInTheDocument();
});
