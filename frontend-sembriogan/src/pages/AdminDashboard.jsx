import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminUsuarios from '../components/AdminUsuarios';
import AdminTrazabilidad from '../components/AdminTrazabilidad';
import AdminCatalogo from '../components/AdminCatalogo';
import AdminResumen from '../components/AdminResumen';
import AdminTestimonios from '../components/AdminTestimonios';

export default function AdminDashboard() {
  const [adminData, setAdminData] = useState(null);
  const [activeTab, setActiveTab] = useState('inicio'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Estado para el menú responsivo
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

  // Cambiar pestaña y cerrar menú en móviles automáticamente
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false); 
  };

  if (!adminData) return <div className="p-10 text-center">Cargando panel...</div>;

  // Función para renderizar el contenido dinámico según la pestaña
  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':
        return <AdminResumen />;
      case 'veterinarios':
        return <AdminUsuarios />;
      case 'historial':
        return <AdminTrazabilidad />;
      case 'catalogo':
        return <AdminCatalogo />;
      case 'testimonios':
        return <AdminTestimonios />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-light overflow-hidden">
      
      {/* OVERLAY OSCURO PARA MÓVILES */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* SIDEBAR (Menú Lateral Responsivo) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark text-white flex flex-col shadow-xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* CABECERA CON EL LOGO */}
        <div className="p-6 text-center border-b border-gray-700 flex flex-col items-center bg-white relative">
          {/* Botón cerrar (Solo visible en móvil) */}
          <button 
            className="lg:hidden absolute top-3 right-4 text-gray-400 hover:text-gray-800 text-xl font-bold"
            onClick={() => setIsSidebarOpen(false)}
          >
            ✕
          </button>
          
          <img 
            src="/logo.png" 
            alt="Logo Sembriogan" 
            className="h-16 object-contain mb-1 mt-2 lg:mt-0" 
          />
          <p className="text-gray-600 text-xs font-bold uppercase tracking-wider">Panel de Administración</p>
        </div>
        
        {/* NAVEGACIÓN */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => handleTabChange('inicio')}
            className={`w-full text-left p-3 rounded-lg font-semibold transition ${activeTab === 'inicio' ? 'bg-primary text-white' : 'hover:bg-gray-800 text-gray-300'}`}
          >
            🏠 Inicio / Resumen
          </button>
          <button 
            onClick={() => handleTabChange('veterinarios')}
            className={`w-full text-left p-3 rounded-lg font-semibold transition ${activeTab === 'veterinarios' ? 'bg-primary text-white' : 'hover:bg-gray-800 text-gray-300'}`}
          >
            👨‍⚕️ Gestión de Personal
          </button>
          <button 
            onClick={() => handleTabChange('historial')}
            className={`w-full text-left p-3 rounded-lg font-semibold transition ${activeTab === 'historial' ? 'bg-primary text-white' : 'hover:bg-gray-800 text-gray-300'}`}
          >
            📋 Historial Genético
          </button>
          <button 
            onClick={() => handleTabChange('catalogo')}
            className={`w-full text-left p-3 rounded-lg font-semibold transition ${activeTab === 'catalogo' ? 'bg-primary text-white' : 'hover:bg-gray-800 text-gray-300'}`}
          >
            📦 Catálogo y Servicios
          </button>
          <button 
            onClick={() => handleTabChange('testimonios')}
            className={`w-full text-left p-3 rounded-lg font-semibold transition ${activeTab === 'testimonios' ? 'bg-primary text-white' : 'hover:bg-gray-800 text-gray-300'}`}
          >
            💬 Testimonios
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        
        {/* HEADER RESPONSIVO */}
        <header className="bg-white shadow-sm p-4 flex items-center border-b border-gray-200 shrink-0">
          {/* BOTÓN HAMBURGUESA (Solo en móviles) */}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden mr-4 text-gray-600 hover:text-primary focus:outline-none"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>

          <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
            {activeTab === 'inicio' && 'Panel de Control General'}
            {activeTab === 'veterinarios' && 'Módulo de Personal'}
            {activeTab === 'historial' && 'Módulo de Trazabilidad'}
            {activeTab === 'catalogo' && 'Gestión de Tienda'}
            {activeTab === 'testimonios' && 'Gestión de Testimonios'}
          </h1>
        </header>

        {/* CONTENEDOR DE LAS VISTAS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}