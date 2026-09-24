import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function AdminResumen() {
  const [stats, setStats] = useState({
    clientes: 0,
    procedimientos: 0,
    tasaExito: 0,
    ingresosAprox: 0
  });
  
  const [datosGrafica, setDatosGrafica] = useState([]);

  useEffect(() => {
    const fetchEstadisticas = async () => {
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
      }
    };

    fetchEstadisticas();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* TARJETAS DE INDICADORES (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 border-l-4 border-primary">
          <div className="p-3 bg-blue-50 rounded-full text-2xl">💰</div>
          <div>
            <p className="text-sm text-gray-500 font-semibold">Ingresos Reales (Ventas)</p>
            <p className="text-2xl font-bold text-gray-800">
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(stats.ingresosAprox)}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 border-l-4 border-green-500">
          <div className="p-3 bg-green-50 rounded-full text-2xl">📈</div>
          <div>
            <p className="text-sm text-gray-500 font-semibold">Tasa de Preñez</p>
            <p className="text-2xl font-bold text-gray-800">{stats.tasaExito}%</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 border-l-4 border-yellow-500">
          <div className="p-3 bg-yellow-50 rounded-full text-2xl">👥</div>
          <div>
            <p className="text-sm text-gray-500 font-semibold">Productores Atendidos</p>
            <p className="text-2xl font-bold text-gray-800">{stats.clientes}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 border-l-4 border-purple-500">
          <div className="p-3 bg-purple-50 rounded-full text-2xl">💉</div>
          <div>
            <p className="text-sm text-gray-500 font-semibold">Procedimientos</p>
            <p className="text-2xl font-bold text-gray-800">{stats.procedimientos}</p>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfica 1: Ingresos Reales */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Evolución de Ingresos (Real)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={datosGrafica}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                <YAxis 
                  tickFormatter={(value) => `$${value / 1000}k`} 
                  axisLine={false} tickLine={false} 
                />
                <Tooltip formatter={(value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value)} />
                <Area type="monotone" dataKey="ingresos" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica 2: Volumen de Procedimientos / Ventas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Volumen de Artículos y Servicios Vendidos</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosGrafica}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="procedimientos" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}