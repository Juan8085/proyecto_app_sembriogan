import { useState, useEffect } from 'react';

export default function AdminTestimonios() {
  const [testimonios, setTestimonios] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargarTestimoniosAdmin = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/testimonios/admin/todos');
      const data = await res.json();
      if (data.success) {
        setTestimonios(data.data);
      }
    } catch (err) {
      console.error("Error cargando testimonios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTestimoniosAdmin();
  }, []);

  const cambiarEstado = async (id, estadoActual) => {
    try {
      const res = await fetch(`http://localhost:3000/api/testimonios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aprobado: !estadoActual })
      });
      const data = await res.json();
      if (data.success) {
        cargarTestimoniosAdmin();
      }
    } catch (err) {
      console.error("Error cambiando estado:", err);
    }
  };

  const eliminarTestimonio = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este testimonio?")) return;
    try {
      const res = await fetch(`http://localhost:3000/api/testimonios/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        cargarTestimoniosAdmin();
      }
    } catch (err) {
      console.error("Error eliminando:", err);
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Cargando testimonios...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Gestión de Testimonios e Historias</h2>
          <p className="text-gray-500 text-sm">Autoriza cuáles testimonios de clientes se publican en la página principal.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-700">
            <tr>
              <th className="px-6 py-4">Autor / Hato</th>
              <th className="px-6 py-4">Rol / Descripción</th>
              <th className="px-6 py-4">Mensaje</th>
              <th className="px-6 py-4 text-center">Estado Web</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {testimonios.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-6 text-center text-gray-400">No hay testimonios recibidos todavía.</td>
              </tr>
            ) : (
              testimonios.map((item) => (
                <tr key={item._id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-bold text-gray-900">{item.nombre}</td>
                  <td className="px-6 py-4 text-gray-600">{item.rol}</td>
                  <td className="px-6 py-4 italic text-gray-700 max-w-xs truncate">"{item.mensaje}"</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.aprobado ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {item.aprobado ? 'Publicado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center space-x-2">
                    <button 
                      onClick={() => cambiarEstado(item._id, item.aprobado)}
                      className={`font-bold px-3 py-1.5 rounded-lg text-xs transition ${item.aprobado ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                    >
                      {item.aprobado ? 'Desaprobar' : 'Aprobar'}
                    </button>
                    <button 
                      onClick={() => eliminarTestimonio(item._id)}
                      className="font-bold px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs transition"
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
  );
}