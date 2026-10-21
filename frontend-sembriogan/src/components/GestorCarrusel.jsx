import { useState, useEffect } from 'react';
import { API_BASE_URL, getApiUrl, getMediaUrl } from '../config/api';
import {
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Plus,
  Layers,
  X
} from 'lucide-react';

const GestorCarrusel = () => {
  // ESTADOS DEL CARRUSEL
  const [imagenes, setImagenes] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [archivoPreview, setArchivoPreview] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [msgCarrusel, setMsgCarrusel] = useState({ type: '', text: '' });

  // ESTADOS DE LA SECCIÓN NOSOTROS
  const [nosotrosData, setNosotrosData] = useState(null);
  const [nosotrosArchivo, setNosotrosArchivo] = useState(null);
  const [nosotrosPreview, setNosotrosPreview] = useState(null);
  const [nosotrosTitulo, setNosotrosTitulo] = useState('');
  const [nosotrosDesc, setNosotrosDesc] = useState('');
  const [isNosotrosLoading, setIsNosotrosLoading] = useState(false);
  const [msgNosotros, setMsgNosotros] = useState({ type: '', text: '' });

  useEffect(() => {
    cargarImagenes();
    cargarNosotros();
  }, []);

  // --- FUNCIONES CARRUSEL ---
  const cargarImagenes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/carrusel`);
      const data = await res.json();
      if (data.success) setImagenes(data.data);
    } catch (error) { 
      console.error(error); 
    }
  };

  const handleArchivoCarrusel = (e) => {
    const file = e.target.files[0];
    setArchivo(file);
    if (file) {
      setArchivoPreview(URL.createObjectURL(file));
    } else {
      setArchivoPreview(null);
    }
  };

  const manejarSubida = async (e) => {
    e.preventDefault();
    setMsgCarrusel({ type: '', text: '' });
    if (!archivo) {
      setMsgCarrusel({ type: 'error', text: 'Por favor selecciona una imagen para el carrusel.' });
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    formData.append('imagen', archivo);
    formData.append('titulo', titulo);
    formData.append('descripcion', descripcion);
    const token = localStorage.getItem('tokenSembriogan'); 
    try {
      const res = await fetch(`${API_BASE_URL}/api/carrusel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setMsgCarrusel({ type: 'success', text: 'Imagen subida con éxito al carrusel principal.' });
        setArchivo(null);
        setArchivoPreview(null);
        setTitulo('');
        setDescripcion('');
        const fileInput = document.getElementById('input-archivo');
        if (fileInput) fileInput.value = '';
        cargarImagenes(); 
      } else {
        setMsgCarrusel({ type: 'error', text: data.mensaje || 'Error al subir imagen.' });
      }
    } catch (error) { 
      setMsgCarrusel({ type: 'error', text: 'Error de conexión con el servidor.' });
    } finally { 
      setIsLoading(false); 
    }
  };

  const eliminarImagen = async (id) => {
    if (!window.confirm("¿Seguro de eliminar este banner del carrusel?")) return;
    const token = localStorage.getItem('tokenSembriogan');
    try {
      const res = await fetch(`${API_BASE_URL}/api/carrusel/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMsgCarrusel({ type: 'success', text: 'Banner eliminado del carrusel.' });
        cargarImagenes();
      }
    } catch (error) { 
      setMsgCarrusel({ type: 'error', text: 'Error de conexión.' });
    }
  };

  // --- FUNCIONES NOSOTROS ---
  const cargarNosotros = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/nosotros`);
      const data = await res.json();
      if (data.success && data.data) {
        setNosotrosData(data.data);
        setNosotrosTitulo(data.data.titulo);
        setNosotrosDesc(data.data.descripcion);
      }
    } catch (error) { 
      console.error(error); 
    }
  };

  const handleArchivoNosotros = (e) => {
    const file = e.target.files[0];
    setNosotrosArchivo(file);
    if (file) {
      setNosotrosPreview(URL.createObjectURL(file));
    } else {
      setNosotrosPreview(null);
    }
  };

  const manejarSubidaNosotros = async (e) => {
    e.preventDefault();
    setMsgNosotros({ type: '', text: '' });
    setIsNosotrosLoading(true);
    const formData = new FormData();
    if (nosotrosArchivo) formData.append('imagen', nosotrosArchivo);
    formData.append('titulo', nosotrosTitulo);
    formData.append('descripcion', nosotrosDesc);
    
    const token = localStorage.getItem('tokenSembriogan'); 
    try {
      const res = await fetch(`${API_BASE_URL}/api/nosotros`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setMsgNosotros({ type: 'success', text: "Sección 'Sobre Sembriogan' actualizada correctamente." });
        setNosotrosArchivo(null);
        setNosotrosPreview(null);
        const inputNos = document.getElementById('input-nosotros');
        if (inputNos) inputNos.value = '';
        cargarNosotros(); 
      } else { 
        setMsgNosotros({ type: 'error', text: data.mensaje || 'Error al actualizar sección.' });
      }
    } catch (error) { 
      setMsgNosotros({ type: 'error', text: 'Error de conexión.' });
    } finally { 
      setIsNosotrosLoading(false); 
    }
  };

  return (
    <div className="space-y-8">
      
      {/* --- MÓDULO NOSOTROS (SOBRE SEMBRIOGAN) --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        
        {/* Cabecera */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                Sección "Sobre Sembriogan"
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">Edita la historia corporativa, misión y fotografía institucional del portal web.</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {msgNosotros.text && (
            <div className={`flex items-center gap-2.5 p-4 mb-6 rounded-2xl text-sm ${
              msgNosotros.type === 'success' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}>
              {msgNosotros.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span>{msgNosotros.text}</span>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Vista Previa de Imagen Actual */}
            <div className="w-full lg:w-72 shrink-0">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Imagen Institucional
              </label>
              <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden border border-slate-200 bg-slate-100 relative shadow-sm group">
                {nosotrosPreview ? (
                  <img src={nosotrosPreview} alt="Nueva vista previa" className="w-full h-full object-cover" />
                ) : nosotrosData?.imagenUrl ? (
                  <img src={`${API_BASE_URL}${nosotrosData.imagenUrl}`} alt="Nosotros actual" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    <ImageIcon className="w-8 h-8 opacity-40" />
                    <span className="text-xs font-medium">Sin imagen</span>
                  </div>
                )}
                <span className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-md text-white text-[10px] px-2.5 py-1 rounded-full font-bold">
                  {nosotrosPreview ? 'Nueva Previa' : 'Pública Actual'}
                </span>
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={manejarSubidaNosotros} className="flex-1 space-y-5 w-full">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Título de la Sección
                </label>
                <input 
                  type="text" 
                  value={nosotrosTitulo} 
                  onChange={(e) => setNosotrosTitulo(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Texto Descriptivo / Historia
                </label>
                <textarea 
                  rows="4" 
                  value={nosotrosDesc} 
                  onChange={(e) => setNosotrosDesc(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium resize-none" 
                  required 
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
                <input 
                  id="input-nosotros" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleArchivoNosotros} 
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer bg-slate-50 border border-slate-200 rounded-2xl" 
                />
                <button 
                  type="submit" 
                  disabled={isNosotrosLoading} 
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-indigo-500/20 text-sm transition disabled:opacity-50 shrink-0"
                >
                  <UploadCloud className="w-4 h-4" />
                  {isNosotrosLoading ? 'Guardando...' : 'Actualizar Sección'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* --- MÓDULO CARRUSEL (HERO BANNERS) --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        
        {/* Cabecera */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                Banners del Carrusel Principal
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">Sube fotografías destacadas en alta resolución para la cabecera interactiva.</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          {msgCarrusel.text && (
            <div className={`flex items-center gap-2.5 p-4 rounded-2xl text-sm ${
              msgCarrusel.type === 'success' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}>
              {msgCarrusel.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span>{msgCarrusel.text}</span>
            </div>
          )}

          {/* Formulario de subida */}
          <form onSubmit={manejarSubida} className="p-6 bg-slate-50/80 border border-slate-200/80 rounded-3xl space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              Subir Nueva Foto al Carrusel
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Título Destacado (Opcional)</label>
                <input 
                  type="text" 
                  value={titulo} 
                  onChange={(e) => setTitulo(e.target.value)} 
                  placeholder="Ej: Día de Campo Sembriogan 2026" 
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Descripción / Subtítulo (Opcional)</label>
                <input 
                  type="text" 
                  value={descripcion} 
                  onChange={(e) => setDescripcion(e.target.value)} 
                  placeholder="Ej: Transferencia de embriones con biotecnología avanzada" 
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 flex items-center gap-3">
                {archivoPreview && (
                  <img src={archivoPreview} alt="Preview" className="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-sm shrink-0" />
                )}
                <input 
                  id="input-archivo" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleArchivoCarrusel} 
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer bg-white border border-slate-200 rounded-2xl"
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading || !archivo} 
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold py-2.5 px-6 rounded-2xl text-xs md:text-sm shadow-md transition disabled:opacity-50 shrink-0"
              >
                <UploadCloud className="w-4 h-4" />
                {isLoading ? 'Subiendo...' : 'Publicar Banner'}
              </button>
            </div>
          </form>

          {/* Galería de imágenes activas */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Imágenes Activas en Rotación</h3>
              <span className="text-xs font-semibold text-slate-400">{imagenes.length} {imagenes.length === 1 ? 'banner' : 'banners'} configurados</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {imagenes.length === 0 ? (
                <div className="col-span-full p-12 text-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No hay imágenes en rotación en este momento.</p>
                </div>
              ) : (
                imagenes.map((img) => (
                  <div key={img._id} className="relative group rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm bg-slate-900">
                    <img 
                      src={`${API_BASE_URL}${img.imagenUrl}`} 
                      alt={img.titulo || 'Banner'} 
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100" 
                    />
                    
                    {/* Gradient Overlay con datos */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent flex flex-col justify-end p-4">
                      <h4 className="text-white font-bold text-sm truncate">{img.titulo || 'Sin título'}</h4>
                      <p className="text-slate-300 text-xs truncate mb-3">{img.descripcion || 'Sin descripción'}</p>
                      
                      <button 
                        onClick={() => eliminarImagen(img._id)} 
                        className="inline-flex items-center gap-1.5 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold py-1.5 px-3 rounded-xl self-start transition shadow-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default GestorCarrusel;