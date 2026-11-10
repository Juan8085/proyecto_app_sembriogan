import { useState, useEffect, useMemo, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  ShieldCheck,
  Mail,
  Search,
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
  Phone,
  Power
} from 'lucide-react';

export default function AdminPersonal() {
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos'); // 'todos' | 'veterinario' | 'admin' | 'inactivos'
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  // Modal Crear Personal (Veterinario / Admin)
  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  const [creando, setCreando] = useState(false);
  const [errorCrear, setErrorCrear] = useState('');
  const [mostrarPasswordCrear, setMostrarPasswordCrear] = useState(false);
  const [nuevoMiembro, setNuevoMiembro] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'Veterinario',
    telefono: '',
    municipio: 'Neiva'
  });

  // Modal Editar Personal
  const [isModalEditarOpen, setIsModalEditarOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [errorEditar, setErrorEditar] = useState('');
  const [mostrarPasswordEditar, setMostrarPasswordEditar] = useState(false);
  const [miembroAEditar, setMiembroAEditar] = useState({
    id: '',
    nombre: '',
    email: '',
    rol: 'Veterinario',
    telefono: '',
    municipio: 'Neiva',
    password: ''
  });

  // Cargar usuarios y filtrar solo personal (Veterinario y Admin)
  const cargarPersonal = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const res = await fetch(`${API_BASE_URL}/api/auth/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success && Array.isArray(data.data)) {
        // Filtrar exclusivamente personal: Veterinarios y Administradores
        const staff = data.data.filter(u => {
          const r = (u.rol || '').toLowerCase();
          return r === 'veterinario' || r === 'admin';
        });
        setPersonal(staff);
        setError('');
        const ahora = new Date();
        setUltimaActualizacion(ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } else {
        setError(data.mensaje || 'Error al obtener nómina de personal.');
      }
    } catch (err) {
      console.error("Error cargando personal:", err);
      setError('Error al sincronizar lista de personal con el servidor.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarPersonal(false);
    const intervalo = setInterval(() => cargarPersonal(true), 15000);
    return () => clearInterval(intervalo);
  }, [cargarPersonal]);

  const generarClaveAleatoria = (esParaCrear = true) => {
    const numeros = Math.floor(1000 + Math.random() * 9000);
    const clave = `Sem-${numeros}*`;
    if (esParaCrear) {
      setNuevoMiembro(prev => ({ ...prev, password: clave }));
      setMostrarPasswordCrear(true);
    } else {
      setMiembroAEditar(prev => ({ ...prev, password: clave }));
      setMostrarPasswordEditar(true);
    }
  };

  const handleCrearPersonal = async (e) => {
    e.preventDefault();
    setErrorCrear('');

    if (!nuevoMiembro.nombre.trim()) {
      setErrorCrear('Ingresa el nombre completo del profesional.');
      return;
    }
    if (!nuevoMiembro.email.trim()) {
      setErrorCrear('Ingresa el correo electrónico institucional.');
      return;
    }
    if (!nuevoMiembro.password || nuevoMiembro.password.length < 6) {
      setErrorCrear('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCreando(true);
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const res = await fetch(`${API_BASE_URL}/api/auth/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: nuevoMiembro.nombre.trim(),
          email: nuevoMiembro.email.toLowerCase().trim(),
          password: nuevoMiembro.password,
          rol: nuevoMiembro.rol,
          telefono: nuevoMiembro.telefono ? nuevoMiembro.telefono.trim() : '',
          municipio: nuevoMiembro.municipio || 'Neiva'
        })
      });

      const data = await res.json();

      if (data.success) {
        setMensaje(`✅ Profesional "${nuevoMiembro.nombre}" registrado con éxito como ${nuevoMiembro.rol}.`);
        setIsModalCrearOpen(false);
        setNuevoMiembro({
          nombre: '',
          email: '',
          password: '',
          rol: 'Veterinario',
          telefono: '',
          municipio: 'Neiva'
        });
        cargarPersonal(true);
      } else {
        setErrorCrear(data.mensaje || 'Error al registrar profesional');
      }
    } catch (err) {
      console.error(err);
      setErrorCrear('Error de conexión con el servidor.');
    } finally {
      setCreando(false);
    }
  };

  const abrirModalEditar = (m) => {
    setErrorEditar('');
    setMiembroAEditar({
      id: m._id,
      nombre: m.nombre || '',
      email: m.email || '',
      rol: m.rol || 'Veterinario',
      telefono: m.telefono || '',
      municipio: m.municipio || 'Neiva',
      password: ''
    });
    setMostrarPasswordEditar(false);
    setIsModalEditarOpen(true);
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setErrorEditar('');

    if (!miembroAEditar.nombre.trim()) {
      setErrorEditar('El nombre es obligatorio.');
      return;
    }
    if (!miembroAEditar.email.trim()) {
      setErrorEditar('El correo es obligatorio.');
      return;
    }
    if (miembroAEditar.password && miembroAEditar.password.length < 6) {
      setErrorEditar('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setEditando(true);
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const payload = {
        nombre: miembroAEditar.nombre.trim(),
        email: miembroAEditar.email.toLowerCase().trim(),
        rol: miembroAEditar.rol,
        telefono: miembroAEditar.telefono ? miembroAEditar.telefono.trim() : '',
        municipio: miembroAEditar.municipio || 'Neiva'
      };

      if (miembroAEditar.password && miembroAEditar.password.trim() !== '') {
        payload.password = miembroAEditar.password.trim();
      }

      const res = await fetch(`${API_BASE_URL}/api/auth/usuarios/${miembroAEditar.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        setMensaje(`✅ Datos de "${miembroAEditar.nombre}" actualizados correctamente.`);
        setIsModalEditarOpen(false);
        cargarPersonal(true);
      } else {
        setErrorEditar(data.mensaje || 'Error al actualizar usuario');
      }
    } catch (err) {
      console.error(err);
      setErrorEditar('Error de conexión al actualizar usuario.');
    } finally {
      setEditando(false);
    }
  };

  const toggleEstado = async (id, estadoActual, nombre) => {
    const accion = estadoActual ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Estás seguro de ${accion} el acceso al sistema de "${nombre}"?`)) return;

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
        setMensaje(`Acceso de "${nombre}" ${!estadoActual ? 'activado' : 'desactivado'} con éxito.`);
        cargarPersonal(true);
      } else {
        setError("Error: " + data.mensaje);
      }
    } catch (err) {
      setError("Error de conexión al actualizar el usuario.");
    }
  };

  // Métricas
  const metricas = useMemo(() => {
    const total = personal.length;
    const veterinarios = personal.filter(u => (u.rol || '').toLowerCase() === 'veterinario').length;
    const admins = personal.filter(u => (u.rol || '').toLowerCase() === 'admin').length;
    const activos = personal.filter(u => u.estado).length;
    const inactivos = personal.filter(u => !u.estado).length;
    return { total, veterinarios, admins, activos, inactivos };
  }, [personal]);

  // Filtrado
  const personalFiltrado = useMemo(() => {
    return personal.filter(m => {
      const q = busqueda.toLowerCase().trim();
      const matchBusqueda = !q || 
        (m.nombre || '').toLowerCase().includes(q) || 
        (m.email || '').toLowerCase().includes(q) ||
        (m.telefono || '').toLowerCase().includes(q);

      if (!matchBusqueda) return false;

      const r = (m.rol || '').toLowerCase();
      if (filtroRol === 'veterinario') return r === 'veterinario';
      if (filtroRol === 'admin') return r === 'admin';
      if (filtroRol === 'inactivos') return !m.estado;
      return true;
    });
  }, [personal, busqueda, filtroRol]);

  const getInitials = (name) => {
    if (!name) return 'P';
    return name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  };

  const formatearFecha = (fechaRaw) => {
    if (!fechaRaw) return 'Reciente';
    try {
      return new Date(fechaRaw).toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch {
      return 'Reciente';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Cargando nómina de personal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Personal</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{metricas.total}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-sky-200/70 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Veterinarios</p>
            <p className="text-2xl font-black text-sky-600 mt-0.5">{metricas.veterinarios}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-inner">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-purple-200/70 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Administradores</p>
            <p className="text-2xl font-black text-purple-600 mt-0.5">{metricas.admins}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
            <Crown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-emerald-200/70 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Cuentas Activas</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{metricas.activos}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ALERTAS */}
      {mensaje && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{mensaje}</span>
          </div>
          <button onClick={() => setMensaje('')} className="text-emerald-600 hover:text-emerald-800 p-1">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800 p-1">
            <X size={16} />
          </button>
        </div>
      )}

      {/* BARRA DE ACCIÓN Y BÚSQUEDA */}
      <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar profesional por nombre, correo o celular..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          {busqueda && (
            <button 
              onClick={() => setBusqueda('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtros por Rol */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFiltroRol('todos')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filtroRol === 'todos' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({metricas.total})
          </button>
          <button
            onClick={() => setFiltroRol('veterinario')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              filtroRol === 'veterinario' ? 'bg-sky-600 text-white shadow-xs' : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
            }`}
          >
            <Stethoscope size={13} />
            Veterinarios ({metricas.veterinarios})
          </button>
          <button
            onClick={() => setFiltroRol('admin')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              filtroRol === 'admin' ? 'bg-purple-600 text-white shadow-xs' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <Crown size={13} />
            Admins ({metricas.admins})
          </button>
          <button
            onClick={() => setFiltroRol('inactivos')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              filtroRol === 'inactivos' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Inactivos ({metricas.inactivos})
          </button>
        </div>

        {/* Botón Nuevo Personal */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => cargarPersonal(false)}
            title="Sincronizar"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
          </button>
          <button
            onClick={() => {
              setErrorCrear('');
              setNuevoMiembro({
                nombre: '',
                email: '',
                password: '',
                rol: 'Veterinario',
                telefono: '',
                municipio: 'Neiva'
              });
              setIsModalCrearOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs md:text-sm font-bold rounded-2xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Registrar Personal</span>
          </button>
        </div>
      </div>

      {/* TABLA DE PERSONAL */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Nómina de Personal Registrada ({personalFiltrado.length})
          </p>
          {ultimaActualizacion && (
            <span className="text-[11px] font-medium text-slate-400">
              Sincronizado: {ultimaActualizacion}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Profesional</th>
                <th className="py-3 px-4">Rol Operativo</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Sede / Municipio</th>
                <th className="py-3 px-4">Fecha de Alta</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {personalFiltrado.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    No se encontró personal con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                personalFiltrado.map((m) => {
                  const esAdmin = (m.rol || '').toLowerCase() === 'admin';
                  return (
                    <tr key={m._id} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black shadow-xs ${
                            esAdmin ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-sky-100 text-sky-700 border border-sky-200'
                          }`}>
                            {getInitials(m.nombre)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs md:text-sm">{m.nombre}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail size={11} /> {m.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold uppercase tracking-wider border ${
                          esAdmin 
                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                            : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}>
                          {esAdmin ? <Crown size={12} /> : <Stethoscope size={12} />}
                          {m.rol}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {m.telefono ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">{m.telefono}</span>
                            <a
                              href={`https://wa.me/57${m.telefono.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Escribir por WhatsApp"
                              className="text-emerald-600 hover:text-emerald-700 p-1 rounded-lg hover:bg-emerald-50 transition"
                            >
                              <Phone size={13} />
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No registrado</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700">{m.municipio || 'Neiva'}</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-medium text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          {formatearFecha(m.createdAt)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          m.estado ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${m.estado ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                          {m.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => abrirModalEditar(m)}
                            title="Editar Datos / Cambiar Clave"
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => toggleEstado(m._id, m.estado, m.nombre)}
                            title={m.estado ? 'Desactivar acceso' : 'Activar acceso'}
                            className={`p-1.5 rounded-xl transition ${
                              m.estado 
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700' 
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            <Power size={14} />
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

      {/* MODAL: REGISTRAR NUEVO PERSONAL */}
      {isModalCrearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsModalCrearOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                <UserPlus size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Registrar Nuevo Profesional</h3>
                <p className="text-xs text-slate-500">Médico Veterinario o Administrador</p>
              </div>
            </div>

            {errorCrear && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                {errorCrear}
              </div>
            )}

            <form onSubmit={handleCrearPersonal} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Carlos Mendoza"
                  value={nuevoMiembro.nombre}
                  onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, nombre: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Correo Institucional *</label>
                <input
                  type="email"
                  required
                  placeholder="veterinario@sembriogan.com"
                  value={nuevoMiembro.email}
                  onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Rol Operativo *</label>
                  <select
                    value={nuevoMiembro.rol}
                    onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, rol: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Veterinario">Veterinario (Campo)</option>
                    <option value="Admin">Administrador (Master)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Municipio Sede</label>
                  <select
                    value={nuevoMiembro.municipio}
                    onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, municipio: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    {['Neiva', 'Rivera', 'Campoalegre', 'Garzón', 'Pitalito', 'Palermo', 'Gigante', 'La Plata'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="Ej: 3106663472"
                  value={nuevoMiembro.telefono}
                  onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, telefono: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Contraseña de Acceso *</label>
                  <button
                    type="button"
                    onClick={() => generarClaveAleatoria(true)}
                    className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound size={11} /> Generar Clave Segura
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={mostrarPasswordCrear ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={nuevoMiembro.password}
                    onChange={(e) => setNuevoMiembro({ ...nuevoMiembro, password: e.target.value })}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPasswordCrear(!mostrarPasswordCrear)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {mostrarPasswordCrear ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalCrearOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creando}
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  {creando ? 'Registrando...' : 'Guardar Profesional'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PERSONAL */}
      {isModalEditarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsModalEditarOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-inner">
                <Edit2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Editar Información</h3>
                <p className="text-xs text-slate-500">Actualizar datos de acceso o cargo</p>
              </div>
            </div>

            {errorEditar && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                {errorEditar}
              </div>
            )}

            <form onSubmit={handleGuardarEdicion} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={miembroAEditar.nombre}
                  onChange={(e) => setMiembroAEditar({ ...miembroAEditar, nombre: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={miembroAEditar.email}
                  onChange={(e) => setMiembroAEditar({ ...miembroAEditar, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Rol *</label>
                  <select
                    value={miembroAEditar.rol}
                    onChange={(e) => setMiembroAEditar({ ...miembroAEditar, rol: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Veterinario">Veterinario</option>
                    <option value="Admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Municipio Sede</label>
                  <select
                    value={miembroAEditar.municipio}
                    onChange={(e) => setMiembroAEditar({ ...miembroAEditar, municipio: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    {['Neiva', 'Rivera', 'Campoalegre', 'Garzón', 'Pitalito', 'Palermo', 'Gigante', 'La Plata'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={miembroAEditar.telefono}
                  onChange={(e) => setMiembroAEditar({ ...miembroAEditar, telefono: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Cambiar Contraseña (Opcional)</label>
                  <button
                    type="button"
                    onClick={() => generarClaveAleatoria(false)}
                    className="text-[10px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound size={11} /> Clave Segura
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={mostrarPasswordEditar ? 'text' : 'password'}
                    placeholder="Dejar en blanco para no modificar"
                    value={miembroAEditar.password}
                    onChange={(e) => setMiembroAEditar({ ...miembroAEditar, password: e.target.value })}
                    className="w-full pl-3.5 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPasswordEditar(!mostrarPasswordEditar)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {mostrarPasswordEditar ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalEditarOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editando}
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  {editando ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
