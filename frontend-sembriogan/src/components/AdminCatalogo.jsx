import { useState, useEffect, useRef, useMemo } from 'react';
import { API_BASE_URL, getApiUrl, getMediaUrl } from '../config/api';
import * as XLSX from 'xlsx';
import {
  PackagePlus,
  PackageCheck,
  Package,
  Edit3,
  Trash2,
  UploadCloud,
  Download,
  DollarSign,
  Layers,
  Search,
  Sparkles,
  Boxes,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  X,
  Plus,
  Star
} from 'lucide-react';

export default function AdminCatalogo() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos' | 'servicios' | 'productos' | 'destacados' | 'bajo_stock'
  const [busqueda, setBusqueda] = useState('');
  
  // Estados del formulario (Creación o Edición)
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState({
    tipo: '',
    descripcion: '',
    costo: '',
    esServicio: 'true',
    stock: '',
    destacado: false
  });
  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const cargarCatalogo = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/catalogo`);
      const data = await res.json();
      if (data.success) {
        setProductos(data.data);
      }
    } catch (err) {
      console.error("Error cargando el catálogo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCatalogo();
    const interval = setInterval(cargarCatalogo, 8000);
    window.addEventListener('focus', cargarCatalogo);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', cargarCatalogo);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    if (type === 'file') {
      const file = files[0];
      setImagenFile(file);
      if (file) {
        setImagenPreview(URL.createObjectURL(file));
      } else {
        setImagenPreview(null);
      }
    } else if (type === 'checkbox') {
      setFormulario({ ...formulario, [name]: checked });
    } else {
      setFormulario({ ...formulario, [name]: value });
    }
  };

  // Cargar datos en el formulario para editar
  const iniciarEdicion = (item) => {
    setEditandoId(item._id);
    setFormulario({
      tipo: item.tipo,
      descripcion: item.descripcion,
      costo: item.costo,
      esServicio: item.esServicio ? 'true' : 'false',
      stock: item.esServicio ? '' : item.stock,
      destacado: item.destacado || false
    });
    setImagenFile(null);
    setImagenPreview(item.imagen ? `${API_BASE_URL}${item.imagen}` : null);
    setError('');
    setMensaje('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormulario({ tipo: '', descripcion: '', costo: '', esServicio: 'true', stock: '', destacado: false });
    setImagenFile(null);
    setImagenPreview(null);
  };

  // Toggle rápido de producto estrella (destacado en portada)
  const toggleDestacado = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      // Optimistic update
      setProductos(prev => prev.map(p => p._id === id ? { ...p, destacado: !p.destacado } : p));

      const token = localStorage.getItem('tokenSembriogan');
      const res = await fetch(`${API_BASE_URL}/api/catalogo/${id}/destacado`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        setMensaje(data.mensaje);
        setTimeout(() => setMensaje(''), 3000);
      } else {
        cargarCatalogo(); // revert if failed
      }
    } catch (err) {
      console.error("Error toggle destacado:", err);
      cargarCatalogo();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    
    if (!formulario.tipo.trim() || !formulario.descripcion.trim() || formulario.costo === '') {
      setError('Por favor, completa el nombre, la descripción y el costo.');
      return;
    }

    if (formulario.esServicio === 'false' && (formulario.stock === '' || Number(formulario.stock) < 0)) {
      setError('Por favor, ingresa una cantidad de stock válida para el producto.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const formData = new FormData();
      formData.append('tipo', formulario.tipo.trim());
      formData.append('descripcion', formulario.descripcion.trim());
      formData.append('costo', Number(formulario.costo));
      formData.append('esServicio', formulario.esServicio);
      formData.append('stock', formulario.esServicio === 'true' ? 0 : Number(formulario.stock));
      formData.append('destacado', formulario.destacado);
      if (imagenFile) {
        formData.append('imagen', imagenFile);
      }

      const url = editandoId 
        ? `${API_BASE_URL}/api/catalogo/${editandoId}` 
        : `${API_BASE_URL}/api/catalogo`;
      
      const method = editandoId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        cancelarEdicion();
        cargarCatalogo();
        setMensaje(editandoId ? 'Ítem actualizado exitosamente' : 'Ítem agregado exitosamente al catálogo');
      } else {
        setError(data.mensaje || 'Error al procesar en el servidor.');
      }
    } catch (err) {
      console.error("Error en operación de catálogo:", err);
      setError('Error de conexión con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const eliminarProducto = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${nombre}" del catálogo?`)) return;

    try {
      const token = localStorage.getItem('tokenSembriogan');
      const res = await fetch(`${API_BASE_URL}/api/catalogo/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        cargarCatalogo();
      } else {
        alert("No se pudo eliminar: " + (data.mensaje || 'Error desconocido'));
      }
    } catch (err) {
      console.error("Error en DELETE:", err);
      alert("Error de conexión al intentar eliminar.");
    }
  };

  const descargarPlantilla = () => {
    const ws = XLSX.utils.json_to_sheet([{
      tipo: "Semen Angus Rojo",
      descripcion: "Pajilla importada de alta genética",
      costo: 150000,
      esServicio: "NO",
      stock: 50,
      destacado: "SI",
      imagen: ""
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Catalogo");
    XLSX.writeFile(wb, "Plantilla_Catalogo_Sembriogan.xlsx");
  };

  const handleImportarExcel = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        const res = await fetch(`${API_BASE_URL}/api/catalogo/masivo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const json = await res.json();
        if(json.success) {
           setMensaje(`Importación completada: ${json.mensaje}`);
           cargarCatalogo();
        } else {
           setError("Error al importar: " + json.mensaje);
        }
      } catch(err) {
         setError("Error procesando el archivo Excel.");
      }
      e.target.value = null;
    };
    reader.readAsBinaryString(file);
  };

  // Métricas
  const metricas = useMemo(() => {
    const total = productos.length;
    const servicios = productos.filter(p => p.esServicio).length;
    const productosFisicos = productos.filter(p => !p.esServicio).length;
    const destacados = productos.filter(p => p.destacado).length;
    const bajoStock = productos.filter(p => !p.esServicio && p.stock <= 5).length;
    return { total, servicios, productosFisicos, destacados, bajoStock };
  }, [productos]);

  // Filtrado y Búsqueda
  const productosFiltrados = useMemo(() => {
    return productos.filter(p => {
      const q = busqueda.toLowerCase().trim();
      const matchBusqueda = !q || 
        p.tipo?.toLowerCase().includes(q) || 
        p.descripcion?.toLowerCase().includes(q);

      if (!matchBusqueda) return false;

      if (filtroTipo === 'servicios') return p.esServicio;
      if (filtroTipo === 'productos') return !p.esServicio;
      if (filtroTipo === 'destacados') return p.destacado;
      if (filtroTipo === 'bajo_stock') return !p.esServicio && p.stock <= 5;
      return true;
    });
  }, [productos, busqueda, filtroTipo]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Sincronizando catálogo con el almacén...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Ítems</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{metricas.total}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Servicios</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{metricas.servicios}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-inner">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Productos Físicos</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{metricas.productosFisicos}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>

        {/* MÉTRICA: PRODUCTOS ESTRELLA (PORTADA) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">En Portada ⭐</p>
            <p className="text-2xl font-black text-amber-500 mt-1">{metricas.destacados}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner">
            <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alerta Stock</p>
            <p className={`text-2xl font-black mt-1 ${metricas.bajoStock > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {metricas.bajoStock}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${metricas.bajoStock > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* FORMULARIO DE CREACIÓN / EDICIÓN */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
              {editandoId ? <Edit3 className="w-5 h-5" /> : <PackagePlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                {editandoId ? 'Editar Ítem del Catálogo' : 'Agregar Nuevo Producto o Servicio'}
                {editandoId && (
                  <span className="text-xs bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full font-medium">
                    Modo Edición
                  </span>
                )}
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">Controla especificaciones técnicas, precio al público, niveles de stock y visibilidad de portada.</p>
            </div>
          </div>

          {editandoId && (
            <button
              type="button"
              onClick={cancelarEdicion}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition"
            >
              <X className="w-4 h-4" /> Cancelar Edición
            </button>
          )}
        </div>

        <div className="p-6 md:p-8">
          {error && (
            <div className="flex items-center gap-2.5 p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mensaje && (
            <div className="flex items-center gap-2.5 p-4 mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{mensaje}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Tipo de Ítem */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Tipo de Publicación
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setFormulario({ ...formulario, esServicio: 'true', stock: '' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      formulario.esServicio === 'true'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Servicio
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormulario({ ...formulario, esServicio: 'false' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      formulario.esServicio === 'false'
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    Producto
                  </button>
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nombre / Título Oficial
                </label>
                <input 
                  type="text" 
                  name="tipo" 
                  value={formulario.tipo} 
                  onChange={handleChange} 
                  required
                  placeholder="Ej: Inseminación Artificial / Bloque Mineral"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                />
              </div>

              {/* Costo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Precio al Público (COP)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <input 
                    type="number" 
                    name="costo" 
                    value={formulario.costo} 
                    onChange={handleChange} 
                    required 
                    min="0"
                    placeholder="150000"
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              
              {/* Stock (solo si es producto) */}
              {formulario.esServicio === 'false' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Stock en Inventario (Unidades)
                  </label>
                  <input 
                    type="number" 
                    name="stock" 
                    value={formulario.stock} 
                    onChange={handleChange} 
                    required 
                    min="0"
                    placeholder="Ej: 30"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                  />
                </div>
              )}

              {/* Descripción */}
              <div className={formulario.esServicio === 'true' ? 'md:col-span-2' : ''}>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Descripción Detallada
                </label>
                <textarea 
                  name="descripcion" 
                  value={formulario.descripcion} 
                  onChange={handleChange} 
                  required
                  placeholder="Detalles genéticos, dosis, especificaciones de uso..."
                  rows="2"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium resize-none"
                />
              </div>

              {/* Imagen */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Imagen Referencial {editandoId && '(Opcional)'}
                </label>
                <div className="flex items-center gap-3">
                  {imagenPreview && (
                    <img 
                      src={imagenPreview} 
                      alt="Preview" 
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-sm"
                    />
                  )}
                  <input 
                    type="file" 
                    name="imagen" 
                    onChange={handleChange} 
                    accept="image/*"
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer bg-slate-50 border border-slate-200 rounded-2xl"
                  />
                </div>
              </div>
            </div>

            {/* TOGGLE: PRODUCTO ESTRELLA (DESTACADO EN PORTADA) */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">¿Marcar como Producto / Servicio Estrella?</h4>
                  <p className="text-xs text-slate-500">
                    Los productos estrella se exhiben de forma prioritaria en la portada principal de la web.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  name="destacado" 
                  checked={formulario.destacado} 
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-blue-500/20 transition disabled:opacity-60 text-sm"
              >
                {editandoId ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Guardar Cambios
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Agregar al Catálogo
                  </>
                )}
              </button>

              {editandoId && (
                <button 
                  type="button" 
                  onClick={cancelarEdicion}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition"
                >
                  Descartar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* TABLA Y CONTROLES DEL CATÁLOGO */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        
        {/* Cabecera y Herramientas */}
        <div className="p-6 md:p-8 border-b border-slate-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Inventario y Catálogo Activo</h2>
              <p className="text-xs text-slate-500 mt-1">Controla productos, servicios, stock y haz clic en la estrella ⭐ para destacarlos en la página principal.</p>
            </div>

            {/* Acciones Masivas Excel */}
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={descargarPlantilla} 
                className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/70 font-semibold px-4 py-2.5 rounded-2xl transition text-xs shadow-sm"
              >
                <Download className="w-4 h-4" />
                Descargar Plantilla
              </button>
              <button 
                onClick={() => fileInputRef.current.click()} 
                className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/70 font-semibold px-4 py-2.5 rounded-2xl transition text-xs shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Importar Masivo
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImportarExcel} accept=".xlsx, .xls" className="hidden" />
            </div>
          </div>

          {/* Filtros y Buscador */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
            
            {/* Buscador reactivo */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o descripción..."
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
                onClick={() => setFiltroTipo('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filtroTipo === 'todos'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({metricas.total})
              </button>
              <button
                onClick={() => setFiltroTipo('destacados')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  filtroTipo === 'destacados'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${filtroTipo === 'destacados' ? 'fill-white text-white' : 'fill-amber-400 text-amber-500'}`} />
                Portada ({metricas.destacados})
              </button>
              <button
                onClick={() => setFiltroTipo('servicios')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filtroTipo === 'servicios'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Servicios ({metricas.servicios})
              </button>
              <button
                onClick={() => setFiltroTipo('productos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filtroTipo === 'productos'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Productos ({metricas.productosFisicos})
              </button>
              <button
                onClick={() => setFiltroTipo('bajo_stock')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filtroTipo === 'bajo_stock'
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Stock Bajo ({metricas.bajoStock})
              </button>
            </div>
          </div>
        </div>
        
        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/75 border-b border-slate-100">
              <tr>
                <th className="px-4 py-4 text-center">Portada</th>
                <th className="px-6 py-4">Ítem</th>
                <th className="px-6 py-4">Modalidad</th>
                <th className="px-6 py-4">Precio COP</th>
                <th className="px-6 py-4">Disponibilidad</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">No se encontraron ítems con los filtros seleccionados.</p>
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Botón Estrella (Activar/Desactivar en Portada) */}
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={(e) => toggleDestacado(item._id, e)}
                        className={`p-2 rounded-xl transition-all ${
                          item.destacado 
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-500 shadow-xs' 
                            : 'text-slate-300 hover:text-amber-400 hover:bg-slate-100'
                        }`}
                        title={item.destacado ? '⭐ Producto Estrella en Portada (Clic para desmarcar)' : 'Marcar como Producto Estrella en Portada'}
                      >
                        <Star className={`w-5 h-5 transition-transform hover:scale-125 ${item.destacado ? 'fill-amber-400 text-amber-500' : ''}`} />
                      </button>
                    </td>

                    {/* Imagen + Título + Descripción */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {item.imagen ? (
                          <img 
                            src={`${API_BASE_URL}${item.imagen}`} 
                            alt={item.tipo} 
                            className="w-12 h-12 object-cover rounded-2xl shadow-sm border border-slate-200 shrink-0" 
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 shrink-0">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{item.tipo}</span>
                            {item.destacado && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200/60 inline-flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-600" /> Estrella
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 max-w-sm line-clamp-1">{item.descripcion}</div>
                        </div>
                      </div>
                    </td>

                    {/* Modalidad (Servicio vs Producto) */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        item.esServicio 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/60' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      }`}>
                        {item.esServicio ? <Layers className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                        {item.esServicio ? 'Servicio' : 'Producto'}
                      </span>
                    </td>

                    {/* Costo */}
                    <td className="px-6 py-4 font-black text-slate-900">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.costo)}
                    </td>

                    {/* Stock */}
                    <td className="px-6 py-4">
                      {item.esServicio ? (
                        <span className="text-slate-400 text-xs italic font-medium">Bajo demanda (N/A)</span>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.stock > 5 
                            ? 'bg-slate-100 text-slate-700' 
                            : item.stock > 0
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.stock > 5 ? 'bg-emerald-500' : item.stock > 0 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                          {item.stock} {item.stock === 1 ? 'unidad' : 'unidades'}
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button 
                          type="button"
                          onClick={() => iniciarEdicion(item)}
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-xl transition text-xs"
                          title="Editar"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button 
                          type="button"
                          onClick={() => eliminarProducto(item._id, item.tipo)}
                          className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-800 font-bold px-3 py-1.5 bg-rose-50 hover:bg-rose-100 rounded-xl transition text-xs"
                          title="Eliminar"
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