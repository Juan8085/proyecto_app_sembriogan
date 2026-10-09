import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
// Importamos los íconos profesionales de Lucide
import { ShoppingCart, User, ChevronDown, Package, Settings, LogOut, Star, CheckCircle, Menu, X } from 'lucide-react';

export default function PublicHome() {
  const [imagenesHero, setImagenesHero] = useState([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [catalogo, setCatalogo] = useState([]);
  const [testimonios, setTestimonios] = useState([]);
  const [carrito, setCarrito] = useState([]);
  
  // Modales
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isTestimonioOpen, setIsTestimonioOpen] = useState(false);
  const [isClienteDashboardOpen, setIsClienteDashboardOpen] = useState(false);
  const [isPerfilOpen, setIsPerfilOpen] = useState(false);
  
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
    fetch('http://localhost:3000/api/catalogo').then(res => res.json()).then(data => { if (data.success) setCatalogo(data.data); }).catch(console.error);
    fetch('http://localhost:3000/api/testimonios').then(res => res.json()).then(data => { if (data.success) setTestimonios(data.data); }).catch(console.error);
    fetch('http://localhost:3000/api/carrusel').then(res => res.json()).then(data => { if (data.success && data.data.length > 0) setImagenesHero(data.data); }).catch(console.error);
    fetch('http://localhost:3000/api/nosotros').then(res => res.json()).then(data => { if (data.success && data.data) setInfoNosotros(data.data); }).catch(console.error);
    fetch('http://localhost:3000/api/configuracion').then(res => res.json()).then(data => { if (data.success) setConfigGlobal(data.data); }).catch(console.error);

    const clienteGuardado = localStorage.getItem('clienteSembriogan');
    if (clienteGuardado) setUserCliente(JSON.parse(clienteGuardado));
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
      fetch(`http://localhost:3000/api/ordenes?email=${userCliente.email}`)
        .then(res => res.json())
        .then(data => { if (data.success) setMisOrdenesCliente(data.data); })
        .catch(console.error);

      const token = localStorage.getItem('tokenSembriogan') || '';
      fetch(`http://localhost:3000/api/registro-genetico?email=${userCliente.email}`, {
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

  const pagarConWompi = () => {
    if (carrito.length === 0) return;
    if (!userCliente) { alert('Por favor, inicia sesión para procesar tu pedido.'); setIsAuthOpen(true); return; }
    if (!window.WidgetCheckout) { alert('El widget de pagos de Wompi no está disponible.'); return; }

    const referenciaUnica = 'WEB-SEM-' + Date.now();
    const checkout = new window.WidgetCheckout({
      currency: 'COP', amountInCents: Math.round(totalCarrito * 100), reference: referenciaUnica,
      publicKey: configGlobal?.wompiPublicKey || 'pub_test_1jKw2orNya3GdwqfTCl1wU6V0yS0mnnh'
    });

    checkout.open(async (result) => {
      const transaction = result.transaction;
      if (transaction && transaction.status === 'APPROVED') {
        try {
          const ordenPayload = {
            cliente: { nombre: userCliente.nombre, email: userCliente.email },
            items: carrito.map(item => ({ catalogoItem: item._id, tipo: item.tipo, costo: item.costo, cantidad: item.cantidad })),
            total: totalCarrito, referenciaWompi: transaction.id || referenciaUnica
          };
          const res = await fetch('http://localhost:3000/api/ordenes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ordenPayload) });
          const data = await res.json();
          if (data.success) {
            alert(`✅ ¡Pago Exitoso!\nOrden registrada en base de datos.`);
            setCarrito([]); setIsCartOpen(false);
          } else alert('Error al registrar la orden: ' + data.mensaje);
        } catch (err) { alert("Error de conexión al registrar la orden."); }
      } else if (transaction) alert('❌ La transacción no se completó. Estado: ' + transaction.status);
    });
  };

  
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/google', {
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
      const res = await fetch('http://localhost:3000/api/testimonios', {
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
      
      {/* HEADER FLOTANTE - Diseño Limpio */}
      <header className="fixed top-6 left-1/2 transform -translate-x-1/2 w-[95%] max-w-7xl bg-white/70 backdrop-blur-xl shadow-lg shadow-slate-200/20 py-4 px-8 flex justify-between items-center rounded-full z-50 border border-white">
        <div className="flex items-center">
          <img src="/logo.png" alt="Logo Sembriogan" className="h-9 object-contain" />
        </div>

        <nav className="hidden md:flex space-x-8 font-medium text-slate-600 text-sm">
          <a href="#inicio" className="hover:text-primary transition">Inicio</a>
          <a href="#nosotros" className="hover:text-primary transition">Nosotros</a>
          <a href="#historias" className="hover:text-primary transition">Historias</a>
          <a href="#servicios" className="hover:text-primary transition">Tienda</a>
          <Link to="/admin" className="hover:text-blue-600 transition font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">⚙️ Admin</Link>
        </nav>

        <div className="flex items-center space-x-3">
          <button onClick={() => setIsCartOpen(true)} className="relative bg-slate-50 border border-slate-100 p-2.5 rounded-xl hover:bg-slate-100 transition text-slate-700 flex items-center gap-2">
            <ShoppingCart size={18} />
            {carrito.length > 0 && <span className="absolute -top-2 -right-2 bg-secondary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{carrito.reduce((sum, item) => sum + item.cantidad, 0)}</span>}
          </button>

          {userCliente ? (
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setIsDropdownMenuOpen(!isDropdownMenuOpen)} className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm font-semibold px-4 py-2 rounded-xl transition flex items-center gap-2 border border-blue-100">
                <User size={16} /> {userCliente.nombre.split(' ')[0]} <ChevronDown size={14} className={`transition-transform ${isDropdownMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* DROPDOWN MENU */}
              {isDropdownMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 flex flex-col z-[70] overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50">
                    <p className="text-sm font-bold text-slate-800 truncate">{userCliente.nombre}</p>
                    <p className="text-xs text-slate-500 truncate">{userCliente.email}</p>
                  </div>
                  <button onClick={() => { setIsClienteDashboardOpen(true); setIsDropdownMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 text-left transition">
                    <Package size={16} /> Historial de Compras
                  </button>
                  <button onClick={() => { setIsPerfilOpen(true); setIsDropdownMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 text-left transition">
                    <Settings size={16} /> Configurar Perfil
                  </button>
                  <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 text-left transition font-semibold">
                    ⚙️ Panel Administrador
                  </Link>
                  <div className="border-t border-slate-50 my-1"></div>
                  <button onClick={() => { setUserCliente(null); localStorage.removeItem('clienteSembriogan'); setIsDropdownMenuOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 text-left transition">
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setIsAuthOpen(true)} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-700 transition shadow-sm text-sm">
              Ingresar
            </button>
          )}
        </div>
      </header>

      {/* SECCIÓN 1: CARRUSEL - Alto completo para impacto visual */}
      <section id="inicio" className="relative min-h-[95vh] w-full overflow-hidden flex items-center">
        {imagenesHero.length > 0 ? (
            imagenesHero.map((img, index) => (
                <div key={img._id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === indiceActual ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    <img src={`http://localhost:3000${img.imagenUrl}`} alt={img.titulo} className="w-full h-full object-cover" />
                    {/* Gradient Overlay that fades into the page background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-50/50 z-10"></div>
                    <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto text-white transition-all duration-1000 ${index === indiceActual ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}`}>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight leading-tight drop-shadow-2xl">{img.titulo || "Biotecnología Reproductiva"}</h1>
                        <p className="text-lg md:text-2xl text-slate-100 mb-12 max-w-3xl font-light drop-shadow-lg leading-relaxed">{img.descripcion || "Maximizando la genética bovina con tecnología de punta."}</p>
                        <a href="#servicios" className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold py-4 px-10 rounded-full hover:bg-white hover:text-slate-900 transition-all duration-500 shadow-2xl text-lg flex items-center gap-3">
                           Explorar Catálogo <ChevronDown size={20} className="animate-bounce"/>
                        </a>
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
            <img src={infoNosotros?.imagenUrl ? `http://localhost:3000${infoNosotros.imagenUrl}` : "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=800"} alt="Ganadería Sembriogan" className="rounded-[2.5rem] shadow-2xl shadow-blue-900/10 object-cover h-[500px] w-full border border-white" />
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

      {/* SECCIÓN 4: CATÁLOGO - Fondo Blanco */}
      <section id="servicios" className="py-32 px-6 max-w-7xl mx-auto w-full relative z-40">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl font-black text-slate-800 mb-4">Catálogo de Servicios</h2>
          <p className="text-slate-500 font-light text-lg">Insumos y biotecnología reproductiva a un clic de distancia.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-stretch">
          {catalogo.map((item) => (
            <div key={item._id} className="bg-white/80 backdrop-blur-lg rounded-[2.5rem] border border-white overflow-hidden flex flex-col justify-between hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 hover:-translate-y-2">
              <div>
                <div className="h-60 w-full bg-slate-50 relative overflow-hidden flex items-center justify-center">
                  {item.imagen ? <img src={`http://localhost:3000${item.imagen}`} alt={item.tipo} className="w-full h-full object-cover" /> : <Package size={48} className="text-slate-300" />}
                  <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wider shadow-sm ${item.esServicio ? 'bg-blue-600 text-white' : 'bg-emerald-500 text-white'}`}>{item.esServicio ? 'Servicio' : 'Producto'}</span>
                </div>
                <div className="p-6 space-y-2">
                  <h3 className="text-xl font-bold text-slate-800">{item.tipo}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2">{item.descripcion}</p>
                </div>
              </div>
              <div className="p-6 pt-0 space-y-5">
                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-2xl font-black text-slate-800">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.costo)}</span>
                </div>
                <button onClick={() => agregarAlCarrito(item)} className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 transition flex justify-center items-center gap-2">
                  <ShoppingCart size={18}/> Agregar
                </button>
              </div>
            </div>
          ))}
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
                      </div>
                    ))}
                  </div>
                )}
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