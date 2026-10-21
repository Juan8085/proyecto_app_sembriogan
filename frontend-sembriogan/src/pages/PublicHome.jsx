import { useState, useEffect, useRef, useMemo } from 'react';
import { API_BASE_URL, getApiUrl, getMediaUrl } from '../config/api';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
// Importamos los íconos profesionales de Lucide
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
  Printer, 
  Award, 
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function PublicHome() {
  const [imagenesHero, setImagenesHero] = useState([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [catalogo, setCatalogo] = useState([]);
  const [testimonios, setTestimonios] = useState([]);
  const [carrito, setCarrito] = useState(() => {
    try {
      const saved = localStorage.getItem('carritoSembriogan');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sincronizar carrito con localStorage
  useEffect(() => {
    localStorage.setItem('carritoSembriogan', JSON.stringify(carrito));
  }, [carrito]);
  
  // Modales
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isTestimonioOpen, setIsTestimonioOpen] = useState(false);
  const [isClienteDashboardOpen, setIsClienteDashboardOpen] = useState(false);
  const [isPerfilOpen, setIsPerfilOpen] = useState(false);
  const [certificadoClienteModal, setCertificadoClienteModal] = useState(null);
  
  // Menú Desplegable (Dropdown)
  const [isDropdownMenuOpen, setIsDropdownMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Estados de Usuario
  const [userCliente, setUserCliente] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({ email: '', password: '', nombre: '' });
  const [nuevoTestimonio, setNuevoTestimonio] = useState({ nombre: '', rol: '', mensaje: '' });
  const [mensajeTestimonioExito, setMensajeTestimonioExito] = useState('');
  const [infoNosotros, setInfoNosotros] = useState(null);
  const [configGlobal, setConfigGlobal] = useState(null);
  const [misOrdenesCliente, setMisOrdenesCliente] = useState([]);
  const [misProcedimientosCliente, setMisProcedimientosCliente] = useState([]);

  // Estados interactivos de la barra de navegación flotante
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Detección de scroll, barra de progreso y ScrollSpy según sección activa
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      setIsScrolled(scrollPos > 35);

      // Progreso de lectura a lo largo del documento (0 a 100%)
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (scrollPos / docHeight) * 100)));
      }

      // ScrollSpy: identificar qué sección se encuentra en vista
      const sections = ['inicio', 'nosotros', 'historias', 'destacados'];
      const scrollPosition = scrollPos + 220; // Offset para activación oportuna

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el) {
          if (scrollPosition >= el.offsetTop) {
            setActiveSection(sections[i]);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filtrar ÚNICAMENTE productos y servicios marcados como estrella para la página principal
  const productosEstrella = useMemo(() => {
    return catalogo.filter(item => item.destacado === true);
  }, [catalogo]);

  // Navegación suave compensando la barra flotante
  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    setIsMobileNavOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 90;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Cerrar el dropdown si se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/catalogo`).then(res => res.json()).then(data => { if (data.success) setCatalogo(data.data); }).catch(console.error);
    fetch(`${API_BASE_URL}/api/testimonios`).then(res => res.json()).then(data => { if (data.success) setTestimonios(data.data); }).catch(console.error);
    fetch(`${API_BASE_URL}/api/carrusel`).then(res => res.json()).then(data => { if (data.success && data.data.length > 0) setImagenesHero(data.data); }).catch(console.error);
    fetch(`${API_BASE_URL}/api/nosotros`).then(res => res.json()).then(data => { if (data.success && data.data) setInfoNosotros(data.data); }).catch(console.error);
    fetch(`${API_BASE_URL}/api/configuracion`).then(res => res.json()).then(data => { if (data.success) setConfigGlobal(data.data); }).catch(console.error);

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
        body: JSON.stringify({
          transactionId: wompiTxId,
          items: pendingCart?.items,
          cliente: pendingCart?.cliente,
          total: pendingCart?.total,
          reference: pendingCart?.reference
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('✅ ¡Pago verificado con Wompi!\nTu orden ha sido confirmada y el inventario actualizado.');
          localStorage.removeItem('pendingWompiCart');
          setCarrito([]);
          window.history.replaceState({}, document.title, window.location.pathname);
          fetch(`${API_BASE_URL}/api/catalogo`).then(res => res.json()).then(d => { if (d.success) setCatalogo(d.data); });
        }
      })
      .catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (imagenesHero.length > 1) {
        const timer = setInterval(() => { setIndiceActual((prev) => (prev + 1) % imagenesHero.length); }, 5000);
        return () => clearInterval(timer);
    }
  }, [imagenesHero]);

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

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(item => item._id === producto._id);
    if (existe) setCarrito(carrito.map(item => item._id === producto._id ? { ...item, cantidad: item.cantidad + 1 } : item));
    else setCarrito([...carrito, { ...producto, cantidad: 1 }]);
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

  const pagarConWompi = async () => {
    if (carrito.length === 0) return;
    if (!userCliente) { alert('Por favor, inicia sesión para procesar tu pedido.'); setIsAuthOpen(true); return; }
    if (!window.WidgetCheckout) { alert('El widget de pagos de Wompi no está disponible.'); return; }

    const referenciaUnica = 'WEB-SEM-' + Date.now();
    const amountInCents = Math.round(totalCarrito * 100);

    // Obtener firma de integridad del backend con fallback local SHA-256
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

    // Fallback criptográfico local con Web Crypto API (SHA-256)
    if (!signature) {
      const secret = configGlobal?.wompiIntegridadSecret || 'test_integrity_aHql6rp4EWgoSLM7bJ9INi9GkHfHVyRO';
      try {
        const cadena = `${referenciaUnica}${amountInCents}COP${secret}`;
        const msgUint8 = new TextEncoder().encode(cadena);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        console.log('✅ Firma de integridad generada vía Web Crypto:', signature);
      } catch (errLocal) {
        console.error('Error calculando firma local SHA-256:', errLocal);
      }
    }

    if (!signature) {
      alert('Error de seguridad: No se pudo generar la firma de integridad de Wompi. Por favor verifica que el backend esté activo.');
      return;
    }

    // Guardar carrito temporal para recuperación ante redirección
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

    // Solo agregar redirectUrl si es un dominio HTTPS público real, porque CloudFront bloquea localhost y IPs privadas con 403
    if (window.location.protocol === 'https:' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
      checkoutConfig.redirectUrl = window.location.origin + window.location.pathname;
    }

    const checkout = new window.WidgetCheckout(checkoutConfig);

    checkout.open(async (result) => {
      const transaction = result?.transaction;
      const status = transaction?.status;

      if (transaction && (status === 'APPROVED' || status === 'PENDING')) {
        try {
          const verifyPayload = {
            transactionId: transaction.id,
            reference: transaction.reference || referenciaUnica,
            cliente: { nombre: userCliente.nombre, email: userCliente.email },
            items: carrito.map(item => ({ catalogoItem: item._id, tipo: item.tipo, costo: item.costo, cantidad: item.cantidad })),
            total: totalCarrito
          };
          const res = await fetch(`${API_BASE_URL}/api/pagos/verificar-transaccion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(verifyPayload)
          });
          const data = await res.json();
          if (data.success) {
            alert('✅ ¡Pago Exitoso!\nTu orden ha sido registrada en base de datos y el stock fue descontado.');
            setCarrito([]);
            setIsCartOpen(false);
            localStorage.removeItem('pendingWompiCart');
            fetch(`${API_BASE_URL}/api/catalogo`).then(r => r.json()).then(d => { if (d.success) setCatalogo(d.data); });
          } else {
            alert('Aviso de pago: ' + (data.mensaje || 'Transacción procesada'));
          }
        } catch (err) {
          console.error("Error al verificar orden:", err);
          alert("Error de conexión al confirmar la orden.");
        }
      } else if (transaction) {
        alert('❌ La transacción no se completó. Estado: ' + transaction.status);
      }
    });
  };

  
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('tokenSembriogan', data.token);
        localStorage.setItem('usuarioSembriogan', JSON.stringify(data.usuario));
        setIsAuthOpen(false);
        setUserCliente(data.usuario);
        alert('¡Bienvenido!');
      } else {
        alert(data.mensaje || 'Error con Google');
      }
    } catch (error) {
      alert('Error de red al conectar con Google.');
    }
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const clienteSimulado = { nombre: authData.nombre || authData.email.split('@')[0], email: authData.email, password: authData.password };
    setUserCliente(clienteSimulado); 
    localStorage.setItem('clienteSembriogan', JSON.stringify(clienteSimulado));
    setIsAuthOpen(false); 
    alert(`¡Bienvenido, ${clienteSimulado.nombre}!`);
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('clienteSembriogan', JSON.stringify(userCliente));
    setIsPerfilOpen(false);
    alert('✅ Datos de perfil y contraseña actualizados correctamente.');
  };

  const enviarTestimonio = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/testimonios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoTestimonio)
      });
      const data = await res.json();
      if (data.success) {
        setMensajeTestimonioExito(data.mensaje);
        setNuevoTestimonio({ nombre: '', rol: '', mensaje: '' });
        setTimeout(() => {
          setIsTestimonioOpen(false);
          setMensajeTestimonioExito('');
        }, 3000);
      } else {
        alert("Error al enviar testimonio: " + data.mensaje);
      }
    } catch (error) {
      alert("Error de conexión al enviar el testimonio.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans relative scroll-smooth selection:bg-blue-600 selection:text-white">
      {/* Ambient Backgrounds for Softness */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/30 blur-[120px] -z-10 pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-100/30 blur-[120px] -z-10 pointer-events-none"></div>
      
      {/* HEADER FLOTANTE INTERACTIVO Y PROFESIONAL */}
      <header 
        className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-in-out w-[95%] max-w-7xl rounded-full border ${
          isScrolled 
            ? 'top-3 bg-white/95 backdrop-blur-2xl shadow-xl shadow-slate-900/10 py-2.5 px-5 md:px-7 border-slate-200/90 ring-1 ring-slate-900/5' 
            : 'top-6 bg-white/85 backdrop-blur-xl shadow-lg shadow-slate-200/30 py-3.5 px-6 md:px-8 border-white/90'
        }`}
      >
        <div className="flex justify-between items-center w-full">
          {/* Logo Sembriogan interactivo con tamaño profesional y nítido */}
          <a 
            href="#inicio" 
            onClick={(e) => scrollToSection(e, 'inicio')} 
            className="flex items-center gap-2 group transition-transform duration-200 hover:scale-[1.02] cursor-pointer"
            title="Sembriogan - Biotecnología Reproductiva"
          >
            <img 
              src="/logo.png" 
              alt="Logo Sembriogan" 
              className={`w-auto object-contain transition-all duration-300 filter drop-shadow-sm ${
                isScrolled ? 'h-9 md:h-11' : 'h-11 md:h-14'
              }`} 
            />
          </a>

          {/* Navegación Desktop Tipo Píldora / Glass Segmented */}
          <nav className="hidden lg:flex items-center bg-slate-100/80 p-1 rounded-full border border-slate-200/60 backdrop-blur-sm text-sm gap-1">
            {[
              { id: 'inicio', label: 'Inicio' },
              { id: 'nosotros', label: 'Nosotros' },
              { id: 'historias', label: 'Historias' },
              { id: 'destacados', label: '⭐ Destacados' }
            ].map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={(e) => scrollToSection(e, item.id)}
                  className={`px-4 py-1.5 rounded-full font-semibold transition-all duration-200 relative ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            
            <Link 
              to="/tienda" 
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition ml-1"
            >
              <ShoppingBag size={13} />
              Tienda Completa
            </Link>

            <div className="h-4 w-px bg-slate-200 mx-1"></div>

            <Link 
              to="/admin" 
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs text-slate-700 bg-white/90 hover:bg-white border border-slate-200/80 shadow-xs hover:text-blue-600 hover:border-blue-200 transition"
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
              className="relative bg-slate-50/90 border border-slate-200/80 p-2.5 rounded-2xl hover:bg-slate-100 transition text-slate-700 flex items-center justify-center group shadow-xs"
              title="Ver Carrito de Compras"
            >
              <ShoppingCart size={19} className="group-hover:scale-110 transition-transform text-slate-700" />
              {carrito.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center font-bold shadow-md shadow-blue-500/30 ring-2 ring-white animate-bounce">
                  {carrito.reduce((sum, item) => sum + item.cantidad, 0)}
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
                
                {/* DROPDOWN MENU */}
                {isDropdownMenuOpen && (
                  <div className="absolute right-0 mt-3 w-60 bg-white/95 backdrop-blur-2xl border border-slate-100 rounded-3xl shadow-2xl py-2 flex flex-col z-[70] overflow-hidden">
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

            {/* Botón Hamburguesa Móvil */}
            <button 
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)} 
              className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-2xl transition border border-slate-200/60"
              aria-label="Abrir menú"
            >
              {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Barra sutil de progreso de lectura a lo largo de la página */}
        <div className="absolute -bottom-[1px] left-10 right-10 h-[2px] bg-transparent rounded-full overflow-hidden pointer-events-none">
          <div 
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* MENÚ MÓVIL DESPLEGABLE */}
        {isMobileNavOpen && (
          <div className="lg:hidden mt-3 pt-3 pb-2 border-t border-slate-200/60 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
            {[
              { id: 'inicio', label: 'Inicio' },
              { id: 'nosotros', label: 'Nosotros' },
              { id: 'historias', label: 'Historias' },
              { id: 'destacados', label: '⭐ Destacados' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={(e) => scrollToSection(e, item.id)}
                className={`text-left px-4 py-2.5 rounded-xl font-semibold text-sm transition ${
                  activeSection === item.id 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
            <Link 
              to="/tienda" 
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white shadow-sm"
            >
              <span>🛍️ Tienda y Catálogo Completo</span>
              <ArrowRight size={16} />
            </Link>
            <Link 
              to="/admin" 
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-800 bg-slate-100 hover:bg-slate-200 transition"
            >
              ⚙️ Acceso Panel Administrador
            </Link>
          </div>
        )}
      </header>

      {/* SECCIÓN 1: CARRUSEL - Alto completo para impacto visual */}
      <section id="inicio" className="relative min-h-[95vh] w-full overflow-hidden flex items-center">
        {imagenesHero.length > 0 ? (
            imagenesHero.map((img, index) => (
                <div key={img._id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === indiceActual ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <img src={`${API_BASE_URL}${img.imagenUrl}`} alt={img.titulo} className="w-full h-full object-cover" />
                    {/* Gradient Overlay that fades into the page background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-50/50 z-10"></div>
                    <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto text-white transition-all duration-1000 ${index === indiceActual ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}`}>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight leading-tight drop-shadow-2xl">{img.titulo || "Biotecnología Reproductiva"}</h1>
                        <p className="text-lg md:text-2xl text-slate-100 mb-12 max-w-3xl font-light drop-shadow-lg leading-relaxed">{img.descripcion || "Maximizando la genética bovina con tecnología de punta."}</p>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                          <a href="#destacados" className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold py-4 px-8 rounded-full hover:bg-white hover:text-slate-900 transition-all duration-300 shadow-2xl text-base flex items-center gap-2">
                             ⭐ Productos Estrella <ChevronDown size={18} className="animate-bounce"/>
                          </a>
                          <Link to="/tienda" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 shadow-2xl shadow-blue-500/30 text-base flex items-center gap-2">
                             <ShoppingBag size={18} /> Tienda y Catálogo Completo
                          </Link>
                        </div>
                    </div>
                </div>
            ))
        ) : (
            <div className="absolute inset-0 z-10 bg-slate-800 flex items-center justify-center text-white">Cargando experiencia...</div>
        )}
        {/* Soft bottom fade to blend with next section */}
        <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-slate-50/50 via-slate-50/30 to-transparent z-30 pointer-events-none"></div>
      </section>

      {/* SECCIÓN 2: NOSOTROS - Fondo Blanco Limpio */}
      <section id="nosotros" className="py-32 px-6 max-w-7xl mx-auto w-full relative z-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <span className="text-primary font-bold text-xs uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-md text-blue-700">Conócenos</span>
            <h2 className="text-4xl font-black text-slate-800 mt-4 mb-6 leading-tight">{infoNosotros?.titulo || 'Liderando la Innovación Genética'}</h2>
            <p className="text-slate-600 mb-4 leading-relaxed text-lg font-light">
                {infoNosotros?.descripcion || 'Transformamos la ganadería tradicional en una empresa altamente rentable mediante biotecnología.'}
            </p>
          </div>
          <div className="relative">
            <img src={infoNosotros?.imagenUrl ? `${API_BASE_URL}${infoNosotros.imagenUrl}` : "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=800"} alt="Ganadería Sembriogan" className="rounded-[2.5rem] shadow-2xl shadow-blue-900/10 object-cover h-[500px] w-full border border-white" />
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4">
              <CheckCircle size={32} className="text-emerald-500" />
              <div>
                <p className="font-black text-slate-800">100%</p>
                <p className="text-xs text-slate-500">Trazabilidad</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: HISTORIAS - Fondo Gris muy sutil */}
      <section id="historias" className="py-32 px-6 relative z-40">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-black text-slate-800 mb-4">Historias que Inspiran</h2>
            <p className="text-slate-500 mb-8 font-light text-lg">Conoce cómo nuestros programas han transformado hatos ganaderos.</p>
            <button onClick={() => setIsTestimonioOpen(true)} className="bg-white border border-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl hover:bg-slate-100 transition shadow-sm text-sm">Dejar mi testimonio</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonios.length === 0 ? (
              <p className="text-center col-span-3 text-slate-400 italic">Aún no hay testimonios publicados.</p>
            ) : (
              testimonios.map((item) => (
                <div key={item._id} className="bg-white/60 backdrop-blur-xl p-10 rounded-[2rem] border border-white shadow-xl shadow-slate-200/50 flex flex-col justify-between hover:-translate-y-2 transition-transform duration-300">
                  <div>
                    <div className="flex gap-1 text-amber-400 mb-4"><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/><Star size={16} fill="currentColor"/></div>
                    <p className="text-slate-600 italic mb-6 leading-relaxed">"{item.mensaje}"</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{item.nombre}</p>
                    <p className="text-xs text-slate-400">{item.rol}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: PRODUCTOS Y SERVICIOS ESTRELLA (PORTADA) */}
      <section id="destacados" className="py-32 px-6 max-w-7xl mx-auto w-full relative z-40">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200/80 shadow-xs">
            <Star size={13} className="fill-amber-500 text-amber-600" />
            Productos y Servicios Estrella
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Lo Más Destacado de Sembriogan</h2>
          <p className="text-slate-500 font-light text-base md:text-lg">
            Genética probada y biotecnología líder seleccionada especialmente para potenciar los índices productivos de tu hato.
          </p>
        </div>

        {productosEstrella.length === 0 ? (
          <div className="py-16 px-8 text-center bg-white/70 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-sm max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-amber-200/60">
              <Star size={32} className="fill-amber-400 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Próximamente Productos Estrella</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Los productos destacados en portada se están actualizando desde la administración. Puedes explorar todos nuestros productos y servicios en la tienda completa.
            </p>
            <div className="pt-2">
              <Link 
                to="/tienda" 
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-full shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
              >
                <ShoppingBag size={16} /> Ver Catálogo en la Tienda
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-stretch">
            {productosEstrella.map((item) => (
              <div key={item._id} className="bg-white/80 backdrop-blur-lg rounded-[2.5rem] border border-white overflow-hidden flex flex-col justify-between hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 hover:-translate-y-2 group">
                <div>
                  <div className="h-60 w-full bg-slate-50 relative overflow-hidden flex items-center justify-center">
                    {item.imagen ? (
                      <img src={`${API_BASE_URL}${item.imagen}`} alt={item.tipo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <Package size={48} className="text-slate-300" />
                    )}
                    <div className="absolute top-4 left-4 flex flex-col gap-1">
                      <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wider shadow-sm ${item.esServicio ? 'bg-blue-600 text-white' : 'bg-emerald-500 text-white'}`}>
                        {item.esServicio ? 'Servicio' : 'Producto'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-900 shadow-md inline-flex items-center gap-1">
                        <Star size={10} className="fill-slate-900 text-slate-900" /> Estrella
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-2">
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.tipo}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{item.descripcion}</p>
                  </div>
                </div>
                <div className="p-6 pt-0 space-y-5">
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-2xl font-black text-slate-800">
                      {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.costo)}
                    </span>
                  </div>
                  <button 
                    onClick={() => agregarAlCarrito(item)} 
                    disabled={!item.esServicio && item.stock <= 0}
                    className={`w-full text-white font-bold py-3.5 rounded-xl transition flex justify-center items-center gap-2 ${(!item.esServicio && item.stock <= 0) ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700'}`}
                  >
                    <ShoppingCart size={18}/> {(!item.esServicio && item.stock <= 0) ? 'Agotado' : 'Agregar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CALL TO ACTION A LA TIENDA COMPLETA */}
        <div className="mt-16 text-center">
          <Link 
            to="/tienda" 
            className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-black text-base md:text-lg py-4 md:py-5 px-8 md:px-12 rounded-full shadow-2xl shadow-blue-500/30 hover:scale-105 transition-all duration-300 group"
          >
            <ShoppingBag size={22} className="group-hover:rotate-12 transition-transform" />
            <span>Explorar Catálogo Completo en la Tienda ({catalogo.length} ítems)</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-xs text-slate-400 mt-3 font-medium">
            Accede a todo nuestro portafolio de pajillas, bloques minerales, servicios y protocolos reproductivos.
          </p>
        </div>
      </section>

      {/* MODAL: DASHBOARD DEL CLIENTE */}
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
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-6">
                <h4 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2"><Star size={18}/> Mis Procedimientos (Genética)</h4>
                {misProcedimientosCliente.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4">No hay procedimientos genéticos vinculados a este correo.</p>
                ) : (
                  <div className="space-y-3">
                    {misProcedimientosCliente.map(proc => (
                      <div key={proc._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                           <div>
                             <p className="font-bold text-slate-800 text-sm">Chapeta: <span className="text-primary">{proc.arete || proc.animalId}</span></p>
                             <p className="text-slate-500 text-xs">Finca: {proc.finca || proc.productor}</p>
                           </div>
                           <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${proc.tipoProcedimiento === 'IATF' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
                             {proc.tipoProcedimiento}
                           </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-1">
                           <span className="text-xs text-slate-400">Día 0: {new Date(proc.fechasProtocolo?.dia0_sincronizacion || proc.createdAt).toLocaleDateString()}</span>
                           <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${(proc.estadoPrenez === 'Pendiente' || proc.estadoPrenez === 'Pendiente Evaluación') ? 'bg-yellow-100 text-yellow-700' : (proc.estadoPrenez === 'Preñada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}`}>
                             {proc.estadoPrenez}
                           </span>
                        </div>
                        <button 
                          onClick={() => setCertificadoClienteModal(proc)}
                          className="mt-1 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition w-fit"
                        >
                          <FileText size={13} /> Certificado Clínico (Imprimir / PDF)
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CERTIFICADO CLÍNICO DEL CLIENTE (IMPRIMIBLE / PDF) */}
      {certificadoClienteModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-6 sm:p-8 relative my-8 border border-slate-200 flex flex-col">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 print:hidden">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Award size={16} className="text-blue-600" /> Certificado Clínico Reproductivo Oficial
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
                >
                  <Printer size={16} /> Imprimir / Guardar PDF
                </button>
                <button 
                  onClick={() => setCertificadoClienteModal(null)} 
                  className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-6 print:m-0">
              <div className="flex flex-col sm:flex-row justify-between items-center border-b-2 border-slate-900 pb-5 gap-4 text-center sm:text-left">
                <img src="/logo.png" alt="Sembriogan" className="h-14 sm:h-16 object-contain" />
                <div className="sm:text-right">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">SEMBRIOGAN - SOMOS EPSEA</h3>
                  <p className="text-xs text-slate-600 font-semibold">Biotecnología Reproductiva y Mejoramiento Genético Bovino</p>
                  <p className="text-[11px] text-slate-500">Certificación Oficial de Procedimientos de Campo</p>
                </div>
              </div>

              <div className="text-center py-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  Ficha No. {certificadoClienteModal._id.slice(-8).toUpperCase()}
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">CERTIFICADO CLÍNICO DE REPRODUCCIÓN</h4>
                <p className="text-xs text-slate-500 mt-1">Expedido bajo estándares de buenas prácticas de manejo reproductivo y trazabilidad animal.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200 text-xs sm:text-sm">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Identificación del Animal</p>
                  <p className="font-black text-base text-slate-900 mt-1">Chapeta: <span className="text-blue-700">{certificadoClienteModal.animalId || certificadoClienteModal.arete}</span></p>
                  <p className="text-slate-600 mt-0.5">Raza / Tipo: <span className="font-semibold text-slate-800">{certificadoClienteModal.raza || 'Bovino'}</span></p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Predio y Titular</p>
                  <p className="font-black text-slate-900 mt-1">Finca: <span className="font-semibold text-slate-800">{certificadoClienteModal.finca || 'No especificada'}</span></p>
                  <p className="text-slate-600 mt-0.5">Productor: <span className="font-semibold text-slate-800">{certificadoClienteModal.productor}</span></p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm space-y-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Protocolo Biotecnológico Aplicado</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-xs text-slate-500 block">Técnica:</span>
                    <span className="font-black text-slate-800 text-sm">{certificadoClienteModal.tipoProcedimiento}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Genética / Pajilla:</span>
                    <span className="font-bold text-slate-800 text-sm">{certificadoClienteModal.geneticaUtilizada || 'Convencional'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Fecha Inicio:</span>
                    <span className="font-bold text-slate-800 text-sm">{new Date(certificadoClienteModal.fechasProtocolo?.dia0_sincronizacion || certificadoClienteModal.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-semibold">Estado Clínico Diagnosticado:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${certificadoClienteModal.estadoPrenez === 'Preñada' ? 'bg-green-100 text-green-700' : (certificadoClienteModal.estadoPrenez === 'Vacía' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}`}>
                    {certificadoClienteModal.estadoPrenez}
                  </span>
                </div>
              </div>

              {certificadoClienteModal.observaciones && (
                <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-2xl text-xs sm:text-sm">
                  <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">Observaciones Clínicas / Novedades</p>
                  <p className="text-slate-700 italic">"{certificadoClienteModal.observaciones}"</p>
                </div>
              )}

              <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Fecha de Emisión:</p>
                  <p className="text-xs font-bold text-slate-700">{new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <div className="mt-2 flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                    <CheckCircle2 size={16} /> Entidad Prestadora del Servicio de Extensión Agropecuaria
                  </div>
                </div>
                <div className="text-center sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0">
                  <div className="inline-block border-b-2 border-slate-800 w-48 mb-2"></div>
                  <p className="font-black text-slate-900 text-sm">{certificadoClienteModal.veterinarioAsignado || 'Médico Veterinario Especialista'}</p>
                  <p className="text-xs text-slate-500 font-medium">Médico Veterinario Zootecnista (MVZ)</p>
                  <p className="text-[11px] text-slate-400">Equipo Técnico Oficial Sembriogan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURAR PERFIL (NUEVO) */}
      {isPerfilOpen && userCliente && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 relative">
            <button onClick={() => setIsPerfilOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"><X size={20}/></button>
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><Settings size={20}/> Mi Perfil</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Nombre</label>
                <input type="text" value={userCliente.nombre} onChange={(e) => setUserCliente({...userCliente, nombre: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Correo (Vinculado a pagos)</label>
                <input type="email" value={userCliente.email} onChange={(e) => setUserCliente({...userCliente, email: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Nueva Contraseña</label>
                <input type="password" value={userCliente.password || ''} onChange={(e) => setUserCliente({...userCliente, password: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" placeholder="••••••••" required />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition mt-2">Guardar Cambios</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AUTENTICACIÓN */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 relative">
            <button onClick={() => setIsAuthOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"><X size={20}/></button>
            <div className="text-center mb-6"><h3 className="text-2xl font-black text-slate-800">{authMode === 'login' ? 'Bienvenido' : 'Crear Cuenta'}</h3></div>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'registro' && <input type="text" required value={authData.nombre} onChange={(e) => setAuthData({...authData, nombre: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary text-sm" placeholder="Tu Nombre" />}
              <input type="email" required value={authData.email} onChange={(e) => setAuthData({...authData, email: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary text-sm" placeholder="Correo Electrónico" />
              <input type="password" required value={authData.password} onChange={(e) => setAuthData({...authData, password: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary text-sm" placeholder="Contraseña" />
              <button type="submit" className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 transition">{authMode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}</button>
            </form>
            <div className="flex items-center gap-3 my-6">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">O también</span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>
            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => alert('No se pudo iniciar sesión con Google')}
                useOneTap
                theme="outline"
                shape="pill"
                locale="es"
              />
            </div>
            <p className="text-center text-sm text-slate-500 mt-6 cursor-pointer hover:text-primary font-semibold" onClick={() => setAuthMode(authMode === 'login' ? 'registro' : 'login')}>
              {authMode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </p>
          </div>
        </div>
      )}

      {/* (MODALES: CARRITO Y TESTIMONIOS - Lógica intacta, diseño ultra limpio) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><ShoppingCart size={20}/> Carrito</h3>
              <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              {carrito.length === 0 ? <p className="text-center text-slate-400 py-10 font-medium">Tu carrito está vacío.</p> : (
                carrito.map((item) => (
                  <div key={item._id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{item.tipo}</p>
                      <p className="text-sm text-slate-600 font-medium">${item.costo.toLocaleString()} COP</p>
                    </div>
                    <div className="flex items-center space-x-3 bg-white border border-slate-200 rounded-lg p-1">
                      <button onClick={() => cambiarCantidad(item._id, -1)} className="w-8 h-8 rounded-md font-bold text-slate-500 hover:bg-slate-100">-</button>
                      <span className="font-bold text-sm text-slate-800 w-4 text-center">{item.cantidad}</span>
                      <button onClick={() => cambiarCantidad(item._id, 1)} className="w-8 h-8 rounded-md font-bold text-slate-500 hover:bg-slate-100">+</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {carrito.length > 0 && (
              <div className="border-t border-slate-100 pt-6 mt-4 space-y-4">
                <div className="flex justify-between items-center text-lg font-black text-slate-800">
                  <span>Total:</span><span className="text-slate-800">${totalCarrito.toLocaleString()} COP</span>
                </div>
                <button onClick={pagarConWompi} className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl hover:bg-emerald-600 transition shadow-md text-lg">Pagar con Wompi</button>
              </div>
            )}
          </div>
        </div>
      )}

      {isTestimonioOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative">
            <button onClick={() => setIsTestimonioOpen(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-700"><X size={20}/></button>
            <h3 className="text-2xl font-black text-slate-800 mb-6">Tu Experiencia</h3>
            {mensajeTestimonioExito && <p className="bg-emerald-50 text-emerald-700 p-3 rounded-xl mb-4 text-sm font-bold">{mensajeTestimonioExito}</p>}
            <form onSubmit={enviarTestimonio} className="space-y-4">
              <input type="text" required value={nuevoTestimonio.nombre} onChange={(e) => setNuevoTestimonio({...nuevoTestimonio, nombre: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" placeholder="Nombre o Hato" />
              <input type="text" value={nuevoTestimonio.rol} onChange={(e) => setNuevoTestimonio({...nuevoTestimonio, rol: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" placeholder="Ej: Ganadero en Huila" />
              <textarea required rows="4" value={nuevoTestimonio.mensaje} onChange={(e) => setNuevoTestimonio({...nuevoTestimonio, mensaje: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" placeholder="¿Cómo te ha ayudado Sembriogan?" />
              <button type="submit" className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 transition">Enviar Testimonio</button>
            </form>
          </div>
        </div>
      )}

      <footer className="bg-transparent border-t border-slate-200/50 py-12 px-6 text-center text-sm mt-auto relative z-40">
        <img src="/logo.png" alt="Sembriogan" className="h-8 mx-auto opacity-50 mb-4 grayscale" />
        <p className="text-slate-400 font-medium">© 2026 Sembriogan. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}