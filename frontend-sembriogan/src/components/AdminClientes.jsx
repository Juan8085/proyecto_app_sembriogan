import { useState, useEffect, useMemo, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import { DEPARTAMENTOS_COLOMBIA, MUNICIPIOS_POR_DEPARTAMENTO, obtenerMunicipios, formatearUbicacion } from '../utils/colombiaData';
import {
  Users,
  UserCheck,
  UserPlus,
  Mail,
  Search,
  CheckCircle2,
  X,
  Phone,
  Power,
  Edit2,
  RefreshCw,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  MapPin,
  ExternalLink,
  Compass,
  ShoppingBag,
  Dna,
  FileText,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ChevronRight
} from 'lucide-react';

export default function AdminClientes() {
  const [clientes, setClientes] = useState([]);
  const [fincas, setFincas] = useState([]);
  const [registrosGeneticos, setRegistrosGeneticos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroMunicipio, setFiltroMunicipio] = useState('todos');
  const [filtroProduccion, setFiltroProduccion] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  // Estado para el DASHBOARD INDIVIDUAL DE CADA CLIENTE
  const [clienteDashboard, setClienteDashboard] = useState(null);
  const [tabDashboard, setTabDashboard] = useState('resumen'); // 'resumen' | 'predio' | 'reproduccion' | 'compras' | 'editar'

  // Modal Crear Nuevo Cliente Ganadero
  const [isModalCrearOpen, setIsModalCrearOpen] = useState(false);
  const [creando, setCreando] = useState(false);
  const [errorCrear, setErrorCrear] = useState('');
  const [mostrarPasswordCrear, setMostrarPasswordCrear] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    fincaPrincipal: '',
    departamento: 'Huila',
    municipio: 'Neiva',
    municipioPersonalizado: '',
    tipoProduccion: 'Doble Propósito',
    inventarioBovino: '',
    hectareas: ''
  });

  // Modal Editar Cliente Rápido
  const [isModalEditarOpen, setIsModalEditarOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [errorEditar, setErrorEditar] = useState('');
  const [mostrarPasswordEditar, setMostrarPasswordEditar] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState({
    id: '',
    nombre: '',
    email: '',
    telefono: '',
    fincaPrincipal: '',
    departamento: 'Huila',
    municipio: 'Neiva',
    municipioPersonalizado: '',
    tipoProduccion: 'Doble Propósito',
    inventarioBovino: 0,
    hectareas: 0,
    password: ''
  });

  // Cargar todos los datos requeridos (Clientes, Fincas GPS, Registros genéticos, Órdenes)
  const cargarDatos = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoading(true);
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      // 1. Usuarios
      const resUsuarios = await fetch(`${API_BASE_URL}/api/auth/usuarios`, { headers });
      const dataUsuarios = await resUsuarios.json();

      if (dataUsuarios.success && Array.isArray(dataUsuarios.data)) {
        // Filtrar exclusivamente Clientes Ganaderos con correo electrónico válido
        const clientesSolo = dataUsuarios.data.filter(u => {
          const r = (u.rol || '').toLowerCase();
          const emailValido = u.email && u.email.trim() !== '' && u.email.includes('@');
          return r === 'cliente' && emailValido;
        });
        setClientes(clientesSolo);
      }

      // 2. Fincas georreferenciadas
      try {
        const resFincas = await fetch(`${API_BASE_URL}/api/fincas`, { headers });
        const dataFincas = await resFincas.json();
        if (dataFincas.success && Array.isArray(dataFincas.data)) {
          setFincas(dataFincas.data);
        }
      } catch (errF) {
        console.warn("Aviso al cargar fincas:", errF.message);
      }

      // 3. Trazabilidad genética (IATF, TE)
      try {
        const resReg = await fetch(`${API_BASE_URL}/api/registro-genetico`, { headers });
        const dataReg = await resReg.json();
        if (dataReg.success && Array.isArray(dataReg.data)) {
          setRegistrosGeneticos(dataReg.data);
        }
      } catch (errR) {
        console.warn("Aviso al cargar registros genéticos:", errR.message);
      }

      // 4. Órdenes / Compras
      try {
        const resOrd = await fetch(`${API_BASE_URL}/api/ordenes`, { headers });
        const dataOrd = await resOrd.json();
        if (dataOrd.success && Array.isArray(dataOrd.data)) {
          setOrdenes(dataOrd.data);
        }
      } catch (errO) {
        console.warn("Aviso al cargar órdenes:", errO.message);
      }

      setError('');
      const ahora = new Date();
      setUltimaActualizacion(ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error("Error al sincronizar clientes:", err);
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos(false);
    const intervalo = setInterval(() => cargarDatos(true), 20000);
    return () => clearInterval(intervalo);
  }, [cargarDatos]);

  // Actualizar el cliente del dashboard si la lista de clientes se refresca
  useEffect(() => {
    if (clienteDashboard) {
      const actualizado = clientes.find(c => c._id === clienteDashboard._id);
      if (actualizado) {
        setClienteDashboard(actualizado);
      }
    }
  }, [clientes]);

  const generarClaveAleatoria = (esParaCrear = true) => {
    const numeros = Math.floor(1000 + Math.random() * 9000);
    const clave = `Gan-${numeros}*`;
    if (esParaCrear) {
      setNuevoCliente(prev => ({ ...prev, password: clave }));
      setMostrarPasswordCrear(true);
    } else {
      setClienteAEditar(prev => ({ ...prev, password: clave }));
      setMostrarPasswordEditar(true);
    }
  };

  // Registrar un nuevo cliente desde la administración
  const handleCrearCliente = async (e) => {
    e.preventDefault();
    setErrorCrear('');

    if (!nuevoCliente.nombre.trim()) {
      setErrorCrear('Ingresa el nombre completo del ganadero.');
      return;
    }
    if (!nuevoCliente.email.trim()) {
      setErrorCrear('Ingresa el correo electrónico.');
      return;
    }
    if (!nuevoCliente.password || nuevoCliente.password.length < 6) {
      setErrorCrear('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    setCreando(true);
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const muniFinal = (nuevoCliente.municipio === 'Otro' && nuevoCliente.municipioPersonalizado?.trim())
        ? nuevoCliente.municipioPersonalizado.trim()
        : (nuevoCliente.municipio || 'Neiva');

      const res = await fetch(`${API_BASE_URL}/api/auth/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: nuevoCliente.nombre.trim(),
          email: nuevoCliente.email.toLowerCase().trim(),
          password: nuevoCliente.password,
          rol: 'Cliente',
          telefono: nuevoCliente.telefono.trim(),
          fincaPrincipal: nuevoCliente.fincaPrincipal.trim(),
          departamento: nuevoCliente.departamento || 'Huila',
          municipio: muniFinal,
          tipoProduccion: nuevoCliente.tipoProduccion || 'Doble Propósito',
          inventarioBovino: Number(nuevoCliente.inventarioBovino) || 0,
          hectareas: Number(nuevoCliente.hectareas) || 0
        })
      });

      const data = await res.json();

      if (data.success) {
        setMensaje(`✅ Cliente ganadero "${nuevoCliente.nombre}" registrado exitosamente.`);
        setIsModalCrearOpen(false);
        setNuevoCliente({
          nombre: '',
          email: '',
          password: '',
          telefono: '',
          fincaPrincipal: '',
          departamento: 'Huila',
          municipio: 'Neiva',
          municipioPersonalizado: '',
          tipoProduccion: 'Doble Propósito',
          inventarioBovino: '',
          hectareas: ''
        });
        cargarDatos(true);
      } else {
        setErrorCrear(data.mensaje || 'Error al registrar cliente ganadero');
      }
    } catch (err) {
      console.error(err);
      setErrorCrear('Error de conexión con el servidor.');
    } finally {
      setCreando(false);
    }
  };

  // Abrir Modal de Edición
  const abrirModalEditar = (c) => {
    setErrorEditar('');
    setClienteAEditar({
      id: c._id,
      nombre: c.nombre || '',
      email: c.email || '',
      telefono: c.telefono || '',
      fincaPrincipal: (c.fincaPrincipal && c.fincaPrincipal !== 'Predio no especificado') ? c.fincaPrincipal : (c.fincasAsociadas?.[0]?.nombreFinca || ''),
      departamento: c.departamento || 'Huila',
      municipio: c.municipio || 'Neiva',
      municipioPersonalizado: '',
      tipoProduccion: c.tipoProduccion || 'Doble Propósito',
      inventarioBovino: Number(c.inventarioBovino) || 0,
      hectareas: Number(c.hectareas) || 0,
      password: ''
    });
    setMostrarPasswordEditar(false);
    setIsModalEditarOpen(true);
  };

  // Guardar Cambios de Cliente
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    setErrorEditar('');

    if (!clienteAEditar.nombre.trim()) {
      setErrorEditar('El nombre es obligatorio.');
      return;
    }
    if (!clienteAEditar.email.trim()) {
      setErrorEditar('El correo es obligatorio.');
      return;
    }
    if (clienteAEditar.password && clienteAEditar.password.length < 6) {
      setErrorEditar('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setEditando(true);
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const muniFinal = (clienteAEditar.municipio === 'Otro' && clienteAEditar.municipioPersonalizado?.trim())
        ? clienteAEditar.municipioPersonalizado.trim()
        : (clienteAEditar.municipio || 'Neiva');

      const payload = {
        nombre: clienteAEditar.nombre.trim(),
        email: clienteAEditar.email.toLowerCase().trim(),
        telefono: clienteAEditar.telefono ? clienteAEditar.telefono.trim() : '',
        fincaPrincipal: clienteAEditar.fincaPrincipal ? clienteAEditar.fincaPrincipal.trim() : '',
        departamento: clienteAEditar.departamento || 'Huila',
        municipio: muniFinal,
        tipoProduccion: clienteAEditar.tipoProduccion || 'Doble Propósito',
        inventarioBovino: Number(clienteAEditar.inventarioBovino) || 0,
        hectareas: Number(clienteAEditar.hectareas) || 0
      };

      if (clienteAEditar.password && clienteAEditar.password.trim() !== '') {
        payload.password = clienteAEditar.password.trim();
      }

      const res = await fetch(`${API_BASE_URL}/api/auth/usuarios/${clienteAEditar.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        setMensaje(`✅ Datos del ganadero "${clienteAEditar.nombre}" actualizados correctamente.`);
        setIsModalEditarOpen(false);
        cargarDatos(true);
      } else {
        setErrorEditar(data.mensaje || 'Error al actualizar cliente');
      }
    } catch (err) {
      console.error(err);
      setErrorEditar('Error de conexión al actualizar cliente.');
    } finally {
      setEditando(false);
    }
  };

  // Toggle Activar / Desactivar
  const toggleEstado = async (id, estadoActual, nombre) => {
    const accion = estadoActual ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Estás seguro de ${accion} el acceso de "${nombre}"?`)) return;

    try {
      setError('');
      setMensaje('');
      const token = localStorage.getItem('tokenSembriogan');
      const res = await fetch(`${API_BASE_URL}/api/auth/usuarios/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ estado: !estadoActual })
      });
      const data = await res.json();

      if (data.success) {
        setMensaje(`Cliente "${nombre}" ${!estadoActual ? 'activado' : 'desactivado'} con éxito.`);
        cargarDatos(true);
      } else {
        setError("Error: " + data.mensaje);
      }
    } catch (err) {
      setError("Error de conexión al actualizar el cliente.");
    }
  };

  // 1. Enriquecer clientes cruzando con fincas de forma reactiva y consistente
  const clientesEnriquecidos = useMemo(() => {
    return clientes.map(c => {
      const email = (c.email || '').toLowerCase().trim();
      const nombre = (c.nombre || '').toLowerCase().trim();
      const fincaNom = (c.fincaPrincipal || '').toLowerCase().trim();

      const fincasAsociadas = fincas.filter(f => 
        (f.propietarioEmail && f.propietarioEmail.toLowerCase().trim() === email) ||
        (f.propietarioNombre && f.propietarioNombre.toLowerCase().trim() === nombre) ||
        (fincaNom && f.nombreFinca && f.nombreFinca.toLowerCase().trim() === fincaNom)
      );

      const totalAnimalesFincas = fincasAsociadas.reduce((sum, f) => sum + (Number(f.numeroAnimales) || 0), 0);
      const totalHectareasFincas = fincasAsociadas.reduce((sum, f) => sum + (Number(f.hectareas) || 0), 0);
      const primeraFinca = fincasAsociadas[0];

      const inventarioBovino = (Number(c.inventarioBovino) > 0)
        ? Number(c.inventarioBovino)
        : totalAnimalesFincas;

      const hectareas = (Number(c.hectareas) > 0)
        ? Number(c.hectareas)
        : totalHectareasFincas;

      const fincaPrincipal = (c.fincaPrincipal && c.fincaPrincipal.trim() !== '' && c.fincaPrincipal !== 'Predio no especificado')
        ? c.fincaPrincipal
        : (primeraFinca?.nombreFinca || 'Predio no especificado');

      const telefono = (c.telefono && c.telefono.trim() !== '')
        ? c.telefono
        : (fincasAsociadas.find(f => f.propietarioTelefono?.trim())?.propietarioTelefono || '');

      const municipio = (c.municipio && c.municipio.trim() !== '')
        ? c.municipio
        : (primeraFinca?.municipio || 'Neiva');

      const tipoProduccion = (c.tipoProduccion && c.tipoProduccion.trim() !== '')
        ? c.tipoProduccion
        : (primeraFinca?.tipoProduccion || 'Doble Propósito');

      return {
        ...c,
        inventarioBovino,
        hectareas,
        fincaPrincipal,
        telefono,
        municipio,
        tipoProduccion,
        fincasAsociadas,
        tieneFincaGps: fincasAsociadas.length > 0
      };
    });
  }, [clientes, fincas]);

  // Métricas Consolidadas del Sector Clientes Ganaderos
  const metricas = useMemo(() => {
    const total = clientesEnriquecidos.length;
    const activos = clientesEnriquecidos.filter(c => c.estado).length;
    const inactivos = clientesEnriquecidos.filter(c => !c.estado).length;
    
    // Sumatoria de inventario bovino total
    const inventarioTotal = clientesEnriquecidos.reduce((acc, c) => acc + (Number(c.inventarioBovino) || 0), 0);
    // Sumatoria de hectáreas totales
    const hectareasTotal = clientesEnriquecidos.reduce((acc, c) => acc + (Number(c.hectareas) || 0), 0);

    // Cuántos clientes tienen fincas georreferenciadas
    const clientesConFinca = clientesEnriquecidos.filter(c => c.tieneFincaGps).length;

    return {
      total,
      activos,
      inactivos,
      inventarioTotal,
      hectareasTotal,
      clientesConFinca
    };
  }, [clientesEnriquecidos]);

  // Lista de municipios únicos para filtrar
  const municipiosDisponibles = useMemo(() => {
    const setM = new Set();
    clientesEnriquecidos.forEach(c => {
      if (c.municipio && c.municipio.trim()) setM.add(c.municipio.trim());
    });
    return Array.from(setM).sort();
  }, [clientesEnriquecidos]);

  // Filtrado dinámico
  const clientesFiltrados = useMemo(() => {
    return clientesEnriquecidos.filter(c => {
      const q = busqueda.toLowerCase().trim();
      const matchBusqueda = !q ||
        (c.nombre || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.telefono || '').toLowerCase().includes(q) ||
        (c.fincaPrincipal || '').toLowerCase().includes(q) ||
        (c.municipio || '').toLowerCase().includes(q);

      if (!matchBusqueda) return false;

      if (filtroMunicipio !== 'todos' && (c.municipio || '').toLowerCase() !== filtroMunicipio.toLowerCase()) {
        return false;
      }

      if (filtroProduccion !== 'todos' && (c.tipoProduccion || '').toLowerCase() !== filtroProduccion.toLowerCase()) {
        return false;
      }

      if (filtroEstado === 'activos' && !c.estado) return false;
      if (filtroEstado === 'inactivos' && c.estado) return false;

      return true;
    });
  }, [clientesEnriquecidos, busqueda, filtroMunicipio, filtroProduccion, filtroEstado]);

  const getInitials = (name) => {
    if (!name) return 'G';
    return name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  };

  const formatearFecha = (fechaRaw) => {
    if (!fechaRaw) return 'Reciente';
    if (typeof fechaRaw === 'string') {
      const match = fechaRaw.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [, year, month, day] = match;
        return `${day}/${month}/${year}`;
      }
    }
    try {
      const d = new Date(fechaRaw);
      if (isNaN(d.getTime())) return 'Reciente';
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const year = d.getUTCFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return 'Reciente';
    }
  };

  // Datos específicos del cliente seleccionado para el Dashboard Individual
  const datosClienteDashboard = useMemo(() => {
    if (!clienteDashboard) return null;

    const email = (clienteDashboard.email || '').toLowerCase().trim();
    const nombre = (clienteDashboard.nombre || '').toLowerCase().trim();
    const fincaPrincipal = (clienteDashboard.fincaPrincipal || '').toLowerCase().trim();

    // 1. Fincas asociadas
    const fincasAsociadas = fincas.filter(f => 
      (f.propietarioEmail && f.propietarioEmail.toLowerCase().trim() === email) ||
      (f.propietarioNombre && f.propietarioNombre.toLowerCase().trim() === nombre) ||
      (fincaPrincipal && f.nombreFinca && f.nombreFinca.toLowerCase().trim() === fincaPrincipal)
    );

    // 2. Registros genéticos / Procedimientos (IATF, TE, etc.)
    const procedimientosAsociados = registrosGeneticos.filter(r => 
      (r.productorEmail && r.productorEmail.toLowerCase().trim() === email) ||
      (r.productor && r.productor.toLowerCase().trim() === nombre) ||
      (fincaPrincipal && r.finca && r.finca.toLowerCase().trim() === fincaPrincipal)
    );

    // 3. Órdenes / compras asociadas
    const ordenesAsociadas = ordenes.filter(o => 
      (o.cliente && o.cliente.email && o.cliente.email.toLowerCase().trim() === email) ||
      (o.cliente && o.cliente.nombre && o.cliente.nombre.toLowerCase().trim() === nombre)
    );

    // 4. Estadísticas del cliente
    const totalProcedimientos = procedimientosAsociados.length;
    const preñadas = procedimientosAsociados.filter(p => p.estadoPrenez === 'Preñada').length;
    const vacias = procedimientosAsociados.filter(p => p.estadoPrenez === 'Vacía').length;
    const pendientes = procedimientosAsociados.filter(p => p.estadoPrenez !== 'Preñada' && p.estadoPrenez !== 'Vacía').length;
    const tasaPrenez = (preñadas + vacias) > 0 ? Math.round((preñadas / (preñadas + vacias)) * 100) : 0;

    // Carga animal calculada
    const animales = Number(clienteDashboard.inventarioBovino) || (fincasAsociadas.reduce((a, f) => a + (f.numeroAnimales || 0), 0)) || 0;
    const ha = Number(clienteDashboard.hectareas) || (fincasAsociadas.reduce((a, f) => a + (f.hectareas || 0), 0)) || 0;
    const cargaAnimal = ha > 0 ? (animales / ha).toFixed(2) : 0;

    return {
      fincasAsociadas,
      procedimientosAsociados,
      ordenesAsociadas,
      totalProcedimientos,
      preñadas,
      vacias,
      pendientes,
      tasaPrenez,
      animales,
      ha,
      cargaAnimal
    };
  }, [clienteDashboard, fincas, registrosGeneticos, ordenes]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Cargando directorio y métricas de clientes ganaderos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* TARJETAS DE MÉTRICAS GENERALES DE CLIENTES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Total Ganaderos */}
        <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Ganaderos</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{metricas.total}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Inventario Bovino Consolidado */}
        <div className="bg-white rounded-3xl p-4 md:p-5 border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Inventario Bovino</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">
              {metricas.inventarioTotal.toLocaleString('es-CO')} <span className="text-xs font-semibold text-emerald-700">cabezas</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 text-lg">
            🐄
          </div>
        </div>

        {/* Área Total Hectáreas */}
        <div className="bg-white rounded-3xl p-4 md:p-5 border border-sky-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">Área Consolidada</p>
            <p className="text-2xl font-black text-sky-600 mt-0.5">
              {metricas.hectareasTotal.toLocaleString('es-CO')} <span className="text-xs font-semibold text-sky-700">Ha</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-inner text-lg">
            📐
          </div>
        </div>

        {/* Fincas con GPS */}
        <div className="bg-white rounded-3xl p-4 md:p-5 border border-teal-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Predios Satelitales</p>
            <p className="text-2xl font-black text-teal-600 mt-0.5">
              {fincas.length} <span className="text-xs font-semibold text-teal-700">fincas</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-inner">
            <MapPin className="w-5 h-5" />
          </div>
        </div>

        {/* Cuentas Activas */}
        <div className="bg-white rounded-3xl p-4 md:p-5 border border-blue-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Cuentas Activas</p>
            <p className="text-2xl font-black text-blue-600 mt-0.5">{metricas.activos}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* ALERTAS */}
      {mensaje && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{mensaje}</span>
          </div>
          <button onClick={() => setMensaje('')} className="text-emerald-600 hover:text-emerald-800 p-1">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-800 p-1">
            <X size={16} />
          </button>
        </div>
      )}

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por ganadero, predio, municipio, correo o WhatsApp..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
          {busqueda && (
            <button 
              onClick={() => setBusqueda('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtros de Municipio y Producción */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Municipio */}
          <select
            value={filtroMunicipio}
            onChange={(e) => setFiltroMunicipio(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="todos">Todos los Municipios</option>
            {municipiosDisponibles.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Tipo de Producción */}
          <select
            value={filtroProduccion}
            onChange={(e) => setFiltroProduccion(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="todos">Toda Producción</option>
            <option value="Doble Propósito">Doble Propósito</option>
            <option value="Leche">Leche</option>
            <option value="Carne">Carne</option>
            <option value="Genética/Biotecnología">Genética / TE</option>
            <option value="Cría y Levante">Cría y Levante</option>
          </select>

          {/* Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="todos">Todos los Estados</option>
            <option value="activos">Solo Activos</option>
            <option value="inactivos">Solo Inactivos</option>
          </select>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => cargarDatos(false)}
            title="Refrescar lista"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-emerald-600' : ''} />
          </button>
          
          <button
            onClick={() => {
              setErrorCrear('');
              setNuevoCliente({
                nombre: '',
                email: '',
                password: '',
                telefono: '',
                fincaPrincipal: '',
                municipio: 'Neiva',
                tipoProduccion: 'Doble Propósito',
                inventarioBovino: '',
                hectareas: ''
              });
              setIsModalCrearOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs md:text-sm font-bold rounded-2xl shadow-md shadow-emerald-500/20 flex items-center gap-2 transition cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Registrar Ganadero</span>
          </button>
        </div>
      </div>

      {/* LISTADO DE CLIENTES GANADEROS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Directorio Ganadero ({clientesFiltrados.length} clientes encontrados)
          </p>
          {ultimaActualizacion && (
            <span className="text-[11px] font-medium text-slate-400">
              Última sincronización: {ultimaActualizacion}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Productor Ganadero</th>
                <th className="py-3 px-4">Predio / Finca</th>
                <th className="py-3 px-4">Inventario Bovino</th>
                <th className="py-3 px-4">Área (Hectáreas)</th>
                <th className="py-3 px-4">Contacto Directo</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-center">Dashboard & Ficha</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-14 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-500" />
                    No se encontraron clientes ganaderos con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((c) => {
                  const telefonoLimpio = (c.telefono || '').replace(/\D/g, '');
                  const tieneFincaGps = fincas.some(f => 
                    (f.propietarioEmail && f.propietarioEmail.toLowerCase() === (c.email || '').toLowerCase()) ||
                    (f.nombreFinca && f.nombreFinca.toLowerCase() === (c.fincaPrincipal || '').toLowerCase())
                  );

                  return (
                    <tr key={c._id} className="hover:bg-emerald-50/40 transition group">
                      
                      {/* Productor */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200 text-emerald-800 flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                            {getInitials(c.nombre)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-900 text-xs md:text-sm">{c.nombre}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail size={11} /> {c.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Predio / Finca */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-800 text-xs flex items-center gap-1">
                            {c.fincaPrincipal || 'Predio no especificado'}
                            {tieneFincaGps && (
                              <span title="Finca con GPS Satelital" className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                            )}
                          </p>
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={11} className="text-emerald-600" />
                            {formatearUbicacion(c.municipio, c.departamento)} &bull; <span className="text-slate-400">{c.tipoProduccion || 'Doble Propósito'}</span>
                          </span>
                        </div>
                      </td>

                      {/* Inventario Bovino */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-extrabold text-xs">
                          <span>🐄</span>
                          <span>{Number(c.inventarioBovino) || 0} cabezas</span>
                        </div>
                      </td>

                      {/* Área Hectáreas */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 border border-sky-200 rounded-xl text-sky-800 font-extrabold text-xs">
                          <span>📐</span>
                          <span>{Number(c.hectareas) || 0} Ha</span>
                        </div>
                      </td>

                      {/* Contacto Directo WhatsApp */}
                      <td className="py-3.5 px-4">
                        {telefonoLimpio ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-700">{c.telefono}</span>
                            <a
                              href={`https://wa.me/57${telefonoLimpio}?text=Hola%20${encodeURIComponent(c.nombre)},%20te%20contactamos%20desde%20Sembriogan%20respecto%20a%20tu%20finca%20${encodeURIComponent(c.fincaPrincipal || 'ganadera')}.`}
                              target="_blank"
                              rel="noreferrer"
                              title="Contactar vía WhatsApp"
                              className="inline-flex items-center gap-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] px-2 py-1 rounded-lg font-bold text-[11px] transition"
                            >
                              <Phone size={12} />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Sin teléfono</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          c.estado ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.estado ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                          {c.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      {/* BOTÓN VER DASHBOARD DEL CLIENTE */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setClienteDashboard(c);
                            setTabDashboard('resumen');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-xs hover:shadow-md transition cursor-pointer"
                        >
                          <Activity size={13} />
                          <span>Ver Dashboard</span>
                        </button>
                      </td>

                      {/* Acciones Secundarias */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => abrirModalEditar(c)}
                            title="Editar Datos"
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => toggleEstado(c._id, c.estado, c.nombre)}
                            title={c.estado ? 'Desactivar cliente' : 'Activar cliente'}
                            className={`p-1.5 rounded-xl transition ${
                              c.estado 
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700' 
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            <Power size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* DASHBOARD INDIVIDUAL DE CADA CLIENTE (MODAL EXPANDIDO COMPLETO) */}
      {/* ============================================================== */}
      {clienteDashboard && datosClienteDashboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
          <div className="bg-slate-50 rounded-3xl w-full max-w-4xl max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header del Dashboard Individual */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-white p-5 sm:p-6 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
              <button
                onClick={() => setClienteDashboard(null)}
                className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition border border-slate-700 shadow-md cursor-pointer z-30"
                title="Cerrar Ficha"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-emerald-500/20 shrink-0">
                  {getInitials(clienteDashboard.nombre)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-white">{clienteDashboard.nombre}</h2>
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                      Cliente Ganadero
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1"><Mail size={12} /> {clienteDashboard.email}</span>
                    {clienteDashboard.telefono && (
                      <span className="flex items-center gap-1"><Phone size={12} /> {clienteDashboard.telefono}</span>
                    )}
                    <span className="flex items-center gap-1"><MapPin size={12} /> {clienteDashboard.municipio || 'Neiva'}</span>
                    {(clienteDashboard.fincaPrincipal && clienteDashboard.fincaPrincipal !== 'Predio no especificado') && (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-xs font-bold">
                        🏡 {clienteDashboard.fincaPrincipal}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Botón WhatsApp de Acción Rápida */}
              {clienteDashboard.telefono && (
                <a
                  href={`https://wa.me/57${clienteDashboard.telefono.replace(/\D/g, '')}?text=Hola%20Dr.%20${encodeURIComponent(clienteDashboard.nombre)},%20te%20contactamos%20desde%20la%20administraci%C3%B3n%20de%20Sembriogan.`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#25D366] hover:bg-[#1EBE5C] text-white px-4 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-2 transition"
                >
                  <Phone size={14} />
                  <span>Contactar Ganadero</span>
                </a>
              )}
            </div>

            {/* PESTAÑAS DE NAVEGACIÓN DENTRO DEL DASHBOARD */}
            <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setTabDashboard('resumen')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  tabDashboard === 'resumen' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Activity size={14} />
                <span>Dashboard & KPIs</span>
              </button>

              <button
                onClick={() => setTabDashboard('predio')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  tabDashboard === 'predio' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <MapPin size={14} />
                <span>Finca & Geolocalización ({datosClienteDashboard.fincasAsociadas.length})</span>
              </button>

              <button
                onClick={() => setTabDashboard('reproduccion')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  tabDashboard === 'reproduccion' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Dna size={14} />
                <span>Trazabilidad Reproductiva ({datosClienteDashboard.totalProcedimientos})</span>
              </button>

              <button
                onClick={() => setTabDashboard('compras')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  tabDashboard === 'compras' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ShoppingBag size={14} />
                <span>Compras en Tienda ({datosClienteDashboard.ordenesAsociadas.length})</span>
              </button>

              <button
                onClick={() => setTabDashboard('editar')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  tabDashboard === 'editar' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Edit2 size={14} />
                <span>Editar Ficha</span>
              </button>
            </div>

            {/* CONTENIDO INTERACTIVO DEL DASHBOARD */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* 1. VISTA: RESUMEN Y KPIS */}
              {tabDashboard === 'resumen' && (
                <div className="space-y-5">
                  
                  {/* Fila de Tarjetas KPI Individuales */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    
                    {/* Inventario Bovino */}
                    <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Inventario Bovino</p>
                      <p className="text-2xl font-black text-emerald-600 mt-1">
                        {datosClienteDashboard.animales}
                      </p>
                      <span className="text-[11px] font-semibold text-slate-500">Cabezas registradas</span>
                    </div>

                    {/* Hectáreas */}
                    <div className="bg-white p-4 rounded-2xl border border-sky-200 shadow-xs">
                      <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">Área del Predio</p>
                      <p className="text-2xl font-black text-sky-600 mt-1">
                        {datosClienteDashboard.ha}
                      </p>
                      <span className="text-[11px] font-semibold text-slate-500">Hectáreas (Ha)</span>
                    </div>

                    {/* Carga Animal */}
                    <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs">
                      <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Carga Animal</p>
                      <p className="text-2xl font-black text-purple-600 mt-1">
                        {datosClienteDashboard.cargaAnimal}
                      </p>
                      <span className="text-[11px] font-semibold text-slate-500">Cabezas / Hectárea</span>
                    </div>

                    {/* Tasa de Preñez */}
                    <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
                      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Tasa de Preñez</p>
                      <p className="text-2xl font-black text-amber-600 mt-1">
                        {datosClienteDashboard.tasaPrenez}%
                      </p>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {datosClienteDashboard.preñadas} de {datosClienteDashboard.totalProcedimientos} evaluadas
                      </span>
                    </div>
                  </div>

                  {/* Resumen Finca y Producción */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Compass size={16} className="text-emerald-600" />
                      Ficha General del Predio Ganadero
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block">Predio / Finca Principal:</span>
                        <span className="font-extrabold text-slate-800 text-sm">
                          {clienteDashboard.fincaPrincipal && clienteDashboard.fincaPrincipal !== 'Predio no especificado' 
                            ? clienteDashboard.fincaPrincipal 
                            : (datosClienteDashboard.fincasAsociadas[0]?.nombreFinca || 'No especificada')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">Municipio / Departamento:</span>
                        <span className="font-extrabold text-slate-800 text-sm">{clienteDashboard.municipio || 'Neiva'}, Huila</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">Tipo de Producción:</span>
                        <span className="font-extrabold text-emerald-700 text-sm">{clienteDashboard.tipoProduccion || 'Doble Propósito'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block">Fecha de Registro:</span>
                        <span className="font-extrabold text-slate-800 text-sm">{formatearFecha(clienteDashboard.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Alerta de Carga Animal con Análisis Zootécnico */}
                  {datosClienteDashboard.ha > 0 && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200 text-xs flex items-center justify-between">
                      <div>
                        <p className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                          <TrendingUp size={16} className="text-emerald-600" />
                          Indicador Zootécnico de Capacidad de Carga
                        </p>
                        <p className="text-slate-600 mt-1">
                          Con {datosClienteDashboard.animales} animales en {datosClienteDashboard.ha} hectáreas, el ganadero mantiene una densidad de <strong>{datosClienteDashboard.cargaAnimal} animales/ha</strong>.
                          {Number(datosClienteDashboard.cargaAnimal) > 2 
                            ? ' Sistema intensivo con alta demanda de forraje o rotación de potreros.' 
                            : ' Sistema de pastoreo extensivo/moderado adecuado para el Huila.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Resumen de Actividad Reproductiva Reciente */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Dna size={16} className="text-blue-600" />
                        Últimos Procedimientos Reproductivos
                      </h3>
                      <button
                        onClick={() => setTabDashboard('reproduccion')}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        Ver todos ({datosClienteDashboard.totalProcedimientos}) <ArrowRight size={13} />
                      </button>
                    </div>

                    {datosClienteDashboard.procedimientosAsociados.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">
                        No hay protocolos registrados aún para este ganadero.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100 text-xs">
                        {datosClienteDashboard.procedimientosAsociados.slice(0, 3).map(p => (
                          <div key={p._id} className="py-2.5 flex items-center justify-between">
                            <div>
                              <p className="font-extrabold text-slate-900">Arete {p.arete} &bull; <span className="text-slate-500 font-semibold">{p.raza || 'Bovino'}</span></p>
                              <p className="text-[11px] text-slate-400">{p.tipoProcedimiento} con {p.geneticaUtilizada}</p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                p.estadoPrenez === 'Preñada' ? 'bg-green-100 text-green-700' :
                                (p.estadoPrenez === 'Vacía' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')
                              }`}>
                                {p.estadoPrenez}
                              </span>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                {formatearFecha(p.fechasProtocolo?.dia0_sincronizacion || p.fechaProcedimiento || p.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* 2. VISTA: PREDIOS Y FINCAS SATELITALES */}
              {tabDashboard === 'predio' && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <MapPin size={16} className="text-emerald-600" />
                      Predios Georreferenciados en Campo ({datosClienteDashboard.fincasAsociadas.length})
                    </h3>

                    {datosClienteDashboard.fincasAsociadas.length === 0 ? (
                      <div className="py-8 text-center text-slate-400">
                        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-600" />
                        <p className="text-xs font-semibold text-slate-600">Este cliente aún no tiene fincas georreferenciadas con GPS.</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          El veterinario en campo puede georreferenciarla desde la App Móvil o tú en la sección "Geolocalización Fincas".
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {datosClienteDashboard.fincasAsociadas.map(f => (
                          <div key={f._id} className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-black text-slate-900 text-sm">{f.nombreFinca}</h4>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {f.municipio}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600">
                                <strong>Vereda:</strong> {f.vereda || 'No especificada'}
                              </p>
                              <p className="text-xs text-slate-600">
                                <strong>Inventario:</strong> {f.numeroAnimales || 0} animales &bull; <strong>Área:</strong> {f.hectareas || 0} Ha
                              </p>
                              {f.coordenadas && f.coordenadas.lat && (
                                <p className="text-[11px] text-slate-400 mt-2 font-mono">
                                  GPS: {f.coordenadas.lat.toFixed(5)}, {f.coordenadas.lng.toFixed(5)}
                                </p>
                              )}
                            </div>

                            {f.coordenadas && f.coordenadas.lat && (
                              <div className="mt-4 pt-3 border-t border-emerald-200/60 flex gap-2">
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${f.coordenadas.lat},${f.coordenadas.lng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl text-center flex items-center justify-center gap-1 transition"
                                >
                                  <ExternalLink size={12} /> Google Maps
                                </a>
                                <a
                                  href={`https://waze.com/ul?ll=${f.coordenadas.lat},${f.coordenadas.lng}&navigate=yes`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex-1 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] rounded-xl text-center flex items-center justify-center gap-1 transition"
                                >
                                  <Compass size={12} /> Waze
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. VISTA: HISTORIAL REPRODUCTIVO (IATF / TE) */}
              {tabDashboard === 'reproduccion' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Dna size={16} className="text-blue-600" />
                      Historial Biotecnológico y Clínico ({datosClienteDashboard.totalProcedimientos})
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-2.5 px-3">Arete / Chapeta</th>
                          <th className="py-2.5 px-3">Procedimiento</th>
                          <th className="py-2.5 px-3">Genética / Toro</th>
                          <th className="py-2.5 px-3">Fecha Día 0</th>
                          <th className="py-2.5 px-3">Veterinario</th>
                          <th className="py-2.5 px-3">Diagnóstico</th>
                          <th className="py-2.5 px-3">Observaciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {datosClienteDashboard.procedimientosAsociados.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="py-8 text-center text-slate-400">
                              No hay registros de sincronización o ecografía para este cliente.
                            </td>
                          </tr>
                        ) : (
                          datosClienteDashboard.procedimientosAsociados.map(p => (
                            <tr key={p._id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3 font-extrabold text-slate-900">
                                {p.arete} <span className="text-slate-400 font-normal">({p.raza || 'Bovino'})</span>
                              </td>
                              <td className="py-2.5 px-3 font-bold text-blue-700">
                                {p.tipoProcedimiento}
                              </td>
                              <td className="py-2.5 px-3 font-medium">
                                {p.geneticaUtilizada}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 font-medium">
                                {formatearFecha(p.fechasProtocolo?.dia0_sincronizacion || p.fechaProcedimiento || p.createdAt)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                {p.veterinarioAsignado || 'Veterinario Sembriogan'}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  p.estadoPrenez === 'Preñada' ? 'bg-green-100 text-green-700' :
                                  (p.estadoPrenez === 'Vacía' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')
                                }`}>
                                  {p.estadoPrenez}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 italic max-w-xs truncate">
                                {p.observaciones || '—'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 4. VISTA: HISTORIAL DE COMPRAS */}
              {tabDashboard === 'compras' && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <ShoppingBag size={16} className="text-indigo-600" />
                      Órdenes y Compras en la Tienda Oficial ({datosClienteDashboard.ordenesAsociadas.length})
                    </h3>
                  </div>

                  {datosClienteDashboard.ordenesAsociadas.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      El cliente no registra compras por catálogo aún.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs p-4">
                      {datosClienteDashboard.ordenesAsociadas.map(o => (
                        <div key={o._id} className="py-3 flex items-center justify-between">
                          <div>
                            <p className="font-extrabold text-slate-900">Orden #{o._id.slice(-6).toUpperCase()}</p>
                            <p className="text-[11px] text-slate-500">
                              {o.items?.length || 1} producto(s) &bull; Ref: {o.referenciaWompi || 'Directo'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-emerald-700 text-sm">
                              ${(o.total || 0).toLocaleString('es-CO')}
                            </p>
                            <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              {o.estado || 'Aprobado'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 5. VISTA: EDITAR DIRECTAMENTE DESDE EL DASHBOARD */}
              {tabDashboard === 'editar' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Edit2 size={16} className="text-emerald-600" />
                    Actualizar Información del Ganadero
                  </h3>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        const token = localStorage.getItem('tokenSembriogan');
                        const res = await fetch(`${API_BASE_URL}/api/auth/usuarios/${clienteDashboard._id}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            nombre: clienteDashboard.nombre,
                            telefono: clienteDashboard.telefono,
                            fincaPrincipal: clienteDashboard.fincaPrincipal,
                            municipio: clienteDashboard.municipio,
                            tipoProduccion: clienteDashboard.tipoProduccion,
                            inventarioBovino: Number(clienteDashboard.inventarioBovino) || 0,
                            hectareas: Number(clienteDashboard.hectareas) || 0
                          })
                        });
                        const data = await res.json();
                        if (data.success) {
                          setMensaje("✅ Ficha del cliente actualizada exitosamente.");
                          if (data.data) {
                            setClienteDashboard(prev => ({ ...prev, ...data.data }));
                          }
                          await cargarDatos(true);
                          setTabDashboard('resumen');
                        } else {
                          alert(data.mensaje || 'Error al actualizar');
                        }
                      } catch (err) {
                        alert('Error de conexión');
                      }
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Nombre Completo</label>
                        <input
                          type="text"
                          value={clienteDashboard.nombre}
                          onChange={(e) => setClienteDashboard({ ...clienteDashboard, nombre: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Teléfono / WhatsApp</label>
                        <input
                          type="tel"
                          value={clienteDashboard.telefono || ''}
                          onChange={(e) => setClienteDashboard({ ...clienteDashboard, telefono: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Finca Principal</label>
                      <input
                        type="text"
                        value={clienteDashboard.fincaPrincipal || ''}
                        onChange={(e) => setClienteDashboard({ ...clienteDashboard, fincaPrincipal: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Departamento</label>
                        <select
                          value={clienteDashboard.departamento || 'Huila'}
                          onChange={(e) => {
                            const d = e.target.value;
                            const primerM = obtenerMunicipios(d)[0] || 'Otro';
                            setClienteDashboard({ ...clienteDashboard, departamento: d, municipio: primerM });
                          }}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-semibold cursor-pointer"
                        >
                          {DEPARTAMENTOS_COLOMBIA.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Municipio</label>
                        <select
                          value={clienteDashboard.municipio || 'Neiva'}
                          onChange={(e) => setClienteDashboard({ ...clienteDashboard, municipio: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-semibold cursor-pointer"
                        >
                          {obtenerMunicipios(clienteDashboard.departamento || 'Huila').map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100">
                      <div>
                        <label className="block text-[10px] font-extrabold text-emerald-800 uppercase mb-1">🐄 Inventario Bovino</label>
                        <input
                          type="number"
                          min="0"
                          value={clienteDashboard.inventarioBovino ?? ''}
                          onChange={(e) => setClienteDashboard({ ...clienteDashboard, inventarioBovino: e.target.value })}
                          className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-emerald-800 uppercase mb-1">📐 Área (Hectáreas)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={clienteDashboard.hectareas ?? ''}
                          onChange={(e) => setClienteDashboard({ ...clienteDashboard, hectareas: e.target.value })}
                          className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-extrabold text-emerald-800 uppercase mb-1">🌾 Tipo Producción</label>
                        <select
                          value={clienteDashboard.tipoProduccion || 'Doble Propósito'}
                          onChange={(e) => setClienteDashboard({ ...clienteDashboard, tipoProduccion: e.target.value })}
                          className="w-full p-2.5 bg-white border border-emerald-200 rounded-xl outline-none focus:border-emerald-500 font-bold"
                        >
                          <option value="Doble Propósito">Doble Propósito</option>
                          <option value="Leche">Leche</option>
                          <option value="Carne">Carne</option>
                          <option value="Genética/Biotecnología">Genética / TE</option>
                          <option value="Cría y Levante">Cría y Levante</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setTabDashboard('resumen')}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
                      >
                        Guardar Cambios
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR NUEVO CLIENTE GANADERO */}
      {isModalCrearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsModalCrearOpen(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition border border-slate-200 cursor-pointer z-20"
              title="Cerrar Ventana"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                <UserPlus size={22} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Registrar Cliente Ganadero</h3>
                <p className="text-xs text-slate-500">Alta de productor ganadero en el sistema</p>
              </div>
            </div>

            {errorCrear && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                {errorCrear}
              </div>
            )}

            <form onSubmit={handleCrearCliente} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Nombre Completo del Ganadero *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Gabriel García"
                  value={nuevoCliente.nombre}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="ganadero@ejemplo.com"
                  value={nuevoCliente.email}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Finca o Predio</label>
                <input
                  type="text"
                  placeholder="Ej: La Florida"
                  value={nuevoCliente.fincaPrincipal}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, fincaPrincipal: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Departamento *</label>
                  <select
                    value={nuevoCliente.departamento || 'Huila'}
                    onChange={(e) => {
                      const d = e.target.value;
                      const primerM = obtenerMunicipios(d)[0] || 'Otro';
                      setNuevoCliente({ ...nuevoCliente, departamento: d, municipio: primerM });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {DEPARTAMENTOS_COLOMBIA.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Municipio *</label>
                  <select
                    value={nuevoCliente.municipio || 'Neiva'}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, municipio: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {obtenerMunicipios(nuevoCliente.departamento || 'Huila').map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {nuevoCliente.municipio === 'Otro' && (
                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 uppercase mb-1">Escribir Municipio / Vereda</label>
                  <input
                    type="text"
                    placeholder="Digita el municipio o sector"
                    value={nuevoCliente.municipioPersonalizado || ''}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, municipioPersonalizado: e.target.value })}
                    className="w-full px-3.5 py-2 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tipo Producción</label>
                  <select
                    value={nuevoCliente.tipoProduccion}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, tipoProduccion: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Doble Propósito">Doble Propósito</option>
                    <option value="Leche">Leche</option>
                    <option value="Carne">Carne</option>
                    <option value="Genética/Biotecnología">Genética / TE</option>
                    <option value="Cría y Levante">Cría y Levante</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="Ej: 3123456789"
                    value={nuevoCliente.telefono}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* CAMPOS CLAVE: INVENTARIO BOVINO Y HECTÁREAS */}
              <div className="grid grid-cols-2 gap-3 bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200">
                <div>
                  <label className="block text-[10px] font-extrabold text-emerald-900 uppercase mb-1">
                    🐄 Inventario Bovino (Cabezas)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej: 35 animales"
                    value={nuevoCliente.inventarioBovino}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, inventarioBovino: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-emerald-900 uppercase mb-1">
                    📐 Área Predial (Hectáreas)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Ej: 15.5 ha"
                    value={nuevoCliente.hectareas}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, hectareas: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">Contraseña Inicial *</label>
                  <button
                    type="button"
                    onClick={() => generarClaveAleatoria(true)}
                    className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound size={11} /> Generar Clave
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={mostrarPasswordCrear ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={nuevoCliente.password}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, password: e.target.value })}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPasswordCrear(!mostrarPasswordCrear)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {mostrarPasswordCrear ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalCrearOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creando}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer"
                >
                  {creando ? 'Registrando...' : 'Guardar Ganadero'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR CLIENTE GANADERO */}
      {isModalEditarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsModalEditarOpen(false)}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition border border-slate-200 cursor-pointer z-20"
              title="Cerrar Ventana"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                <Edit2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Editar Datos del Ganadero</h3>
                <p className="text-xs text-slate-500">Actualizar predio, inventario bovino o contacto</p>
              </div>
            </div>

            {errorEditar && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                {errorEditar}
              </div>
            )}

            <form onSubmit={handleGuardarEdicion} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={clienteAEditar.nombre}
                  onChange={(e) => setClienteAEditar({ ...clienteAEditar, nombre: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={clienteAEditar.email}
                  onChange={(e) => setClienteAEditar({ ...clienteAEditar, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Finca Principal</label>
                <input
                  type="text"
                  value={clienteAEditar.fincaPrincipal}
                  onChange={(e) => setClienteAEditar({ ...clienteAEditar, fincaPrincipal: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Departamento</label>
                  <select
                    value={clienteAEditar.departamento || 'Huila'}
                    onChange={(e) => {
                      const d = e.target.value;
                      const primerM = obtenerMunicipios(d)[0] || 'Otro';
                      setClienteAEditar({ ...clienteAEditar, departamento: d, municipio: primerM });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {DEPARTAMENTOS_COLOMBIA.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Municipio</label>
                  <select
                    value={clienteAEditar.municipio || 'Neiva'}
                    onChange={(e) => setClienteAEditar({ ...clienteAEditar, municipio: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {obtenerMunicipios(clienteAEditar.departamento || 'Huila').map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {clienteAEditar.municipio === 'Otro' && (
                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 uppercase mb-1">Escribir Municipio / Vereda</label>
                  <input
                    type="text"
                    placeholder="Digita el municipio o sector"
                    value={clienteAEditar.municipioPersonalizado || ''}
                    onChange={(e) => setClienteAEditar({ ...clienteAEditar, municipioPersonalizado: e.target.value })}
                    className="w-full px-3.5 py-2 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tipo Producción</label>
                  <select
                    value={clienteAEditar.tipoProduccion}
                    onChange={(e) => setClienteAEditar({ ...clienteAEditar, tipoProduccion: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Doble Propósito">Doble Propósito</option>
                    <option value="Leche">Leche</option>
                    <option value="Carne">Carne</option>
                    <option value="Genética/Biotecnología">Genética / TE</option>
                    <option value="Cría y Levante">Cría y Levante</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={clienteAEditar.telefono}
                    onChange={(e) => setClienteAEditar({ ...clienteAEditar, telefono: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* INVENTARIO BOVINO Y HECTÁREAS EN EDICIÓN */}
              <div className="grid grid-cols-2 gap-3 bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200">
                <div>
                  <label className="block text-[10px] font-extrabold text-emerald-900 uppercase mb-1">
                    🐄 Inventario Bovino
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={clienteAEditar.inventarioBovino}
                    onChange={(e) => setClienteAEditar({ ...clienteAEditar, inventarioBovino: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-emerald-900 uppercase mb-1">
                    📐 Hectáreas (Ha)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={clienteAEditar.hectareas}
                    onChange={(e) => setClienteAEditar({ ...clienteAEditar, hectareas: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Contraseña Opcional */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Cambiar Contraseña (Opcional)</label>
                  <button
                    type="button"
                    onClick={() => generarClaveAleatoria(false)}
                    className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound size={11} /> Generar Clave
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={mostrarPasswordEditar ? 'text' : 'password'}
                    placeholder="Dejar vacío para no cambiar"
                    value={clienteAEditar.password}
                    onChange={(e) => setClienteAEditar({ ...clienteAEditar, password: e.target.value })}
                    className="w-full pl-3.5 pr-10 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPasswordEditar(!mostrarPasswordEditar)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {mostrarPasswordEditar ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalEditarOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editando}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 transition cursor-pointer"
                >
                  {editando ? 'Guardando...' : 'Actualizar Ganadero'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

