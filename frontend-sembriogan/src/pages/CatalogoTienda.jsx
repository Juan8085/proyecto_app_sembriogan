import { useState, useEffect, useRef, useMemo } from 'react';
import { API_BASE_URL, getApiUrl, getMediaUrl, GOOGLE_CLIENT_ID } from '../config/api';
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
  Award,
  Printer,
  CheckCircle2
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
  const [informeConsolidadoModal, setInformeConsolidadoModal] = useState(false);

  // Menú Desplegable (Dropdown) y Navegación
  const [isDropdownMenuOpen, setIsDropdownMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef(null);

  // Estados de Usuario
  const [userCliente, setUserCliente] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({ email: '', password: '', nombre: '' });
  const [configGlobal, setConfigGlobal] = useState(null);
  const [misOrdenesCliente, setMisOrdenesCliente] = useState([]);
  const [misProcedimientosCliente, setMisProcedimientosCliente] = useState([]);

  // Detección de scroll para barra de navegación flotante homogénea con la página principal
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 35);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Estadísticas consolidadas de reproducción para el informe del cliente
  const statsReproduccion = useMemo(() => {
    const total = misProcedimientosCliente.length;
    const preñadas = misProcedimientosCliente.filter(p => p.estadoPrenez === 'Preñada').length;
    const vacias = misProcedimientosCliente.filter(p => p.estadoPrenez === 'Vacía').length;
    const pendientes = misProcedimientosCliente.filter(p => p.estadoPrenez !== 'Preñada' && p.estadoPrenez !== 'Vacía').length;
    const tasa = (preñadas + vacias) > 0 ? Math.round((preñadas / (preñadas + vacias)) * 100) : 0;
    return { total, preñadas, vacias, pendientes, tasa };
  }, [misProcedimientosCliente]);

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

      const verifyPayload = {
        transactionId: wompiTxId,
        reference: pendingCart?.reference,
        items: pendingCart?.items,
        cliente: pendingCart?.cliente,
        total: pendingCart?.total
      };

      fetch(`${API_BASE_URL}/api/pagos/verificar-transaccion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifyPayload)
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('✅ ¡Pago completado con éxito! Tu orden ha sido registrada en base de datos y el stock actualizado.');
          setCarrito([]);
          localStorage.removeItem('carritoSembriogan');
          localStorage.removeItem('pendingWompiCart');
          window.history.replaceState({}, document.title, window.location.pathname);
          cargarDatos();
          if (pendingCart?.cliente?.email) {
            fetch(`${API_BASE_URL}/api/ordenes?email=${pendingCart.cliente.email}`)
              .then(r => r.json())
              .then(d => { if (d.success) setMisOrdenesCliente(d.data); });
          }
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
    
    try {
      const resSig = await fetch(`${API_BASE_URL}/api/configuracion/generar-firma`, {
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
            localStorage.removeItem('carritoSembriogan');
            cargarDatos();
            // Refrescar órdenes de inmediato en el panel del cliente
            fetch(`${API_BASE_URL}/api/ordenes?email=${userCliente.email}`)
              .then(r => r.json())
              .then(d => { if (d.success) setMisOrdenesCliente(d.data); });
          } else {
            alert('Aviso de pago: ' + (data.mensaje || 'Transacción procesada'));
          }
        } catch (err) {
          console.error("Error al verificar orden:", err);
          alert("Error de conexión al confirmar la orden.");
        }
      } else if (transaction && transaction.status === 'DECLINED') {
        alert('La transacción fue rechazada por tu entidad bancaria. Por favor intenta con otro medio.');
      } else if (transaction) {
        alert('❌ La transacción no se completó. Estado: ' + transaction.status);
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

  // Escuchar token emitido si se completó mediante popup directo
  useEffect(() => {
    const onToken = (e) => {
      if (e.detail) {
        procesarTokenGoogle(e.detail);
      }
    };
    window.addEventListener('sembriogan_google_token', onToken);
    return () => window.removeEventListener('sembriogan_google_token', onToken);
  }, []);

  const procesarTokenGoogle = async (accessToken) => {
    try {
      const resGoogle = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const dataGoogle = await resGoogle.json();

      if (!dataGoogle || !dataGoogle.email) {
        throw new Error('No se pudo obtener información de Google');
      }

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
  };

  const abrirGooglePopupDirecto = () => {
    const redirectUri = window.location.origin;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent('openid email profile')}&` +
      `prompt=select_account`;

    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(authUrl, 'GoogleLoginPopup', `width=${width},height=${height},left=${left},top=${top}`);

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      alert('⚠️ Tu navegador bloqueó la ventana emergente de Google.\n\nPor favor haz clic en el ícono de ventana bloqueada en tu barra de direcciones y selecciona "Permitir siempre ventanas emergentes".');
    }
  };

  const handleClickGoogle = () => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isOfficialDomain = window.location.hostname === 'sembriogan-app.loca.lt';

    if (!isLocalhost && !isOfficialDomain) {
      alert(
        `💡 El botón de Google está configurado exclusivamente para el enlace oficial de Sembriogan:\n\n` +
        `👉 https://sembriogan-app.loca.lt\n` +
        `(O http://localhost:5173 en este equipo)\n\n` +
        `Desde cualquier otro enlace o dirección IP, Google bloquea el acceso por seguridad (Error 400: redirect_uri_mismatch).\n\n` +
        `Por favor:\n` +
        `1. Abre https://sembriogan-app.loca.lt para usar el botón de Google, o\n` +
        `2. Inicia sesión con tu Correo y Contraseña en este formulario (funciona en cualquier lugar).`
      );
      return;
    }

    abrirGooglePopupDirecto();
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
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans selection:bg-blue-600 selection:text-white flex flex-col justify-between relative scroll-smooth">
      {/* Ambient Backgrounds for Softness (Idéntico a Página Principal) */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/30 blur-[120px] -z-10 pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-100/30 blur-[120px] -z-10 pointer-events-none"></div>
      
      {/* ============================================================ */}
      {/* BARRA DE NAVEGACIÓN SUPERIOR (FLOTANTE GLASSMORPHISM IDÉNTICA) */}
      {/* ============================================================ */}
      <header 
        className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-in-out w-[95%] max-w-7xl border ${
          isMobileNavOpen ? 'rounded-3xl' : 'rounded-full'
        } ${
          isScrolled 
            ? 'top-3 bg-white/70 backdrop-blur-2xl shadow-xl shadow-slate-900/10 py-2.5 px-5 md:px-7 border-white/60 ring-1 ring-slate-900/5' 
            : 'top-6 bg-white/20 backdrop-blur-xl shadow-2xl shadow-black/15 py-3 px-6 md:px-8 border-white/35 ring-1 ring-white/20 hover:bg-white/25'
        }`}
      >
        <div className="flex justify-between items-center w-full">
          
          {/* Logo y Enlace a Inicio */}
          <Link 
            to="/" 
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
          </Link>

          {/* Menú Desktop Tipo Píldora / Glass Segmented */}
          <nav className="hidden lg:flex items-center bg-white/30 backdrop-blur-md p-1 rounded-full border border-white/40 shadow-xs text-sm gap-1">
            <Link 
              to="/" 
              className="px-4 py-1.5 rounded-full font-semibold text-slate-800 hover:text-blue-600 hover:bg-white/60 transition"
            >
              Inicio
            </Link>
            <Link 
              to="/#nosotros" 
              className="px-4 py-1.5 rounded-full font-semibold text-slate-800 hover:text-blue-600 hover:bg-white/60 transition"
            >
              Nosotros
            </Link>
            <Link 
              to="/#historias" 
              className="px-4 py-1.5 rounded-full font-semibold text-slate-800 hover:text-blue-600 hover:bg-white/60 transition"
            >
              Historias
            </Link>
            <Link 
              to="/#destacados" 
              className="px-4 py-1.5 rounded-full font-semibold text-slate-800 hover:text-blue-600 hover:bg-white/60 transition"
            >
              ⭐ Destacados
            </Link>
            
            <Link 
              to="/tienda" 
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold text-xs bg-blue-600 text-white shadow-md shadow-blue-500/25 transition ml-1"
            >
              <ShoppingBag size={13} />
              Tienda Oficial
            </Link>

            <div className="h-4 w-px bg-white/50 mx-1"></div>

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
              className="relative bg-white/40 hover:bg-white/70 backdrop-blur-md border border-white/50 p-2.5 rounded-2xl transition text-slate-800 flex items-center justify-center group shadow-xs cursor-pointer"
              title="Ver Carrito de Compras"
            >
              <ShoppingCart size={19} className="group-hover:scale-110 transition-transform text-slate-800" />
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
                  className="bg-blue-50/90 text-blue-700 hover:bg-blue-100/90 text-xs md:text-sm font-semibold px-3 md:px-4 py-2 rounded-2xl transition flex items-center gap-2 border border-blue-200/70 shadow-xs cursor-pointer"
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
                    <button onClick={() => { setIsClienteDashboardOpen(true); setIsDropdownMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50 text-left transition font-medium cursor-pointer">
                      <Package size={16} className="text-blue-600" /> Historial y Certificados
                    </button>
                    <button onClick={() => { setIsPerfilOpen(true); setIsDropdownMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50 text-left transition font-medium cursor-pointer">
                      <Settings size={16} className="text-slate-500" /> Configurar Perfil
                    </button>
                    <Link to="/admin" className="flex items-center gap-3 px-5 py-3 text-sm text-blue-600 hover:bg-blue-50 text-left transition font-semibold">
                      ⚙️ Panel Administrador
                    </Link>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button onClick={() => { setUserCliente(null); localStorage.removeItem('clienteSembriogan'); setIsDropdownMenuOpen(false); }} className="flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50 text-left transition font-medium cursor-pointer">
                      <LogOut size={16} /> Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthOpen(true)} 
                className="bg-slate-900 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-2xl font-bold hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-600/20 transition-all duration-200 text-xs md:text-sm shadow-xs cursor-pointer"
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
            <Link to="/#nosotros" onClick={() => setIsMobileNavOpen(false)} className="px-4 py-2.5 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 text-sm">
              Nosotros
            </Link>
            <Link to="/#historias" onClick={() => setIsMobileNavOpen(false)} className="px-4 py-2.5 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 text-sm">
              Historias
            </Link>
            <Link to="/#destacados" onClick={() => setIsMobileNavOpen(false)} className="px-4 py-2.5 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 text-sm">
              ⭐ Destacados
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

            {(!['localhost', '127.0.0.1', 'sembriogan-app.loca.lt'].includes(window.location.hostname)) && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-3 text-xs mb-4 text-left shadow-xs">
                <p className="font-bold flex items-center gap-1.5">
                  <span>💡</span> Navegando desde {window.location.hostname}
                </p>
                <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                  Por políticas de Google, su botón solo opera en <strong>https://sembriogan-app.loca.lt</strong> o <strong>localhost</strong>. En esta ventana puedes <strong>iniciar sesión directamente con tu Correo y Contraseña</strong> aquí abajo (funciona siempre).
                </p>
              </div>
            )}

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

              {/* SECCIÓN: MIS PROCEDIMIENTOS GENÉTICOS */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                      <Star size={18} className="text-amber-500 fill-amber-400" /> Mis Procedimientos (Genética)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Trazabilidad biotecnológica y diagnósticos de campo oficiales</p>
                  </div>
                  {misProcedimientosCliente.length > 0 && (
                    <button 
                      onClick={() => setInformeConsolidadoModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-2 shadow-sm shrink-0 cursor-pointer"
                    >
                      <Printer size={14} /> Descargar Informe Completo (PDF)
                    </button>
                  )}
                </div>

                {misProcedimientosCliente.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Sincronizados</span>
                      <span className="text-base font-black text-slate-800">{statsReproduccion.total}</span>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">Preñadas</span>
                      <span className="text-base font-black text-emerald-700">{statsReproduccion.preñadas}</span>
                    </div>
                    <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100 text-center">
                      <span className="text-[10px] uppercase font-bold text-rose-700 block">Vacías</span>
                      <span className="text-base font-black text-rose-700">{statsReproduccion.vacias}</span>
                    </div>
                    <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100 text-center">
                      <span className="text-[10px] uppercase font-bold text-blue-700 block">Tasa Éxito</span>
                      <span className="text-base font-black text-blue-700">{statsReproduccion.tasa}%</span>
                    </div>
                  </div>
                )}

                {misProcedimientosCliente.length === 0 ? (
                  <p className="text-sm text-slate-500 py-4">No hay procedimientos genéticos vinculados a este correo.</p>
                ) : (
                  <div className="space-y-3">
                    {misProcedimientosCliente.map(proc => (
                      <div key={proc._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                           <div>
                             <p className="font-bold text-slate-800 text-sm">Chapeta: <span className="text-primary font-black">{proc.arete || proc.animalId}</span></p>
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
                          className="mt-1 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition w-fit cursor-pointer"
                        >
                          <FileText size={13} /> Certificado Individual (Imprimir / PDF)
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
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Printer size={16} /> Imprimir / Guardar PDF
                </button>
                <button 
                  onClick={() => setCertificadoClienteModal(null)} 
                  className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
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

      {/* MODAL: INFORME TÉCNICO CONSOLIDADO GANADERO (IMPRIMIBLE / PDF) */}
      {informeConsolidadoModal && userCliente && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl p-6 sm:p-10 relative my-6 border border-slate-200 flex flex-col max-h-[92vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:border-none print:shadow-none print:my-0">
            {/* Barra de acciones (Oculta al Imprimir) */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Informe Técnico Oficial Consolidado EPSEA
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => window.print()} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-md hover:shadow-blue-600/30 cursor-pointer"
                >
                  <Printer size={16} /> Imprimir / Guardar en PDF
                </button>
                <button 
                  onClick={() => setInformeConsolidadoModal(false)} 
                  className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Documento Imprimible */}
            <div className="space-y-6 print:m-0 text-slate-800">
              {/* Encabezado Institucional */}
              <div className="flex flex-col sm:flex-row justify-between items-center border-b-2 border-slate-900 pb-5 gap-4 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="Sembriogan" className="h-14 sm:h-16 object-contain" />
                </div>
                <div className="sm:text-right">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">SEMBRIOGAN - SOMOS EPSEA</h3>
                  <p className="text-xs text-slate-700 font-bold">Entidad Prestadora del Servicio de Extensión Agropecuaria</p>
                  <p className="text-[11px] text-slate-500">Biotecnología Reproductiva, Mejoramiento Genético e IATF Bovina</p>
                  <p className="text-[10px] text-blue-700 font-mono mt-0.5">Acreditación MinAgricultura / ADR - Departamento del Huila</p>
                </div>
              </div>

              {/* Título del Informe */}
              <div className="text-center py-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                  INFORME GENERAL No. INF-{new Date().getFullYear()}-{userCliente.email.slice(0, 4).toUpperCase()}
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  INFORME CONSOLIDADO DE PROCEDIMIENTOS REPRODUCTIVOS
                </h4>
                <p className="text-xs text-slate-500 max-w-xl mx-auto mt-1">
                  Resumen de intervenciones biotecnológicas (IATF, TE, Inseminación), diagnósticos de preñez y trazabilidad genealógica del hato.
                </p>
              </div>

              {/* Datos del Ganadero / Titular */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Productor Ganadero</span>
                  <p className="font-black text-slate-900 text-sm mt-0.5">{userCliente.nombre}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Correo Electrónico</span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5">{userCliente.email}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fecha de Emisión</span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5">{new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              {/* Indicadores Reproductivos Clave (KPIs) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Total Hembras Intervenidas</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{statsReproduccion.total}</p>
                </div>
                <div className="bg-green-50/80 border border-green-200 rounded-2xl p-3.5 text-center">
                  <p className="text-[10px] uppercase font-bold text-green-700">Confirmadas Preñadas</p>
                  <p className="text-2xl font-black text-green-700 mt-1">{statsReproduccion.preñadas}</p>
                </div>
                <div className="bg-red-50/80 border border-red-200 rounded-2xl p-3.5 text-center">
                  <p className="text-[10px] uppercase font-bold text-red-700">Vacías al Diagnóstico</p>
                  <p className="text-2xl font-black text-red-700 mt-1">{statsReproduccion.vacias}</p>
                </div>
                <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 text-center">
                  <p className="text-[10px] uppercase font-bold text-blue-700">Tasa de Preñez Lograda</p>
                  <p className="text-2xl font-black text-blue-700 mt-1">{statsReproduccion.tasa}%</p>
                </div>
              </div>

              {/* Tabla Detallada de Animales */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Detalle de Ejemplares y Procedimientos</span>
                  <span className="text-[11px] font-semibold text-slate-500">{misProcedimientosCliente.length} registros</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Chapeta / Arete</th>
                        <th className="py-2.5 px-3">Finca</th>
                        <th className="py-2.5 px-3">Raza</th>
                        <th className="py-2.5 px-3">Procedimiento</th>
                        <th className="py-2.5 px-3">Genética / Toro</th>
                        <th className="py-2.5 px-3">Fecha D0</th>
                        <th className="py-2.5 px-3">Diagnóstico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {misProcedimientosCliente.map((proc, idx) => (
                        <tr key={proc._id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-black text-slate-900">{proc.arete || proc.animalId}</td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium">{proc.finca || proc.productor || 'Hato Principal'}</td>
                          <td className="py-2.5 px-3 text-slate-700">{proc.raza || 'Bovino'}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                              {proc.tipoProcedimiento}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-semibold">{proc.geneticaUtilizada || 'Convencional'}</td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                            {new Date(proc.fechasProtocolo?.dia0_sincronizacion || proc.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              proc.estadoPrenez === 'Preñada' 
                                ? 'bg-green-100 text-green-700' 
                                : proc.estadoPrenez === 'Vacía' 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-amber-100 text-amber-700'
                            }`}>
                              {proc.estadoPrenez}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recomendaciones Técnicas */}
              <div className="bg-amber-50/60 border border-amber-200/70 p-4 rounded-2xl text-xs space-y-1.5">
                <p className="font-bold text-amber-900 uppercase tracking-wider text-[11px]">Recomendaciones Técnicas y Plan de Manejo EPSEA</p>
                <p className="text-slate-700 leading-relaxed">
                  1. Mantener protocolo nutricional reforzado con sales mineralizadas al 8% de fósforo para ejemplares confirmados preñadas.<br />
                  2. Programar chequeo ecográfico confirmatorio de viabilidad fetal entre los días 60 y 90 post-inseminación.<br />
                  3. Las hembras vacías quedan habilitadas para nuevo protocolo de resincronización bajo evaluación de condición corporal (≥ 2.75).
                </p>
              </div>

              {/* Firmas Oficiales y Validación */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-8 items-end">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold mb-1">
                    <CheckCircle2 size={16} /> Certificado Oficial EPSEA Sembriogan
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Este documento consolida la trazabilidad reproductiva en campo realizada por profesionales certificados. Válido para registros de asociaciones ganaderas y seguimiento técnico predial.
                  </p>
                </div>
                <div className="text-center sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0">
                  <div className="inline-block border-b-2 border-slate-800 w-52 mb-2"></div>
                  <p className="font-black text-slate-900 text-sm">Equipo Médico Veterinario Zootecnista</p>
                  <p className="text-xs text-slate-500 font-medium">Especialistas en Reproducción Bovina y Biotecnología</p>
                  <p className="text-[11px] text-blue-700 font-semibold">Sembriogan - SOMOS EPSEA</p>
                </div>
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
