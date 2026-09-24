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

  // Lógica para exportar a Excel (CSV)
  const exportarExcelGenetica = () => {
    if (registros.length === 0) {
      alert('No hay registros para exportar.');
      return;
    }
    
    let csv = "Productor,Finca,Chapeta Vaca,Tecnica,Genetica Utilizada,Fecha Procedimiento,Fecha Palpacion,Estado Prenez,Veterinario\n";
    
    registros.forEach(r => {
      const fProc = r.fechaProcedimiento ? new Date(r.fechaProcedimiento).toLocaleDateString('es-CO') : '';
      const fPalp = r.fechaPalpacion ? new Date(r.fechaPalpacion).toLocaleDateString('es-CO') : '';
      csv += `"${r.productor}","${r.finca}","${r.animalId}","${r.tipoProcedimiento}","${r.geneticaUtilizada}","${fProc}","${fPalp}","${r.estadoPrenez}","${r.veterinarioAsignado}"\n`;
    });
    
    // Añadimos el BOM (\uFEFF) para que Excel reconozca las tildes correctamente
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Genetica_Sembriogan_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="text-center p-4 text-gray-500">Cargando trazabilidad...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary">Trazabilidad Genética</h2>
          <p className="text-gray-500 text-sm mt-1">Monitoreo de procedimientos y diagnósticos en campo.</p>
        </div>
        <button 
          onClick={exportarExcelGenetica}
          className="bg-secondary text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-green-600 transition"
        >
          📊 Exportar a Excel
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 font-bold">Fecha</th>
              <th className="px-4 py-3 font-bold">Finca / Productor</th>
              <th className="px-4 py-3 font-bold">Chapeta</th>
              <th className="px-4 py-3 font-bold">Genética</th>
              <th className="px-4 py-3 font-bold text-center">Estado</th>
              <th className="px-4 py-3 font-bold">Veterinario</th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No hay procedimientos registrados.</td>
              </tr>
            ) : (
              registros.map((reg) => (
                <tr key={reg._id} className="bg-white border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {new Date(reg.fechaProcedimiento).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="block font-bold text-gray-800">{reg.finca}</span>
                    <span className="text-xs text-gray-500">{reg.productor}</span>
                  </td>
                  <td className="px-4 py-3 font-bold text-primary">
                    {reg.animalId} <span className="text-xs font-normal text-gray-500 block">({reg.tipoProcedimiento})</span>
                  </td>
                  <td className="px-4 py-3">{reg.geneticaUtilizada}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold 
                      ${reg.estadoPrenez === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' : 
                        (reg.estadoPrenez === 'Preñada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}`}>
                      {reg.estadoPrenez}
                    </span>
                  </td>
                  <td className="px-4 py-3">{reg.veterinarioAsignado}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}