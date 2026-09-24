import { useState, useEffect } from 'react';

export default function CatalogoPublico() {
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos', 'servicios', 'productos'

  useEffect(() => {
    const obtenerCatalogoPublico = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/catalogo');
        const data = await res.json();
        if (data.success) {
          setCatalogo(data.data);
        }
      } catch (err) {
        console.error("Error al cargar el catálogo público:", err);
      } finally {
        setLoading(false);
      }
    };

    obtenerCatalogoPublico();
  }, []);

  // Filtrar según la selección del usuario
  const catalogoFiltrado = catalogo.filter(item => {
    if (filtroTipo === 'servicios') return item.esServicio === true;
    if (filtroTipo === 'productos') return item.esServicio === false;
    return true;
  });

  if (loading) {
    return <div className="text-center py-12 text-gray-500 font-medium">Cargando catálogo de Sembriogan...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Encabezado */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-primary">Nuestros Servicios y Productos</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explora nuestra oferta especializada para el sector agropecuario y ganadero. Calidad y tecnología al servicio de tu producción.
        </p>

        {/* Filtros */}
        <div className="flex justify-center gap-3 pt-4">
          <button 
            onClick={() => setFiltroTipo('todos')}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${filtroTipo === 'todos' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFiltroTipo('servicios')}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${filtroTipo === 'servicios' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Servicios Veterinarios
          </button>
          <button 
            onClick={() => setFiltroTipo('productos')}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${filtroTipo === 'productos' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Productos e Insumos
          </button>
        </div>
      </div>

      {/* Grid de Ítems */}
      {catalogoFiltrado.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-500">No hay elementos disponibles en esta categoría por el momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalogoFiltrado.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition">
              
              {/* Imagen */}
              <div className="h-48 w-full bg-gray-100 relative overflow-hidden">
                {item.imagen ? (
                  <img 
                    src={`http://localhost:3000${item.imagen}`} 
                    alt={item.tipo} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm italic">
                    Sin imagen disponible
                  </div>
                )}
                <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${item.esServicio ? 'bg-blue-600 text-white' : 'bg-amber-500 text-white'}`}>
                  {item.esServicio ? 'Servicio' : 'Producto'}
                </span>
              </div>

              {/* Contenido */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">{item.tipo}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{item.descripcion}</p>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 block">Valor</span>
                    <span className="text-lg font-extrabold text-green-600">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.costo)}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400 block text-right">Disponibilidad</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {item.esServicio ? 'Disponible' : `${item.stock} unids.`}
                    </span>
                  </div>
                </div>

                {/* Botón de Acción / Solicitar / Comprar */}
                <button 
                  onClick={() => alert(`Seleccionaste: ${item.tipo}. Aquí conectaremos la pasarela de pagos o formulario de solicitud.`)}
                  className="w-full bg-primary text-white font-bold py-2.5 px-4 rounded-xl hover:bg-blue-700 transition text-sm shadow-sm"
                >
                  {item.esServicio ? 'Solicitar Servicio' : 'Comprar Producto'}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}