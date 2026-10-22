import { useState, useEffect, useRef, useMemo } from 'react';
import { API_BASE_URL, getApiUrl, getMediaUrl } from '../config/api';
import { Link } from 'react-router-dom';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { 
  ShoppingCart, 
  User, 
  ChevronDown, 
  Package, 
  Settings, 
  LogOut, 
  Star, 
  CheckCircle, 
  Menu, 
  X, 
  FileText, 
  Search,
  Filter,
  Layers,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ExternalLink,
  ShieldCheck,
  Award
} from 'lucide-react';

export default function CatalogoTienda() {
  const [catalogo, setCatalogo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carrito, setCarrito] = useState(() => {
    try {
      const saved = localStorage.getItem('carritoSembriogan');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'todos' | 'servicios' | 'productos' | 'destacados' | 'en_stock'

  // Modales
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isClienteDashboardOpen, setIsClienteDashboardOpen] = useState(false);
  const [isPerfilOpen, setIsPerfilOpen] = useState(false);
  const [certificadoClienteModal, setCertificadoClienteModal] = useState(null);

  // Menú Desplegable (Dropdown)
  const [isDropdownMenuOpen, setIsDropdownMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Estados de Usuario
  const [userCliente, setUserCliente] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({ email: '', password: '', nombre: '' });
  const [configGlobal, setConfigGlobal] = useState(null);
  const [misOrdenesCliente, setMisOrdenesCliente] = useState([]);
  const [misProcedimientosCliente, setMisProcedimientosCliente] = useState([]);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('carritoSembriogan', JSON.stringify(carrito));
  }, [carrito]);

  // Cargar catálogo y configuración
  const cargarDatos = async () => {
    try {
      const resCat = await fetch(`${API_BASE_URL}/api/catalogo`);
      const dataCat = await resCat.json();
      if (dataCat.success) setCatalogo(dataCat.data);

      const resConf = await fetch(`${API_BASE_URL}/api/configuracion`);
      const dataConf = await resConf.json();
      if (dataConf.success) setConfigGlobal(dataConf.data);
    } catch (err) {
      console.error("Error cargando tienda:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    const clienteGuardado = localStorage.getItem('clienteSembriogan');
    if (clienteGuardado) setUserCliente(JSON.parse(clienteGuardado));

    // Verificar si el usuario fue redirigido por Wompi tras un pago
    const searchParams = new URLSearchParams(window.location.search);
    const wompiTxId = searchParams.get('id');
    if (wompiTxId) {
      const pendingCartRaw = localStorage.getItem('pendingWompiCart');
      const pendingCart = pendingCartRaw ? JSON.parse(pendingCartRaw) : null;

      fetch(`${API_BASE_URL}/api/pagos/verificar-transaccion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: wompiTxId, pendingCart })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.status === 'APPROVED') {
          alert('¡Pago completado con éxito! Tu pedido ha sido procesado.');
          setCarrito([]);
          localStorage.removeItem('carritoSembriogan');
          localStorage.removeItem('pendingWompiCart');
          window.history.replaceState({}, document.title, window.location.pathname);
          cargarDatos();
        }
      })
      .catch(console.error);
    }
  }, []);

  // Cargar historial de compras al abrir el panel
  useEffect(() => {
    if (userCliente && isClienteDashboardOpen) {
      fetch(`${API_BASE_URL}/api/ordenes?email=${userCliente.email}`)
        .then(res => res.json())
        .then(data => { if (data.success) setMisOrdenesCliente(data.data); })
        .catch(console.error);

      const token = localStorage.getItem('tokenSembriogan') || '';
      fetch(`${API_BASE_URL}/api/registro-genetico?email=${userCliente.email}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => { if (data.success) setMisProcedimientosCliente(data.data); })
      .catch(console.error);
    }
  }, [userCliente, isClienteDashboardOpen]);

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Operaciones de Carrito
  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(item => item._id === producto._id);
    if (existe) {
      setCarrito(carrito.map(item => item._id === producto._id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
    setIsCartOpen(true);
  };

  const cambiarCantidad = (id, delta) => {
    setCarrito(carrito.map(item => {
      if (item._id === id) {
        const nuevaCantidad = item.cantidad + delta;
        return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const totalCarrito = carrito.reduce((sum, item) => sum + (item.costo * item.cantidad), 0);
  const totalCantidadItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  // Proceso de Pago Seguro con Wompi
  const pagarConWompi = async () => {
    if (carrito.length === 0) return;
    if (!userCliente) {
      alert('Por favor, inicia sesión para procesar tu pedido.');
      setIsAuthOpen(true);
      return;
    }
    if (!window.WidgetCheckout) {
      alert('El widget de pagos de Wompi se está cargando. Por favor intenta en un momento.');
      return;
    }

    const referenciaUnica = 'WEB-SEM-' + Date.now();
    const amountInCents = Math.round(totalCarrito * 100);

    let signature = '';
    const apiBase = window.location.hostname === 'localhost' ? `${API_BASE_URL}` : `http://${window.location.hostname}:3000`;
    
    try {
      const resSig = await fetch(`${apiBase}/api/configuracion/generar-firma`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: referenciaUnica, amountInCents, currency: 'COP' })
      });
      const dataSig = await resSig.json();
      if (dataSig.success && dataSig.signature) {
        signature = dataSig.signature;
      }
    } catch (e) {
      console.warn('Backend generar-firma no respondió, intentando fallback local...', e);
    }

    if (!signature) {
      const secret = configGlobal?.wompiIntegridadSecret || 'test_integrity_aHql6rp4EWgoSLM7bJ9INi9GkHfHVyRO';
      try {
        const cadena = `${referenciaUnica}${amountInCents}COP${secret}`;
        const msgUint8 = new TextEncoder().encode(cadena);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (errLocal) {
        console.error('Error calculando firma local SHA-256:', errLocal);
      }
    }

    if (!signature) {
      alert('Error de seguridad: No se pudo generar la firma de integridad de Wompi.');
      return;
    }

    localStorage.setItem('pendingWompiCart', JSON.stringify({
      items: carrito.map(item => ({ catalogoItem: item._id, tipo: item.tipo, costo: item.costo, cantidad: item.cantidad })),
      cliente: { nombre: userCliente.nombre, email: userCliente.email },
      total: totalCarrito,
      reference: referenciaUnica
    }));

    const checkoutConfig = {
      currency: 'COP',
      amountInCents: amountInCents,
      reference: referenciaUnica,
      publicKey: configGlobal?.wompiPublicKey || 'pub_test_ljKW2orNya3GoWqfTCl1wu6vOy50mnnh',
      signature: { integrity: signature },
      'signature:integrity': signature
    };

    const checkout = new window.WidgetCheckout(checkoutConfig);
    checkout.open((result) => {
      const transaction = result.transaction;
      if (transaction && transaction.status === 'APPROVED') {
        alert('¡Transacción aprobada! Tu compra ha sido confirmada con éxito.');
        setCarrito([]);
        localStorage.removeItem('carritoSembriogan');
        localStorage.removeItem('pendingWompiCart');
        setIsCartOpen(false);
        cargarDatos();
      } else if (transaction && transaction.status === 'DECLINED') {
        alert('La transacción fue rechazada por tu entidad bancaria. Por favor intenta con otro medio.');
      }
    });
  };

  // Autenticación de Cliente
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? 'login' : 'registro';
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData)
      });
      const data = await res.json();
      if (data.success) {
        setUserCliente(data.usuario);
        localStorage.setItem('clienteSembriogan', JSON.stringify(data.usuario));
        setIsAuthOpen(false);
      } else {
        alert(data.mensaje || 'Error en autenticación');
      }
    } catch {
      alert('Error de conexión');
    }
  };

  const loginConGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const resGoogle = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const dataGoogle = await resGoogle.json();

        const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInfo: dataGoogle })
        });
        const data = await res.json();
        if (data.success) {
          setUserCliente(data.usuario);
          if (data.token) localStorage.setItem('tokenSembriogan', data.token);
          localStorage.setItem('clienteSembriogan', JSON.stringify(data.usuario));
          localStorage.setItem('usuarioSembriogan', JSON.stringify(data.usuario));
          setIsAuthOpen(false);
          alert(`¡Bienvenido, ${data.usuario.nombre}!`);
        } else {
          alert('Error autenticando con Google: ' + data.mensaje);
        }
      } catch (error) {
        console.error('Error Google:', error);
        alert('Error de conexión con Google');
      }
    },
    onError: (error) => {
      console.error('Error Google:', error);
      alert('No se pudo abrir la ventana de Google. Si estás navegando por IP privada, usa https://sembriogan-app.loca.lt');
    }
  });

  const handleClickGoogle = () => {
    if (/^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname)) {
      alert(`💡 Por políticas de seguridad, Google no permite autenticación desde direcciones IP numéricas (${window.location.hostname}).\n\nPor favor:\n1. Inicia sesión con Correo y Contraseña aquí en el formulario, o\n2. Ingresa a la plataforma usando el enlace seguro: https://sembriogan-app.loca.lt`);
      return;
    }
    loginConGoogle();
  };

  // Filtrado de Productos
  const productosFiltrados = useMemo(() => {
    return catalogo.filter(item => {
      const q = busqueda.toLowerCase().trim();
      const matchBusqueda = !q || 
        item.tipo?.toLowerCase().includes(q) || 
        item.descripcion?.toLowerCase().includes(q);

      if (!matchBusqueda) return false;

      if (filtroTipo === 'servicios') return item.esServicio;
      if (filtroTipo === 'productos') return !item.esServicio;
      if (filtroTipo === 'destacados') return item.destacado;
      if (filtroTipo === 'en_stock') return item.esServicio || item.stock > 0;
      return true;
    });
  }, [catalogo, busqueda, filtroTipo]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      
      {/* ============================================================ */}
      {/* BARRA DE NAVEGACIÓN SUPERIOR (FLOTANTE GLASS) */}
      <header className="fixed top-3 md:top-5 inset-x-3 md:inset-x-8 z-50 transition-all duration-300">
        <div className="bg-white/75 backdrop-blur-2xl border border-white/80 rounded-3xl shadow-xl shadow-slate-900/5 px-4 md:px-6 py-2.5 md:py-3 flex items-center justify-between max-w-7xl mx-auto">
          
          {/* Logo y Enlace a Inicio */}
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src="/logo.png" 
              alt="Logo Sembriogan" 
              className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" 
            />
          </Link>

          {/* Menú Desktop */}
          <nav className="hidden lg:flex items-center bg-white/40 backdrop-blur-md p-1 rounded-full border border-white/50 text-sm gap-1">
            <Link 
              to="/" 
              className="px-4 py-1.5 rounded-full font-semibold text-slate-700 hover:text-blue-600 hover:bg-white/70 transition"
            >
              Inicio
            </Link>
            <Link 
              to="/#nosotros" 
              className="px-4 py-1.5 rounded-full font-semibold text-slate-700 hover:text-blue-600 hover:bg-white/70 transition"
            >
              Nosotros
            </Link>
            <Link 
              to="/#historias" 
              className="px-4 py-1.5 rounded-full font-semibold text-slate-700 hover:text-blue-600 hover:bg-white/70 transition"
            >
              Historias
            </Link>
            <Link 
              to="/tienda" 
              className="px-4 py-1.5 rounded-full font-bold bg-blue-600 text-white shadow-md shadow-blue-500/30 transition"
            >
              Tienda Oficial
            </Link>
            
            <div className="h-4 w-px bg-white/60 mx-1"></div>

            <Link 
              to="/admin" 
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs text-slate-800 bg-white/80 hover:bg-white border border-white/60 shadow-xs hover:text-blue-600 hover:border-blue-200 transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Admin
            </Link>
          </nav>

          {/* Acciones Derecha (Carrito, Usuario y Menú Móvil) */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Botón Carrito */}
            <button 
              onClick={() => setIsCartOpen(true)} 
              className="relative bg-white/50 hover:bg-white/80 backdrop-blur-md border border-white/60 p-2.5 rounded-2xl transition text-slate-800 flex items-center justify-center group shadow-xs"
              title="Ver Carrito de Compras"
            >
              <ShoppingCart size={19} className="group-hover:scale-110 transition-transform text-slate-700" />
              {totalCantidadItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center font-bold shadow-md shadow-blue-500/30 ring-2 ring-white animate-bounce">
                  {totalCantidadItems}
                </span>
              )}
            </button>

            {/* Menú Usuario / Login */}
            {userCliente ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownMenuOpen(!isDropdownMenuOpen)} 
                  className="bg-blue-50/90 text-blue-700 hover:bg-blue-100/90 text-xs md:text-sm font-semibold px-3 md:px-4 py-2 rounded-2xl transition flex items-center gap-2 border border-blue-200/70 shadow-xs"
                >
                  <User size={16} /> 
                  <span className="max-w-[90px] md:max-w-none truncate">{userCliente.nombre.split(' ')[0]}</span> 
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDropdownMenuOpen && (
                  <div className="absolute right-0 mt-3 w-60 bg-white border border-slate-100 rounded-3xl shadow-2xl py-2 flex flex-col z-[70] overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
                      <p className="text-sm font-bold text-slate-800 truncate">{userCliente.nombre}</p>
                      <p className="text-xs text-slate-500 truncate">{userCliente.email}</p>
                    </div>
                    <button onClick={() => { setIsClienteDashboardOpen(true); setIsDropdownMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50 text-left transition font-medium">
                      <Package size={16} className="text-blue-600" /> Historial de Compras
                    </button>
                    <button onClick={() => { setIsPerfilOpen(true); setIsDropdownMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50 text-left transition font-medium">
                      <Settings size={16} className="text-slate-500" /> Configurar Perfil
                    </button>
                    <Link to="/admin" className="flex items-center gap-3 px-5 py-3 text-sm text-blue-600 hover:bg-blue-50 text-left transition font-semibold">
                      ⚙️ Panel Administrador
                    </Link>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button onClick={() => { setUserCliente(null); localStorage.removeItem('clienteSembriogan'); setIsDropdownMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50 text-left transition font-medium">
                      <LogOut size={16} /> Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthOpen(true)} 
                className="bg-slate-900 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-2xl font-bold hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-600/20 transition-all duration-200 text-xs md:text-sm shadow-xs"
              >
                Ingresar
              </button>
            )}

            {/* Menú Móvil Trigger */}
            <button 
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)} 
              className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-2xl transition border border-slate-200/60"
            >
              {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Menú Móvil Desplegable */}
        {isMobileNavOpen && (
          <div className="lg:hidden mt-2 p-4 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-xl flex flex-col gap-2 max-w-7xl mx-auto">
            <Link to="/" onClick={() => setIsMobileNavOpen(false)} className="px-4 py-2.5 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 text-sm">
              Inicio
            </Link>
            <Link to="/tienda" onClick={() => setIsMobileNavOpen(false)} className="px-4 py-2.5 rounded-xl font-bold bg-blue-600 text-white text-sm">
              Tienda Oficial
            </Link>
            <Link to="/admin" onClick={() => setIsMobileNavOpen(false)} className="px-4 py-2.5 rounded-xl font-bold text-slate-800 bg-slate-100 text-sm">
              ⚙️ Panel Administrador
            </Link>
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* CONTENIDO PRINCIPAL DE LA TIENDA                            */}
      {/* ============================================================ */}
      <main className="pt-28 md:pt-36 pb-24 px-4 sm:px-6 max-w-7xl mx-auto w-full flex-1">
        
        {/* Cabecera / Banner de Tienda */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-[2.5rem] p-8 md:p-14 text-white shadow-2xl relative overflow-hidden mb-12">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-blue-200">
              <ShoppingBag size={14} className="text-blue-400" />
              <span>Tienda y Catálogo Completo Sembriogan</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Insumos y Biotecnología Reproductiva
            </h1>

            <p className="text-slate-300 text-sm sm:text-lg font-light leading-relaxed">
              Explora nuestro inventario de pajillas de alta genética, bloques minerales, protocolos hormonales y asesoría especializada con despacho nacional y pagos seguros mediante Wompi.
            </p>

            <div className="flex flex-wrap gap-3 pt-2 text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <ShieldCheck size={14} className="text-emerald-400" /> Pagos Protegidos (Wompi)
              </span>
              <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                <Award size={14} className="text-amber-400" /> Calidad Genética EPSEA
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* HERRAMIENTAS: BÚSQUEDA Y FILTROS                             */}
        {/* ============================================================ */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 mb-10 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Buscador */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar pajillas, bloques, servicios..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Chips de filtro */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                onClick={() => setFiltroTipo('todos')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  filtroTipo === 'todos'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({catalogo.length})
              </button>
              <button
                onClick={() => setFiltroTipo('destacados')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  filtroTipo === 'destacados'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${filtroTipo === 'destacados' ? 'fill-white text-white' : 'fill-amber-400 text-amber-500'}`} />
                Estrella ⭐
              </button>
              <button
                onClick={() => setFiltroTipo('servicios')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  filtroTipo === 'servicios'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Servicios
              </button>
              <button
                onClick={() => setFiltroTipo('productos')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  filtroTipo === 'productos'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Productos
              </button>
              <button
                onClick={() => setFiltroTipo('en_stock')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  filtroTipo === 'en_stock'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Disponibles
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* GRILLA DE PRODUCTOS                                          */}
        {/* ============================================================ */}
        {loading ? (
          <div className="py-24 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-sm font-semibold">Cargando catálogo completo...</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="py-20 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
            <Package size={48} className="mx-auto mb-3 opacity-30 text-slate-400" />
            <h3 className="text-base font-bold text-slate-700">No se encontraron productos</h3>
            <p className="text-xs text-slate-400 mt-1">Prueba ajustando los términos de búsqueda o los filtros de categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {productosFiltrados.map((item) => {
              const estaAgotado = !item.esServicio && item.stock <= 0;
              return (
                <div 
                  key={item._id} 
                  className="bg-white rounded-[2.2rem] border border-slate-200/80 overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 hover:-translate-y-1.5 group"
                >
                  <div>
                    {/* Imagen del Ítem */}
                    <div className="h-64 w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      {item.imagen ? (
                        <img 
                          src={`${API_BASE_URL}${item.imagen}`} 
                          alt={item.tipo} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <Package size={52} className="text-slate-300" />
                      )}

                      {/* Badges de Tipo y Estrella */}
                      <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wider shadow-sm ${
                          item.esServicio ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
                        }`}>
                          {item.esServicio ? 'Servicio' : 'Producto'}
                        </span>
                        {item.destacado && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-900 shadow-md inline-flex items-center gap-1">
                            <Star size={11} className="fill-slate-900 text-slate-900" /> Estrella
                          </span>
                        )}
                      </div>

                      {/* Badge de Disponibilidad */}
                      {!item.esServicio && (
                        <div className="absolute top-4 right-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm ${
                            item.stock > 0 ? 'bg-white/90 backdrop-blur-md text-slate-800' : 'bg-rose-500 text-white font-black'
                          }`}>
                            {item.stock > 0 ? `${item.stock} unids.` : 'Agotado'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Descripción y Título */}
                    <div className="p-6 space-y-2">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.tipo}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                        {item.descripcion}
                      </p>
                    </div>
                  </div>

                  {/* Precio y Botón de Carrito */}
                  <div className="p-6 pt-0 space-y-4">
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-2xl font-black text-slate-900">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.costo)}
                      </span>
                    </div>

                    <button 
                      onClick={() => agregarAlCarrito(item)} 
                      disabled={estaAgotado}
                      className={`w-full font-bold py-3.5 rounded-2xl transition flex justify-center items-center gap-2 shadow-sm ${
                        estaAgotado 
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                          : 'bg-slate-900 hover:bg-blue-600 text-white shadow-slate-900/10'
                      }`}
                    >
                      <ShoppingCart size={18} />
                      <span>{estaAgotado ? 'Agotado' : 'Agregar al Carrito'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* ============================================================ */}
      {/* MODAL: CARRITO DE COMPRAS FLOTANTE (SLIDE-OVER / DRAWER)     */}
      {/* ============================================================ */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md h-full shadow-2xl p-6 sm:p-8 flex flex-col justify-between animate-in slide-in-from-right duration-300">
            
            <div className="flex-1 overflow-y-auto">
              <div className="flex justify-between items-center pb-5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={22} className="text-blue-600" />
                  <h3 className="text-xl font-black text-slate-900">Mi Carrito</h3>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)} 
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
                >
                  <X size={20} />
                </button>
              </div>

              {carrito.length === 0 ? (
                <div className="py-20 text-center text-slate-400 space-y-3">
                  <Package size={52} className="mx-auto opacity-30 text-slate-400" />
                  <p className="text-sm font-semibold">Tu carrito está vacío.</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Explorar productos disponibles
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 py-4 space-y-4">
                  {carrito.map((item) => (
                    <div key={item._id} className="pt-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate">{item.tipo}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.costo)}
                        </p>
                      </div>

                      {/* Control de cantidad */}
                      <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1 border border-slate-200">
                        <button 
                          onClick={() => cambiarCantidad(item._id, -1)} 
                          className="p-1 hover:bg-white rounded-lg transition text-slate-600"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="font-black text-xs px-1.5">{item.cantidad}</span>
                        <button 
                          onClick={() => cambiarCantidad(item._id, 1)} 
                          className="p-1 hover:bg-white rounded-lg transition text-slate-600"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Subtotal del ítem */}
                      <span className="font-black text-slate-900 text-sm whitespace-nowrap">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.costo * item.cantidad)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total y Checkout */}
            {carrito.length > 0 && (
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold text-sm">Subtotal:</span>
                  <span className="text-2xl font-black text-slate-900">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalCarrito)}
                  </span>
                </div>

                <button 
                  onClick={pagarConWompi} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 text-sm"
                >
                  <ShieldCheck size={18} />
                  <span>Pagar Seguro con Wompi</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: LOGIN / REGISTRO DE CLIENTES                          */}
      {/* ============================================================ */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative border border-slate-200">
            <button 
              onClick={() => setIsAuthOpen(false)} 
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 p-1"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {authMode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta Ganadera'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {authMode === 'login' ? 'Accede a tus certificados y trazabilidad en línea.' : 'Regístrate para recibir reportes y facturación directa.'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'registro' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={authData.nombre} 
                    onChange={e => setAuthData({...authData, nombre: e.target.value})} 
                    required 
                    placeholder="Ej: Juan Pérez" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={authData.email} 
                  onChange={e => setAuthData({...authData, email: e.target.value})} 
                  required 
                  placeholder="ganadero@ejemplo.com" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contraseña</label>
                <input 
                  type="password" 
                  value={authData.password} 
                  onChange={e => setAuthData({...authData, password: e.target.value})} 
                  required 
                  placeholder="••••••••" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition shadow-md shadow-blue-500/20 text-sm"
              >
                {authMode === 'login' ? 'Entrar a mi Cuenta' : 'Completar Registro'}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">O continúa con</span></div>
            </div>

            <div className="flex justify-center w-full">
              <button
                type="button"
                onClick={handleClickGoogle}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-2xl border border-slate-300 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer active:scale-[0.98]"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-sm font-semibold">Continuar con Google</span>
              </button>
            </div>

            <div className="mt-6 text-center text-xs text-slate-500">
              {authMode === 'login' ? (
                <>¿Aún no tienes cuenta? <button type="button" onClick={() => setAuthMode('registro')} className="font-bold text-blue-600 hover:underline">Regístrate gratis</button></>
              ) : (
                <>¿Ya tienes una cuenta? <button type="button" onClick={() => setAuthMode('login')} className="font-bold text-blue-600 hover:underline">Inicia sesión</button></>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: DASHBOARD DEL CLIENTE (HISTORIAL DE COMPRAS)           */}
      {/* ============================================================ */}
      {isClienteDashboardOpen && userCliente && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-8 relative overflow-hidden max-h-[90vh] flex flex-col">
            <button onClick={() => setIsClienteDashboardOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-700"><X size={24}/></button>
            <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-black">
                {userCliente.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800">{userCliente.nombre}</h3>
                <p className="text-sm text-slate-500 font-medium">{userCliente.email}</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2"><Package size={18}/> Mis Compras</h4>
                {misOrdenesCliente.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4">No hay compras registradas bajo el correo: {userCliente.email}</p>
                ) : (
                  <div className="space-y-3">
                    {misOrdenesCliente.map(orden => (
                      <div key={orden._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">Ref: <span className="font-mono text-xs text-slate-500">{orden.referenciaWompi}</span></p>
                          <p className="text-slate-400 text-xs mt-1">{new Date(orden.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-slate-800">${orden.total?.toLocaleString()} COP</p>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md">Aprobado</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FOOTER                                                       */}
      {/* ============================================================ */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Sembriogan" className="h-9 w-auto brightness-0 invert" />
            <p className="text-slate-500">Somos EPSEA • Biotecnología Reproductiva y Extensión Agropecuaria.</p>
          </div>
          <p>© {new Date().getFullYear()} Sembriogan. Todos los derechos reservados.</p>
        </div>
      </footer>

    </div>
  );
}
