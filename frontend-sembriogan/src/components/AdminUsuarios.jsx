import { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL, getApiUrl, getMediaUrl } from '../config/api';
import {
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Search,
  Sparkles,
  Power,
  CheckCircle2,
  XCircle,
  X,
  Stethoscope,
  Crown
} from 'lucide-react';

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos'); // 'todos' | 'admin' | 'veterinario' | 'inactivos'
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // Cargar usuarios desde el backend
  const cargarUsuarios = async () => {
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const res = await fetch(`${API_BASE_URL}/api/auth/usuarios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setUsuarios(data.data);
      }
    } catch (err) {
      console.error("Error cargando usuarios:", err);
      setError('Error al sincronizar lista de usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

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
        cargarUsuarios();
      } else {
        setError("Error: " + data.mensaje);
      }
    } catch (err) {
      setError("Error de conexión al actualizar el usuario.");
    }
  };

  // Métricas
  const metricas = useMemo(() => {
    const total = usuarios.length;
    const admins = usuarios.filter(u => u.rol?.toLowerCase() === 'admin').length;
    const activos = usuarios.filter(u => u.estado).length;
    const inactivos = usuarios.filter(u => !u.estado).length;
    return { total, admins, activos, inactivos };
  }, [usuarios]);

  // Filtrado
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter(u => {
      const q = busqueda.toLowerCase().trim();
      const matchBusqueda = !q || 
        u.nombre?.toLowerCase().includes(q) || 
        u.email?.toLowerCase().includes(q);

      if (!matchBusqueda) return false;

      if (filtroRol === 'admin') return u.rol?.toLowerCase() === 'admin';
      if (filtroRol === 'veterinario') return u.rol?.toLowerCase() !== 'admin';
      if (filtroRol === 'inactivos') return !u.estado;
      return true;
    });
  }, [usuarios, busqueda, filtroRol]);

  // Generar iniciales
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Cargando nómina de personal y permisos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Cuentas</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{metricas.total}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Administradores</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{metricas.admins}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
            <Crown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Acceso Activo</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{metricas.activos}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suspendidos</p>
            <p className={`text-2xl font-black mt-1 ${metricas.inactivos > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {metricas.inactivos}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${metricas.inactivos > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
            <UserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* MENSAJES DE ESTADO */}
      {mensaje && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{mensaje}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        
        {/* Cabecera y Herramientas */}
        <div className="p-6 md:p-8 border-b border-slate-100 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Directorio y Control de Accesos</h2>
              <p className="text-xs text-slate-500 mt-1">Supervisa roles de usuario, permisos del sistema y estado de acceso de veterinarios.</p>
            </div>
            
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full self-start md:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Autenticación JWT Cifrada</span>
            </div>
          </div>

          {/* Filtros y Buscador */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
            
            {/* Buscador */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Chips de filtro */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/70">
              <button
                onClick={() => setFiltroRol('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filtroRol === 'todos'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({metricas.total})
              </button>
              <button
                onClick={() => setFiltroRol('admin')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filtroRol === 'admin'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Admins ({metricas.admins})
              </button>
              <button
                onClick={() => setFiltroRol('veterinario')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filtroRol === 'veterinario'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Veterinarios ({metricas.total - metricas.admins})
              </button>
              <button
                onClick={() => setFiltroRol('inactivos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
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
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-center">Acción de Acceso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No se encontraron usuarios coincidentes.</p>
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((user) => {
                  const isAdmin = user.rol?.toLowerCase() === 'admin';
                  return (
                    <tr key={user._id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Avatar e Identidad */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shadow-inner ${
                            isAdmin 
                              ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/20' 
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
                            : 'bg-blue-50 text-blue-700 border border-blue-200/60'
                        }`}>
                          {isAdmin ? <Crown className="w-3 h-3 text-purple-600" /> : <Stethoscope className="w-3 h-3 text-blue-600" />}
                          {user.rol}
                        </span>
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

                      {/* Botón de Acción */}
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => toggleEstado(user._id, user.estado, user.nombre)}
                          className={`inline-flex items-center gap-1.5 font-bold text-xs px-3.5 py-1.5 rounded-xl transition ${
                            user.estado 
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60' 
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          {user.estado ? 'Desactivar' : 'Reactivar'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}