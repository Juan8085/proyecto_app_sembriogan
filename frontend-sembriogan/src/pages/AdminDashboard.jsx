import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Dna, 
  ShoppingBag, 
  MessageSquareQuote, 
  Image as ImageIcon, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ExternalLink, 
  ShieldCheck,
  ChevronRight,
  Activity,
  Sparkles,
  MapPin
} from 'lucide-react';
import AdminUsuarios from '../components/AdminUsuarios';
import AdminTrazabilidad from '../components/AdminTrazabilidad';
import AdminCatalogo from '../components/AdminCatalogo';
import AdminResumen from '../components/AdminResumen';
import AdminTestimonios from '../components/AdminTestimonios';
import GestorCarrusel from '../components/GestorCarrusel';
import AdminConfiguracion from '../components/AdminConfiguracion';
import AdminFincasMapa from '../components/AdminFincasMapa';

export default function AdminDashboard() {
  const [adminData, setAdminData] = useState(null);
  const [activeTab, setActiveTab] = useState('inicio'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false); 
  };

  if (!adminData) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium text-sm">Cargando portal administrativo...</p>
      </div>
    );
  }

  const navItems = [
    { id: 'inicio', label: 'Inicio / Resumen', icon: LayoutDashboard, badge: 'KPIs' },
    { id: 'veterinarios', label: 'Gestión de Personal', icon: Users },
    { id: 'fincas', label: 'Geolocalización Fincas', icon: MapPin, badge: 'GPS' },
    { id: 'historial', label: 'Historial Genético', icon: Dna, badge: 'Alertas' },
    { id: 'catalogo', label: 'Catálogo y Servicios', icon: ShoppingBag },
    { id: 'testimonios', label: 'Testimonios', icon: MessageSquareQuote },
    { id: 'carrusel', label: 'Landing Page', icon: ImageIcon },
    { id: 'configuracion', label: 'Configuración', icon: Settings }
  ];

  const getSectionTitle = () => {
    switch (activeTab) {
      case 'inicio': return { title: 'Panel de Control General', subtitle: 'Métricas financieras, tasa de preñez e inventario en tiempo real' };
      case 'veterinarios': return { title: 'Gestión de Personal y Clientes', subtitle: 'Directorio de clientes ganaderos registrados, veterinarios y administradores' };
      case 'fincas': return { title: 'Geolocalización de Fincas y Clientes', subtitle: 'Mapa interactivo y georreferenciación satelital de predios ganaderos' };
      case 'historial': return { title: 'Trazabilidad Genética y Protocolos', subtitle: 'Seguimiento de biotecnología reproductiva (IATF, IA, TE) y alertas clínicas' };
      case 'catalogo': return { title: 'Gestión de Tienda y Servicios', subtitle: 'Control de productos, stock en bodega y servicios biotecnológicos' };
      case 'testimonios': return { title: 'Gestión de Testimonios', subtitle: 'Moderación de experiencias y opiniones de ganaderos' };
      case 'carrusel': return { title: 'Landing Page y Contenido Web', subtitle: 'Banners de portada e información institucional de Sembriogan' };
      case 'configuracion': return { title: 'Configuración del Sistema', subtitle: 'Pasarelas de pago Wompi, WhatsApp oficial y perfil de administración' };
      default: return { title: 'Panel de Administración', subtitle: 'Sembriogan' };
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio': return <AdminResumen />;
      case 'veterinarios': return <AdminUsuarios />;
      case 'fincas': return <AdminFincasMapa />;
      case 'historial': return <AdminTrazabilidad />;
      case 'catalogo': return <AdminCatalogo />;
      case 'testimonios': return <AdminTestimonios />;
      case 'configuracion': return <AdminConfiguracion />;
      case 'carrusel': return <GestorCarrusel />;
      default: return null;
    }
  };

  const { title, subtitle } = getSectionTitle();

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* OVERLAY MÓVIL */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* SIDEBAR MODERNO */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white flex flex-col border-r border-slate-800/80 shadow-2xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* LOGO Y MARCA */}
        <div className="p-6 pb-5 border-b border-slate-800/70 flex flex-col relative bg-slate-900/50">
          <button 
            className="lg:hidden absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-2xl shadow-md border border-slate-700/50 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Logo Sembriogan" 
                className="h-10 w-auto object-contain" 
              />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                SEMBRIOGAN
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 inline-block">
                Somos EPSEA
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Sistema en Línea &middot; Base Central
          </div>
        </div>
        
        {/* NAVEGACIÓN MODERNA CON LUCIDE */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
          <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Navegación Principal
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-lg shadow-blue-500/25 font-bold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-xl transition ${isActive ? 'bg-white/20 text-white' : 'text-slate-400 group-hover:text-blue-400 group-hover:bg-slate-800'}`}>
                    <Icon size={18} />
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>
                
                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-white/25 text-white' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* PIE DE SIDEBAR CON PERFIL DE USUARIO */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/60">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-3 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm shadow-blue-500/30">
                {adminData.nombre ? adminData.nombre.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="truncate">
                <p className="font-bold text-xs text-white truncate">{adminData.nombre}</p>
                <p className="text-[10px] text-blue-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck size={12} /> Administrador
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 py-2.5 rounded-xl font-bold transition text-xs"
          >
            <LogOut size={15} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full bg-slate-100">
        
        {/* HEADER BAR MODERNO */}
        <header className="bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-200/80 shadow-xs shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition focus:outline-none"
              title="Abrir Menú"
            >
              <Menu size={22} />
            </button>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-0.5">
                <span>Panel</span>
                <ChevronRight size={12} />
                <span className="text-blue-600 font-bold capitalize">{activeTab}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {title}
              </h1>
            </div>
          </div>

          {/* ACCIONES SUPERIORES */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-blue-600 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <span>Ver Tienda Pública</span>
              <ExternalLink size={14} />
            </Link>
          </div>
        </header>

        {/* CONTENEDOR DE CONTENIDO CON SCROLL FLUIDO */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}