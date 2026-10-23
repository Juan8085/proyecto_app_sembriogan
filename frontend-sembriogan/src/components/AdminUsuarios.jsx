import { useState, useEffect, useMemo, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import {
  Users,
  UserCheck,
  UserX,
  User,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Search,
  Power,
  CheckCircle2,
  X,
  Stethoscope,
  Crown,
  RefreshCw,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Edit2,
  KeyRound,
  Sparkles
} from 'lucide-react';

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos'); // 'todos' | 'cliente' | 'veterinario' | 'admin' | 'inactivos'
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  // Estados para Modal de Crear Usuario / Veterinario
  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  const [creandoUsuario, setCreandoUsuario] = useState(false);
  const [errorCrear, setErrorCrear] = useState('');
  const [mostrarPasswordCrear, setMostrarPasswordCrear] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'Veterinario'
  });

  // Estados para Modal de Editar Usuario
  const [isModalEditarOpen, setIsModalEditarOpen] = useState(false);
  const [editandoUsuario, setEditandoUsuario] = useState(false);
  const [errorEditar, setErrorEditar] = useState('');
  const [mostrarPasswordEditar, setMostrarPasswordEditar] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState({
    id: '',
    nombre: '',
    email: '',
    rol: 'Veterinario',
    password: ''
  });

  // Cargar usuarios desde el backend (soporta carga silenciosa para actualización en tiempo real)
  const cargarUsuarios = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const res = await fetch(`${API_BASE_URL}/api/auth/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success && Array.isArray(data.data)) {
        setUsuarios(data.data);
        setError('');
        const ahora = new Date();
        setUltimaActualizacion(ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } else {
        setError(data.mensaje || 'Error al obtener nómina de usuarios.');
      }
    } catch (err) {
      console.error("Error cargando usuarios:", err);
      setError('Error al sincronizar lista de usuarios con el servidor.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Carga inicial y sondeo periódico cada 15 segundos para registrar nuevos clientes y personal en tiempo real
  useEffect(() => {
    cargarUsuarios(false);

    const intervalo = setInterval(() => {
      cargarUsuarios(true);
    }, 15000);

    const handleFocus = () => {
      cargarUsuarios(true);
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalo);
      window.removeEventListener('focus', handleFocus);
    };
  }, [cargarUsuarios]);

  // Generador de Contraseña Segura
  const generarClaveAleatoria = (esParaCrear = true) => {
    const numeros = Math.floor(1000 + Math.random() * 9000);
    const clave = `Sem-${numeros}*`;
    if (esParaCrear) {
      setNuevoUsuario(prev => ({ ...prev, password: clave }));
      setMostrarPasswordCrear(true);
    } else {
      setUsuarioAEditar(prev => ({ ...prev, password: clave }));
      setMostrarPasswordEditar(true);
    }
  };

  // Crear Nuevo Usuario (Veterinario, Admin o Cliente)
  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setErrorCrear('');

    if (!nuevoUsuario.nombre.trim()) {
      setErrorCrear('Ingresa el nombre completo del profesional o usuario.');
      return;
    }
    if (!nuevoUsuario.email.trim()) {
      setErrorCrear('Ingresa el correo electrónico.');
      return;
    }
    if (!nuevoUsuario.password || nuevoUsuario.password.length < 6) {
      setErrorCrear('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCreandoUsuario(true);
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const res = await fetch(`${API_BASE_URL}/api/auth/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: nuevoUsuario.nombre.trim(),
          email: nuevoUsuario.email.toLowerCase().trim(),
          password: nuevoUsuario.password,
          rol: nuevoUsuario.rol
        })
      });

      const data = await res.json();

      if (data.success) {
        setMensaje(`✅ Usuario "${nuevoUsuario.nombre}" registrado exitosamente como ${nuevoUsuario.rol}.`);
        setIsModalCrearOpen(false);
        setNuevoUsuario({ nombre: '', email: '', password: '', rol: 'Veterinario' });
        cargarUsuarios(true);
      } else {
        setErrorCrear(data.mensaje || 'Error al registrar usuario');
      }
    } catch (err) {
      console.error(err);
      setErrorCrear('Error de conexión con el servidor.');
    } finally {
      setCreandoUsuario(false);
    }
  };

  // Abrir Modal de Edición
  const abrirModalEditar = (u) => {
    setErrorEditar('');
    setUsuarioAEditar({
      id: u._id,
      nombre: u.nombre || '',
      email: u.email || '',
      rol: u.rol || 'Veterinario',
      password: ''
    });
    setMostrarPasswordEditar(false);
    setIsModalEditarOpen(true);
  };

  // Guardar Cambios de Usuario Existente
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setErrorEditar('');

    if (!usuarioAEditar.nombre.trim()) {
      setErrorEditar('El nombre es obligatorio.');
      return;
    }
    if (!usuarioAEditar.email.trim()) {
      setErrorEditar('El correo es obligatorio.');
      return;
    }
    if (usuarioAEditar.password && usuarioAEditar.password.length < 6) {
      setErrorEditar('La nueva contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    setEditandoUsuario(true);
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const payload = {
        nombre: usuarioAEditar.nombre.trim(),
        email: usuarioAEditar.email.toLowerCase().trim(),
        rol: usuarioAEditar.rol
      };

      if (usuarioAEditar.password && usuarioAEditar.password.trim() !== '') {
        payload.password = usuarioAEditar.password.trim();
      }

      const res = await fetch(`${API_BASE_URL}/api/auth/usuarios/${usuarioAEditar.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        setMensaje(`✅ Datos de "${usuarioAEditar.nombre}" actualizados correctamente.`);
        setIsModalEditarOpen(false);
        cargarUsuarios(true);
      } else {
        setErrorEditar(data.mensaje || 'Error al actualizar usuario');
      }
    } catch (err) {
      console.error(err);
      setErrorEditar('Error de conexión al actualizar usuario.');
    } finally {
      setEditandoUsuario(false);
    }
  };

  // Función para Activar/Desactivar
  const toggleEstado = async (id, estadoActual, nombre) => {
    const accion = estadoActual ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Estás seguro de ${accion} el acceso de "${nombre}"?`)) return;

    try {
      setError('');
      setMensaje('');
      const token = localStorage.getItem('tokenSembriogan');
      const res = await fetch(`${API_BASE_URL}/api/auth/usuarios/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ estado: !estadoActual })
      });
      const data = await res.json();

      if (data.success) {
        setMensaje(`Usuario ${nombre} ${!estadoActual ? 'activado' : 'desactivado'} con éxito.`);
        cargarUsuarios(true);
      } else {
        setError("Error: " + data.mensaje);
      }
    } catch (err) {
      setError("Error de conexión al actualizar el usuario.");
    }
  };

  // Métricas discriminadas por rol real y estado
  const metricas = useMemo(() => {
    const total = usuarios.length;
    const clientes = usuarios.filter(u => (u.rol || '').toLowerCase() === 'cliente').length;
    const veterinarios = usuarios.filter(u => (u.rol || '').toLowerCase() === 'veterinario').length;
    const admins = usuarios.filter(u => (u.rol || '').toLowerCase() === 'admin').length;
    const activos = usuarios.filter(u => u.estado).length;
    const inactivos = usuarios.filter(u => !u.estado).length;
    return { total, clientes, veterinarios, admins, activos, inactivos };
  }, [usuarios]);

  // Filtrado de usuarios
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      const q = busqueda.toLowerCase().trim();
      const matchBusqueda = !q || 
        (u.nombre || '').toLowerCase().includes(q) || 
        (u.email || '').toLowerCase().includes(q);

      if (!matchBusqueda) return false;

      const rolNormalizado = (u.rol || '').toLowerCase();
      if (filtroRol === 'cliente') return rolNormalizado === 'cliente';
      if (filtroRol === 'veterinario') return rolNormalizado === 'veterinario';
      if (filtroRol === 'admin') return rolNormalizado === 'admin';
      if (filtroRol === 'inactivos') return !u.estado;
      return true;
    });
  }, [usuarios, busqueda, filtroRol]);

  // Generar iniciales de nombre
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Formatear fecha de creación
  const formatearFecha = (fechaRaw) => {
    if (!fechaRaw) return 'Reciente';
    try {
      const f = new Date(fechaRaw);
      return f.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Reciente';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Sincronizando nómina de personal y clientes con la base de datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Total Cuentas */}
        <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Cuentas</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{metricas.total}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Clientes Ganaderos */}
        <div className="bg-white rounded-3xl p-4 md:p-5 border border-emerald-200/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Clientes</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{metricas.clientes}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Veterinarios */}
        <div className="bg-white rounded-3xl p-4 md:p-5 border border-sky-200/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Veterinarios</p>
            <p className="text-2xl font-black text-sky-600 mt-0.5">{metricas.veterinarios}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-inner">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>

        {/* Administradores */}
        <div className="bg-white rounded-3xl p-4 md:p-5 border border-purple-200/60 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Admins</p>
            <p className="text-2xl font-black text-purple-600 mt-0.5">{metricas.admins}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
            <Crown className="w-5 h-5" />
          </div>
        </div>

        {/* Suspendidos / Inactivos */}
        <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Suspendidos</p>
            <p className={`text-2xl font-black mt-0.5 ${metricas.inactivos > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {metricas.inactivos}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner ${metricas.inactivos > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
            <UserX className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* MENSAJES DE ESTADO */}
      {mensaje && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span className="font-semibold">{mensaje}</span>
          </div>
          <button onClick={() => setMensaje('')} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600" />
            <span className="font-semibold">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        
        {/* Cabecera y Herramientas */}
        <div className="p-6 md:p-8 border-b border-slate-100 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Directorio de Usuarios y Clientes</h2>
              <p className="text-xs text-slate-500 mt-1">Supervisa roles, credenciales del personal veterinario y clientes registrados.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5">
              {/* BOTÓN NUEVO: CREAR USUARIO / VETERINARIO */}
              <button
                onClick={() => {
                  setErrorCrear('');
                  setNuevoUsuario({ nombre: '', email: '', password: '', rol: 'Veterinario' });
                  setIsModalCrearOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition shadow-sm shadow-blue-500/25 cursor-pointer"
                title="Registrar una nueva cuenta para veterinario o personal del equipo"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Registrar Veterinario</span>
              </button>

              {/* Botón de Actualizar Lista en Tiempo Real */}
              <button
                onClick={() => cargarUsuarios(false)}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                title="Recargar usuarios desde la base de datos"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Sincronizando...' : 'Actualizar'}</span>
              </button>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>En Línea {ultimaActualizacion ? `• ${ultimaActualizacion}` : ''}</span>
              </div>
            </div>
          </div>

          {/* Filtros y Buscador */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
            
            {/* Buscador */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o correo de cliente/veterinario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Chips de filtro */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/70">
              <button
                onClick={() => setFiltroRol('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filtroRol === 'todos'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({metricas.total})
              </button>
              <button
                onClick={() => setFiltroRol('veterinario')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filtroRol === 'veterinario'
                    ? 'bg-white text-sky-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Veterinarios ({metricas.veterinarios})
              </button>
              <button
                onClick={() => setFiltroRol('cliente')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filtroRol === 'cliente'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Clientes ({metricas.clientes})
              </button>
              <button
                onClick={() => setFiltroRol('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filtroRol === 'admin'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Admins ({metricas.admins})
              </button>
              <button
                onClick={() => setFiltroRol('inactivos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filtroRol === 'inactivos'
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Inactivos ({metricas.inactivos})
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/75 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Correo Electrónico</th>
                <th className="px-6 py-4">Rol en Plataforma</th>
                <th className="px-6 py-4">Registro</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-center">Gestión & Acceso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No se encontraron usuarios coincidentes.</p>
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((user) => {
                  const rolLower = (user.rol || '').toLowerCase();
                  const isAdmin = rolLower === 'admin';
                  const isCliente = rolLower === 'cliente';

                  return (
                    <tr key={user._id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Avatar e Identidad */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shadow-inner ${
                            isAdmin 
                              ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/20' 
                              : isCliente
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20'
                                : 'bg-gradient-to-br from-blue-500 to-sky-600 text-white shadow-blue-500/20'
                          }`}>
                            {getInitials(user.nombre)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{user.nombre}</div>
                            <div className="text-[11px] text-slate-400">ID: {user._id?.slice(-6)}</div>
                          </div>
                        </div>
                      </td>

                      {/* Correo */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-700 text-xs font-medium">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{user.email}</span>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          isAdmin 
                            ? 'bg-purple-50 text-purple-700 border border-purple-200/60' 
                            : isCliente
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                        }`}>
                          {isAdmin ? (
                            <Crown className="w-3 h-3 text-purple-600" />
                          ) : isCliente ? (
                            <User className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Stethoscope className="w-3 h-3 text-blue-600" />
                          )}
                          {user.rol || 'Cliente'}
                        </span>
                      </td>

                      {/* Fecha de Registro */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatearFecha(user.createdAt)}</span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          user.estado 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.estado ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {user.estado ? 'Activo' : 'Suspendido'}
                        </span>
                      </td>

                      {/* Botones de Gestión (Editar Datos / Activar-Desactivar) */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <button 
                            onClick={() => abrirModalEditar(user)}
                            className="inline-flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer border border-slate-200/80"
                            title="Editar información o resetear contraseña"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button 
                            onClick={() => toggleEstado(user._id, user.estado, user.nombre)}
                            className={`inline-flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-xl transition cursor-pointer ${
                              user.estado 
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60' 
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                            }`}
                            title={user.estado ? "Suspender acceso" : "Reactivar acceso"}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{user.estado ? 'Desactivar' : 'Activar'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: REGISTRAR NUEVO PERSONAL / VETERINARIO              */}
      {/* ============================================================ */}
      {isModalCrearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header del Modal */}
            <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100/70 text-blue-600 flex items-center justify-center shadow-inner">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Registrar Personal / Veterinario</h3>
                  <p className="text-xs text-slate-500">Crea una cuenta oficial para el equipo de Sembriogan.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalCrearOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleCrearUsuario} className="p-6 overflow-y-auto space-y-4">
              {errorCrear && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorCrear}</span>
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre Completo *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={nuevoUsuario.nombre}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                    placeholder="Ej: Dr. Fernando Gómez"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Correo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Correo Electrónico Oficial *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={nuevoUsuario.email}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
                    placeholder="veterinario@sembriogan.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Selector de Rol */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Rol en la Plataforma *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNuevoUsuario({ ...nuevoUsuario, rol: 'Veterinario' })}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                      nuevoUsuario.rol === 'Veterinario'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 mb-1 text-blue-600" />
                    <span>Veterinario</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNuevoUsuario({ ...nuevoUsuario, rol: 'Admin' })}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                      nuevoUsuario.rol === 'Admin'
                        ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Crown className="w-4 h-4 mb-1 text-purple-600" />
                    <span>Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNuevoUsuario({ ...nuevoUsuario, rol: 'Cliente' })}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                      nuevoUsuario.rol === 'Cliente'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-4 h-4 mb-1 text-emerald-600" />
                    <span>Cliente</span>
                  </button>
                </div>
              </div>

              {/* Contraseña Inicial */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Contraseña Inicial *</label>
                  <button
                    type="button"
                    onClick={() => generarClaveAleatoria(true)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generar Clave Segura</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={mostrarPasswordCrear ? "text" : "password"}
                    required
                    value={nuevoUsuario.password}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres..."
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPasswordCrear(!mostrarPasswordCrear)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {mostrarPasswordCrear ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalCrearOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creandoUsuario}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-blue-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {creandoUsuario ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Crear Cuenta Oficial</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: EDITAR USUARIO / CAMBIAR CONTRASEÑA O ROL           */}
      {/* ============================================================ */}
      {isModalEditarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header del Modal */}
            <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center shadow-inner">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Editar Usuario / Credenciales</h3>
                  <p className="text-xs text-slate-500">Actualiza los datos o asigna una nueva contraseña.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalEditarOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario de Edición */}
            <form onSubmit={handleGuardarEdicion} className="p-6 overflow-y-auto space-y-4">
              {errorEditar && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorEditar}</span>
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre Completo *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={usuarioAEditar.nombre}
                    onChange={(e) => setUsuarioAEditar({ ...usuarioAEditar, nombre: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Correo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Correo Electrónico *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={usuarioAEditar.email}
                    onChange={(e) => setUsuarioAEditar({ ...usuarioAEditar, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Selector de Rol */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Rol en la Plataforma</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setUsuarioAEditar({ ...usuarioAEditar, rol: 'Veterinario' })}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                      usuarioAEditar.rol === 'Veterinario'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 mb-1 text-blue-600" />
                    <span>Veterinario</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUsuarioAEditar({ ...usuarioAEditar, rol: 'Admin' })}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                      usuarioAEditar.rol === 'Admin'
                        ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Crown className="w-4 h-4 mb-1 text-purple-600" />
                    <span>Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUsuarioAEditar({ ...usuarioAEditar, rol: 'Cliente' })}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                      usuarioAEditar.rol === 'Cliente'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-4 h-4 mb-1 text-emerald-600" />
                    <span>Cliente</span>
                  </button>
                </div>
              </div>

              {/* Cambiar Contraseña (Opcional) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Cambiar Contraseña (Opcional)</label>
                  <button
                    type="button"
                    onClick={() => generarClaveAleatoria(false)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Generar Nueva Clave</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={mostrarPasswordEditar ? "text" : "password"}
                    value={usuarioAEditar.password}
                    onChange={(e) => setUsuarioAEditar({ ...usuarioAEditar, password: e.target.value })}
                    placeholder="Dejar en blanco para mantener la contraseña actual"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPasswordEditar(!mostrarPasswordEditar)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {mostrarPasswordEditar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Si escribes una clave aquí, reemplazará la contraseña anterior del usuario.</p>
              </div>

              {/* Botones de Acción */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalEditarOpen(false)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editandoUsuario}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-blue-600 text-white rounded-2xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {editandoUsuario ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}