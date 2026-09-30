import { useState, useEffect } from 'react';

const GestorCarrusel = () => {
    // ESTADOS DEL CARRUSEL
    const [imagenes, setImagenes] = useState([]);
    const [archivo, setArchivo] = useState(null);
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // ESTADOS DE LA SECCIÓN NOSOTROS
    const [nosotrosData, setNosotrosData] = useState(null);
    const [nosotrosArchivo, setNosotrosArchivo] = useState(null);
    const [nosotrosTitulo, setNosotrosTitulo] = useState('');
    const [nosotrosDesc, setNosotrosDesc] = useState('');
    const [isNosotrosLoading, setIsNosotrosLoading] = useState(false);

    useEffect(() => {
        cargarImagenes();
        cargarNosotros();
    }, []);

    // --- FUNCIONES CARRUSEL ---
    const cargarImagenes = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/carrusel');
            const data = await res.json();
            if (data.success) setImagenes(data.data);
        } catch (error) { console.error(error); }
    };

    const manejarSubida = async (e) => {
        e.preventDefault();
        if (!archivo) return alert("Selecciona una imagen.");
        setIsLoading(true);
        const formData = new FormData();
        formData.append('imagen', archivo);
        formData.append('titulo', titulo);
        formData.append('descripcion', descripcion);
        const token = localStorage.getItem('tokenSembriogan'); 
        try {
            const res = await fetch('http://localhost:3000/api/carrusel', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                alert("✅ Imagen subida con éxito al Carrusel");
                setArchivo(null); setTitulo(''); setDescripcion('');
                document.getElementById('input-archivo').value = '';
                cargarImagenes(); 
            }
        } catch (error) { alert("Error de conexión."); } 
        finally { setIsLoading(false); }
    };

    const eliminarImagen = async (id) => {
        if (!window.confirm("¿Seguro de eliminar esta imagen del carrusel?")) return;
        const token = localStorage.getItem('tokenSembriogan');
        try {
            const res = await fetch(`http://localhost:3000/api/carrusel/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) cargarImagenes();
        } catch (error) { alert("Error de conexión."); }
    };

    // --- FUNCIONES NOSOTROS ---
    const cargarNosotros = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/nosotros');
            const data = await res.json();
            if (data.success && data.data) {
                setNosotrosData(data.data);
                setNosotrosTitulo(data.data.titulo);
                setNosotrosDesc(data.data.descripcion);
            }
        } catch (error) { console.error(error); }
    };

    const manejarSubidaNosotros = async (e) => {
        e.preventDefault();
        setIsNosotrosLoading(true);
        const formData = new FormData();
        if (nosotrosArchivo) formData.append('imagen', nosotrosArchivo);
        formData.append('titulo', nosotrosTitulo);
        formData.append('descripcion', nosotrosDesc);
        
        const token = localStorage.getItem('tokenSembriogan'); 
        try {
            const res = await fetch('http://localhost:3000/api/nosotros', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                alert("✅ Sección 'Sobre Sembriogan' actualizada");
                setNosotrosArchivo(null);
                document.getElementById('input-nosotros').value = '';
                cargarNosotros(); 
            } else { alert("Error: " + data.mensaje); }
        } catch (error) { alert("Error de conexión."); } 
        finally { setIsNosotrosLoading(false); }
    };

    return (
        <div className="space-y-6 mt-6">
            
            {/* --- MÓDULO NOSOTROS --- */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4">🐄 Actualizar "Sobre Sembriogan" (Nosotros)</h2>
                
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Vista Previa Actual */}
                    <div className="w-full md:w-1/3 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 h-48 flex items-center justify-center relative">
                        {nosotrosData?.imagenUrl ? (
                            <img src={`http://localhost:3000${nosotrosData.imagenUrl}`} alt="Nosotros" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-slate-400 text-sm font-bold">Sin imagen asignada</span>
                        )}
                        <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded font-bold">Imagen Actual Pública</span>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={manejarSubidaNosotros} className="flex-1 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Título de la sección</label>
                            <input type="text" value={nosotrosTitulo} onChange={(e) => setNosotrosTitulo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none" required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Texto descriptivo</label>
                            <textarea rows="3" value={nosotrosDesc} onChange={(e) => setNosotrosDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none" required />
                        </div>
                        <div className="flex items-center gap-4">
                            <input id="input-nosotros" type="file" accept="image/*" onChange={(e) => setNosotrosArchivo(e.target.files[0])} className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                            <button type="submit" disabled={isNosotrosLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition disabled:opacity-50">
                                {isNosotrosLoading ? 'Guardando...' : 'Actualizar Sección'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* --- MÓDULO CARRUSEL (HERO) --- */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-800 mb-4">📸 Gestor de Banners (Carrusel Principal)</h2>
                
                <form onSubmit={manejarSubida} className="bg-slate-50 p-5 rounded-xl border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-end">
                    {/* ... (el resto del formulario de subida que ya tenías) ... */}
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Título (Opcional)</label>
                        <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Día de campo Sembriogan" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"/>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Descripción (Opcional)</label>
                        <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Breve detalle de la foto..." className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"/>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-slate-700 mb-1">Seleccionar Imagen</label>
                        <input id="input-archivo" type="file" accept="image/*" onChange={(e) => setArchivo(e.target.files[0])} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 cursor-pointer"/>
                    </div>
                    <button type="submit" disabled={isLoading || !archivo} className="bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-lg text-sm disabled:opacity-50">
                        {isLoading ? 'Subiendo...' : 'Subir Foto'}
                    </button>
                </form>

                <h3 className="text-sm font-bold text-slate-800 mb-3">Imágenes Públicas Actuales</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {imagenes.length === 0 ? (
                        <p className="text-sm text-slate-500 col-span-3 text-center py-6">No hay imágenes en el carrusel.</p>
                    ) : (
                        imagenes.map(img => (
                            <div key={img._id} className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                <img src={`http://localhost:3000${img.imagenUrl}`} alt={img.titulo} className="w-full h-40 object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <h4 className="text-white font-bold text-sm truncate">{img.titulo || 'Sin título'}</h4>
                                    <p className="text-slate-300 text-xs truncate mb-2">{img.descripcion}</p>
                                    <button onClick={() => eliminarImagen(img._id)} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1.5 px-3 rounded-lg self-start transition">
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
};

export default GestorCarrusel;