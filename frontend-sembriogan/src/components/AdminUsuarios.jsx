import { useState, useEffect } from 'react';

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar usuarios desde el backend
  const cargarUsuarios = async () => {
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const res = await fetch('http://localhost:3000/api/auth/usuarios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setUsuarios(data.data);
      }
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar al cargar el componente
  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Función para Activar/Desactivar
  const toggleEstado = async (id, estadoActual) => {
    const accion = estadoActual ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Estás seguro de ${accion} este usuario?`)) return;

    try {
      const token = localStorage.getItem('tokenSembriogan');
      const res = await fetch(`http://localhost:3000/api/auth/usuarios/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ estado: !estadoActual })
      });
      const data = await res.json();

      if (data.success) {
        cargarUsuarios(); // Recargamos la tabla para ver el cambio
      } else {
        alert("Error: " + data.mensaje);
      }
    } catch (error) {
      alert("Error de conexión al actualizar.");
    }
  };

  if (loading) return <div className="text-center p-4 text-gray-500">Cargando personal...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary">Gestión de Personal</h2>
          <p className="text-gray-500 text-sm mt-1">Administra accesos y roles de la plataforma.</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-bold">Nombre</th>
              <th className="px-6 py-4 font-bold">Correo</th>
              <th className="px-6 py-4 font-bold">Rol</th>
              <th className="px-6 py-4 font-bold text-center">Estado</th>
              <th className="px-6 py-4 font-bold text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No hay usuarios registrados.</td>
              </tr>
            ) : (
              usuarios.map((user) => (
                <tr key={user._id} className="bg-white border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{user.nombre}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.rol === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${user.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {/* Evitar que un Admin se desactive a sí mismo por error (opcional pero recomendado) */}
                    <button 
                      onClick={() => toggleEstado(user._id, user.estado)}
                      className={`font-bold text-xs px-4 py-2 rounded-lg transition text-white ${user.estado ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                    >
                      {user.estado ? 'Desactivar' : 'Activar'}
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