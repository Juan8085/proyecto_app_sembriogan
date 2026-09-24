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

      {/* SECCIÓN 3: HISTORIAS (DINÁMICA + BOTÓN DE ENVIAR TESTIMONIO) */}
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
                <button onClick={() => alert('Pasarela de pago Wompi simulada correctamente.')} className="w-full bg-secondary text-white font-bold py-3.5 rounded-xl hover:bg-green-600 transition text-center">
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