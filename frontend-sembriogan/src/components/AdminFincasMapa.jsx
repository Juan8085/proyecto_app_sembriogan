import { useState, useEffect, useRef, useMemo } from 'react';
import { API_BASE_URL, getApiUrl } from '../config/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  MapPin,
  Search,
  Plus,
  RefreshCw,
  Compass,
  Navigation,
  Layers,
  Phone,
  MessageCircle,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Building2,
  Activity,
  Maximize2,
  Map as MapIcon,
  Globe
} from 'lucide-react';

const MUNICIPIOS_HUILA = [
  'Neiva', 'Rivera', 'Campoalegre', 'Garzón', 'Pitalito', 'Palermo', 
  'Gigante', 'Aipe', 'Algeciras', 'Baraya', 'Tarqui', 'Hobo', 
  'Villavieja', 'Yaguará', 'Tello', 'La Plata', 'San Agustín', 'Timaná',
  'Otro'
];

const TIPOS_PRODUCCION = [
  'Doble Propósito',
  'Leche',
  'Carne',
  'Genética/Biotecnología',
  'Cría y Levante',
  'Otro'
];

export default function AdminFincasMapa() {
  const [fincas, setFincas] = useState([]);
  const [stats, setStats] = useState({
    totalFincas: 0,
    totalAnimales: 0,
    totalHectareas: 0,
    municipiosCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroMunicipio, setFiltroMunicipio] = useState('todos');
  const [filtroProduccion, setFiltroProduccion] = useState('todos');
  const [selectedFinca, setSelectedFinca] = useState(null);
  const [capaMapa, setCapaMapa] = useState('satelital'); // 'satelital' | 'callejero'

  // Modal de Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');
  const [fincaForm, setFincaForm] = useState({
    _id: '',
    nombreFinca: '',
    propietarioNombre: '',
    propietarioEmail: '',
    propietarioTelefono: '',
    departamento: 'Huila',
    municipio: 'Neiva',
    vereda: '',
    coordenadas: { lat: 2.9273, lng: -75.2819 },
    numeroAnimales: '',
    hectareas: '',
    tipoProduccion: 'Doble Propósito',
    notas: ''
  });

  // Modal para confirmación de eliminación
  const [fincaAEliminar, setFincaAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Referencias Leaflet
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Cargar fincas desde backend
  const cargarFincas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fincas`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setFincas(data.data);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error al cargar fincas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarFincas();
    const interval = setInterval(cargarFincas, 30000);
    return () => clearInterval(interval);
  }, []);

  // Inicializar mapa de Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Coordenadas por defecto (Huila, Colombia)
    const initialLat = 2.9273;
    const initialLng = -75.2819;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 9,
      zoomControl: true,
      attributionControl: false
    });

    // Capa base inicial (Satelital de Esri para ganadería)
    const esriSatellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19 }
    );
    esriSatellite.addTo(map);
    tileLayerRef.current = esriSatellite;

    // Grupo para marcadores
    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Redimensionar cuando el componente termine de montar
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Cambiar entre Satelital y Callejero
  const toggleCapaMapa = () => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    if (capaMapa === 'satelital') {
      const osmStreet = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      });
      osmStreet.addTo(mapInstanceRef.current);
      tileLayerRef.current = osmStreet;
      setCapaMapa('callejero');
    } else {
      const esriSatellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      );
      esriSatellite.addTo(mapInstanceRef.current);
      tileLayerRef.current = esriSatellite;
      setCapaMapa('satelital');
    }
  };

  // Filtrado de fincas
  const fincasFiltradas = useMemo(() => {
    return fincas.filter((f) => {
      const matchBusqueda =
        !busqueda ||
        f.nombreFinca?.toLowerCase().includes(busqueda.toLowerCase()) ||
        f.propietarioNombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        f.municipio?.toLowerCase().includes(busqueda.toLowerCase()) ||
        f.vereda?.toLowerCase().includes(busqueda.toLowerCase());

      const matchMunicipio =
        filtroMunicipio === 'todos' ||
        f.municipio?.toLowerCase() === filtroMunicipio.toLowerCase();

      const matchProduccion =
        filtroProduccion === 'todos' || f.tipoProduccion === filtroProduccion;

      return matchBusqueda && matchMunicipio && matchProduccion;
    });
  }, [fincas, busqueda, filtroMunicipio, filtroProduccion]);

  // Actualizar marcadores en el mapa
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    const bounds = L.latLngBounds([]);

    fincasFiltradas.forEach((finca) => {
      if (
        finca.coordenadas &&
        finca.coordenadas.lat !== undefined &&
        finca.coordenadas.lng !== undefined
      ) {
        const lat = parseFloat(finca.coordenadas.lat);
        const lng = parseFloat(finca.coordenadas.lng);

        if (!isNaN(lat) && !isNaN(lng)) {
          bounds.extend([lat, lng]);

          // Crear icono HTML personalizado con pin esmeralda y badge
          const customIcon = L.divIcon({
            className: 'custom-finca-marker',
            html: `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
                <div style="
                  background: linear-gradient(135deg, #10b981, #047857);
                  color: white;
                  padding: 4px 8px;
                  border-radius: 9999px;
                  font-size: 11px;
                  font-weight: 800;
                  white-space: nowrap;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.35);
                  border: 2px solid #ffffff;
                  display: flex;
                  align-items: center;
                  gap: 4px;
                ">
                  <span>🏡</span>
                  <span>${finca.nombreFinca}</span>
                </div>
                <div style="
                  width: 14px;
                  height: 14px;
                  background: #10b981;
                  transform: rotate(45deg);
                  margin-top: -6px;
                  border-right: 2px solid white;
                  border-bottom: 2px solid white;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                "></div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0]
          });

          const marker = L.marker([lat, lng], { icon: customIcon });

          // Popup estilizado
          const popupContent = `
            <div style="font-family: system-ui, sans-serif; min-width: 230px; padding: 4px;">
              <div style="border-bottom: 2px solid #10b981; padding-bottom: 6px; margin-bottom: 8px;">
                <span style="font-size: 10px; font-weight: 700; color: #047857; text-transform: uppercase; background: #d1fae5; padding: 2px 6px; border-radius: 4px;">
                  Predio Ganadero
                </span>
                <h4 style="margin: 4px 0 0 0; font-size: 15px; font-weight: 800; color: #1e293b;">
                  ${finca.nombreFinca}
                </h4>
              </div>
              <div style="font-size: 12px; color: #475569; line-height: 1.5;">
                <p style="margin: 2px 0;"><strong>👤 Propietario:</strong> ${finca.propietarioNombre}</p>
                <p style="margin: 2px 0;"><strong>📍 Ubicación:</strong> ${finca.municipio} - ${finca.vereda || 'Principal'}</p>
                <p style="margin: 2px 0;"><strong>🐄 Animales:</strong> ${finca.numeroAnimales || 0} cabezas</p>
                <p style="margin: 2px 0;"><strong>🌱 Producción:</strong> ${finca.tipoProduccion || 'Doble Propósito'}</p>
                <p style="margin: 2px 0;"><strong>🌐 GPS:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
              </div>
              <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; gap: 6px;">
                ${
                  finca.propietarioTelefono
                    ? `<a href="https://wa.me/57${finca.propietarioTelefono.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(finca.propietarioNombre)},%20te%20escribimos%20desde%20Sembriogan%20respecto%20a%20tu%20finca%20${encodeURIComponent(finca.nombreFinca)}" target="_blank" style="flex: 1; text-align: center; background: #25D366; color: white; padding: 5px 8px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold; display: inline-block;">WhatsApp</a>`
                    : ''
                }
                <a href="https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}" target="_blank" style="flex: 1; text-align: center; background: #3b82f6; color: white; padding: 5px 8px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold; display: inline-block;">Cómo llegar</a>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);

          marker.on('click', () => {
            setSelectedFinca(finca);
          });

          markersGroupRef.current.addLayer(marker);
        }
      }
    });

    // Centrar mapa si hay fincas y no hay una seleccionada
    if (fincasFiltradas.length > 0 && bounds.isValid() && !selectedFinca) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [fincasFiltradas, selectedFinca]);

  // Centrar mapa en una finca seleccionada
  const enfocarFincaEnMapa = (finca) => {
    setSelectedFinca(finca);
    if (!mapInstanceRef.current || !finca.coordenadas) return;

    const lat = parseFloat(finca.coordenadas.lat);
    const lng = parseFloat(finca.coordenadas.lng);

    if (!isNaN(lat) && !isNaN(lng)) {
      mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
    }
  };

  // Abrir modal de creación
  const handleAbrirCrear = () => {
    setIsEditing(false);
    setErrorModal('');
    setFincaForm({
      _id: '',
      nombreFinca: '',
      propietarioNombre: '',
      propietarioEmail: '',
      propietarioTelefono: '',
      departamento: 'Huila',
      municipio: 'Neiva',
      vereda: '',
      coordenadas: { lat: 2.9273, lng: -75.2819 },
      numeroAnimales: '',
      hectareas: '',
      tipoProduccion: 'Doble Propósito',
      notas: ''
    });
    setIsModalOpen(true);
  };

  // Abrir modal de edición
  const handleAbrirEditar = (finca) => {
    setIsEditing(true);
    setErrorModal('');
    setFincaForm({
      _id: finca._id,
      nombreFinca: finca.nombreFinca || '',
      propietarioNombre: finca.propietarioNombre || '',
      propietarioEmail: finca.propietarioEmail || '',
      propietarioTelefono: finca.propietarioTelefono || '',
      departamento: finca.departamento || 'Huila',
      municipio: finca.municipio || 'Neiva',
      vereda: finca.vereda || '',
      coordenadas: {
        lat: finca.coordenadas?.lat ?? 2.9273,
        lng: finca.coordenadas?.lng ?? -75.2819
      },
      numeroAnimales: finca.numeroAnimales || '',
      hectareas: finca.hectareas || '',
      tipoProduccion: finca.tipoProduccion || 'Doble Propósito',
      notas: finca.notas || ''
    });
    setIsModalOpen(true);
  };

  // Capturar coordenadas GPS del navegador
  const capturarUbicacionActual = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFincaForm((prev) => ({
          ...prev,
          coordenadas: {
            lat: parseFloat(pos.coords.latitude.toFixed(6)),
            lng: parseFloat(pos.coords.longitude.toFixed(6))
          }
        }));
      },
      (err) => {
        alert('No se pudo obtener la ubicación GPS: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Guardar (crear o actualizar) finca
  const handleSubmitFinca = async (e) => {
    e.preventDefault();
    setErrorModal('');

    if (!fincaForm.nombreFinca.trim() || !fincaForm.propietarioNombre.trim()) {
      setErrorModal('El nombre de la finca y el propietario son obligatorios.');
      return;
    }

    if (
      isNaN(parseFloat(fincaForm.coordenadas.lat)) ||
      isNaN(parseFloat(fincaForm.coordenadas.lng))
    ) {
      setErrorModal('Las coordenadas latitud y longitud deben ser valores numéricos válidos.');
      return;
    }

    setGuardando(true);
    try {
      const url = isEditing
        ? `${API_BASE_URL}/api/fincas/${fincaForm._id}`
        : `${API_BASE_URL}/api/fincas`;

      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...fincaForm,
          registradoPor: 'Admin'
        })
      });

      const data = await res.json();

      if (data.success) {
        setIsModalOpen(false);
        cargarFincas();
      } else {
        setErrorModal(data.mensaje || 'Error al guardar finca.');
      }
    } catch (err) {
      console.error('Error guardando finca:', err);
      setErrorModal('Error de conexión con el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar finca
  const confirmarEliminarFinca = async () => {
    if (!fincaAEliminar) return;
    setEliminando(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fincas/${fincaAEliminar._id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setFincaAEliminar(null);
        if (selectedFinca?._id === fincaAEliminar._id) {
          setSelectedFinca(null);
        }
        cargarFincas();
      }
    } catch (err) {
      console.error('Error al eliminar finca:', err);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TARJETAS DE INDICADORES (KPIS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Fincas Georreferenciadas
            </p>
            <h3 className="text-2xl font-black text-slate-900">{stats.totalFincas || fincas.length}</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 size={13} />
              Predios en mapa GPS
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100">
            <MapPin size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Cabezas de Ganado
            </p>
            <h3 className="text-2xl font-black text-slate-900">
              {(stats.totalAnimales || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-blue-600 font-semibold mt-1 flex items-center gap-1">
              <Activity size={13} />
              Censo bovino registrado
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100">
            <Building2 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Municipios Cobertura
            </p>
            <h3 className="text-2xl font-black text-slate-900">{stats.municipiosCount || 1}</h3>
            <p className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
              <Compass size={13} />
              Departamentos y zonas
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100">
            <Globe size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Hectáreas Georreferenciadas
            </p>
            <h3 className="text-2xl font-black text-slate-900">
              {(stats.totalHectareas || 0).toLocaleString()} ha
            </h3>
            <p className="text-[11px] text-purple-600 font-semibold mt-1 flex items-center gap-1">
              <Sparkles size={13} />
              Área productiva total
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 border border-purple-100">
            <Layers size={24} />
          </div>
        </div>
      </div>

      {/* BARRA DE ACCIONES Y FILTROS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por finca, cliente, vereda o municipio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          {/* Filtro Municipio */}
          <select
            value={filtroMunicipio}
            onChange={(e) => setFiltroMunicipio(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="todos">Todos los municipios</option>
            {MUNICIPIOS_HUILA.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Filtro Producción */}
          <select
            value={filtroProduccion}
            onChange={(e) => setFiltroProduccion(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="todos">Toda producción</option>
            {TIPOS_PRODUCCION.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Alternar vista de mapa (Satelital / Callejero) */}
          <button
            onClick={toggleCapaMapa}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold flex items-center gap-1.5 transition border border-slate-200"
            title="Alternar entre Satélite y Callejero"
          >
            <Layers size={16} />
            <span className="hidden sm:inline">
              {capaMapa === 'satelital' ? 'Vista Satélite 🛰️' : 'Mapa Callejero 🗺️'}
            </span>
          </button>

          {/* Recargar */}
          <button
            onClick={cargarFincas}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl border border-slate-200 transition"
            title="Actualizar datos"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Botón Nueva Finca */}
          <button
            onClick={handleAbrirCrear}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm shadow-emerald-600/30 transition transform active:scale-95"
          >
            <Plus size={18} />
            Registrar Finca
          </button>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL: MAPA + DIRECTORIO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* MAPA INTERACTIVO (7 COLUMNAS EN DESKTOP) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-[650px] relative">
          <div className="p-3 bg-slate-900 text-white flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold tracking-wide">
                MAPA SATELITAL DE FINCAS ({fincasFiltradas.length} ubicadas)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-mono text-emerald-400">
                {capaMapa === 'satelital' ? 'Esri World Imagery' : 'OpenStreetMap'}
              </span>
            </div>
          </div>

          {/* CONTENEDOR LEAFLET */}
          <div ref={mapContainerRef} className="flex-1 w-full h-full relative z-0" />

          {/* MINI OVERLAY CUANDO HAY FINCA SELECCIONADA */}
          {selectedFinca && (
            <div className="absolute bottom-4 left-4 right-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                  🏡
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{selectedFinca.nombreFinca}</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedFinca.propietarioNombre} • {selectedFinca.municipio} ({selectedFinca.vereda || 'Principal'})
                  </p>
                  <p className="text-[11px] font-mono text-emerald-700 font-semibold">
                    GPS: {selectedFinca.coordenadas?.lat?.toFixed(5)}, {selectedFinca.coordenadas?.lng?.toFixed(5)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {selectedFinca.propietarioTelefono && (
                  <a
                    href={`https://wa.me/57${selectedFinca.propietarioTelefono.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(selectedFinca.propietarioNombre)},%20te%20escribimos%20desde%20Sembriogan%20respecto%20a%20tu%20predio%20${encodeURIComponent(selectedFinca.nombreFinca)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition"
                    title="Enviar WhatsApp al productor"
                  >
                    <MessageCircle size={15} />
                    <span>WhatsApp</span>
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFinca.coordenadas?.lat},${selectedFinca.coordenadas?.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition"
                  title="Abrir ruta en Google Maps"
                >
                  <Navigation size={15} />
                  <span>Ruta GPS</span>
                </a>
                <button
                  onClick={() => handleAbrirEditar(selectedFinca)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                  title="Editar predio"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => setSelectedFinca(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                  title="Cerrar detalle"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* DIRECTORIO DE FINCAS Y CLIENTES (5 COLUMNAS EN DESKTOP) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-[650px] overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Building2 size={16} className="text-emerald-600" />
                Clientes y Predios Registrados
              </h3>
              <p className="text-xs text-slate-500">
                Mostrando {fincasFiltradas.length} de {fincas.length} fincas
              </p>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
              Satelital
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-emerald-600" />
                <p className="text-xs font-medium">Sincronizando predios y geolocalizaciones...</p>
              </div>
            ) : fincasFiltradas.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MapPin size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-bold text-slate-700">No se encontraron fincas</p>
                <p className="text-xs text-slate-500 mt-1">
                  Ajusta los filtros o registra un nuevo predio con el botón superior.
                </p>
              </div>
            ) : (
              fincasFiltradas.map((finca) => {
                const isSelected = selectedFinca?._id === finca._id;
                return (
                  <div
                    key={finca._id}
                    onClick={() => enfocarFincaEnMapa(finca)}
                    className={`p-3.5 rounded-xl cursor-pointer transition border ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                        : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-sm truncate">
                            {finca.nombreFinca}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {finca.municipio}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5 truncate">
                          👤 Propietario: {finca.propietarioNombre}
                        </p>
                        {finca.vereda && (
                          <p className="text-[11px] text-slate-400">
                            📍 Vereda: {finca.vereda}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-lg">
                          {finca.numeroAnimales || 0} reses
                        </span>
                        {finca.hectareas > 0 && (
                          <p className="text-[10px] text-slate-400 font-medium mt-1">
                            {finca.hectareas} ha
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-mono text-slate-400">
                        {finca.coordenadas?.lat?.toFixed(4)}, {finca.coordenadas?.lng?.toFixed(4)}
                      </span>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {finca.propietarioTelefono && (
                          <a
                            href={`https://wa.me/57${finca.propietarioTelefono.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(finca.propietarioNombre)},%20te%20saludamos%20desde%20Sembriogan`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition"
                            title="Chat de WhatsApp"
                          >
                            <Phone size={14} />
                          </a>
                        )}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${finca.coordenadas?.lat},${finca.coordenadas?.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          title="Ruta en Google Maps"
                        >
                          <Navigation size={14} />
                        </a>
                        <button
                          onClick={() => handleAbrirEditar(finca)}
                          className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setFincaAEliminar(finca)}
                          className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* MODAL CREAR / EDITAR FINCA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {isEditing ? 'Editar Predio Ganadero' : 'Georreferenciar Nueva Finca'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ingresa los datos del cliente y sus coordenadas satelitales
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            {errorModal && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{errorModal}</span>
              </div>
            )}

            <form onSubmit={handleSubmitFinca} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre de la Finca *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Hacienda El Progreso"
                    value={fincaForm.nombreFinca}
                    onChange={(e) => setFincaForm({ ...fincaForm, nombreFinca: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre del Propietario / Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Arturo Lozano"
                    value={fincaForm.propietarioNombre}
                    onChange={(e) => setFincaForm({ ...fincaForm, propietarioNombre: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 3154567890"
                    value={fincaForm.propietarioTelefono}
                    onChange={(e) => setFincaForm({ ...fincaForm, propietarioTelefono: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo del Propietario (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@correo.com"
                    value={fincaForm.propietarioEmail}
                    onChange={(e) => setFincaForm({ ...fincaForm, propietarioEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={fincaForm.departamento}
                    onChange={(e) => setFincaForm({ ...fincaForm, departamento: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Municipio *
                  </label>
                  <select
                    value={fincaForm.municipio}
                    onChange={(e) => setFincaForm({ ...fincaForm, municipio: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {MUNICIPIOS_HUILA.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vereda / Sector
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. El Caguán"
                    value={fincaForm.vereda}
                    onChange={(e) => setFincaForm({ ...fincaForm, vereda: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* COORDENADAS GPS */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Navigation size={14} className="text-emerald-600" />
                    Coordenadas Satelitales GPS *
                  </span>
                  <button
                    type="button"
                    onClick={capturarUbicacionActual}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                  >
                    <Compass size={13} />
                    Usar mi ubicación actual
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Latitud
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="Ej. 2.9273"
                      value={fincaForm.coordenadas.lat}
                      onChange={(e) =>
                        setFincaForm({
                          ...fincaForm,
                          coordenadas: {
                            ...fincaForm.coordenadas,
                            lat: parseFloat(e.target.value) || 0
                          }
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Longitud
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="Ej. -75.2819"
                      value={fincaForm.coordenadas.lng}
                      onChange={(e) =>
                        setFincaForm({
                          ...fincaForm,
                          coordenadas: {
                            ...fincaForm.coordenadas,
                            lng: parseFloat(e.target.value) || 0
                          }
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Animales
                  </label>
                  <input
                    type="number"
                    placeholder="Ej. 120"
                    value={fincaForm.numeroAnimales}
                    onChange={(e) => setFincaForm({ ...fincaForm, numeroAnimales: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hectáreas Totales
                  </label>
                  <input
                    type="number"
                    placeholder="Ej. 65"
                    value={fincaForm.hectareas}
                    onChange={(e) => setFincaForm({ ...fincaForm, hectareas: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Producción
                  </label>
                  <select
                    value={fincaForm.tipoProduccion}
                    onChange={(e) => setFincaForm({ ...fincaForm, tipoProduccion: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {TIPOS_PRODUCCION.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas / Observaciones del Predio
                </label>
                <textarea
                  rows={2}
                  placeholder="Acceso por vía destapada, cuenta con corral techado, planta de ordeño..."
                  value={fincaForm.notas}
                  onChange={(e) => setFincaForm({ ...fincaForm, notas: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/30 flex items-center gap-2 transition disabled:opacity-50"
                >
                  {guardando && <RefreshCw size={16} className="animate-spin" />}
                  {isEditing ? 'Guardar Cambios' : 'Registrar Predio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {fincaAEliminar && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">
              ¿Eliminar predio georreferenciado?
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Estás a punto de eliminar la finca{' '}
              <strong className="text-slate-800">{fincaAEliminar.nombreFinca}</strong> perteneciente
              a <strong className="text-slate-800">{fincaAEliminar.propietarioNombre}</strong> del
              mapa satelital de clientes.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setFincaAEliminar(null)}
                disabled={eliminando}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminarFinca}
                disabled={eliminando}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-md shadow-red-600/30 flex items-center gap-2 transition disabled:opacity-50"
              >
                {eliminando && <RefreshCw size={16} className="animate-spin" />}
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
