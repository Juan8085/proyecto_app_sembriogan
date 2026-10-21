import { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL, getApiUrl, getMediaUrl } from '../config/api';
import {
  MessageSquareQuote,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  Sparkles,
  Search,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

export default function AdminTestimonios() {
  const [testimonios, setTestimonios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | 'publicados' | 'pendientes'
  const [mensaje, setMensaje] = useState('');

  const cargarTestimoniosAdmin = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/testimonios/admin/todos`);
      const data = await res.json();
      if (data.success) {
        setTestimonios(data.data);
      }
    } catch (err) {
      console.error("Error cargando testimonios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTestimoniosAdmin();
  }, []);

  const cambiarEstado = async (id, estadoActual, autor) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/testimonios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aprobado: !estadoActual })
      });
      const data = await res.json();
      if (data.success) {
        setMensaje(`Testimonio de "${autor}" ${!estadoActual ? 'publicado en la web' : 'ocultado'}.`);
        cargarTestimoniosAdmin();
      }
    } catch (err) {
      console.error("Error cambiando estado:", err);
    }
  };

  const eliminarTestimonio = async (id, autor) => {
    if (!window.confirm(`¿Estás seguro de eliminar permanentemente el testimonio de "${autor}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/testimonios/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setMensaje(`Testimonio eliminado.`);
        cargarTestimoniosAdmin();
      }
    } catch (err) {
      console.error("Error eliminando:", err);
    }
  };

  const metricas = useMemo(() => {
    const total = testimonios.length;
    const publicados = testimonios.filter(t => t.aprobado).length;
    const pendientes = testimonios.filter(t => !t.aprobado).length;
    return { total, publicados, pendientes };
  }, [testimonios]);

  const testimoniosFiltrados = useMemo(() => {
    return testimonios.filter(t => {
      const q = busqueda.toLowerCase().trim();
      const matchBusqueda = !q || 
        t.nombre?.toLowerCase().includes(q) || 
        t.rol?.toLowerCase().includes(q) || 
        t.mensaje?.toLowerCase().includes(q);

      if (!matchBusqueda) return false;

      if (filtroEstado === 'publicados') return t.aprobado;
      if (filtroEstado === 'pendientes') return !t.aprobado;
      return true;
    });
  }, [testimonios, busqueda, filtroEstado]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Cargando testimonios de ganaderos y hatos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Reseñas</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{metricas.total}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
            <MessageSquareQuote className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Publicados en Web</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{metricas.publicados}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pendientes de Aprobación</p>
            <p className={`text-2xl font-black mt-1 ${metricas.pendientes > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {metricas.pendientes}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${metricas.pendientes > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* MENSAJE DE ÉXITO */}
      {mensaje && (
        <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{mensaje}</span>
        </div>
      )}

      {/* TABLA Y CONTROLES */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        
        {/* Cabecera */}
        <div className="p-6 md:p-8 border-b border-slate-100 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Testimonios e Historias de Éxito</h2>
              <p className="text-xs text-slate-500 mt-1">Autoriza o modera los testimonios de ganaderos que se exhiben en la landing pública.</p>
            </div>
          </div>

          {/* Filtros y Buscador */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
            
            {/* Buscador */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por productor, finca o texto..."
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
                onClick={() => setFiltroEstado('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filtroEstado === 'todos'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({metricas.total})
              </button>
              <button
                onClick={() => setFiltroEstado('publicados')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filtroEstado === 'publicados'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Publicados ({metricas.publicados})
              </button>
              <button
                onClick={() => setFiltroEstado('pendientes')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filtroEstado === 'pendientes'
                    ? 'bg-white text-amber-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pendientes ({metricas.pendientes})
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/75 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Productor / Hato</th>
                <th className="px-6 py-4">Rol / Ubicación</th>
                <th className="px-6 py-4">Testimonio</th>
                <th className="px-6 py-4 text-center">Estado Web</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {testimoniosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <MessageSquareQuote className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No hay testimonios que coincidan con la búsqueda.</p>
                  </td>
                </tr>
              ) : (
                testimoniosFiltrados.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                    
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {item.nombre}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                      {item.rol}
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-700 italic max-w-md line-clamp-2">
                        "{item.mensaje}"
                      </p>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        item.aprobado 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.aprobado ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {item.aprobado ? 'Publicado' : 'Pendiente'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button 
                          onClick={() => cambiarEstado(item._id, item.aprobado, item.nombre)}
                          className={`inline-flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-xl transition ${
                            item.aprobado 
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                          }`}
                        >
                          {item.aprobado ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {item.aprobado ? 'Ocultar' : 'Aprobar'}
                        </button>
                        <button 
                          onClick={() => eliminarTestimonio(item._id, item.nombre)}
                          className="inline-flex items-center gap-1.5 font-bold text-xs px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}