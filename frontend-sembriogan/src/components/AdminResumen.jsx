import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  DollarSign, 
  Activity, 
  Users2, 
  Dna, 
  RotateCw, 
  TrendingUp, 
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';

export default function AdminResumen() {
  const [stats, setStats] = useState({
    clientes: 0,
    procedimientos: 0,
    tasaExito: 0,
    ingresosAprox: 0
  });
  
  const [datosGrafica, setDatosGrafica] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEstadisticas = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('tokenSembriogan');
      
      // 1. Obtener registros genéticos para métricas de campo
      const resGen = await fetch('http://localhost:3000/api/registro-genetico', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataGen = await resGen.json();

      let clientesUnicos = 0;
      let totalProcedimientos = 0;
      let tasa = 0;

      if (dataGen.success && dataGen.data) {
        const registros = dataGen.data;
        clientesUnicos = new Set(registros.map(r => r.productor)).size;
        totalProcedimientos = registros.length;
        
        const preñadas = registros.filter(r => r.estadoPrenez === 'Preñada').length;
        const evaluadas = registros.filter(r => r.estadoPrenez === 'Preñada' || r.estadoPrenez === 'Vacía').length;
        tasa = evaluadas > 0 ? ((preñadas / evaluadas) * 100).toFixed(1) : 0;
      }

      // 2. Obtener resumen financiero real del backend de órdenes
      const resFin = await fetch('http://localhost:3000/api/ordenes/resumen-financiero', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataFin = await resFin.json();

      let ingresosReales = 0;
      if (dataFin.success) {
        ingresosReales = dataFin.ingresosTotales;
        if (dataFin.datosGrafica && dataFin.datosGrafica.length > 0) {
          setDatosGrafica(dataFin.datosGrafica);
        }
      }

      setStats({
        clientes: clientesUnicos,
        procedimientos: totalProcedimientos,
        tasaExito: tasa,
        ingresosAprox: ingresosReales
      });

    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchEstadisticas();

    // Actualización automática cada 8 segundos para reflejar pagos de Wompi en tiempo real
    const interval = setInterval(fetchEstadisticas, 8000);
    window.addEventListener('focus', fetchEstadisticas);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchEstadisticas);
    };
  }, []);

  return (
    <div className="space-y-6">
      
      {/* BANNER DE BIENVENIDA Y CONTROL */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} className="text-blue-300" /> Monitoreo Inteligente
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">&middot; Actualización en vivo</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Resumen Operativo y Financiero
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Consolidado de ventas en tienda pública, pasarela de pagos Wompi y protocolos de biotecnología reproductiva.
            </p>
          </div>

          <button 
            onClick={fetchEstadisticas}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-xs font-bold transition shadow-sm backdrop-blur-sm self-stretch sm:self-auto justify-center"
            title="Refrescar métricas ahora"
          >
            <RotateCw size={14} className={isRefreshing ? 'animate-spin text-blue-300' : ''} />
            <span>{isRefreshing ? 'Actualizando...' : 'Sincronizar'}</span>
          </button>
        </div>
      </div>

      {/* TARJETAS DE INDICADORES (KPIs) CON DISEÑO MODERNO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Ingresos Reales */}
        <div className="bg-white p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200/70 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3.5 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
              <DollarSign size={22} />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
              <TrendingUp size={12} /> Ventas
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ingresos Reales</p>
            <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(stats.ingresosAprox)}
            </p>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <PackageCheck size={12} className="text-emerald-500" /> Wompi y Pasarelas activas
            </p>
          </div>
        </div>

        {/* KPI 2: Tasa de Preñez */}
        <div className="bg-white p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200/70 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3.5 bg-gradient-to-tr from-blue-500 to-cyan-500 text-white rounded-2xl shadow-lg shadow-blue-500/20">
              <Activity size={22} />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
              Efectividad
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tasa de Preñez</p>
            <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
              {stats.tasaExito}%
            </p>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <ShieldCheck size={12} className="text-blue-500" /> Animales diagnosticados
            </p>
          </div>
        </div>

        {/* KPI 3: Productores */}
        <div className="bg-white p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200/70 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3.5 bg-gradient-to-tr from-amber-500 to-orange-500 text-white rounded-2xl shadow-lg shadow-amber-500/20">
              <Users2 size={22} />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
              Fincas
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Productores Atendidos</p>
            <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
              {stats.clientes}
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              Clientes vinculados a EPSEA
            </p>
          </div>
        </div>

        {/* KPI 4: Procedimientos */}
        <div className="bg-white p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200/70 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3.5 bg-gradient-to-tr from-violet-500 to-indigo-500 text-white rounded-2xl shadow-lg shadow-violet-500/20">
              <Dna size={22} />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-200/60">
              Biotecnología
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Procedimientos Totales</p>
            <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
              {stats.procedimientos}
            </p>
            <p className="text-[11px] text-slate-500 mt-2">
              IATF, IA y Transferencia de Embriones
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICAS ESTILIZADAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfica 1: Ingresos Reales */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-sm border border-slate-200/70">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Evolución de Ingresos (COP)</h3>
              <p className="text-xs text-slate-400">Total recaudado por mes en ventas y servicios</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
              Histórico
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datosGrafica}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis 
                  tickFormatter={(value) => `$${value / 1000}k`} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff' }}
                  formatter={(value) => [new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value), 'Ingresos']} 
                />
                <Area type="monotone" dataKey="ingresos" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica 2: Volumen de Procedimientos / Ventas */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl shadow-sm border border-slate-200/70">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Volumen de Actividad Mensual</h3>
              <p className="text-xs text-slate-400">Artículos despachados y servicios ejecutados</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
              Operaciones
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosGrafica}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc', radius: 12 }}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff' }}
                  formatter={(value) => [value, 'Operaciones']}
                />
                <Bar dataKey="procedimientos" fill="#10b981" radius={[8, 8, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}