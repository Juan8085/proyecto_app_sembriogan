import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate(); // Hook de React para cambiar de página

  // Maneja los cambios en los inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Lógica para Iniciar Sesión
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });
      const data = await res.json();

      if (data.success) {
        // Redirección inteligente basada en el ROL
        if (data.usuario.rol === 'Admin') {
          localStorage.setItem('tokenSembriogan', data.token);
          localStorage.setItem('usuarioSembriogan', JSON.stringify(data.usuario));
          navigate('/admin'); 
        } else if (data.usuario.rol === 'Veterinario') {
          localStorage.setItem('tokenVetSembriogan', data.token);
          localStorage.setItem('datosVetSembriogan', JSON.stringify(data.usuario));
          navigate('/vet'); 
        } else {
          setError('Rol no autorizado para esta plataforma operativa.');
        }
      } else {
        setError(data.mensaje);
      }
    } catch (err) {
      setError('Error de conexión con el servidor. Verifica que el backend esté encendido.');
    } finally {
      setLoading(false);
    }
  };

  // Lógica para Registrar al primer Admin Maestro
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('http://localhost:3000/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, rol: 'Admin' })
      });
      const data = await res.json();

      if (data.success) {
        setSuccess('¡Administrador maestro creado con éxito! Ya puedes iniciar sesión.');
        setTimeout(() => setIsRegistering(false), 2000); // Vuelve al login tras 2 seg
      } else {
        setError(data.mensaje);
      }
    } catch (err) {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-light p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center border border-gray-100">
        
        {/* Cabecera del Login */}
        <div className="mb-6 flex flex-col items-center">
          <img 
            src="/logo.png" 
            alt="Logo Sembriogan" 
            className="h-20 object-contain mb-2" 
          />
          <p className="text-gray-500 text-sm">Portal Operativo y Administrativo</p>
        </div>

        {/* Alertas de Error o Éxito */}
        {error && <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 p-3 rounded-lg font-medium">{error}</p>}
        {success && <p className="text-green-700 text-sm mb-4 bg-green-50 border border-green-200 p-3 rounded-lg font-medium">{success}</p>}

        {!isRegistering ? (
          /* ========================================= */
          /* FORMULARIO DE LOGIN                       */
          /* ========================================= */
          <form onSubmit={handleLogin} className="text-left">
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
              <input 
                type="email" name="email" required 
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="usuario@sembriogan.com"
                onChange={handleChange}
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
              <input 
                type="password" name="password" required 
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="••••••••"
                onChange={handleChange}
              />
            </div>
            <button 
              type="submit" disabled={loading}
              className="w-full bg-primary text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition duration-200 disabled:opacity-50 shadow-md"
            >
              {loading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
            
            <p 
              onClick={() => setIsRegistering(true)}
              className="mt-6 text-sm text-primary font-semibold cursor-pointer hover:underline text-center"
            >
              ¿Sistema Nuevo? Registra el Admin inicial aquí
            </p>
          </form>
        ) : (
          /* ========================================= */
          /* FORMULARIO DE REGISTRO INICIAL            */
          /* ========================================= */
          <form onSubmit={handleRegister} className="text-left">
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
              <input 
                type="text" name="nombre" required 
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                placeholder="Tu Nombre"
                onChange={handleChange}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
              <input 
                type="email" name="email" required 
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                placeholder="admin@sembriogan.com"
                onChange={handleChange}
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
              <input 
                type="password" name="password" required 
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all"
                placeholder="••••••••"
                onChange={handleChange}
              />
            </div>
            <button 
              type="submit" disabled={loading}
              className="w-full bg-secondary text-white font-bold py-3 px-4 rounded-xl hover:bg-green-600 transition duration-200 disabled:opacity-50 shadow-md"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta Admin Maestro'}
            </button>
            
            <p 
              onClick={() => setIsRegistering(false)}
              className="mt-6 text-sm text-gray-500 font-semibold cursor-pointer hover:text-gray-700 text-center"
            >
              ← Volver al Login
            </p>
          </form>
        )}
      </div>
    </div>
  );
}