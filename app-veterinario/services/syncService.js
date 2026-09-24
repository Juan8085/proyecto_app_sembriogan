import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const API_URL = 'http://localhost:3000/api'; // Ajusta la IP si usas emulador o dispositivo físico (ej: 192.168.X.X)

// Registrar procedimiento (IATF / TE) con soporte Offline
export const registrarProcedimientoCampo = async (datosProcedimiento, token) => {
  const netState = await NetInfo.fetch();

  if (netState.isConnected) {
    try {
      // Intento en línea directo al backend
      const res = await fetch(`${API_URL}/registro-genetico`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosProcedimiento)
      });
      const data = await res.json();
      if (data.success) {
        return { success: true, mensaje: "Procedimiento sincronizado con el servidor en tiempo real." };
      } else {
        throw new Error(data.mensaje || "Error en el servidor");
      }
    } catch (error) {
      console.warn("Fallo la red, guardando offline...", error);
      return await guardarLocalmente(datosProcedimiento);
    }
  } else {
    // Sin internet: Guardar en cola offline
    return await guardarLocalmente(datosProcedimiento);
  }
};

// Guardar localmente en AsyncStorage
const guardarLocalmente = async (datos) => {
  try {
    const pendientes = await AsyncStorage.getItem('@cola_registros_pendientes');
    const listaPendientes = pendientes ? JSON.parse(pendientes) : [];
    
    listaPendientes.push({ ...datos, fechaLocal: new Date().toISOString() });
    await AsyncStorage.setItem('@cola_registros_pendientes', JSON.stringify(listaPendientes));

    return { 
      success: true, 
      offline: true, 
      mensaje: "📱 Sin conexión: Registro guardado en el dispositivo. Se sincronizará al tener señal." 
    };
  } catch (err) {
    return { success: false, mensaje: "Error al almacenar localmente: " + err.message };
  }
};

// Sincronizar cola pendiente al recuperar conexión
export const sincronizarDatosPendientes = async (token) => {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return;

  try {
    const pendientes = await AsyncStorage.getItem('@cola_registros_pendientes');
    if (!pendientes) return;

    const listaPendientes = JSON.parse(pendientes);
    if (listaPendientes.length === 0) return;

    console.log(`Sincronizando ${listaPendientes.length} registros pendientes...`);

    const noSincronizados = [];

    for (let item of listaPendientes) {
      try {
        const res = await fetch(`${API_URL}/registro-genetico`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(item)
        });
        const data = await res.json();
        if (!data.success) {
          noSincronizados.push(item);
        }
      } catch (e) {
        noSincronizados.push(item);
      }
    }

    await AsyncStorage.setItem('@cola_registros_pendientes', JSON.stringify(noSincronizados));
    console.log("Sincronización finalizada con éxito.");
  } catch (error) {
    console.error("Error durante la sincronización automática:", error);
  }
};