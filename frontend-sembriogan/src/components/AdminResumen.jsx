import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function AdminResumen() {
  const [stats, setStats] = useState({
    clientes: 0,
    procedimientos: 0,
    tasaExito: 0,
    ingresosAprox: 0
  });
  
  // Datos simulados de ventas semestrales para la gráfica
  // En producción, esto vendría del backend consolidando los pagos de Wompi
  const [datosGrafica, setDatosGrafica] = useState([
    { mes: 'Mar', ingresos: 1200000, procedimientos: 10 },
    { mes: 'Abr', ingresos: 1850000, procedimientos: 15 },
    { mes: 'May', ingresos: 1500000, procedimientos: 12 },
    { mes: 'Jun', ingresos: 2100000, procedimientos: 18 },
    { mes: 'Jul', ingresos: 2800000, procedimientos: 24 },
    { mes: 'Ago', ingresos: 3250000, procedimientos: 28 },
  ]);

  useEffect(() => {
    const fetchEstadisticas = async () => {
      try {
        const token = localStorage.getItem('tokenSembriogan');
        const res = await fetch('http://localhost:3000/api/registro-genetico', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.data) {
          const registros = data.data;
          
          // 1. Calcular Clientes Únicos
          const clientesUnicos = new Set(registros.map(r => r.productor)).size;
          
          // 2. Calcular Tasa de Preñez
          const preñadas = registros.filter(r => r.estadoPrenez === 'Preñada').length;
          const evaluadas = registros.filter(r => r.estadoPrenez === 'Preñada' || r.estadoPrenez === 'Vacía').length;
          const tasa = evaluadas > 0 ? ((preñadas / evaluadas) * 100).toFixed(1) : 0;

          // 3. Aproximación de Ingresos (Asumiendo un ticket promedio de $120.000 por procedimiento)
          const ingresosCalculados = registros.length * 120000;

          setStats({
            clientes: clientesUnicos,
            procedimientos: registros.length,
            tasaExito: tasa,
            ingresosAprox: ingresosCalculados
          });
        }
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
        {/* Tarjeta 1 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 border-l-4 border-primary">
          <div className="p-3 bg-blue-50 rounded-full text-2xl">💰</div>
          <div>
            <p className="text-sm text-gray-500 font-semibold">Ingresos Totales (Est.)</p>
            <p className="text-2xl font-bold text-gray-800">
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(stats.ingresosAprox)}
            </p>
          </div>
        </div>

        {/* Tarjeta 2 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 border-l-4 border-green-500">
          <div className="p-3 bg-green-50 rounded-full text-2xl">📈</div>
          <div>
            <p className="text-sm text-gray-500 font-semibold">Tasa de Preñez</p>
            <p className="text-2xl font-bold text-gray-800">{stats.tasaExito}%</p>
          </div>
        </div>

        {/* Tarjeta 3 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 border-l-4 border-yellow-500">
          <div className="p-3 bg-yellow-50 rounded-full text-2xl">👥</div>
          <div>
            <p className="text-sm text-gray-500 font-semibold">Productores Atendidos</p>
            <p className="text-2xl font-bold text-gray-800">{stats.clientes}</p>
          </div>
        </div>

        {/* Tarjeta 4 */}
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
        
        {/* Gráfica 1: Ingresos Semestrales */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Evolución de Ingresos Semestrales</h3>
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
                  tickFormatter={(value) => `$${value / 1000000}M`} 
                  axisLine={false} tickLine={false} 
                />
                <Tooltip formatter={(value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value)} />
                <Area type="monotone" dataKey="ingresos" stroke="#0284c7" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica 2: Volumen de Procedimientos */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Volumen de Procedimientos</h3>
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