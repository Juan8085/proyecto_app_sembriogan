import { useState, useEffect } from 'react';

export default function AdminConfiguracion() {
  const [usuario, setUsuario] = useState({ nombre: '', email: '', password: '' });
  const [configuracion, setConfiguracion] = useState({ wompiPublicKey: '', wompiPrivateKey: '', telefonoWhatsapp: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const user = JSON.parse(localStorage.getItem('usuarioSembriogan'));
      
      setUsuario({ nombre: user.nombre, email: user.email, password: '' });

      const resConf = await fetch('http://localhost:3000/api/configuracion', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataConf = await resConf.json();
      if (dataConf.success) {
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
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const user = JSON.parse(localStorage.getItem('usuarioSembriogan'));
      
      const res = await fetch(`http://localhost:3000/api/auth/usuarios/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nombre: usuario.nombre, password: usuario.password })
      });
      const data = await res.json();
      
      if (data.success) {
        alert('Datos de administrador actualizados correctamente');
        user.nombre = usuario.nombre;
        localStorage.setItem('usuarioSembriogan', JSON.stringify(user));
        setUsuario({...usuario, password: ''});
      } else {
        alert('Error al actualizar datos: ' + data.mensaje);
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('tokenSembriogan');
      const res = await fetch(`http://localhost:3000/api/configuracion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(configuracion)
      });
      const data = await res.json();
      
      if (data.success) {
        alert('Configuración de Wompi actualizada correctamente');
      } else {
        alert('Error al actualizar configuración: ' + data.mensaje);
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>👤</span> Datos del Administrador
        </h2>
        <form onSubmit={handleUpdateUsuario} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Nombre</label>
            <input type="text" value={usuario.nombre} onChange={e => setUsuario({...usuario, nombre: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Correo Electrónico (Solo Lectura)</label>
            <input type="email" value={usuario.email} disabled className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl outline-none text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Nueva Contraseña (Dejar en blanco para no cambiar)</label>
            <input type="password" value={usuario.password} onChange={e => setUsuario({...usuario, password: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="••••••••" />
          </div>
          <button type="submit" className="bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-emerald-700 transition">
            Guardar Cambios de Perfil
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span>💳</span> Configuración de Pasarela de Pagos (Wompi)
        </h2>
        <p className="text-sm text-gray-500 mb-6">Actualiza las llaves públicas para que los pagos en la tienda ingresen a tu cuenta oficial.</p>
        
        <form onSubmit={handleUpdateConfig} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Llave Pública (Public Key)</label>
            <input type="text" value={configuracion.wompiPublicKey || ''} onChange={e => setConfiguracion({...configuracion, wompiPublicKey: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-mono text-sm" placeholder="pub_prod_..." required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Llave Privada (Private Key)</label>
            <input type="password" value={configuracion.wompiPrivateKey || ''} onChange={e => setConfiguracion({...configuracion, wompiPrivateKey: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-mono text-sm" placeholder="prv_prod_..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Secreto de Eventos (Webhooks)</label>
            <input type="password" value={configuracion.wompiEventosSecret || ''} onChange={e => setConfiguracion({...configuracion, wompiEventosSecret: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-mono text-sm" placeholder="Opcional para eventos" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Secreto de Integridad (Signature)</label>
            <input type="password" value={configuracion.wompiIntegridadSecret || ''} onChange={e => setConfiguracion({...configuracion, wompiIntegridadSecret: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-mono text-sm" placeholder="Opcional para validación" />
          </div>
          <button type="submit" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition">
            Guardar Llaves Wompi
          </button>
        </form>
      </div>
    </div>
  );
}
