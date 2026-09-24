import { useState, useEffect } from 'react';

export default function AdminCatalogo() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados del formulario (Creación o Edición)
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState({
    tipo: '',
    descripcion: '',
    costo: '',
    esServicio: 'true',
    stock: ''
  });
  const [imagenFile, setImagenFile] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarCatalogo = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/catalogo');
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
  }, []);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setImagenFile(files[0]);
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
      stock: item.esServicio ? '' : item.stock
    });
    setImagenFile(null);
    setError('');
    setMensaje('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormulario({ tipo: '', descripcion: '', costo: '', esServicio: 'true', stock: '' });
    setImagenFile(null);
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

    try {
      const token = localStorage.getItem('tokenSembriogan');
      const formData = new FormData();
      formData.append('tipo', formulario.tipo.trim());
      formData.append('descripcion', formulario.descripcion.trim());
      formData.append('costo', Number(formulario.costo));
      formData.append('esServicio', formulario.esServicio);
      formData.append('stock', formulario.esServicio === 'true' ? 0 : Number(formulario.stock));
      if (imagenFile) {
        formData.append('imagen', imagenFile);
      }

      const url = editandoId 
        ? `http://localhost:3000/api/catalogo/${editandoId}` 
        : 'http://localhost:3000/api/catalogo';
      
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
        setMensaje(editandoId ? '¡Ítem actualizado exitosamente!' : '¡Ítem agregado exitosamente!');
      } else {
        setError(data.mensaje || 'Error al procesar en el servidor.');
      }
    } catch (err) {
      console.error("Error en operación de catálogo:", err);
      setError('Error de conexión con el servidor.');
    }
  };

  const eliminarProducto = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${nombre}" del catálogo?`)) return;

    try {
      const token = localStorage.getItem('tokenSembriogan');
      const res = await fetch(`http://localhost:3000/api/catalogo/${id}`, {
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

  if (loading) return <div className="text-center p-4 text-gray-500">Cargando catálogo...</div>;

  return (
    <div className="space-y-6">
      
      {/* FORMULARIO */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-primary mb-1">
          {editandoId ? 'Editar Ítem del Catálogo' : 'Agregar Nuevo Servicio o Producto'}
        </h2>
        <p className="text-gray-500 text-sm mb-4">Gestiona precios, descripciones y control de inventario físico.</p>
        
        {error && <p className="text-red-600 text-sm mb-3 bg-red-50 p-3 rounded-lg font-medium">{error}</p>}
        {mensaje && <p className="text-green-700 text-sm mb-3 bg-green-50 p-3 rounded-lg font-medium">{mensaje}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Ítem</label>
              <select 
                name="esServicio" 
                value={formulario.esServicio} 
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none bg-white"
              >
                <option value="true">Servicio (Sin Stock / N/A)</option>
                <option value="false">Producto (Control de Stock)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre / Título</label>
              <input 
                type="text" name="tipo" 
                value={formulario.tipo} onChange={handleChange} required
                placeholder="Ej: Inseminación / Bloque Salino"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Costo (COP)</label>
              <input 
                type="number" name="costo" 
                value={formulario.costo} onChange={handleChange} required min="0"
                placeholder="Ej: 150000"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formulario.esServicio === 'false' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Stock / Cantidad Inicial</label>
                <input 
                  type="number" name="stock" 
                  value={formulario.stock} onChange={handleChange} required min="0"
                  placeholder="Ej: 25"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            )}
            <div className={formulario.esServicio === 'true' ? 'md:col-span-2' : ''}>
              <label className="block text-sm font-bold text-gray-700 mb-1">Descripción</label>
              <textarea 
                name="descripcion" 
                value={formulario.descripcion} onChange={handleChange} required
                placeholder="Detalles o especificaciones..."
                rows="2"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Imagen {editandoId && '(Opcional)'}</label>
              <input 
                type="file" name="imagen" 
                onChange={handleChange} accept="image/*"
                className="w-full p-2 border border-gray-300 rounded-xl bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-700 cursor-pointer text-xs"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="submit" 
              className="bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition shadow-md"
            >
              {editandoId ? 'Guardar Cambios' : '+ Agregar al Catálogo'}
            </button>
            {editandoId && (
              <button 
                type="button" 
                onClick={cancelarEdicion}
                className="bg-gray-300 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* TABLA */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Catálogo Activo e Inventario</h2>
        
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold">Imagen</th>
                <th className="px-6 py-4 font-bold">Tipo</th>
                <th className="px-6 py-4 font-bold">Nombre / Descripción</th>
                <th className="px-6 py-4 font-bold">Costo</th>
                <th className="px-6 py-4 font-bold">Stock</th>
                <th className="px-6 py-4 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No hay registros en el sistema.</td>
                </tr>
              ) : (
                productos.map((item) => (
                  <tr key={item._id} className="bg-white border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      {item.imagen ? (
                        <img 
                          src={`http://localhost:3000${item.imagen}`} 
                          alt={item.tipo} 
                          className="w-12 h-12 object-cover rounded-lg shadow-sm border" 
                        />
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sin imagen</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${item.esServicio ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                        {item.esServicio ? 'Servicio' : 'Producto'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{item.tipo}</div>
                      <div className="text-xs text-gray-500">{item.descripcion}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-green-600">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.costo)}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {item.esServicio ? (
                        <span className="text-gray-400 italic">N/A</span>
                      ) : (
                        <span className={item.stock > 0 ? 'text-gray-700' : 'text-red-600 font-bold'}>
                          {item.stock} unids.
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <button 
                        type="button"
                        onClick={() => iniciarEdicion(item)}
                        className="text-blue-600 hover:text-blue-800 font-bold px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-xs"
                      >
                        Editar
                      </button>
                      <button 
                        type="button"
                        onClick={() => eliminarProducto(item._id, item.tipo)}
                        className="text-red-600 hover:text-red-800 font-bold px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition text-xs"
                      >
                        Eliminar
                      </button>
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