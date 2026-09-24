import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const slides = [
  {
    url: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=1600&auto=format&fit=crop",
    titulo: "Biotecnología Reproductiva Avanzada",
    subtit: "Maximizando la genética y rentabilidad de tu hato en el Huila y Colombia."
  },
  {
    url: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=1600&auto=format&fit=crop",
    titulo: "Inseminación y Trazabilidad de Élite",
    subtit: "Control técnico profesional respaldado por expertos veterinarios."
  },
  {
    url: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?q=80&w=1600&auto=format&fit=crop",
    titulo: "Insumos y Servicios Ganaderos Confiables",
    subtit: "Todo lo que tu ganadería necesita al alcance de un clic."
  }
];

export default function PublicHome() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [catalogo, setCatalogo] = useState([]);
  const [testimonios, setTestimonios] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isTestimonioOpen, setIsTestimonioOpen] = useState(false);
  const [userCliente, setUserCliente] = useState(null);
  
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({ email: '', password: '', nombre: '' });
  
  // Estado para enviar testimonio
  const [nuevoTestimonio, setNuevoTestimonio] = useState({ nombre: '', rol: '', mensaje: '' });
  const [mensajeTestimonioExito, setMensajeTestimonioExito] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Cargar catálogo y testimonios aprobados desde el backend
  useEffect(() => {
    fetch('http://localhost:3000/api/catalogo')
      .then(res => res.json())
      .then(data => { if (data.success) setCatalogo(data.data); })
      .catch(err => console.error("Error cargando catálogo:", err));

    fetch('http://localhost:3000/api/testimonios')
      .then(res => res.json())
      .then(data => { if (data.success) setTestimonios(data.data); })
      .catch(err => console.error("Error cargando testimonios:", err));

    const clienteGuardado = localStorage.getItem('clienteSembriogan');
    if (clienteGuardado) setUserCliente(JSON.parse(clienteGuardado));
  }, []);

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

  // Procesar Pago Real en Modo de Pruebas con Wompi
  const pagarConWompi = () => {
    if (carrito.length === 0) return;
    if (!userCliente) {
      alert('Por favor, inicia sesión o regístrate para procesar tu pedido.');
      setIsAuthOpen(true);
      return;
    }

    // Validar que el script de Wompi se haya cargado en index.html
    if (!window.WidgetCheckout) {
      alert('El widget de pagos de Wompi no está disponible. Asegúrate de tener conexión a internet y el script en index.html.');
      return;
    }

    const referenciaUnica = 'WEB-SEM-' + Date.now();
    
    // Instanciar el widget oficial de Wompi Sandbox
    const checkout = new window.WidgetCheckout({
      currency: 'COP',
      amountInCents: Math.round(totalCarrito * 100), // Wompi exige el valor en centavos
      reference: referenciaUnica,
      publicKey: 'pub_test_b9Wif8x93ek97Eo0wrRazU19DefFIiQX',
      taxes: {
        vat: {
          amountInCents: 0
        }
      }
    });

    // Abrir la pasarela y escuchar la respuesta de la transacción
    checkout.open(async (result) => {
      const transaction = result.transaction;
      
      if (transaction && transaction.status === 'APPROVED') {
        try {
          const ordenPayload = {
            cliente: {
              nombre: userCliente.nombre,
              email: userCliente.email
            },
            items: carrito.map(item => ({
              catalogoItem: item._id,
              tipo: item.tipo,
              costo: item.costo,
              cantidad: item.cantidad
            })),
            total: totalCarrito,
            referenciaWompi: transaction.id || referenciaUnica
          };

          const res = await fetch('http://localhost:3000/api/ordenes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ordenPayload)
          });
          const data = await res.json();

          if (data.success) {
            alert(`✅ ¡Pago Exitoso por Wompi (Sandbox)!\nID Transacción: ${transaction.id}\n\n• Orden registrada en base de datos.\n• Inventario actualizado.\n• Panel general sincronizado.`);
            setCarrito([]);
            setIsCartOpen(false);
          } else {
            alert('El pago se aprobó pero hubo un error al registrar la orden: ' + data.mensaje);
          }
        } catch (err) {
          console.error("Error al registrar orden:", err);
          alert("Error de conexión al registrar la orden en el servidor.");
        }
      } else if (transaction) {
        alert('❌ La transacción no se completó. Estado: ' + transaction.status);
      }
    });
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const clienteSimulado = {
      nombre: authData.nombre || authData.email.split('@')[0],
      email: authData.email
    };
    setUserCliente(clienteSimulado);
    localStorage.setItem('clienteSembriogan', JSON.stringify(clienteSimulado));
    setIsAuthOpen(false);
    alert(`¡Bienvenido, ${clienteSimulado.nombre}! Sesión iniciada correctamente.`);
  };

  const handleGoogleLogin = () => {
    const clienteGoogle = {
      nombre: "Ganadero Google User",
      email: "ganadero.digital@gmail.com"
    };
    setUserCliente(clienteGoogle);
    localStorage.setItem('clienteSembriogan', JSON.stringify(clienteGoogle));
    setIsAuthOpen(false);
    alert('¡Conectado exitosamente con tu cuenta de Google!');
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
        }, 3500);
      }
    } catch (err) {
      console.error("Error enviando testimonio:", err);
    }
  };

  return (
    <div className="min-h-screen bg-light flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="bg-white shadow-sm py-4 px-8 flex justify-between items-center border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center">
          <img src="/logo.png" alt="Logo Sembriogan" className="h-12 object-contain" />
        </div>

        <nav className="hidden md:flex space-x-8 font-bold text-gray-700">
          <a href="#inicio" className="hover:text-primary transition">Inicio</a>
          <a href="#nosotros" className="hover:text-primary transition">Nosotros</a>
          <a href="#historias" className="hover:text-primary transition">Historias</a>
          <a href="#servicios" className="hover:text-primary transition">Productos y Servicios</a>
        </nav>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative bg-gray-100 p-2.5 rounded-xl hover:bg-gray-200 transition text-gray-700 font-bold flex items-center gap-2"
          >
            🛒 <span className="hidden sm:inline">Carrito</span>
            {carrito.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-secondary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {carrito.reduce((sum, item) => sum + item.cantidad, 0)}
              </span>
            )}
          </button>

          {userCliente ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-700 hidden lg:inline">Hola, {userCliente.nombre}</span>
              <button onClick={() => { setUserCliente(null); localStorage.removeItem('clienteSembriogan'); }} className="text-xs text-red-600 font-bold bg-red-50 hover:bg-red-100 p-2 rounded-lg transition">Salir</button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="bg-primary text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm text-sm"
            >
              Iniciar Sesión / Registro
            </button>
          )}

          <Link to="/login" className="text-xs font-bold text-gray-400 hover:text-gray-600 transition hidden xl:inline">
            Panel Admin/Vet
          </Link>
        </div>
      </header>

      {/* SECCIÓN 1: CARRUSEL */}
      <section id="inicio" className="relative h-[550px] w-full overflow-hidden bg-dark">
        {slides.map((slide, index) => (
          <div 
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="absolute inset-0 bg-black/50 z-10" />
            <img src={slide.url} alt="Slide Sembriogan" className="w-full h-full object-cover" />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto text-white">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-md">{slide.titulo}</h1>
              <p className="text-lg md:text-xl text-gray-200 mb-8 drop-shadow">{slide.subtit}</p>
              <a href="#servicios" className="bg-secondary text-white font-bold py-3 px-8 rounded-xl hover:bg-green-600 transition shadow-lg text-lg">
                Explorar Catálogo
              </a>
            </div>
          </div>
        ))}
      </section>

      {/* SECCIÓN 2: NOSOTROS */}
      <section id="nosotros" className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-primary font-extrabold text-sm uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full">Sobre Sembriogan</span>
            <h2 className="text-3xl font-extrabold text-gray-800 mt-3 mb-6">Liderando la Innovación Genética Bovina en el Sur Colombiano</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              En Sembriogan nos especializamos en transformar la ganadería tradicional en una empresa pecuaria moderna, eficiente y altamente rentable mediante la implementación rigurosa de biotecnología reproductiva.
            </p>
          </div>
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=800&auto=format&fit=crop" alt="Ganadería" className="rounded-2xl shadow-xl object-cover h-[350px] w-full" />
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: HISTORIAS */}
      <section id="historias" className="bg-white py-20 px-6 border-y border-gray-200">
        <div className="max-w-6xl mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-secondary font-extrabold text-sm uppercase tracking-wider bg-green-50 px-3 py-1 rounded-full">Testimonios</span>
            <h2 className="text-3xl font-extrabold text-gray-800 mt-3 mb-4">Historias que Inspiran Nuestro Trabajo</h2>
            <p className="text-gray-600 mb-6">Conoce cómo nuestros programas han transformado hatos ganaderos. ¿Ya trabajas con nosotros? ¡Comparte tu experiencia!</p>
            
            <button 
              onClick={() => setIsTestimonioOpen(true)}
              className="bg-secondary text-white font-bold py-2.5 px-6 rounded-xl hover:bg-green-600 transition shadow-sm text-sm"
            >
              ✍️ Cuéntanos tu Historia
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonios.length === 0 ? (
              <p className="text-center col-span-3 text-gray-400 italic py-6">Aún no hay testimonios publicados. ¡Sé el primero en compartir el tuyo!</p>
            ) : (
              testimonios.map((item) => (
                <div key={item._id} className="bg-light p-8 rounded-2xl border border-gray-200 flex flex-col justify-between">
                  <div>
                    <p className="text-primary text-4xl mb-4">“</p>
                    <p className="text-gray-700 italic mb-6">{item.mensaje}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{item.nombre}</p>
                    <p className="text-xs text-gray-500">{item.rol}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: PRODUCTOS Y SERVICIOS */}
      <section id="servicios" className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary font-extrabold text-sm uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full">Tienda y Servicios</span>
          <h2 className="text-3xl font-extrabold text-gray-800 mt-3 mb-4">Productos y Servicios Disponibles</h2>
          <p className="text-gray-600">Selecciona los servicios veterinarios o insumos que requieras para tu hato e agrégalos al carrito de compras.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {catalogo.length === 0 ? (
            <p className="text-center col-span-3 text-gray-500 py-10">Cargando catálogo en tiempo real...</p>
          ) : (
            catalogo.map((item) => (
              <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                <div>
                  <div className="h-48 w-full bg-gray-100 relative overflow-hidden flex items-center justify-center">
                    {item.imagen ? (
                      <img src={`http://localhost:3000${item.imagen}`} alt={item.tipo} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">📦</span>
                    )}
                    <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${item.esServicio ? 'bg-blue-600 text-white' : 'bg-amber-500 text-white'}`}>
                      {item.esServicio ? 'Servicio' : 'Producto'}
                    </span>
                  </div>
                  <div className="p-6 space-y-2">
                    <h3 className="text-xl font-bold text-gray-800">{item.tipo}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{item.descripcion}</p>
                  </div>
                </div>

                <div className="p-6 pt-0 space-y-4">
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block">Precio</span>
                      <span className="text-xl font-extrabold text-primary">
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
                  <button onClick={() => agregarAlCarrito(item)} className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-sm">
                    Añadir al Carrito 🛒
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* MODAL ENVIAR TESTIMONIO */}
      {isTestimonioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 relative">
            <button onClick={() => setIsTestimonioOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Comparte tu Experiencia</h3>
            <p className="text-gray-500 text-sm mb-4">Tu mensaje será revisado y publicado por nuestro equipo administrativo.</p>
            
            {mensajeTestimonioExito && <p className="bg-green-50 text-green-700 p-3 rounded-xl mb-4 text-sm font-bold">{mensajeTestimonioExito}</p>}

            <form onSubmit={enviarTestimonio} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tu Nombre o Hato</label>
                <input type="text" required value={nuevoTestimonio.nombre} onChange={(e) => setNuevoTestimonio({...nuevoTestimonio, nombre: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Ej: Finca La Esmeralda" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Rol o Descripción corta</label>
                <input type="text" value={nuevoTestimonio.rol} onChange={(e) => setNuevoTestimonio({...nuevoTestimonio, rol: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Ej: Productor Asociado en Garzón" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Tu Testimonio</label>
                <textarea required rows="3" value={nuevoTestimonio.mensaje} onChange={(e) => setNuevoTestimonio({...nuevoTestimonio, mensaje: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="¿Cómo te ha ayudado Sembriogan?" />
              </div>
              <button type="submit" className="w-full bg-secondary text-white font-bold py-3 rounded-xl hover:bg-green-600 transition shadow-md">
                Enviar Testimonio
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE AUTENTICACIÓN / REGISTRO CLIENTE */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 relative">
            <button onClick={() => setIsAuthOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">{authMode === 'login' ? 'Iniciar Sesión' : 'Registro de Cliente'}</h3>
              <p className="text-gray-500 text-sm">Accede a tus solicitudes y compras en Sembriogan</p>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition flex items-center justify-center gap-3 shadow-sm mb-4"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continuar con Google
            </button>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-3 text-gray-400 text-xs uppercase font-bold">O con correo</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'registro' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                  <input type="text" required value={authData.nombre} onChange={(e) => setAuthData({...authData, nombre: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Tu Nombre" />
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Correo Electrónico</label>
                <input type="email" required value={authData.email} onChange={(e) => setAuthData({...authData, email: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="usuario@correo.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
                <input type="password" required value={authData.password} onChange={(e) => setAuthData({...authData, password: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="••••••••" />
              </div>
              <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-md">
                {authMode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              {authMode === 'login' ? (
                <p className="text-gray-600">¿No tienes cuenta? <button onClick={() => setAuthMode('registro')} className="text-primary font-bold hover:underline">Regístrate aquí</button></p>
              ) : (
                <p className="text-gray-600">¿Ya tienes cuenta? <button onClick={() => setAuthMode('login')} className="text-primary font-bold hover:underline">Inicia sesión</button></p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CARRITO */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col p-6">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <h3 className="text-xl font-bold text-gray-800">Tu Carrito de Servicios</h3>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-400 font-bold text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              {carrito.length === 0 ? <p className="text-center text-gray-500 py-10">Tu carrito está vacío.</p> : (
                carrito.map((item) => (
                  <div key={item._id} className="flex justify-between items-center bg-light p-4 rounded-xl border">
                    <div>
                      <p className="font-bold text-gray-800">{item.tipo}</p>
                      <p className="text-sm text-primary font-semibold">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.costo)}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button onClick={() => cambiarCantidad(item._id, -1)} className="bg-white border w-8 h-8 rounded-lg font-bold">-</button>
                      <span className="font-bold">{item.cantidad}</span>
                      <button onClick={() => cambiarCantidad(item._id, 1)} className="bg-white border w-8 h-8 rounded-lg font-bold">+</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {carrito.length > 0 && (
              <div className="border-t pt-4 mt-4 space-y-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalCarrito)}</span>
                </div>
                <button onClick={pagarConWompi} className="w-full bg-secondary text-white font-bold py-3.5 rounded-xl hover:bg-green-600 transition text-center shadow-lg">
                  Pagar Seguro con Wompi 💳
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-dark text-gray-400 py-10 px-6 text-center text-sm border-t border-gray-800 mt-auto">
        <p>© 2026 Sembriogan - Expertos en Genética Bovina. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}