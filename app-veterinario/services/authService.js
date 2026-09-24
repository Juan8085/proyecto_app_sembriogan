import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3000/api'; // Cambia por tu IP local si pruebas en dispositivo físico

export const loginVeterinario = async (email, password) => {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.mensaje || 'Credenciales incorrectas');
    }

    // Validar que el usuario sea Veterinario o Admin de campo
    if (data.usuario.rol !== 'Veterinario' && data.usuario.rol !== 'Admin') {
      throw new Error('Acceso denegado: Esta app es exclusiva para personal veterinario.');
    }

    // Guardar token y datos del usuario de forma segura en el dispositivo
    await AsyncStorage.setItem('@token_veterinario', data.token);
    await AsyncStorage.setItem('@usuario_veterinario', JSON.stringify(data.usuario));

    return { success: true, usuario: data.usuario };
  } catch (error) {
    return { success: false, mensaje: error.message };
  }
};

export const obtenerSesionActual = async () => {
  try {
    const token = await AsyncStorage.getItem('@token_veterinario');
    const usuario = await AsyncStorage.getItem('@usuario_veterinario');
    if (token && usuario) {
      return { token, usuario: JSON.parse(usuario) };
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const cerrarSesionVeterinario = async () => {
  try {
    await AsyncStorage.removeItem('@token_veterinario');
    await AsyncStorage.removeItem('@usuario_veterinario');
    return true;
  } catch (error) {
    return false;
  }
};