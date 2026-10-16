import { useState, useEffect } from 'react';
import { FileText, MessageCircle, Printer, X, Award, CheckCircle2 } from 'lucide-react';

export default function AdminTrazabilidad() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [certificadoModal, setCertificadoModal] = useState(null);

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

  // Enviar Reporte Clínico directo por WhatsApp al ganadero
  const compartirWhatsAppAdmin = (reg) => {
    const arete = reg.animalId || reg.arete || 'Sin Chapeta';
    const finca = reg.finca || 'No especificada';
    const productor = reg.productor || 'Ganadero';
    const procedimiento = reg.tipoProcedimiento || 'Reproducción';
    const genetica = reg.geneticaUtilizada || 'Convencional';
    const prenez = reg.estadoPrenez || 'Pendiente Evaluación';
    const vet = reg.veterinarioAsignado || 'Equipo Veterinario Sembriogan';
    const dia0 = reg.fechasProtocolo?.dia0_sincronizacion || reg.fechaProcedimiento || reg.createdAt;
    const dia0Str = dia0 ? new Date(dia0).toLocaleDateString('es-CO') : 'N/A';
    const observaciones = reg.observaciones ? `\n📝 *Novedades / Observaciones:* ${reg.observaciones}` : '';

    const mensaje = 
`📋 *REPORTE CLÍNICO REPRODUCTIVO - SEMBRIOGAN*
----------------------------------------
🐮 *Animal / Chapeta:* ${arete}
🏡 *Finca:* ${finca}
👤 *Productor:* ${productor}
🧬 *Procedimiento:* ${procedimiento}
💉 *Genética:* ${genetica}
📅 *Fecha Inicio (Día 0):* ${dia0Str}
🩺 *Diagnóstico Actual:* ${prenez}${observaciones}
👨‍⚕️ *Veterinario Asignado:* ${vet}
----------------------------------------
_Generado desde el Panel Administrativo Sembriogan (Somos EPSEA)._`;

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  // NUEVA LÓGICA DE ALERTAS
  const obtenerAlertaProtocolo = (registro) => {
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

    const pasos = [];
    const comp = registro.pasosCompletados || {};

    if (!comp.dia8_retiro) {
        pasos.push({ nombre: 'Retiro Dispositivo (Día 8)', fecha: sumarDias(dia0, 8) });
    }

    if (registro.tipoProcedimiento === 'IATF') {
        if (!comp.dia10_inseminacion) pasos.push({ nombre: 'Inseminación (Día 10)', fecha: sumarDias(dia0, 10) });
    } else if (registro.tipoProcedimiento === 'TE') {
        if (!comp.dia17_transferencia) pasos.push({ nombre: 'Transferencia (Día 17)', fecha: sumarDias(dia0, 17) });
    }
    
    pasos.push({ nombre: 'Conf. Preñez (Día 45)', fecha: sumarDias(dia0, 45) });
    
    if (registro.tipoProcedimiento === 'TE') {
        pasos.push({ nombre: 'Entrega (Día 90)', fecha: sumarDias(dia0, 90) });
    }

    // El próximo paso será el primero que no esté completado en la secuencia lógica
    const proximoPaso = pasos[0]; 

    if (!proximoPaso) return { texto: 'Protocolo Finalizado. Pendiente Estado.', color: 'bg-yellow-50 text-yellow-700 border border-yellow-200' };

    const diasFaltantes = Math.ceil((proximoPaso.fecha - new Date()) / (1000 * 60 * 60 * 24));
    
    // Función para formatear fecha a dd/mm/yyyy localmente
    const formatear = (f) => {
        const d = new Date(f);
        return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
    };
    
    const fechaPasoStr = formatear(proximoPaso.fecha);
    
    if (diasFaltantes < 0) return { texto: `¡RETRASADO! ${proximoPaso.nombre} (${Math.abs(diasFaltantes)} días)`, color: 'bg-red-200 text-red-800 font-bold animate-pulse' };
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
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Monitoreo de procedimientos, diagnósticos clínicos, certificados y alertas de campo.</p>
        </div>
        <button 
          onClick={exportarExcelGenetica}
          className="bg-secondary text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-green-600 transition w-full sm:w-auto text-sm flex items-center justify-center gap-2"
        >
          <span>📊</span> Exportar a Excel
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
              <th className="px-4 py-3 font-bold text-center">Acciones / Reporte</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {registros.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No hay procedimientos registrados.</td>
              </tr>
            ) : (
              registros.map((reg) => {
                const alerta = obtenerAlertaProtocolo(reg);
                return (
                  <tr key={reg._id} className="bg-white border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span className="block font-bold text-gray-800">{reg.productor} {reg.finca ? `(${reg.finca})` : ''}</span>
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full inline-block mt-1">{reg.productorEmail || 'Sin correo vinculado'}</span>
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
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setCertificadoModal(reg)} 
                          className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-blue-200 transition shadow-xs"
                          title="Ver / Imprimir Certificado Clínico Oficial"
                        >
                          <FileText size={14} /> Certificado
                        </button>
                        <button 
                          onClick={() => compartirWhatsAppAdmin(reg)} 
                          className="px-2.5 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-green-200 transition shadow-xs"
                          title="Enviar Reporte por WhatsApp"
                        >
                          <MessageCircle size={14} /> WhatsApp
                        </button>
                      </div>
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
                  <h3 className="font-bold text-gray-800 text-base">{reg.productor} {reg.finca ? `(${reg.finca})` : ''}</h3>
                  <p className="text-[10px] text-blue-600 mb-1">{reg.productorEmail || 'Sin correo vinculado'}</p>
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

              {/* Botones de acción en vista móvil */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                <button 
                  onClick={() => setCertificadoModal(reg)} 
                  className="w-full py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border border-blue-200 transition"
                >
                  <FileText size={14} /> Certificado
                </button>
                <button 
                  onClick={() => compartirWhatsAppAdmin(reg)} 
                  className="w-full py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border border-green-200 transition"
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL DE CERTIFICADO CLÍNICO OFICIAL (LISTO PARA IMPRIMIR / PDF) */}
      {certificadoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-6 sm:p-8 relative my-8 border border-slate-200 flex flex-col">
            
            {/* Botones de Acción Superior (Ocultos en impresión) */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 print:hidden">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Award size={16} className="text-blue-600" /> Certificado Clínico Reproductivo Oficial
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                >
                  <Printer size={16} /> Imprimir / Guardar PDF
                </button>
                <button 
                  onClick={() => compartirWhatsAppAdmin(certificadoModal)} 
                  className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-green-700 transition flex items-center gap-2 shadow-sm"
                >
                  <MessageCircle size={16} /> Enviar WhatsApp
                </button>
                <button 
                  onClick={() => setCertificadoModal(null)} 
                  className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* CONTENIDO DEL CERTIFICADO - MEMBRETE Y FORMATO OFICIAL */}
            <div className="space-y-6 print:m-0" id="certificado-imprimible">
              {/* Encabezado con Membrete */}
              <div className="flex flex-col sm:flex-row justify-between items-center border-b-2 border-slate-900 pb-5 gap-4 text-center sm:text-left">
                <img src="/logo.png" alt="Sembriogan" className="h-14 sm:h-16 object-contain" />
                <div className="sm:text-right">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">SEMBRIOGAN - SOMOS EPSEA</h3>
                  <p className="text-xs text-slate-600 font-semibold">Biotecnología Reproductiva y Mejoramiento Genético Bovino</p>
                  <p className="text-[11px] text-slate-500">Certificación Oficial de Procedimientos de Campo</p>
                </div>
              </div>

              {/* Título Central */}
              <div className="text-center py-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  Ficha Oficial No. {certificadoModal._id.slice(-8).toUpperCase()}
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">CERTIFICADO CLÍNICO DE REPRODUCCIÓN</h4>
                <p className="text-xs text-slate-500 mt-1">Expedido bajo estándares de buenas prácticas de manejo reproductivo y trazabilidad animal.</p>
              </div>

              {/* Bloque 1: Datos del Predio y del Animal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Identificación del Animal</p>
                  <p className="font-black text-base text-slate-900 mt-1">Chapeta / Arete: <span className="text-blue-700">{certificadoModal.animalId || certificadoModal.arete}</span></p>
                  <p className="text-slate-600 mt-0.5">Raza / Tipo: <span className="font-semibold text-slate-800">{certificadoModal.raza || 'Bovino'}</span></p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Predio y Propietario</p>
                  <p className="font-black text-slate-900 mt-1">Finca: <span className="font-semibold text-slate-800">{certificadoModal.finca || 'No especificada'}</span></p>
                  <p className="text-slate-600 mt-0.5">Productor: <span className="font-semibold text-slate-800">{certificadoModal.productor}</span></p>
                  {certificadoModal.productorEmail && (
                    <p className="text-[11px] text-slate-500">Email: {certificadoModal.productorEmail}</p>
                  )}
                </div>
              </div>

              {/* Bloque 2: Detalles del Protocolo y Biotecnología */}
              <div className="border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm space-y-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Protocolo Biotecnológico Aplicado</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-xs text-slate-500 block">Técnica:</span>
                    <span className="font-black text-slate-800 text-sm">{certificadoModal.tipoProcedimiento}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Genética / Pajilla:</span>
                    <span className="font-bold text-slate-800 text-sm">{certificadoModal.geneticaUtilizada || 'Convencional'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Fecha Inicio (Día 0):</span>
                    <span className="font-bold text-slate-800 text-sm">{formatearFecha(certificadoModal.fechasProtocolo?.dia0_sincronizacion || certificadoModal.fechaProcedimiento || certificadoModal.createdAt)}</span>
                  </div>
                </div>

                {/* Hitos del cronograma */}
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-slate-400 block">Retiro Disp. (Día 8)</span>
                    <span className="font-bold text-slate-700">{certificadoModal.fechasProtocolo?.dia8_retiro ? formatearFecha(certificadoModal.fechasProtocolo.dia8_retiro) : 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-slate-400 block">{certificadoModal.tipoProcedimiento === 'TE' ? 'Transferencia (D17)' : 'Inseminación (D10)'}</span>
                    <span className="font-bold text-slate-700">
                      {certificadoModal.tipoProcedimiento === 'TE' 
                        ? (certificadoModal.fechasProtocolo?.dia17_transferencia ? formatearFecha(certificadoModal.fechasProtocolo.dia17_transferencia) : 'N/A')
                        : (certificadoModal.fechasProtocolo?.dia10_inseminacion ? formatearFecha(certificadoModal.fechasProtocolo.dia10_inseminacion) : 'N/A')}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-slate-400 block">Confirmación (D45)</span>
                    <span className="font-bold text-slate-700">{certificadoModal.fechasProtocolo?.dia45_confirmacion ? formatearFecha(certificadoModal.fechasProtocolo.dia45_confirmacion) : 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-slate-400 block">Diagnóstico</span>
                    <span className={`font-black uppercase ${certificadoModal.estadoPrenez === 'Preñada' ? 'text-green-600' : (certificadoModal.estadoPrenez === 'Vacía' ? 'text-red-600' : 'text-amber-600')}`}>
                      {certificadoModal.estadoPrenez}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloque 3: Novedades Clínicas y Observaciones */}
              {certificadoModal.observaciones && (
                <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-2xl text-xs sm:text-sm">
                  <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">Observaciones Clínicas / Novedades de Campo</p>
                  <p className="text-slate-700 italic">"{certificadoModal.observaciones}"</p>
                </div>
              )}

              {/* Bloque 4: Firma del Médico Veterinario y Aval EPSEA */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Fecha de Emisión del Documento:</p>
                  <p className="text-xs font-bold text-slate-700">{new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <div className="mt-2 flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                    <CheckCircle2 size={16} /> Entidad Prestadora del Servicio de Extensión Agropecuaria
                  </div>
                </div>
                <div className="text-center sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0">
                  <div className="inline-block border-b-2 border-slate-800 w-48 mb-2"></div>
                  <p className="font-black text-slate-900 text-sm">{certificadoModal.veterinarioAsignado || 'Médico Veterinario Especialista'}</p>
                  <p className="text-xs text-slate-500 font-medium">Médico Veterinario Zootecnista (MVZ)</p>
                  <p className="text-[11px] text-slate-400">Equipo Técnico Oficial Sembriogan</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}