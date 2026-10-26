import { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL, getApiUrl, getMediaUrl } from '../config/api';
import { 
  FileText, 
  MessageCircle, 
  Printer, 
  X, 
  Award, 
  CheckCircle2, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Calendar,
  AlertTriangle,
  Dna,
  Clock,
  Sparkles,
  Users,
  Download,
  TrendingUp,
  Building2,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export default function AdminTrazabilidad() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [certificadoModal, setCertificadoModal] = useState(null);
  const [reporteProductorModal, setReporteProductorModal] = useState(null);
  const [modoVista, setModoVista] = useState('animales'); // 'animales' | 'productores'
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Cargar registros desde el backend
  const cargarRegistros = async () => {
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const res = await fetch(`${API_BASE_URL}/api/registro-genetico`, {
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
    // Auto-actualizar cada 20 segundos para reflejar registros de campo en vivo
    const timer = setInterval(cargarRegistros, 20000);
    return () => clearInterval(timer);
  }, []);

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CO');
  };

  // Filtrado reactivo en tiempo real (por animal)
  const registrosFiltrados = useMemo(() => {
    return registros.filter((reg) => {
      const termino = busqueda.toLowerCase().trim();
      const coincideBusqueda = 
        !termino ||
        (reg.productor && reg.productor.toLowerCase().includes(termino)) ||
        (reg.finca && reg.finca.toLowerCase().includes(termino)) ||
        (reg.arete && reg.arete.toLowerCase().includes(termino)) ||
        (reg.animalId && reg.animalId.toLowerCase().includes(termino)) ||
        (reg.geneticaUtilizada && reg.geneticaUtilizada.toLowerCase().includes(termino)) ||
        (reg.tipoProcedimiento && reg.tipoProcedimiento.toLowerCase().includes(termino));

      if (!coincideBusqueda) return false;

      if (filtroEstado === 'todos') return true;
      if (filtroEstado === 'prenadas') return reg.estadoPrenez === 'Preñada';
      if (filtroEstado === 'vacias') return reg.estadoPrenez === 'Vacía';
      if (filtroEstado === 'pendientes') return reg.estadoPrenez === 'Pendiente' || reg.estadoPrenez === 'Pendiente Evaluación';
      if (filtroEstado === 'ia') return reg.tipoProcedimiento === 'IA' || reg.tipoProcedimiento === 'IATF';
      if (filtroEstado === 'te') return reg.tipoProcedimiento === 'TE';

      return true;
    });
  }, [registros, busqueda, filtroEstado]);

  // Agrupación y Métricas por Productor
  const productoresAgrupados = useMemo(() => {
    const mapa = {};
    registros.forEach(reg => {
      const key = reg.productor?.trim() || 'Sin Productor';
      if (!mapa[key]) {
        mapa[key] = {
          nombre: key,
          email: reg.productorEmail || '',
          fincas: new Set(),
          animales: [],
          total: 0,
          prenadas: 0,
          vacias: 0,
          pendientes: 0,
          iaCount: 0,
          iatfCount: 0,
          teCount: 0,
          diagnosticoCount: 0,
          veterinarios: new Set()
        };
      }
      if (reg.finca) mapa[key].fincas.add(reg.finca);
      if (reg.veterinarioAsignado) mapa[key].veterinarios.add(reg.veterinarioAsignado);
      if (!mapa[key].email && reg.productorEmail) mapa[key].email = reg.productorEmail;
      
      mapa[key].animales.push(reg);
      mapa[key].total++;
      if (reg.estadoPrenez === 'Preñada') mapa[key].prenadas++;
      else if (reg.estadoPrenez === 'Vacía') mapa[key].vacias++;
      else mapa[key].pendientes++;

      if (reg.tipoProcedimiento === 'IA') mapa[key].iaCount++;
      else if (reg.tipoProcedimiento === 'IATF') mapa[key].iatfCount++;
      else if (reg.tipoProcedimiento === 'TE') mapa[key].teCount++;
      else if (reg.tipoProcedimiento === 'Diagnostico') mapa[key].diagnosticoCount++;
    });

    return Object.values(mapa).map(p => {
      const evaluadas = p.prenadas + p.vacias;
      const tasaEvaluada = evaluadas > 0 ? Math.round((p.prenadas / evaluadas) * 100) : 0;
      const tasaTotal = p.total > 0 ? Math.round((p.prenadas / p.total) * 100) : 0;
      return {
        ...p,
        fincasTexto: Array.from(p.fincas).join(', ') || 'No especificada',
        veterinariosTexto: Array.from(p.veterinarios).join(', ') || 'Equipo Veterinario Sembriogan',
        tasaPrenez: tasaEvaluada,
        tasaTotal: tasaTotal
      };
    });
  }, [registros]);

  // Filtrado de Productores
  const productoresFiltrados = useMemo(() => {
    const termino = busqueda.toLowerCase().trim();
    if (!termino) return productoresAgrupados;
    return productoresAgrupados.filter(p => 
      p.nombre.toLowerCase().includes(termino) ||
      p.fincasTexto.toLowerCase().includes(termino) ||
      p.email.toLowerCase().includes(termino)
    );
  }, [productoresAgrupados, busqueda]);

  const abrirReporteProductor = (nombreProductor) => {
    const prod = productoresAgrupados.find(p => p.nombre.toLowerCase() === nombreProductor?.trim().toLowerCase());
    if (prod) {
      setReporteProductorModal(prod);
    }
  };

  // Exportar Excel de un Ganadero específico
  const exportarExcelProductor = (productorData) => {
    let csv = `REPORTE CONSOLIDADO REPRODUCTIVO - ${productorData.nombre.toUpperCase()}\n`;
    csv += `Predio(s) / Finca(s): "${productorData.fincasTexto}"\n`;
    csv += `Total Bovinos: ${productorData.total} | Preñadas: ${productorData.prenadas} | Vacías: ${productorData.vacias} | Pendientes: ${productorData.pendientes}\n`;
    csv += `Efectividad de Preñez: ${productorData.tasaTotal}%\n\n`;
    csv += "No.,Chapeta / Arete,Raza,Técnica,Genética Utilizada,Fecha Día 0,Diagnóstico Gestacional,Observaciones,Veterinario\n";
    
    productorData.animales.forEach((r, idx) => {
      const fProc = formatearFecha(r.fechasProtocolo?.dia0_sincronizacion || r.fechaProcedimiento || r.createdAt);
      csv += `${idx + 1},"${r.animalId || r.arete || ''}","${r.raza || 'Bovino'}","${r.tipoProcedimiento || ''}","${r.geneticaUtilizada || ''}","${fProc}","${r.estadoPrenez || ''}","${r.observaciones || ''}","${r.veterinarioAsignado || ''}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Sembriogan_${productorData.nombre.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compartir Resumen Consolidado por WhatsApp al Productor
  const compartirWhatsAppProductor = (productorData) => {
    let listaAnimales = productorData.animales.slice(0, 12).map(a => 
      `• 🐮 *${a.animalId || a.arete}:* ${a.tipoProcedimiento} - ${a.estadoPrenez}`
    ).join('\n');

    if (productorData.animales.length > 12) {
      listaAnimales += `\n_...y ${productorData.animales.length - 12} animales más en el informe oficial._`;
    }

    const mensaje = 
`📋 *INFORME CONSOLIDADO REPRODUCTIVO - SEMBRIOGAN*
----------------------------------------
👤 *Ganadero / Productor:* ${productorData.nombre}
🏡 *Finca(s):* ${productorData.fincasTexto}
📅 *Fecha de Emisión:* ${new Date().toLocaleDateString('es-CO')}
----------------------------------------
📊 *BALANCE DEL HATO / LOTE:*
• Total Animales: *${productorData.total}*
• 🟢 Preñadas Confirmadas: *${productorData.prenadas}*
• 🔴 Vacías: *${productorData.vacias}*
• 🟡 Pendientes Evaluación: *${productorData.pendientes}*
• ⭐ Efectividad Reproductiva: *${productorData.tasaTotal}%*

📋 *RESUMEN DE CHAPETAS:*
${listaAnimales}
----------------------------------------
_Emitido por el Departamento Técnico de Sembriogan (Somos EPSEA)._`;

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  // Exportar Excel general de todos los filtrados
  const exportarExcelGenetica = () => {
    if (registrosFiltrados.length === 0) {
      alert('No hay registros para exportar.');
      return;
    }
    
    let csv = "Productor,Finca,Chapeta Vaca,Tecnica,Genetica Utilizada,Fecha Procedimiento (Día 0),Fecha Palpacion,Estado Prenez,Veterinario\n";
    
    registrosFiltrados.forEach(r => {
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

  // Enviar Reporte Clínico individual directo por WhatsApp
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

  // LÓGICA DE ALERTAS Y CRONOGRAMA CLÍNICO
  const obtenerAlertaProtocolo = (registro) => {
    if (registro.estadoPrenez === 'Preñada') {
      return { texto: 'Ciclo Cerrado (Preñez Confirmada)', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold' };
    }
    if (registro.estadoPrenez === 'Vacía') {
      return { texto: 'Ciclo Cerrado (Animal Vacío)', color: 'bg-slate-100 text-slate-500 border border-slate-200' };
    }

    const fechaBase = registro.fechasProtocolo?.dia0_sincronizacion || registro.fechaProcedimiento;
    if (!fechaBase) return { texto: 'Sin fecha de inicio', color: 'bg-slate-100 text-slate-500' };

    const dia0 = new Date(fechaBase);
    const sumarDias = (fecha, dias) => {
      const nueva = new Date(fecha);
      nueva.setDate(nueva.getDate() + dias);
      return nueva;
    };

    const pasos = [];
    const comp = registro.pasosCompletados || {};

    if (registro.tipoProcedimiento === 'IATF') {
      if (!comp.dia8_retiro) pasos.push({ nombre: 'Retiro Dispositivo (Día 8)', fecha: sumarDias(dia0, 8) });
      if (!comp.dia10_inseminacion) pasos.push({ nombre: 'Inseminación (Día 10)', fecha: sumarDias(dia0, 10) });
      if (!comp.dia45_confirmacion) pasos.push({ nombre: 'Conf. Preñez (Día 45)', fecha: sumarDias(dia0, 45) });
    } else if (registro.tipoProcedimiento === 'IA') {
      if (!comp.dia45_confirmacion) pasos.push({ nombre: 'Conf. Preñez (Día 45)', fecha: sumarDias(dia0, 45) });
    } else if (registro.tipoProcedimiento === 'TE') {
      if (!comp.dia8_retiro) pasos.push({ nombre: 'Retiro Dispositivo (Día 8)', fecha: sumarDias(dia0, 8) });
      if (!comp.dia17_transferencia) pasos.push({ nombre: 'Transferencia (Día 17)', fecha: sumarDias(dia0, 17) });
      if (!comp.dia45_confirmacion) pasos.push({ nombre: 'Conf. Preñez (Día 45)', fecha: sumarDias(dia0, 45) });
      pasos.push({ nombre: 'Entrega (Día 90)', fecha: sumarDias(dia0, 90) });
    } else if (registro.tipoProcedimiento === 'Diagnostico') {
      if (!comp.dia45_confirmacion) pasos.push({ nombre: 'Diagnóstico Ecográfico', fecha: dia0 });
    } else {
      if (!comp.dia45_confirmacion) pasos.push({ nombre: 'Conf. Preñez (Día 45)', fecha: sumarDias(dia0, 45) });
    }

    const proximoPaso = pasos[0]; 
    if (!proximoPaso) return { texto: 'Protocolo Finalizado. Pendiente Estado.', color: 'bg-amber-50 text-amber-700 border border-amber-200' };

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaComparar = new Date(proximoPaso.fecha);
    fechaComparar.setHours(0, 0, 0, 0);

    const diasFaltantes = Math.round((fechaComparar - hoy) / (1000 * 60 * 60 * 24));
    const fechaPasoStr = formatearFecha(proximoPaso.fecha);
    
    if (diasFaltantes < 0) return { texto: `¡RETRASADO! ${proximoPaso.nombre} (${Math.abs(diasFaltantes)}d)`, color: 'bg-rose-50 text-rose-700 border border-rose-200 font-black animate-pulse' };
    if (diasFaltantes === 0) return { texto: `¡HOY! ${proximoPaso.nombre}`, color: 'bg-amber-50 text-amber-800 border border-amber-300 font-black animate-pulse' };
    if (diasFaltantes <= 3) return { texto: `En ${diasFaltantes} días: ${proximoPaso.nombre} (${fechaPasoStr})`, color: 'bg-amber-50 text-amber-700 border border-amber-200 font-bold' };
    return { texto: `Próximo: ${proximoPaso.nombre} (${fechaPasoStr})`, color: 'bg-blue-50 text-blue-700 border border-blue-200 font-medium' };
  };

  const getTipoBadge = (tipo) => {
    switch (tipo) {
      case 'IATF':
        return 'bg-violet-50 text-violet-700 border border-violet-200/80';
      case 'IA':
        return 'bg-sky-50 text-sky-700 border border-sky-200/80';
      case 'TE':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
      case 'Diagnostico':
        return 'bg-amber-50 text-amber-700 border border-amber-200/80';
      default:
        return 'bg-slate-50 text-slate-700 border border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200/80 text-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-500 font-medium text-sm">Cargando trazabilidad y protocolos genéticos...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/70 space-y-6 w-full">
      
      {/* ENCABEZADO Y SELECTOR DE VISTA */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
              <Dna size={20} />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Trazabilidad Reproductiva y Reportes
            </h2>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm">
            Monitoreo en campo, alertas sincronizadas (IA / IATF / TE), certificados individuales y reportes consolidados por productor.
          </p>
        </div>

        {/* SELECTOR DE MODALIDAD (ANIMALES VS PRODUCTORES) */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
            <button
              onClick={() => setModoVista('animales')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                modoVista === 'animales'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Dna size={14} /> Por Animales ({registros.length})
            </button>
            <button
              onClick={() => setModoVista('productores')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                modoVista === 'productores'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users size={14} /> Por Productor ({productoresAgrupados.length})
            </button>
          </div>

          <button 
            onClick={exportarExcelGenetica}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition shadow-md shadow-emerald-600/20 justify-center shrink-0"
          >
            <FileSpreadsheet size={15} />
            <span>Exportar Todo (CSV)</span>
          </button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS RÁPIDOS */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        
        {/* BUSCADOR */}
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={modoVista === 'animales' ? "Buscar por chapeta, finca, productor, técnica..." : "Buscar productor, finca o correo..."}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder:text-slate-400 font-medium"
          />
          {busqueda && (
            <button 
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* CHIPS DE FILTRO (Activos en modo Animales) */}
        {modoVista === 'animales' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
            <button 
              onClick={() => setFiltroEstado('todos')}
              className={`px-3 py-1.5 rounded-xl transition ${filtroEstado === 'todos' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Todos ({registros.length})
            </button>
            <button 
              onClick={() => setFiltroEstado('ia')}
              className={`px-3 py-1.5 rounded-xl transition ${filtroEstado === 'ia' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
            >
              IA / IATF
            </button>
            <button 
              onClick={() => setFiltroEstado('te')}
              className={`px-3 py-1.5 rounded-xl transition ${filtroEstado === 'te' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
            >
              Embriones (TE)
            </button>
            <button 
              onClick={() => setFiltroEstado('pendientes')}
              className={`px-3 py-1.5 rounded-xl transition ${filtroEstado === 'pendientes' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
            >
              Pendientes
            </button>
            <button 
              onClick={() => setFiltroEstado('prenadas')}
              className={`px-3 py-1.5 rounded-xl transition ${filtroEstado === 'prenadas' ? 'bg-green-600 text-white shadow-xs' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
            >
              Preñadas
            </button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* VISTA 1: MODO POR PRODUCTORES (REPORTES CONSOLIDADOS) */}
      {/* ============================================================ */}
      {modoVista === 'productores' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {productoresFiltrados.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50/70 rounded-3xl border border-dashed border-slate-200">
                <Users size={36} className="mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-sm font-semibold">No se encontraron productores coincidentes.</p>
              </div>
            ) : (
              productoresFiltrados.map((prod, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden group"
                >
                  <div className="space-y-3">
                    {/* Encabezado Productor */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60 inline-block mb-1">
                          Ganadero / Cliente
                        </span>
                        <h3 className="font-black text-slate-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                          {prod.nombre}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Building2 size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">{prod.fincasTexto}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-2xl font-black text-slate-900 block leading-none">
                          {prod.total}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {prod.total === 1 ? 'Animal' : 'Animales'}
                        </span>
                      </div>
                    </div>

                    {/* Resumen de Efectividad Reproductiva */}
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-600 flex items-center gap-1">
                          <TrendingUp size={13} className="text-emerald-600" /> Efectividad Lote:
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                          prod.tasaTotal >= 60 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : prod.tasaTotal > 0 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {prod.tasaTotal}% Preñez
                        </span>
                      </div>

                      {/* Mini desglose */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                        <div className="bg-white py-1.5 rounded-xl border border-slate-200/60">
                          <span className="text-[10px] font-bold text-emerald-700 block">Preñadas</span>
                          <span className="text-xs font-black text-emerald-900">{prod.prenadas}</span>
                        </div>
                        <div className="bg-white py-1.5 rounded-xl border border-slate-200/60">
                          <span className="text-[10px] font-bold text-rose-700 block">Vacías</span>
                          <span className="text-xs font-black text-rose-900">{prod.vacias}</span>
                        </div>
                        <div className="bg-white py-1.5 rounded-xl border border-slate-200/60">
                          <span className="text-[10px] font-bold text-amber-700 block">Pendientes</span>
                          <span className="text-xs font-black text-amber-900">{prod.pendientes}</span>
                        </div>
                      </div>
                    </div>

                    {/* Técnicas empleadas */}
                    <div className="flex flex-wrap gap-1 text-[10px] font-semibold text-slate-500">
                      {prod.iatfCount > 0 && <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-lg border border-violet-200/60">{prod.iatfCount} IATF</span>}
                      {prod.iaCount > 0 && <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-lg border border-sky-200/60">{prod.iaCount} IA</span>}
                      {prod.teCount > 0 && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200/60">{prod.teCount} TE</span>}
                      {prod.diagnosticoCount > 0 && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-200/60">{prod.diagnosticoCount} Diag</span>}
                    </div>
                  </div>

                  {/* Botones de Acción para el Reporte Consolidado */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <button
                      onClick={() => setReporteProductorModal(prod)}
                      className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-between shadow-sm shadow-blue-500/20 group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={15} className="text-blue-100" />
                        <span>Generar Reporte Oficial</span>
                      </div>
                      <ChevronRight size={15} className="text-blue-200 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => compartirWhatsAppProductor(prod)}
                        className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-emerald-200/70"
                        title="Enviar resumen por WhatsApp"
                      >
                        <MessageCircle size={14} /> WhatsApp
                      </button>
                      <button
                        onClick={() => exportarExcelProductor(prod)}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-200"
                        title="Descargar Excel del productor"
                      >
                        <Download size={14} /> Excel Lote
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VISTA 2: MODO POR ANIMALES (INDIVIDUAL / DETALLE) */}
      {/* ============================================================ */}
      {modoVista === 'animales' && (
        <>
          {/* VISTA ESCRITORIO (Tabla estilizada) */}
          <div className="hidden lg:block overflow-hidden rounded-3xl border border-slate-200/80 shadow-xs">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-[11px] text-slate-400 uppercase bg-slate-50/80 border-b border-slate-200/80 tracking-wider">
                <tr>
                  <th className="px-5 py-4 font-bold">Finca / Productor</th>
                  <th className="px-4 py-4 font-bold">Chapeta</th>
                  <th className="px-4 py-4 font-bold">Procedimiento</th>
                  <th className="px-4 py-4 font-bold">Genética</th>
                  <th className="px-4 py-4 font-bold">Alerta Activa</th>
                  <th className="px-4 py-4 font-bold text-center">Estado</th>
                  <th className="px-5 py-4 font-bold text-center">Acciones / Certificado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                      No se encontraron procedimientos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  registrosFiltrados.map((reg) => {
                    const alerta = obtenerAlertaProtocolo(reg);
                    return (
                      <tr key={reg._id} className="bg-white hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <span className="block font-bold text-slate-900">{reg.productor} {reg.finca ? `(${reg.finca})` : ''}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full inline-block font-mono">
                              {reg.productorEmail || 'Sin email'}
                            </span>
                            <button
                              onClick={() => abrirReporteProductor(reg.productor)}
                              className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 hover:underline"
                              title="Ver lote completo y reporte de este productor"
                            >
                              <Users size={11} /> Lote
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono font-black text-blue-600">
                          {reg.animalId || reg.arete}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-xl text-xs font-bold inline-block ${getTipoBadge(reg.tipoProcedimiento)}`}>
                            {reg.tipoProcedimiento}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-1 font-medium">
                            Día 0: {formatearFecha(reg.fechaProcedimiento || reg.fechasProtocolo?.dia0_sincronizacion)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs font-semibold text-slate-700">
                          {reg.geneticaUtilizada || 'N/A'}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-3 py-1.5 rounded-xl text-xs block text-center font-medium ${alerta.color}`}>
                            {alerta.texto}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block
                            ${(reg.estadoPrenez === 'Pendiente' || reg.estadoPrenez === 'Pendiente Evaluación') ? 'bg-amber-100 text-amber-800' : 
                              (reg.estadoPrenez === 'Preñada' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')}`}>
                            {reg.estadoPrenez}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => setCertificadoModal(reg)} 
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-blue-200/70 transition shadow-2xs"
                              title="Ver / Imprimir Certificado Clínico Individual"
                            >
                              <FileText size={14} /> Certificado
                            </button>
                            <button 
                              onClick={() => compartirWhatsAppAdmin(reg)} 
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-200/70 transition shadow-2xs"
                              title="Enviar Reporte por WhatsApp"
                            >
                              <MessageCircle size={14} /> WhatsApp
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

          {/* VISTA MÓVIL (Tarjetas redondeadas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
            {registrosFiltrados.map((reg) => {
              const alerta = obtenerAlertaProtocolo(reg);
              return (
                <div key={reg._id} className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/80 space-y-3 relative">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{reg.productor} {reg.finca ? `(${reg.finca})` : ''}</h3>
                      <p className="text-[10px] text-slate-500 mb-1 font-mono">{reg.productorEmail || 'Sin email registrado'}</p>
                      <p className="text-blue-600 font-mono font-black text-sm">Chapeta: {reg.animalId || reg.arete}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${getTipoBadge(reg.tipoProcedimiento)}`}>
                      {reg.tipoProcedimiento}
                    </span>
                  </div>
                  
                  <div className="text-xs text-slate-600 border-t border-slate-100 pt-2 flex justify-between">
                    <div>
                      <span className="font-bold block text-[10px] text-slate-400 uppercase">Genética:</span> 
                      {reg.geneticaUtilizada || 'N/A'}
                    </div>
                    <div className="text-right">
                      <span className="font-bold block text-[10px] text-slate-400 uppercase">Día 0 (Inicio):</span> 
                      {formatearFecha(reg.fechaProcedimiento || reg.fechasProtocolo?.dia0_sincronizacion)}
                    </div>
                  </div>

                  <div className={`p-2.5 rounded-xl text-xs font-medium text-center ${alerta.color}`}>
                    {alerta.texto}
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100 pt-2.5">
                    <span className="text-xs text-slate-400 font-medium truncate max-w-[150px]">
                      Vet: {reg.veterinarioAsignado || 'No asignado'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${(reg.estadoPrenez === 'Pendiente' || reg.estadoPrenez === 'Pendiente Evaluación') ? 'bg-amber-100 text-amber-800' : (reg.estadoPrenez === 'Preñada' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')}`}>
                      {reg.estadoPrenez}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <button 
                      onClick={() => setCertificadoModal(reg)} 
                      className="w-full py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-blue-200/80 transition"
                    >
                      <FileText size={14} /> Certificado
                    </button>
                    <button 
                      onClick={() => compartirWhatsAppAdmin(reg)} 
                      className="w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200/80 transition"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: CERTIFICADO INDIVIDUAL POR ANIMAL                    */}
      {/* ============================================================ */}
      {certificadoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
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
                  <Printer size={16} /> Imprimir / PDF
                </button>
                <button 
                  onClick={() => compartirWhatsAppAdmin(certificadoModal)} 
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm"
                >
                  <MessageCircle size={16} /> WhatsApp
                </button>
                <button 
                  onClick={() => setCertificadoModal(null)} 
                  className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* CONTENIDO DEL CERTIFICADO */}
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
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Retiro Disp. (Día 8)</span>
                    <span className="font-bold text-slate-700">{certificadoModal.fechasProtocolo?.dia8_retiro ? formatearFecha(certificadoModal.fechasProtocolo.dia8_retiro) : 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">{certificadoModal.tipoProcedimiento === 'TE' ? 'Transferencia (D17)' : 'Inseminación (D10)'}</span>
                    <span className="font-bold text-slate-700">
                      {certificadoModal.tipoProcedimiento === 'TE' 
                        ? (certificadoModal.fechasProtocolo?.dia17_transferencia ? formatearFecha(certificadoModal.fechasProtocolo.dia17_transferencia) : 'N/A')
                        : (certificadoModal.fechasProtocolo?.dia10_inseminacion ? formatearFecha(certificadoModal.fechasProtocolo.dia10_inseminacion) : 'N/A')}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Confirmación (D45)</span>
                    <span className="font-bold text-slate-700">{certificadoModal.fechasProtocolo?.dia45_confirmacion ? formatearFecha(certificadoModal.fechasProtocolo.dia45_confirmacion) : 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Diagnóstico</span>
                    <span className={`font-black uppercase ${certificadoModal.estadoPrenez === 'Preñada' ? 'text-emerald-600' : (certificadoModal.estadoPrenez === 'Vacía' ? 'text-rose-600' : 'text-amber-600')}`}>
                      {certificadoModal.estadoPrenez}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bloque 3: Novedades Clínicas */}
              {certificadoModal.observaciones && (
                <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-2xl text-xs sm:text-sm">
                  <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">Observaciones Clínicas / Novedades de Campo</p>
                  <p className="text-slate-700 italic">"{certificadoModal.observaciones}"</p>
                </div>
              )}

              {/* Bloque 4: Firma del Médico Veterinario */}
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

      {/* ============================================================ */}
      {/* MODAL 2: INFORME REPRODUCTIVO CONSOLIDADO POR PRODUCTOR      */}
      {/* ============================================================ */}
      {reporteProductorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl p-6 sm:p-10 relative my-8 border border-slate-200 flex flex-col">
            
            {/* Botones de Acción Superior (Ocultos en impresión) */}
            <div className="flex flex-wrap justify-between items-center mb-6 pb-4 border-b border-slate-100 gap-3 print:hidden">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Award size={16} className="text-emerald-600" /> Informe Técnico Reproductivo por Predio / Ganadero
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => window.print()} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                >
                  <Printer size={16} /> Imprimir / PDF
                </button>
                <button 
                  onClick={() => compartirWhatsAppProductor(reporteProductorModal)} 
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm"
                >
                  <MessageCircle size={16} /> WhatsApp
                </button>
                <button 
                  onClick={() => exportarExcelProductor(reporteProductorModal)} 
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 border border-slate-200"
                >
                  <Download size={16} /> Excel
                </button>
                <button 
                  onClick={() => setReporteProductorModal(null)} 
                  className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* CONTENIDO DEL INFORME CONSOLIDADO (IMPRIMIBLE) */}
            <div className="space-y-6 print:m-0" id="reporte-productor-imprimible">
              
              {/* Membrete Oficial */}
              <div className="flex flex-col sm:flex-row justify-between items-center border-b-2 border-slate-900 pb-5 gap-4 text-center sm:text-left">
                <img src="/logo.png" alt="Sembriogan" className="h-14 sm:h-16 object-contain" />
                <div className="sm:text-right">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">SEMBRIOGAN - SOMOS EPSEA</h3>
                  <p className="text-xs text-slate-600 font-semibold">Biotecnología Reproductiva y Extensión Agropecuaria</p>
                  <p className="text-[11px] text-slate-500">Informe Técnico Consolidado de Intervención en Campo</p>
                </div>
              </div>

              {/* Título del Documento */}
              <div className="text-center py-1">
                <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Informe General de Hato • Ref. {reporteProductorModal.nombre.slice(0, 3).toUpperCase()}-{Date.now().toString().slice(-6)}
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">INFORME TÉCNICO Y CLÍNICO REPRODUCTIVO</h4>
                <p className="text-xs text-slate-500 mt-0.5">Consolidado de palpaciones, transferencias y diagnósticos de preñez.</p>
              </div>

              {/* Bloque 1: Ficha del Productor y Finca */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs sm:text-sm">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Datos del Ganadero / Titular</p>
                  <p className="font-black text-base text-slate-900 mt-1">{reporteProductorModal.nombre}</p>
                  <p className="text-slate-600 mt-0.5">Correo: <span className="font-medium text-slate-800">{reporteProductorModal.email || 'No registrado'}</span></p>
                  <p className="text-slate-600">Predio(s): <span className="font-bold text-slate-800">{reporteProductorModal.fincasTexto}</span></p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha de Auditoría / Emisión</p>
                  <p className="font-black text-slate-900 mt-1">{new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="text-slate-600 mt-0.5">Equipo Clínico: <span className="font-medium text-slate-800">{reporteProductorModal.veterinariosTexto}</span></p>
                </div>
              </div>

              {/* Bloque 2: Indicadores Clave del Lote (KPIs) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Bovinos Totales</span>
                  <span className="text-2xl font-black text-blue-900 mt-1 block">{reporteProductorModal.total}</span>
                </div>
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Preñadas</span>
                  <span className="text-2xl font-black text-emerald-900 mt-1 block">{reporteProductorModal.prenadas}</span>
                </div>
                <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200/80">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Vacías</span>
                  <span className="text-2xl font-black text-rose-900 mt-1 block">{reporteProductorModal.vacias}</span>
                </div>
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Efectividad Lote</span>
                  <span className="text-2xl font-black text-amber-900 mt-1 block">{reporteProductorModal.tasaTotal}%</span>
                </div>
              </div>

              {/* Bloque 3: Tabla Detallada de Bovinos del Productor */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead className="bg-slate-50 uppercase text-[10px] text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-3">#</th>
                      <th className="px-3 py-3">Chapeta / Arete</th>
                      <th className="px-3 py-3">Raza</th>
                      <th className="px-3 py-3">Técnica</th>
                      <th className="px-3 py-3">Genética</th>
                      <th className="px-3 py-3">Día 0 (Inicio)</th>
                      <th className="px-3 py-3 text-center">Diagnóstico</th>
                      <th className="px-3 py-3">Observaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reporteProductorModal.animales.map((anim, idx) => (
                      <tr key={anim._id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2.5 font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-mono font-black text-blue-700">{anim.animalId || anim.arete}</td>
                        <td className="px-3 py-2.5">{anim.raza || 'Bovino'}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-800">{anim.tipoProcedimiento}</td>
                        <td className="px-3 py-2.5 text-slate-600">{anim.geneticaUtilizada || 'N/A'}</td>
                        <td className="px-3 py-2.5 font-medium">{formatearFecha(anim.fechasProtocolo?.dia0_sincronizacion || anim.fechaProcedimiento || anim.createdAt)}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase inline-block ${
                            anim.estadoPrenez === 'Preñada' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : anim.estadoPrenez === 'Vacía' 
                              ? 'bg-rose-100 text-rose-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {anim.estadoPrenez}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 italic max-w-xs truncate">{anim.observaciones || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bloque 4: Firmas de Responsabilidad Técnica */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-b-2 border-slate-800 w-44 mx-auto mb-2"></div>
                  <p className="font-black text-slate-900">{reporteProductorModal.veterinariosTexto}</p>
                  <p className="text-[11px] text-slate-500">Médico Veterinario Especialista (MVZ)</p>
                  <p className="text-[10px] text-slate-400">Equipo Técnico Oficial Sembriogan</p>
                </div>
                <div>
                  <div className="border-b-2 border-slate-800 w-44 mx-auto mb-2"></div>
                  <p className="font-black text-slate-900">{reporteProductorModal.nombre}</p>
                  <p className="text-[11px] text-slate-500">Productor Ganadero / Titular de Finca</p>
                  <p className="text-[10px] text-slate-400">Constancia de Recibido y Socialización</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}