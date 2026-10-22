import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Modal, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_URL, setCustomApiUrl, getDefaultApiUrl, initApiUrl, getApiUrl } from '../config/api';
import { User, Lock, Globe, RotateCcw, X, CheckCircle2, Server } from 'lucide-react-native';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para configuración de servidor / túnel
  const [servidorActual, setServidorActual] = useState(API_URL);
  const [modalServidorVisible, setModalServidorVisible] = useState(false);
  const [inputUrlServidor, setInputUrlServidor] = useState('');
  const [probandoConexion, setProbandoConexion] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkLogin = async () => {
      const url = await initApiUrl();
      setServidorActual(url);
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        navigation.replace('Dashboard');
      }
    };
    checkLogin();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa todos los campos');
      return;
    }

    setLoading(true);
    const currentUrl = getApiUrl() || API_URL;
    try {
      const res = await fetch(`${currentUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.usuario.rol !== 'Veterinario' && data.usuario.rol !== 'Admin') {
          Alert.alert('Acceso Denegado', 'Esta aplicación móvil es exclusiva para médicos veterinarios.');
          return;
        }
        await SecureStore.setItemAsync('token', data.token);
        await SecureStore.setItemAsync('usuario', JSON.stringify(data.usuario));
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Error', data.mensaje || 'Credenciales incorrectas');
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Error de conexión',
        `No fue posible conectar con el servidor:\n${currentUrl}\n\nSi estás en el SENA o fuera de tu casa, toca "Cambiar Servidor" para colocar el enlace del túnel público.`
      );
    } finally {
      setLoading(false);
    }
  };

  const probarYGuardarServidor = async (urlAProbar) => {
    const urlLimpia = (urlAProbar || '').trim().replace(/\/$/, '');
    if (!urlLimpia) {
      Alert.alert('Error', 'Por favor ingresa una URL válida.');
      return;
    }

    setProbandoConexion(true);
    try {
      const res = await fetch(`${urlLimpia}/api/configuracion`);
      const data = await res.json();
      if (data && data.success !== undefined) {
        const nuevaUrl = await setCustomApiUrl(urlLimpia);
        setServidorActual(nuevaUrl);
        setModalServidorVisible(false);
        Alert.alert('✅ Conexión Exitosa', `Servidor configurado correctamente en:\n${nuevaUrl}`);
      } else {
        Alert.alert('Aviso', 'El servidor respondió pero no es un backend de Sembriogan válido.');
      }
    } catch (e) {
      Alert.alert('Error de Conexión', `No se pudo conectar a "${urlLimpia}". Verifica que el servidor o túnel esté encendido.`);
    } finally {
      setProbandoConexion(false);
    }
  };

  const restaurarDeteccionAuto = async () => {
    const defaultUrl = await setCustomApiUrl(null);
    setServidorActual(defaultUrl);
    setModalServidorVisible(false);
    Alert.alert('🔄 Restaurado', `Se restauró la detección automática de Wi-Fi:\n${defaultUrl}`);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Sembriogan</Text>
          <Text style={styles.subtitle}>Portal Veterinario Móvil</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar Sesión</Text>
          
          <View style={styles.inputContainer}>
            <User color="#64748b" size={20} style={styles.icon} />
            <TextInput 
              style={styles.input} 
              placeholder="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock color="#64748b" size={20} style={styles.icon} />
            <TextInput 
              style={styles.input} 
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Iniciando...' : 'Entrar al Sistema'}</Text>
          </TouchableOpacity>

          {/* Selector interactivo de servidor/túnel */}
          <TouchableOpacity 
            style={styles.serverPill} 
            onPress={() => {
              setInputUrlServidor(servidorActual);
              setModalServidorVisible(true);
            }}
          >
            <Server size={14} color="#0284c7" />
            <Text style={styles.serverPillText} numberOfLines={1}>
              {servidorActual}
            </Text>
            <Text style={styles.serverPillAction}>Cambiar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL CONFIGURACIÓN DE SERVIDOR */}
      <Modal visible={modalServidorVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Globe size={20} color="#0284c7" />
                <Text style={styles.modalTitle}>Configurar Servidor</Text>
              </View>
              <TouchableOpacity onPress={() => setModalServidorVisible(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Si estás en el SENA o en otra red, pega aquí la URL del túnel público (ej: localtunnel o ngrok) o el IP de tu computadora:
            </Text>

            <TextInput 
              style={styles.modalInput} 
              placeholder="https://tu-tunel.loca.lt"
              value={inputUrlServidor}
              onChangeText={setInputUrlServidor}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={() => probarYGuardarServidor(inputUrlServidor)}
              disabled={probandoConexion}
            >
              {probandoConexion ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Guardar y Probar Conexión</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.resetBtn} 
              onPress={restaurarDeteccionAuto}
            >
              <RotateCcw size={16} color="#475569" style={{ marginRight: 6 }} />
              <Text style={styles.resetBtnText}>Restaurar Detección Wi-Fi Automática</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0ea5e9',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#334155',
  },
  button: {
    backgroundColor: '#0ea5e9',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginTop: 20,
    gap: 8,
  },
  serverPillText: {
    flex: 1,
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
  },
  serverPillAction: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: '#0284c7',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  resetBtn: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  resetBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
});
