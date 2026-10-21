import { useState, useEffect } from 'react';
import { API_BASE_URL, getApiUrl, getMediaUrl } from '../config/api';
import {
  User,
  Mail,
  KeyRound,
  Lock,
  CreditCard,
  ShieldCheck,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function AdminConfiguracion() {
  const [usuario, setUsuario] = useState({ nombre: '', email: '', password: '' });
  const [configuracion, setConfiguracion] = useState({ 
    wompiPublicKey: '', 
    wompiPrivateKey: '', 
    wompiEventosSecret: '', 
    wompiIntegridadSecret: '',
    telefonoWhatsapp: '' 
  });
  const [loading, setLoading] = useState(true);
  
  // Feedback
  const [msgPerfil, setMsgPerfil] = useState({ type: '', text: '' });
  const [msgWompi, setMsgWompi] = useState({ type: '', text: '' });
  
  // Password / Secret visibilities
  const [showPassword, setShowPassword] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showEventsSecret, setShowEventsSecret] = useState(false);
  const [showIntegritySecret, setShowIntegritySecret] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const user = JSON.parse(localStorage.getItem('usuarioSembriogan') || '{}');
      
      setUsuario({ nombre: user.nombre || '', email: user.email || '', password: '' });

      const resConf = await fetch(`${API_BASE_URL}/api/configuracion`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataConf = await resConf.json();
      if (dataConf.success && dataConf.data) {
        setConfiguracion(dataConf.data);
      }
    } catch (error) {
      console.error("Error cargando configuración:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsuario = async (e) => {
    e.preventDefault();
    setMsgPerfil({ type: '', text: '' });
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const user = JSON.parse(localStorage.getItem('usuarioSembriogan') || '{}');
      
      const res = await fetch(`${API_BASE_URL}/api/auth/usuarios/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre: usuario.nombre, password: usuario.password })
      });
      const data = await res.json();
      
      if (data.success) {
        user.nombre = usuario.nombre;
        localStorage.setItem('usuarioSembriogan', JSON.stringify(user));
        setUsuario({...usuario, password: ''});
        setMsgPerfil({ type: 'success', text: 'Datos de perfil actualizados correctamente.' });
      } else {
        setMsgPerfil({ type: 'error', text: data.mensaje || 'Error al actualizar datos.' });
      }
    } catch (error) {
      setMsgPerfil({ type: 'error', text: 'Error de conexión con el servidor.' });
    }
  };

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    setMsgWompi({ type: '', text: '' });
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const res = await fetch(`${API_BASE_URL}/api/configuracion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(configuracion)
      });
      const data = await res.json();
      
      if (data.success) {
        setMsgWompi({ type: 'success', text: 'Parámetros de Wompi actualizados con éxito en producción.' });
      } else {
        setMsgWompi({ type: 'error', text: data.mensaje || 'Error al actualizar configuración.' });
      }
    } catch (error) {
      setMsgWompi({ type: 'error', text: 'Error de conexión con el servidor.' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Cargando credenciales y configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* SECCIÓN 1: DATOS DEL ADMINISTRADOR */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        
        {/* Encabezado */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-inner">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                Perfil de Seguridad del Administrador
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">Actualiza tu nombre de visualización o regenera tu clave de acceso maestro.</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Sesión Activa
          </span>
        </div>

        <div className="p-6 md:p-8">
          {msgPerfil.text && (
            <div className={`flex items-center gap-2.5 p-4 mb-6 rounded-2xl text-sm ${
              msgPerfil.type === 'success' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}>
              {msgPerfil.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span>{msgPerfil.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateUsuario} className="space-y-5 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nombre Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    value={usuario.nombre} 
                    onChange={e => setUsuario({...usuario, nombre: e.target.value})} 
                    required 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                  />
                </div>
              </div>

              {/* Correo (Lectura) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Correo Electrónico (Principal)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input 
                    type="email" 
                    value={usuario.email} 
                    disabled 
                    className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Nueva Contraseña <span className="text-slate-400 font-normal lowercase">(dejar en blanco para conservar la actual)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={usuario.password} 
                  onChange={e => setUsuario({...usuario, password: e.target.value})} 
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-blue-500/20 transition text-sm"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios de Perfil
            </button>
          </form>
        </div>
      </div>

      {/* SECCIÓN 2: WOMPI & PASARELA DE PAGOS */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        
        {/* Encabezado */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                Pasarela de Pagos (Wompi Bancolombia)
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">Controla las llaves criptográficas para el cobro en línea y la recepción de transferencias PSE/Tarjetas.</p>
            </div>
          </div>
          
          <a
            href="https://comercios.wompi.co"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition self-start md:self-auto"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Portal Wompi
          </a>
        </div>

        <div className="p-6 md:p-8">
          {msgWompi.text && (
            <div className={`flex items-center gap-2.5 p-4 mb-6 rounded-2xl text-sm ${
              msgWompi.type === 'success' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                : 'bg-rose-50 border border-rose-200 text-rose-700'
            }`}>
              {msgWompi.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <span>{msgWompi.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateConfig} className="space-y-5 max-w-2xl">
            
            {/* Public Key */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Llave Pública (Public Key)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  value={configuracion.wompiPublicKey || ''} 
                  onChange={e => setConfiguracion({...configuracion, wompiPublicKey: e.target.value})} 
                  placeholder="pub_prod_... o pub_test_..." 
                  required 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Usada en el Widget público para procesar pagos seguros sin tocar tus servidores.</p>
            </div>

            {/* Private Key */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Llave Privada (Private Key)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type={showPrivateKey ? "text" : "password"} 
                  value={configuracion.wompiPrivateKey || ''} 
                  onChange={e => setConfiguracion({...configuracion, wompiPrivateKey: e.target.value})} 
                  placeholder="prv_prod_... o prv_test_..." 
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Eventos Secret */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Secreto de Eventos (Webhooks Secret)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input 
                  type={showEventsSecret ? "text" : "password"} 
                  value={configuracion.wompiEventosSecret || ''} 
                  onChange={e => setConfiguracion({...configuracion, wompiEventosSecret: e.target.value})} 
                  placeholder="prod_events_... o test_events_..." 
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowEventsSecret(!showEventsSecret)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  {showEventsSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Valida que las notificaciones de pagos aprobados provengan auténticamente de Wompi.</p>
            </div>

            {/* Integridad Secret */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Secreto de Integridad (Integrity Signature)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <input 
                  type={showIntegritySecret ? "text" : "password"} 
                  value={configuracion.wompiIntegridadSecret || ''} 
                  onChange={e => setConfiguracion({...configuracion, wompiIntegridadSecret: e.target.value})} 
                  placeholder="prod_integrity_... o test_integrity_..." 
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowIntegritySecret(!showIntegritySecret)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                >
                  {showIntegritySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-emerald-500/20 transition text-sm"
            >
              <Save className="w-4 h-4" />
              Guardar Llaves de Wompi
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
