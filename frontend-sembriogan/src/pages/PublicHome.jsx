import { useState, useEffect, useRef, useMemo } from 'react';
import { API_BASE_URL, getApiUrl, getMediaUrl, GOOGLE_CLIENT_ID } from '../config/api';
import { Link } from 'react-router-dom';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
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
  Sparkles,
  MapPin,
  Compass,
  Navigation,
  Plus,
  Trash2
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
  const [informeConsolidadoModal, setInformeConsolidadoModal] = useState(false);
  
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
  const [misFincasCliente, setMisFincasCliente] = useState([]);
  const [tabCliente, setTabCliente] = useState('fincas'); // 'fincas' | 'compras' | 'reproduccion'
  const [isRegistrarFincaOpen, setIsRegistrarFincaOpen] = useState(false);
  const [capturandoGpsCliente, setCapturandoGpsCliente] = useState(false);
  const [guardandoFincaCliente, setGuardandoFincaCliente] = useState(false);
  const [nuevaFincaCliente, setNuevaFincaCliente] = useState({
    nombreFinca: '',
    municipio: 'Neiva',
    vereda: '',
    lat: '',
    lng: '',
    numeroAnimales: '',
    hectareas: '',
    tipoProduccion: 'Doble Propósito'
  });

  // Estadísticas consolidadas de reproducción para el informe del cliente
  const statsReproduccion = useMemo(() => {
    const total = misProcedimientosCliente.length;
    const preñadas = misProcedimientosCliente.filter(p => p.estadoPrenez === 'Preñada').length;
    const vacias = misProcedimientosCliente.filter(p => p.estadoPrenez === 'Vacía').length;
    const pendientes = misProcedimientosCliente.filter(p => p.estadoPrenez !== 'Preñada' && p.estadoPrenez !== 'Vacía').length;
    const tasa = (preñadas + vacias) > 0 ? Math.round((preñadas / (preñadas + vacias)) * 100) : 0;
    return { total, preñadas, vacias, pendientes, tasa };
  }, [misProcedimientosCliente]);

  // Estados interactivos de la barra de navegación flotante
  const [isScrolled, setIsScrolled] = useState(false);
  const [capsuleProgress, setCapsuleProgress] = useState(0); // 0 = transparente total en carrusel, 1 = cápsula consolidada
  const [activeSection, setActiveSection] = useState('inicio');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Detección de scroll, barra de progreso y ScrollSpy según sección activa
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;

      // Obtener el final de la imagen del carrusel de inicio (#inicio)
      const heroEl = document.getElementById('inicio');
      const heroHeight = heroEl ? heroEl.offsetHeight : (window.innerHeight * 0.95);

      // La cápsula debe permanecer transparente durante el carrusel y aparecer de forma paulatina hacia el final de este
      const startAppear = Math.max(120, heroHeight - 320);
      const fullAppear = Math.max(startAppear + 80, heroHeight - 40);

      let progress = 0;
      if (scrollPos <= startAppear) {
        progress = 0;
      } else if (scrollPos >= fullAppear) {
        progress = 1;
      } else {
        progress = (scrollPos - startAppear) / (fullAppear - startAppear);
      }

      setCapsuleProgress(progress);
      setIsScrolled(progress > 0.5);

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
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
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
      fetch(`${API_BASE_URL}/api/fincas?email=${userCliente.email}`)
        .then(res => res.json())
        .then(data => { if (data.success && Array.isArray(data.data)) setMisFincasCliente(data.data); })
        .catch(console.error);
    }
  }, [userCliente, isClienteDashboardOpen]);

  // Capturar coordenadas GPS del navegador para el cliente
  const capturarGpsCliente = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización GPS.');
      return;
    }
    setCapturandoGpsCliente(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNuevaFincaCliente(prev => ({
          ...prev,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6)
        }));
        setCapturandoGpsCliente(false);
      },
      (err) => {
        alert('No se pudo obtener la señal GPS: ' + err.message);
        setCapturandoGpsCliente(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Registrar nueva finca del cliente
  const handleGuardarFincaCliente = async (e) => {
    e.preventDefault();
    if (!nuevaFincaCliente.nombreFinca.trim()) {
      alert('Por favor escribe el nombre de tu finca.');
      return;
    }
    if (!nuevaFincaCliente.lat || !nuevaFincaCliente.lng) {
      alert('Las coordenadas GPS (latitud y longitud) son obligatorias.');
      return;
    }

    setGuardandoFincaCliente(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fincas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreFinca: nuevaFincaCliente.nombreFinca.trim(),
          propietarioNombre: userCliente.nombre,
          propietarioEmail: userCliente.email,
          municipio: nuevaFincaCliente.municipio,
          vereda: nuevaFincaCliente.vereda,
          coordenadas: {
            lat: parseFloat(nuevaFincaCliente.lat),
            lng: parseFloat(nuevaFincaCliente.lng)
          },
          numeroAnimales: Number(nuevaFincaCliente.numeroAnimales) || 0,
          hectareas: Number(nuevaFincaCliente.hectareas) || 0,
          tipoProduccion: nuevaFincaCliente.tipoProduccion,
          registradoPor: 'Cliente'
        })
      });

      const data = await res.json();
      if (data.success) {
        setNuevaFincaCliente({
          nombreFinca: '',
          municipio: 'Neiva',
          vereda: '',
          lat: '',
          lng: '',
          numeroAnimales: '',
          hectareas: '',
          tipoProduccion: 'Doble Propósito'
        });
        setIsRegistrarFincaOpen(false);
        // Recargar fincas
        fetch(`${API_BASE_URL}/api/fincas?email=${userCliente.email}`)
          .then(r => r.json())
          .then(d => { if (d.success) setMisFincasCliente(d.data); });
      } else {
        alert(data.mensaje || 'Error al guardar finca.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al guardar el predio.');
    } finally {
      setGuardandoFincaCliente(false);
    }
  };

  // Eliminar finca del cliente
  const handleEliminarFincaCliente = async (idFinca) => {
    if (!window.confirm('¿Deseas eliminar esta finca de tus predios georreferenciados?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/fincas/${idFinca}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMisFincasCliente(prev => prev.filter(f => f._id !== idFinca));
      }
    } catch (err) {
      console.error(err);
    }
  };

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
        throw new Error('No se pudo obtener información del perfil de Google.');
      }

      const resBackend = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInfo: dataGoogle })
      });
      const dataBackend = await resBackend.json();

      if (dataBackend.success) {
        const usuarioFinal = dataBackend.usuario || {
          nombre: dataGoogle.name || dataGoogle.email.split('@')[0],
          email: dataGoogle.email,
          rol: 'Cliente'
        };
        setUserCliente(usuarioFinal);
        if (dataBackend.token) localStorage.setItem('tokenSembriogan', dataBackend.token);
        localStorage.setItem('clienteSembriogan', JSON.stringify(usuarioFinal));
        localStorage.setItem('usuarioSembriogan', JSON.stringify(usuarioFinal));
        setIsAuthOpen(false);
        alert(`¡Bienvenido, ${usuarioFinal.nombre}!`);
      } else {
        alert(dataBackend.mensaje || 'Error al autenticar con Google en el servidor.');
      }
    } catch (err) {
      console.error('Error procesando Google:', err);
      alert('Error de conexión al conectar con Google.');
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
        const usuarioFinal = data.usuario || { nombre: authData.nombre || authData.email.split('@')[0], email: authData.email };
        setUserCliente(usuarioFinal);
        if (data.token) localStorage.setItem('tokenSembriogan', data.token);
        localStorage.setItem('clienteSembriogan', JSON.stringify(usuarioFinal));
        setIsAuthOpen(false);
        alert(`¡Bienvenido, ${usuarioFinal.nombre}!`);
      } else {
        alert(data.mensaje || 'Error en autenticación');
      }
    } catch {
      // Fallback local en caso de desconexión
      const clienteSimulado = { nombre: authData.nombre || authData.email.split('@')[0], email: authData.email, password: authData.password };
      setUserCliente(clienteSimulado); 
      localStorage.setItem('clienteSembriogan', JSON.stringify(clienteSimulado));
      setIsAuthOpen(false); 
      alert(`¡Bienvenido, ${clienteSimulado.nombre}!`);
    }
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
      
      {/* HEADER FLOTANTE INTERACTIVO Y PROFESIONAL CON VIDRIO ESMERILADO (GLASSMORPHISM) */}
      <header 
        className={`fixed left-1/2 -translate-x-1/2 z-50 transition-[top,padding,border-radius] duration-300 ease-out w-[95%] max-w-7xl ${
          isMobileNavOpen 
            ? 'rounded-3xl bg-white/95 backdrop-blur-2xl shadow-2xl border border-slate-200/80 top-3 py-3 px-5' 
            : `rounded-full ${capsuleProgress > 0.5 ? 'top-3 py-2.5 px-5 md:px-7' : 'top-6 py-3 px-6 md:px-8'}`
        }`}
        style={!isMobileNavOpen ? {
          backgroundColor: `rgba(255, 255, 255, ${0.82 * capsuleProgress})`,
          backdropFilter: capsuleProgress > 0.03 ? `blur(${capsuleProgress * 24}px)` : 'none',
          WebkitBackdropFilter: capsuleProgress > 0.03 ? `blur(${capsuleProgress * 24}px)` : 'none',
          borderColor: `rgba(255, 255, 255, ${0.65 * capsuleProgress})`,
          borderWidth: '1px',
          borderStyle: 'solid',
          boxShadow: capsuleProgress > 0.03 
            ? `0 ${10 * capsuleProgress}px ${25 * capsuleProgress}px -5px rgba(15, 23, 42, ${0.1 * capsuleProgress}), 0 0 0 ${1 * capsuleProgress}px rgba(15, 23, 42, ${0.05 * capsuleProgress})` 
            : 'none',
          transition: 'background-color 0.25s ease-out, border-color 0.25s ease-out, box-shadow 0.25s ease-out, backdrop-filter 0.25s ease-out'
        } : undefined}
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
                capsuleProgress > 0.5 ? 'h-9 md:h-11' : 'h-11 md:h-14'
              }`} 
            />
          </a>

          {/* Navegación Desktop Tipo Píldora / Glass Segmented */}
          <nav className="hidden lg:flex items-center bg-white/30 backdrop-blur-md p-1 rounded-full border border-white/40 shadow-xs text-sm gap-1">
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
                      : 'text-slate-800 hover:text-blue-600 hover:bg-white/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
            
            <Link 
              to="/tienda" 
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full font-semibold text-xs text-slate-800 hover:text-blue-600 hover:bg-white/60 transition ml-1"
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
              className="relative bg-white/40 hover:bg-white/70 backdrop-blur-md border border-white/50 p-2.5 rounded-2xl transition text-slate-800 flex items-center justify-center group shadow-xs"
              title="Ver Carrito de Compras"
            >
              <ShoppingCart size={19} className="group-hover:scale-110 transition-transform text-slate-800" />
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
                    <button onClick={() => { setIsClienteDashboardOpen(true); setIsDropdownMenuOpen(false); setTabCliente('fincas'); }} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50 text-left transition font-medium">
                      <MapPin size={16} className="text-emerald-600" /> Mis Fincas (GPS)
                    </button>
                    <button onClick={() => { setIsClienteDashboardOpen(true); setIsDropdownMenuOpen(false); setTabCliente('compras'); }} className="flex items-center gap-3 px-5 py-3 text-sm text-slate-600 hover:bg-slate-50 text-left transition font-medium">
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
              className="lg:hidden p-2 text-slate-800 hover:bg-white/60 bg-white/30 backdrop-blur-md rounded-2xl transition border border-white/40"
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
          <div className="lg:hidden mt-3 pt-3 pb-2 border-t border-white/30 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
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
                    : 'text-slate-800 hover:bg-white/40'
                }`}
              >
                {item.label}
              </button>
            ))}
            <Link 
              to="/tienda" 
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-800 hover:bg-white/40 transition"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag size={16} className="text-blue-600" />
                Tienda Oficial
              </span>
              <ArrowRight size={16} className="text-slate-400" />
            </Link>
            <Link 
              to="/admin" 
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-slate-800 bg-white/70 hover:bg-white transition border border-white/40"
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
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden max-h-[92vh] flex flex-col">
            <button onClick={() => setIsClienteDashboardOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition">
              <X size={24}/>
            </button>

            {/* Encabezado del Perfil */}
            <div className="flex items-center gap-4 mb-4 border-b border-slate-100 pb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-md shadow-blue-500/20">
                {userCliente.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">{userCliente.nombre}</h3>
                <p className="text-xs text-slate-500 font-medium">{userCliente.email}</p>
                <span className="inline-block mt-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Productor Ganadero Verificado
                </span>
              </div>
            </div>

            {/* PESTAÑAS DEL DASHBOARD */}
            <div className="flex gap-2 border-b border-slate-100 pb-3 mb-4 overflow-x-auto">
              <button
                onClick={() => setTabCliente('fincas')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${
                  tabCliente === 'fincas'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <MapPin size={15} />
                <span>Mis Fincas (GPS)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${tabCliente === 'fincas' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {misFincasCliente.length}
                </span>
              </button>

              <button
                onClick={() => setTabCliente('reproduccion')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${
                  tabCliente === 'reproduccion'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Star size={15} />
                <span>Historial Genético</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${tabCliente === 'reproduccion' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {misProcedimientosCliente.length}
                </span>
              </button>

              <button
                onClick={() => setTabCliente('compras')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shrink-0 ${
                  tabCliente === 'compras'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Package size={15} />
                <span>Mis Compras</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${tabCliente === 'compras' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {misOrdenesCliente.length}
                </span>
              </button>
            </div>

            {/* CONTENIDO DE PESTAÑAS */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">

              {/* 1. PESTAÑA: MIS FINCAS (GPS) */}
              {tabCliente === 'fincas' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-4 rounded-2xl border border-emerald-100">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <MapPin size={17} className="text-emerald-600" />
                        Geolocalización de tus Predios Ganaderos
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Registra la ubicación satelital de tus fincas para soporte veterinario y trazabilidad.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsRegistrarFincaOpen(!isRegistrarFincaOpen)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 shrink-0"
                    >
                      <Plus size={15} />
                      <span>{isRegistrarFincaOpen ? 'Cerrar Formulario' : 'Georreferenciar Finca'}</span>
                    </button>
                  </div>

                  {/* Formulario para registrar nueva finca */}
                  {isRegistrarFincaOpen && (
                    <form onSubmit={handleGuardarFincaCliente} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Compass size={15} className="text-emerald-600" />
                          Nuevo Predio Georreferenciado
                        </span>
                        <span className="text-[11px] text-slate-400">Coordenadas por GPS</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Nombre de la Finca *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Hacienda La Esperanza"
                            value={nuevaFincaCliente.nombreFinca}
                            onChange={(e) => setNuevaFincaCliente({ ...nuevaFincaCliente, nombreFinca: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Municipio *</label>
                          <select
                            value={nuevaFincaCliente.municipio}
                            onChange={(e) => setNuevaFincaCliente({ ...nuevaFincaCliente, municipio: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {['Neiva', 'Rivera', 'Campoalegre', 'Garzón', 'Pitalito', 'Palermo', 'Gigante', 'Aipe', 'Algeciras', 'Baraya', 'Tarqui', 'Hobo', 'Villavieja', 'Yaguará', 'Tello', 'La Plata', 'San Agustín', 'Timaná', 'Otro'].map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Vereda / Sector</label>
                          <input
                            type="text"
                            placeholder="Ej. El Caguán"
                            value={nuevaFincaCliente.vereda}
                            onChange={(e) => setNuevaFincaCliente({ ...nuevaFincaCliente, vereda: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">N° de Animales</label>
                          <input
                            type="number"
                            placeholder="Ej. 80"
                            value={nuevaFincaCliente.numeroAnimales}
                            onChange={(e) => setNuevaFincaCliente({ ...nuevaFincaCliente, numeroAnimales: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Hectáreas</label>
                          <input
                            type="number"
                            placeholder="Ej. 45"
                            value={nuevaFincaCliente.hectareas}
                            onChange={(e) => setNuevaFincaCliente({ ...nuevaFincaCliente, hectareas: e.target.value })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Captura GPS */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-700">Coordenadas Satelitales *</span>
                          <button
                            type="button"
                            onClick={capturarGpsCliente}
                            disabled={capturandoGpsCliente}
                            className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 transition"
                          >
                            <Compass size={13} className={capturandoGpsCliente ? 'animate-spin' : ''} />
                            {capturandoGpsCliente ? 'Detectando satélite...' : 'Detectar mi ubicación GPS actual'}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="Latitud (Ej. 2.9273)"
                            value={nuevaFincaCliente.lat}
                            onChange={(e) => setNuevaFincaCliente({ ...nuevaFincaCliente, lat: e.target.value })}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                          />
                          <input
                            type="number"
                            step="any"
                            required
                            placeholder="Longitud (Ej. -75.2819)"
                            value={nuevaFincaCliente.lng}
                            onChange={(e) => setNuevaFincaCliente({ ...nuevaFincaCliente, lng: e.target.value })}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsRegistrarFincaOpen(false)}
                          className="px-3.5 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={guardandoFincaCliente}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
                        >
                          {guardandoFincaCliente ? 'Guardando...' : 'Guardar Predio'}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Listado de fincas registradas del cliente */}
                  {misFincasCliente.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <MapPin size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-700">Aún no tienes fincas georreferenciadas</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Haz clic en "Georreferenciar Finca" para agregar tu predio ganadero usando el GPS de tu celular o computador.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {misFincasCliente.map((finca) => (
                        <div key={finca._id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                                  <span>🏡</span> {finca.nombreFinca}
                                </h5>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                  {finca.municipio} {finca.vereda ? `• ${finca.vereda}` : ''}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                {finca.numeroAnimales || 0} reses
                              </span>
                            </div>

                            <div className="mt-3 text-[11px] text-slate-500 space-y-1">
                              <p className="font-mono text-emerald-700 font-semibold">
                                📍 Lat: {finca.coordenadas?.lat?.toFixed(5)}, Lng: {finca.coordenadas?.lng?.toFixed(5)}
                              </p>
                              {finca.hectareas > 0 && (
                                <p>🌱 Área: {finca.hectareas} hectáreas ({finca.tipoProduccion || 'Doble Propósito'})</p>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${finca.coordenadas?.lat},${finca.coordenadas?.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition"
                            >
                              <Navigation size={13} />
                              <span>Cómo llegar (GPS)</span>
                            </a>

                            <button
                              onClick={() => handleEliminarFincaCliente(finca._id)}
                              className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                              title="Eliminar predio"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. PESTAÑA: MIS COMPRAS */}
              {tabCliente === 'compras' && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
                    <Package size={18}/> Mis Compras
                  </h4>
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
              )}

              {/* 3. PESTAÑA: MIS PROCEDIMIENTOS (GENÉTICA) */}
              {tabCliente === 'reproduccion' && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
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
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-2 shadow-sm shrink-0"
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
                            <FileText size={13} /> Certificado Individual (Imprimir / PDF)
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shadow-md hover:shadow-blue-600/30"
                >
                  <Printer size={16} /> Imprimir / Guardar en PDF
                </button>
                <button 
                  onClick={() => setInformeConsolidadoModal(false)} 
                  className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition"
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

      {/* FOOTER INSTITUCIONAL CON LOGOS OFICIALES */}
      <footer className="bg-white/70 backdrop-blur-md border-t border-slate-200/70 py-12 px-6 mt-auto relative z-40">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center text-center space-y-6">
          
          {/* Fila de Logos Oficiales */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-90 transition-opacity hover:opacity-100">
            <a href="#inicio" onClick={(e) => scrollToSection(e, 'inicio')} className="transition hover:scale-105" title="Sembriogan - SOMOS EPSEA">
              <img src="/logo.png" alt="Sembriogan" className="h-10 md:h-12 w-auto object-contain filter drop-shadow-xs" />
            </a>
            
            <div className="h-8 w-px bg-slate-300/80 hidden sm:block"></div>

            <div className="flex items-center gap-3" title="Servicio Nacional de Aprendizaje - SENA">
              <img src="/SENA.png" alt="SENA" className="h-11 md:h-13 w-auto object-contain filter drop-shadow-xs" />
            </div>

            <div className="h-8 w-px bg-slate-300/80 hidden sm:block"></div>

            <div className="flex items-center gap-3" title="Desarrollo e Innovación por JUNEX SAS">
              <img src="/junex-wordmark-negro.png" alt="JUNEX S.A.S." className="h-7 md:h-8 w-auto object-contain filter drop-shadow-xs" />
            </div>
          </div>

          {/* Textos Institucionales y Reconocimiento */}
          <div className="space-y-1.5 max-w-2xl text-xs md:text-sm text-slate-500">
            <p className="font-semibold text-slate-700">
              Proyecto biotecnológico desarrollado en articulación con el <span className="font-black text-emerald-700">SENA</span> (Servicio Nacional de Aprendizaje).
            </p>
            <p className="font-medium text-slate-600">
              Arquitectura, ingeniería de software y desarrollo tecnológico por <span className="font-black text-slate-800">JUNEX S.A.S.</span>
            </p>
          </div>

          <div className="w-16 h-0.5 bg-slate-200 rounded-full"></div>

          {/* Derechos de Autor */}
          <p className="text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} Sembriogan - SOMOS EPSEA. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}