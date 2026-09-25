import { useState, useEffect } from 'react';

export default function AdminTrazabilidad() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar registros desde el backend
  const cargarRegistros = async () => {
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const res = await fetch('http://localhost:3000/api/registro-genetico', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setRegistros(data.data);
      }
    } catch (error) {
      console.error("Error cargando registros:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRegistros();
  }, []);

  const formatearFecha = (fecha) => new Date(fecha).toLocaleDateString('es-CO');

  // Lógica para exportar a Excel (CSV)
  const exportarExcelGenetica = () => {
    if (registros.length === 0) {
      alert('No hay registros para exportar.');
      return;
    }
    
    let csv = "Productor,Finca,Chapeta Vaca,Tecnica,Genetica Utilizada,Fecha Procedimiento (Día 0),Fecha Palpacion,Estado Prenez,Veterinario\n";
    
    registros.forEach(r => {
      const fProc = r.fechaProcedimiento ? formatearFecha(r.fechaProcedimiento) : (r.fechasProtocolo?.dia0_sincronizacion ? formatearFecha(r.fechasProtocolo.dia0_sincronizacion) : '');
      const fPalp = r.fechaPalpacion ? formatearFecha(r.fechaPalpacion) : '';
      csv += `"${r.productor || ''}","${r.finca || ''}","${r.animalId || r.arete || ''}","${r.tipoProcedimiento || ''}","${r.geneticaUtilizada || ''}","${fProc}","${fPalp}","${r.estadoPrenez || ''}","${r.veterinarioAsignado || ''}"\n`;
    });
    
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Genetica_Sembriogan_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // NUEVA LÓGICA DE ALERTAS
  const obtenerAlertaProtocolo = (registro) => {
    // 1. Si el ciclo ya se cerró (Preñada o Vacía), no hay más alertas futuras.
    if (registro.estadoPrenez === 'Preñada') {
      return { texto: 'Ciclo Cerrado (Preñez Confirmada)', color: 'bg-green-50 text-green-700 border border-green-200' };
    }
    if (registro.estadoPrenez === 'Vacía') {
      return { texto: 'Ciclo Cerrado (Animal Vacío)', color: 'bg-gray-100 text-gray-500 border border-gray-200' };
    }

    const hoy = new Date();
    const fechaBase = registro.fechasProtocolo?.dia0_sincronizacion || registro.fechaProcedimiento;
    
    if (!fechaBase) return { texto: 'Sin fecha de inicio', color: 'bg-gray-100 text-gray-600' };

    const dia0 = new Date(fechaBase);
    const sumarDias = (fecha, dias) => {
      const nueva = new Date(fecha);
      nueva.setDate(nueva.getDate() + dias);
      return nueva;
    };

    const pasos = [
      { nombre: 'Retiro Dispositivo (Día 8)', fecha: sumarDias(dia0, 8) }
    ];

    if (registro.tipoProcedimiento === 'IATF') {
      pasos.push({ nombre: 'Inseminación (Día 10)', fecha: sumarDias(dia0, 10) });
    } else if (registro.tipoProcedimiento === 'TE') {
      pasos.push({ nombre: 'Transferencia (Día 17)', fecha: sumarDias(dia0, 17) });
    }
    
    pasos.push({ nombre: 'Conf. Preñez (Día 45)', fecha: sumarDias(dia0, 45) });
    
    if (registro.tipoProcedimiento === 'TE') {
      pasos.push({ nombre: 'Entrega (Día 90)', fecha: sumarDias(dia0, 90) });
    }

    const proximoPaso = pasos.find(p => p.fecha >= hoy.setHours(0,0,0,0));

    if (!proximoPaso) return { texto: 'Protocolo Finalizado. Pendiente Estado.', color: 'bg-yellow-50 text-yellow-700 border border-yellow-200' };

    const diasFaltantes = Math.ceil((proximoPaso.fecha - new Date()) / (1000 * 60 * 60 * 24));
    const fechaPasoStr = formatearFecha(proximoPaso.fecha);
    
    if (diasFaltantes === 0) return { texto: `¡HOY! ${proximoPaso.nombre}`, color: 'bg-red-100 text-red-700 font-bold animate-pulse' };
    if (diasFaltantes <= 3) return { texto: `En ${diasFaltantes} días: ${proximoPaso.nombre} (${fechaPasoStr})`, color: 'bg-amber-100 text-amber-800 font-bold' };
    return { texto: `Próximo: ${proximoPaso.nombre} (${fechaPasoStr})`, color: 'bg-blue-50 text-blue-700' };
  };

  if (loading) return <div className="text-center p-6 text-gray-500">Cargando trazabilidad y protocolos...</div>;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 space-y-6 w-full">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary">Trazabilidad Genética y Protocolos</h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Monitoreo de procedimientos, diagnósticos y alertas de campo.</p>
        </div>
        <button 
          onClick={exportarExcelGenetica}
          className="bg-secondary text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-green-600 transition w-full sm:w-auto text-sm"
        >
          📊 Exportar a Excel
        </button>
      </div>

      {/* VISTA ESCRITORIO (Tabla) */}
      <div className="hidden lg:block overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 font-bold">Finca / Productor</th>
              <th className="px-4 py-3 font-bold">Chapeta</th>
              <th className="px-4 py-3 font-bold">Procedimiento</th>
              <th className="px-4 py-3 font-bold">Genética</th>
              <th className="px-4 py-3 font-bold">Alerta Activa</th>
              <th className="px-4 py-3 font-bold text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {registros.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No hay procedimientos registrados.</td>
              </tr>
            ) : (
              registros.map((reg) => {
                const alerta = obtenerAlertaProtocolo(reg);
                return (
                  <tr key={reg._id} className="bg-white border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span className="block font-bold text-gray-800">{reg.finca || reg.productor}</span>
                      <span className="text-xs text-gray-500">{reg.finca ? reg.productor : ''}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-primary">
                      {reg.animalId || reg.arete}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${reg.tipoProcedimiento === 'IATF' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {reg.tipoProcedimiento}
                      </span>
                      <span className="text-xs text-gray-400 block mt-1">Día 0: {formatearFecha(reg.fechaProcedimiento || reg.fechasProtocolo?.dia0_sincronizacion)}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">{reg.geneticaUtilizada || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1.5 rounded-xl text-xs block text-center font-medium ${alerta.color}`}>
                        {alerta.texto}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold 
                        ${(reg.estadoPrenez === 'Pendiente' || reg.estadoPrenez === 'Pendiente Evaluación') ? 'bg-yellow-100 text-yellow-700' : 
                          (reg.estadoPrenez === 'Preñada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}`}>
                        {reg.estadoPrenez}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* VISTA MÓVIL (Tarjetas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
        {registros.map((reg) => {
          const alerta = obtenerAlertaProtocolo(reg);
          return (
            <div key={reg._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-3 relative">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800 text-base">{reg.finca || reg.productor}</h3>
                  <p className="text-primary font-bold text-sm">Chapeta: {reg.animalId || reg.arete}</p>
                </div>
                <span className={`px-2 py-1 rounded-md text-xs font-bold ${reg.tipoProcedimiento === 'IATF' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  {reg.tipoProcedimiento}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 border-t border-gray-100 pt-2 flex justify-between">
                <div>
                  <span className="font-bold block text-xs text-gray-400">Genética:</span> 
                  {reg.geneticaUtilizada || 'N/A'}
                </div>
                <div className="text-right">
                  <span className="font-bold block text-xs text-gray-400">Día 0 (Inicio):</span> 
                  {formatearFecha(reg.fechaProcedimiento || reg.fechasProtocolo?.dia0_sincronizacion)}
                </div>
              </div>

              <div className={`p-2.5 rounded-lg text-xs font-medium text-center ${alerta.color}`}>
                {alerta.texto.includes('Ciclo Cerrado') ? '✓ ' : '⚠️ '} {alerta.texto}
              </div>

              <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                <span className="text-xs font-semibold text-gray-400">Vet: {reg.veterinarioAsignado || 'No asignado'}</span>
                <span className={`px-2 py-1 rounded-md text-xs font-bold ${(reg.estadoPrenez === 'Pendiente' || reg.estadoPrenez === 'Pendiente Evaluación') ? 'bg-yellow-100 text-yellow-700' : (reg.estadoPrenez === 'Preñada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}`}>
                  {reg.estadoPrenez}
                </span>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  );
}