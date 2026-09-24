import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminUsuarios from '../components/AdminUsuarios';

export default function AdminDashboard() {
  const [adminData, setAdminData] = useState(null);
  const [activeTab, setActiveTab] = useState('inicio'); // Estado para controlar la pestaña activa
  const navigate = useNavigate();

  // Verificar si hay sesión activa al cargar
  useEffect(() => {
    const token = localStorage.getItem('tokenSembriogan');
    const user = JSON.parse(localStorage.getItem('usuarioSembriogan'));
    
    if (!token || !user || user.rol !== 'Admin') {
      navigate('/login');
    } else {
      setAdminData(user);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('tokenSembriogan');
    localStorage.removeItem('usuarioSembriogan');
    navigate('/login');
  };

  if (!adminData) return <div className="p-10 text-center">Cargando panel...</div>;

  // Función para renderizar el contenido dinámico según la pestaña
  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-primary mb-4">¡Bienvenido de nuevo, {adminData.nombre}!</h2>
            <p className="text-gray-600">
              Desde aquí podrás gestionar toda la operación de Sembriogan. Utilice el menú de la izquierda para navegar entre los módulos.
            </p>
          </div>
        );
      case 'veterinarios':
        return <AdminUsuarios />;
      case 'historial':
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-primary mb-4">Historial Genético</h2>
            <p className="text-gray-600">Aquí conectaremos la tabla de trazabilidad de los procedimientos.</p>
          </div>
        );
      case 'catalogo':
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-primary mb-4">Catálogo y Servicios</h2>
            <p className="text-gray-600">Aquí gestionaremos los productos para el POS móvil de Wompi.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-light">
      {/* SIDEBAR (Menú Lateral) */}
      <aside className="w-64 bg-dark text-white flex flex-col shadow-xl">
        
        {/* CABECERA CON EL LOGO */}
        <div className="p-6 text-center border-b border-gray-700 flex flex-col items-center bg-white">
          <img 
            src="/logo.png" 
            alt="Logo Sembriogan" 
            className="h-16 object-contain mb-1" 
          />
          <p className="text-gray-600 text-xs font-bold uppercase tracking-wider">Panel de Administración</p>
        </div>
        
        {/* NAVEGACIÓN */}
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('inicio')}
            className={`w-full text-left p-3 rounded-lg font-semibold transition ${activeTab === 'inicio' ? 'bg-primary text-white' : 'hover:bg-gray-800 text-gray-300'}`}
          >
            🏠 Inicio / Resumen
          </button>
          <button 
            onClick={() => setActiveTab('veterinarios')}
            className={`w-full text-left p-3 rounded-lg font-semibold transition ${activeTab === 'veterinarios' ? 'bg-primary text-white' : 'hover:bg-gray-800 text-gray-300'}`}
          >
            👨‍⚕️ Gestión de Personal
          </button>
          <button 
            onClick={() => setActiveTab('historial')}
            className={`w-full text-left p-3 rounded-lg font-semibold transition ${activeTab === 'historial' ? 'bg-primary text-white' : 'hover:bg-gray-800 text-gray-300'}`}
          >
            📋 Historial Genético
          </button>
          <button 
            onClick={() => setActiveTab('catalogo')}
            className={`w-full text-left p-3 rounded-lg font-semibold transition ${activeTab === 'catalogo' ? 'bg-primary text-white' : 'hover:bg-gray-800 text-gray-300'}`}
          >
            📦 Catálogo y Servicios
          </button>
        </nav>

        {/* PIE DEL SIDEBAR (Cerrar sesión) */}
        <div className="p-4 border-t border-gray-700 bg-gray-900">
          <div className="mb-3">
            <p className="text-xs text-gray-400">Sesión iniciada como:</p>
            <p className="font-bold text-sm truncate">{adminData.nombre}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg font-bold transition text-sm"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">
            {activeTab === 'inicio' && 'Panel de Control General'}
            {activeTab === 'veterinarios' && 'Módulo de Personal'}
            {activeTab === 'historial' && 'Módulo de Trazabilidad'}
            {activeTab === 'catalogo' && 'Gestión de Tienda'}
          </h1>
        </header>

        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}