import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import { getToken, getUsuario, setSession, clearSession } from '../utils/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, getApiUrl, setCustomApiUrl, initApiUrl } from '../config/api';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  LogOut,
  ShieldCheck,
  Stethoscope,
  Server,
  Globe,
  RotateCcw,
  X,
  CheckCircle2,
  HardDrive
} from 'lucide-react-native';

export default function PerfilScreen({ navigation }) {
  const [usuario, setUsuario] = useState(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Estados de Servidor y Conectividad
  const [servidorActual, setServidorActual] = useState(API_URL);
  const [modalServidorVisible, setModalServidorVisible] = useState(false);
  const [inputUrlServidor, setInputUrlServidor] = useState('');
  const [probandoConexion, setProbandoConexion] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);

  // Cargar información del usuario autenticado
  const cargarDatos = async () => {
    try {
      const url = await initApiUrl();
      setServidorActual(url);

      const u = await getUsuario();
      if (u) {
        setUsuario(u);
        setNombre(u.nombre || '');
        setEmail(u.email || '');
      }

      const offlineRaw = await AsyncStorage.getItem('offlineRegistros');
      if (offlineRaw) {
        const offlineData = JSON.parse(offlineRaw);
        setOfflineCount(offlineData.length);
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Guardar cambios del perfil
  const handleGuardarPerfil = async () => {
    if (!nombre.trim()) {
      Alert.alert('Campo Requerido', 'Por favor ingresa tu nombre completo.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Campo Requerido', 'Por favor ingresa tu correo electrónico.');
      return;
    }

    if (password && password.length < 6) {
      Alert.alert('Seguridad', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password && password !== confirmPassword) {
      Alert.alert('Validación', 'Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setGuardando(true);
    const currentUrl = getApiUrl() || API_URL;
    const token = await getToken();
    const userId = usuario?.id || usuario?._id;

    if (!userId) {
      Alert.alert('Error', 'No se encontró la identidad del usuario actual.');
      setGuardando(false);
      return;
    }

    try {
      const payload = {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase()
      };

      if (password.trim() !== '') {
        payload.password = password.trim();
      }

      const res = await fetch(`${currentUrl}/api/auth/usuarios/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        // Actualizar datos locales
        const nuevoUsuario = {
          ...usuario,
          nombre: nombre.trim(),
          email: email.trim().toLowerCase()
        };
        await setSession(token, nuevoUsuario);
        setUsuario(nuevoUsuario);
        setPassword('');
        setConfirmPassword('');

        Alert.alert(
          '✅ Perfil Actualizado',
          'Tus datos han sido actualizados con éxito en la plataforma Sembriogan.'
        );
      } else {
        Alert.alert('Error', data.mensaje || 'No se pudo actualizar el perfil');
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      Alert.alert(
        'Error de Conexión',
        'No se pudo conectar con el servidor para guardar los cambios. Si estás en campo, conéctate a internet para sincronizar tu perfil.'
      );
    } finally {
      setGuardando(false);
    }
  };

  // Configuración de servidor API
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

  // Cerrar sesión
  const handleCerrarSesion = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir de tu cuenta veterinaria?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Salir',
          style: 'destructive',
          onPress: async () => {
            await clearSession();
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  // Iniciales del veterinario
  const obtenerIniciales = (nombreCompleto) => {
    if (!nombreCompleto) return 'DR';
    return nombreCompleto
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Cargando información del veterinario...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CABECERA / HERO PROFILE CARD */}
        <View style={styles.heroCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{obtenerIniciales(usuario?.nombre)}</Text>
          </View>
          <Text style={styles.heroNombre}>{usuario?.nombre || 'Médico Veterinario'}</Text>
          <Text style={styles.heroEmail}>{usuario?.email || 'veterinario@sembriogan.com'}</Text>
          
          <View style={styles.badgeRol}>
            <Stethoscope size={14} color="#0284c7" />
            <Text style={styles.badgeRolText}>Médico Veterinario • EPSEA</Text>
          </View>
        </View>

        {/* TARJETA 1: DATOS PERSONALES */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <User size={18} color="#0f172a" />
            <Text style={styles.sectionTitle}>Datos del Profesional</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre Completo</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Nombre del veterinario..."
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Correo Electrónico</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="correo@ejemplo.com"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Rol en Plataforma</Text>
            <View style={[styles.inputWrapper, { backgroundColor: '#f1f5f9' }]}>
              <ShieldCheck size={18} color="#059669" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: '#059669', fontWeight: 'bold' }]}
                value={usuario?.rol || 'Veterinario'}
                editable={false}
              />
            </View>
          </View>
        </View>

        {/* TARJETA 2: SEGURIDAD / CAMBIAR CONTRASEÑA */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Lock size={18} color="#0f172a" />
            <Text style={styles.sectionTitle}>Seguridad y Clave de Acceso</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Deja estos campos vacíos si no deseas cambiar tu contraseña actual.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nueva Contraseña (Opcional)</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres..."
                placeholderTextColor="#94a3b8"
                secureTextEntry={!mostrarPassword}
              />
              <TouchableOpacity
                onPress={() => setMostrarPassword(!mostrarPassword)}
                style={styles.eyeBtn}
              >
                {mostrarPassword ? (
                  <EyeOff size={18} color="#64748b" />
                ) : (
                  <Eye size={18} color="#64748b" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {password.trim() !== '' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirmar Nueva Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repite tu nueva contraseña..."
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!mostrarPassword}
                />
              </View>
            </View>
          )}
        </View>

        {/* BOTÓN GUARDAR INFORMACIÓN */}
        <TouchableOpacity
          style={[styles.btnGuardar, guardando && styles.btnDisabled]}
          onPress={handleGuardarPerfil}
          disabled={guardando}
          activeOpacity={0.8}
        >
          {guardando ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Save size={20} color="#ffffff" />
              <Text style={styles.btnGuardarTexto}>Guardar Cambios</Text>
            </>
          )}
        </TouchableOpacity>

        {/* TARJETA 3: SERVIDOR Y CONECTIVIDAD */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Server size={18} color="#0f172a" />
            <Text style={styles.sectionTitle}>Conectividad & Datos Locales</Text>
          </View>

          <View style={styles.servidorInfoRow}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
              <Text style={{ fontSize: 13, color: '#0f172a', fontWeight: '600' }}>
                Servicio Central Sincronizado
              </Text>
            </View>
          </View>

          {offlineCount > 0 && (
            <View style={styles.offlineAlertRow}>
              <HardDrive size={16} color="#d97706" />
              <Text style={styles.offlineAlertText}>
                {offlineCount} registro(s) pendiente(s) por sincronizar en este dispositivo.
              </Text>
            </View>
          )}
        </View>

        {/* ZONA DE CIERRE DE SESIÓN */}
        <TouchableOpacity
          style={styles.btnCerrarSesion}
          onPress={handleCerrarSesion}
          activeOpacity={0.8}
        >
          <LogOut size={20} color="#e11d48" />
          <Text style={styles.btnCerrarSesionTexto}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* PIE INSTITUCIONAL */}
        <View style={styles.footerNote}>
          <Text style={styles.footerText}>Sembriogan • Biotecnología Reproductiva Bovina</Text>
          <Text style={styles.footerSubText}>Desarrollo Tecnológico por JUNEX S.A.S. • Articulación SENA</Text>
        </View>
      </ScrollView>

      {/* MODAL CONFIGURACIÓN SERVIDOR */}
      <Modal
        visible={modalServidorVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalServidorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Server size={22} color="#0284c7" />
                <Text style={styles.modalTitle}>Configurar Servidor</Text>
              </View>
              <TouchableOpacity onPress={() => setModalServidorVisible(false)}>
                <X size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Si estás trabajando fuera de tu red local, ingresa el enlace oficial o el túnel activo de Sembriogan:
            </Text>

            <TextInput
              style={styles.modalInput}
              value={inputUrlServidor}
              onChangeText={setInputUrlServidor}
              placeholder="https://sembriogan-app.loca.lt"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => probarYGuardarServidor(inputUrlServidor)}
              disabled={probandoConexion}
            >
              {probandoConexion ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.saveBtnText}>Probar y Conectar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={restaurarDeteccionAuto}
              disabled={probandoConexion}
            >
              <RotateCcw size={16} color="#475569" style={{ marginRight: 6 }} />
              <Text style={styles.resetBtnText}>Restaurar Detección Automática</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500'
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 45 : 60,
    paddingBottom: 110 // Espacio para que la barra inferior no tape el contenido
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1
  },
  heroNombre: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center'
  },
  heroEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 10
  },
  badgeRol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20
  },
  badgeRolText: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: 'bold'
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  sectionDesc: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14,
    lineHeight: 16
  },
  inputGroup: {
    marginBottom: 14
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48
  },
  inputIcon: {
    marginRight: 10
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a'
  },
  eyeBtn: {
    padding: 6
  },
  btnGuardar: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5
  },
  btnDisabled: {
    opacity: 0.6
  },
  btnGuardarTexto: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold'
  },
  servidorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10
  },
  servidorInfoLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600'
  },
  servidorInfoUrl: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: 'bold',
    marginTop: 2
  },
  btnConfigServidor: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10
  },
  btnConfigServidorTexto: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: 'bold'
  },
  offlineAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 12,
    borderRadius: 12,
    marginTop: 12
  },
  offlineAlertText: {
    fontSize: 11,
    color: '#92400e',
    flex: 1,
    fontWeight: '600'
  },
  btnCerrarSesion: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 16,
    marginBottom: 20
  },
  btnCerrarSesionTexto: {
    color: '#e11d48',
    fontSize: 14,
    fontWeight: 'bold'
  },
  footerNote: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
    gap: 3
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8'
  },
  footerSubText: {
    fontSize: 10,
    color: '#cbd5e1'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  modalDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 16
  },
  saveBtn: {
    backgroundColor: '#0284c7',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14
  },
  resetBtn: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9'
  },
  resetBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13
  }
});
