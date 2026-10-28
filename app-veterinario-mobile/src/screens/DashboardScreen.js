import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, FlatList, Alert, Modal, RefreshControl, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView, Linking } from 'react-native';
import { getToken, clearSession, isTokenExpired } from '../utils/auth';
import * as Location from 'expo-location';
import { API_URL, getApiUrl, setCustomApiUrl, getDefaultApiUrl, initApiUrl } from '../config/api';
import { 
  LogOut, 
  Bell, 
  CloudOff, 
  RefreshCw, 
  CheckCircle, 
  Edit3, 
  X, 
  Save, 
  MessageCircle, 
  Share2, 
  Server, 
  Globe, 
  RotateCcw,
  MapPin,
  Compass,
  Navigation,
  Phone,
  Plus,
  Search
} from 'lucide-react-native';

export default function DashboardScreen({ navigation }) {
  const [procedimientos, setProcedimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAlertasVisible, setModalAlertasVisible] = useState(false);
  const [alertas, setAlertas] = useState([]);
  const [offlineCount, setOfflineCount] = useState(0);

  // Estados para el Modal de Gestión de Ficha
  const [selectedProc, setSelectedProc] = useState(null);
  const [modalGestionVisible, setModalGestionVisible] = useState(false);
  const [nuevoEstadoPrenez, setNuevoEstadoPrenez] = useState('Pendiente Evaluación');
  const [novedadesTexto, setNovedadesTexto] = useState('');
  const [guardandoGestion, setGuardandoGestion] = useState(false);

  // Estados para configuración de servidor
  const [servidorActual, setServidorActual] = useState(API_URL);
  const [modalServidorVisible, setModalServidorVisible] = useState(false);
  const [inputUrlServidor, setInputUrlServidor] = useState('');
  const [probandoConexion, setProbandoConexion] = useState(false);
  const [servidorConectado, setServidorConectado] = useState(true);

  // Estados para Módulo de Fincas y Geolocalización GPS
  const [modalFincasVisible, setModalFincasVisible] = useState(false);
  const [fincas, setFincas] = useState([]);
  const [fincasLoading, setFincasLoading] = useState(false);
  const [busquedaFinca, setBusquedaFinca] = useState('');
  const [modalNuevaFincaVisible, setModalNuevaFincaVisible] = useState(false);
  const [capturandoGpsFinca, setCapturandoGpsFinca] = useState(false);
  const [guardandoFinca, setGuardandoFinca] = useState(false);
  const [nuevaFinca, setNuevaFinca] = useState({
    nombreFinca: '',
    propietarioNombre: '',
    propietarioTelefono: '',
    municipio: 'Neiva',
    vereda: '',
    numeroAnimales: '',
    tipoProduccion: 'Doble Propósito',
    lat: '',
    lng: ''
  });

  // Cargar fincas desde el backend
  const cargarFincas = async () => {
    setFincasLoading(true);
    try {
      const currentUrl = getApiUrl() || API_URL;
      const res = await fetch(`${currentUrl}/api/fincas`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setFincas(data.data);
      }
    } catch (err) {
      console.error('Error cargando fincas:', err);
    } finally {
      setFincasLoading(false);
    }
  };

  // Capturar coordenadas GPS del veterinario en campo
  const capturarGpsFinca = async () => {
    try {
      setCapturandoGpsFinca(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Denegado', 'Se requiere acceso al GPS para capturar la posición de la finca.');
        setCapturandoGpsFinca(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setNuevaFinca(prev => ({
        ...prev,
        lat: loc.coords.latitude.toFixed(6),
        lng: loc.coords.longitude.toFixed(6)
      }));
      Alert.alert('📍 Ubicación Capturada', `Coordenadas satelitales:\nLat: ${loc.coords.latitude.toFixed(5)}\nLng: ${loc.coords.longitude.toFixed(5)}`);
    } catch (err) {
      Alert.alert('Error GPS', 'No se pudo obtener la posición satelital: ' + err.message);
    } finally {
      setCapturandoGpsFinca(false);
    }
  };

  // Guardar nueva finca desde la App del Veterinario
  const guardarNuevaFinca = async () => {
    if (!nuevaFinca.nombreFinca.trim() || !nuevaFinca.propietarioNombre.trim()) {
      Alert.alert('Error', 'El nombre de la finca y del cliente propietario son obligatorios.');
      return;
    }
    if (!nuevaFinca.lat || !nuevaFinca.lng) {
      Alert.alert('Error', 'Debes capturar las coordenadas GPS del predio.');
      return;
    }

    setGuardandoFinca(true);
    try {
      const currentUrl = getApiUrl() || API_URL;
      const res = await fetch(`${currentUrl}/api/fincas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreFinca: nuevaFinca.nombreFinca.trim(),
          propietarioNombre: nuevaFinca.propietarioNombre.trim(),
          propietarioTelefono: nuevaFinca.propietarioTelefono.trim(),
          municipio: nuevaFinca.municipio,
          vereda: nuevaFinca.vereda,
          coordenadas: {
            lat: parseFloat(nuevaFinca.lat),
            lng: parseFloat(nuevaFinca.lng)
          },
          numeroAnimales: Number(nuevaFinca.numeroAnimales) || 0,
          tipoProduccion: nuevaFinca.tipoProduccion || 'Doble Propósito',
          registradoPor: 'Veterinario'
        })
      });

      const data = await res.json();
      if (data.success) {
        Alert.alert('✅ Finca Registrada', 'El predio ha sido georreferenciado en el sistema satelital.');
        setModalNuevaFincaVisible(false);
        setNuevaFinca({
          nombreFinca: '',
          propietarioNombre: '',
          propietarioTelefono: '',
          municipio: 'Neiva',
          vereda: '',
          numeroAnimales: '',
          tipoProduccion: 'Doble Propósito',
          lat: '',
          lng: ''
        });
        cargarFincas();
      } else {
        Alert.alert('Error', data.mensaje || 'No se pudo guardar la finca.');
      }
    } catch (err) {
      Alert.alert('Error de Red', 'Error al sincronizar con el servidor.');
    } finally {
      setGuardandoFinca(false);
    }
  };

  // Abrir ruta satelital en Google Maps / Waze
  const abrirRutaEnMaps = (lat, lng) => {
    if (!lat || !lng) {
      Alert.alert('Aviso', 'Este predio no cuenta con coordenadas satelitales válidas.');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir la app de navegación.');
    });
  };

  useEffect(() => {
    initApiUrl().then(url => {
      setServidorActual(url);
      cargarFincas();
    });
  }, []);

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
        setServidorConectado(true);
        setModalServidorVisible(false);
        Alert.alert('✅ Conexión Exitosa', `Servidor configurado correctamente en:\n${nuevaUrl}`);
        cargarProcedimientos();
      } else {
        Alert.alert('Aviso', 'El servidor respondió pero no es un backend de Sembriogan válido.');
      }
    } catch (e) {
      Alert.alert('Error de Conexión', `No se pudo conectar a "${urlLimpia}". Verifica que el túnel o servidor esté encendido.`);
    } finally {
      setProbandoConexion(false);
    }
  };

  const restaurarDeteccionAuto = async () => {
    const defaultUrl = await setCustomApiUrl(null);
    setServidorActual(defaultUrl);
    setModalServidorVisible(false);
    Alert.alert('🔄 Restaurado', `Se restauró la detección automática de Wi-Fi:\n${defaultUrl}`);
    cargarProcedimientos();
  };

  const cargarProcedimientos = async () => {
    setLoading(true);
    try {
      await sincronizarOffline();

      const currentUrl = getApiUrl() || API_URL;
      const token = await getToken();
      const res = await fetch(`${currentUrl}/api/registro-genetico`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) {
        setServidorConectado(true);
        // Guardar copia local de caché para disponibilidad offline
        await AsyncStorage.setItem('cacheProcedimientos', JSON.stringify(data.data));

        const offlineRaw = await AsyncStorage.getItem('offlineRegistros');
        const offlineData = offlineRaw ? JSON.parse(offlineRaw) : [];
        setOfflineCount(offlineData.length);
        
        const mergedData = [...offlineData, ...data.data];
        setProcedimientos(mergedData);
        calcularAlertas(mergedData);
      }
    } catch (error) {
      setServidorConectado(false);
      console.error('Modo Offline: Cargando caché local y pendientes');
      const cacheRaw = await AsyncStorage.getItem('cacheProcedimientos');
      const cacheData = cacheRaw ? JSON.parse(cacheRaw) : [];
      const offlineRaw = await AsyncStorage.getItem('offlineRegistros');
      const offlineData = offlineRaw ? JSON.parse(offlineRaw) : [];
      
      setOfflineCount(offlineData.length);
      const combined = [...offlineData, ...cacheData];
      setProcedimientos(combined);
      calcularAlertas(combined);
      Alert.alert('Modo Offline 📡', `Mostrando ${combined.length} registros guardados en la memoria de tu celular.`);
    } finally {
      setLoading(false);
    }
  };

  const sincronizarOffline = async () => {
    try {
      const offlineRaw = await AsyncStorage.getItem('offlineRegistros');
      if (!offlineRaw) return;
      const offlineData = JSON.parse(offlineRaw);
      
      if (offlineData.length === 0) return;

      const token = await getToken();
      if (!token || isTokenExpired(token)) {
        console.log('⚠️ [Dashboard] Sesión vencida para sincronización offline.');
        return;
      }
      let subidos = 0;
      let fallidos = [];

      const currentUrl = getApiUrl() || API_URL;
      for (let reg of offlineData) {
        const { _id, isOffline, ...payload } = reg;
        try {
          const res = await fetch(`${currentUrl}/api/registro-genetico`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.success) {
            subidos++;
          } else {
            fallidos.push(reg);
          }
        } catch (e) {
          fallidos.push(reg);
        }
      }

      await AsyncStorage.setItem('offlineRegistros', JSON.stringify(fallidos));
      setOfflineCount(fallidos.length);
      
      if (subidos > 0) {
        Alert.alert('Sincronización Exitosa', `Se subieron ${subidos} registros a la nube.`);
      }
    } catch (error) {
      console.error('Error sincronizando', error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      cargarProcedimientos();
    });
    return unsubscribe;
  }, [navigation]);

  const handleLogout = async () => {
    await clearSession();
    navigation.replace('Login');
  };

  const calcularAlertas = (procs) => {
    const alertasGeneradas = [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const sumarDias = (fecha, dias) => {
      const nueva = new Date(fecha);
      nueva.setDate(nueva.getDate() + dias);
      return nueva;
    };

    procs.forEach(proc => {
      if (proc.estadoPrenez === 'Preñada' || proc.estadoPrenez === 'Vacía') return;

      let pasoActual = null;
      let endpointPaso = null;

      const dia0 = new Date(proc.fechasProtocolo?.dia0_sincronizacion || proc.createdAt);
      dia0.setHours(0, 0, 0, 0);
      const comp = proc.pasosCompletados || {};

      if (proc.tipoProcedimiento === 'IATF') {
        if (!comp.dia8_retiro) {
          pasoActual = { nombre: 'Retiro Dispositivo (Día 8)', fecha: sumarDias(dia0, 8) };
          endpointPaso = 'dia8_retiro';
        } else if (!comp.dia10_inseminacion) {
          pasoActual = { nombre: 'Inseminación (Día 10)', fecha: sumarDias(dia0, 10) };
          endpointPaso = 'dia10_inseminacion';
        } else if (!comp.dia45_confirmacion) {
          pasoActual = { nombre: 'Conf. Preñez (Día 45)', fecha: sumarDias(dia0, 45) };
          endpointPaso = 'dia45_confirmacion';
        }
      } else if (proc.tipoProcedimiento === 'IA') {
        // IA en celo natural: solo confirmación de preñez
        if (!comp.dia45_confirmacion) {
          pasoActual = { nombre: 'Conf. Preñez (Día 45)', fecha: sumarDias(dia0, 45) };
          endpointPaso = 'dia45_confirmacion';
        }
      } else if (proc.tipoProcedimiento === 'TE') {
        if (!comp.dia8_retiro) {
          pasoActual = { nombre: 'Retiro Dispositivo (Día 8)', fecha: sumarDias(dia0, 8) };
          endpointPaso = 'dia8_retiro';
        } else if (!comp.dia17_transferencia) {
          pasoActual = { nombre: 'Transferencia (Día 17)', fecha: sumarDias(dia0, 17) };
          endpointPaso = 'dia17_transferencia';
        } else if (!comp.dia45_confirmacion) {
          pasoActual = { nombre: 'Conf. Preñez (Día 45)', fecha: sumarDias(dia0, 45) };
          endpointPaso = 'dia45_confirmacion';
        }
      } else if (proc.tipoProcedimiento === 'Diagnostico') {
        if (!comp.dia45_confirmacion) {
          pasoActual = { nombre: 'Conf. Preñez (Día 45)', fecha: sumarDias(dia0, 45) };
          endpointPaso = 'dia45_confirmacion';
        }
      }

      if (pasoActual) {
        const diasFaltantes = Math.ceil((pasoActual.fecha - hoy) / (1000 * 60 * 60 * 24));
        if (diasFaltantes <= 0) {
          alertasGeneradas.push({
            ...proc,
            pasoNombre: pasoActual.nombre,
            endpointPaso,
            retrasado: diasFaltantes < 0
          });
        }
      }
    });

    setAlertas(alertasGeneradas);
  };

  const confirmarPaso = async (idProcedimiento, nombrePasoBD) => {
    const proc = procedimientos.find(p => p._id === idProcedimiento);
    if (nombrePasoBD === 'dia45_confirmacion' && proc) {
      handleAbrirGestion(proc);
      return;
    }

    Alert.alert(
      'Confirmar Procedimiento',
      '¿Estás seguro de marcar este paso como completado?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, Completar', 
          onPress: async () => {
            try {
              const currentUrl = getApiUrl() || API_URL;
              const token = await getToken();
              const res = await fetch(`${currentUrl}/api/registro-genetico/${idProcedimiento}/paso`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ paso: nombrePasoBD })
              });
              const data = await res.json();
              if (data.success) {
                Alert.alert('Éxito', 'Paso marcado como completado.');
                cargarProcedimientos();
              } else {
                Alert.alert('Error', data.mensaje);
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo actualizar el progreso.');
            }
          }
        }
      ]
    );
  };

  // Abrir Modal de Gestión al tocar una ficha
  const handleAbrirGestion = (item) => {
    setSelectedProc(item);
    setNuevoEstadoPrenez(item.estadoPrenez || 'Pendiente Evaluación');
    setNovedadesTexto(item.observaciones || '');
    setModalGestionVisible(true);
  };

  // Guardar Diagnóstico y Novedades en Servidor o Localmente
  const handleGuardarGestion = async () => {
    if (!selectedProc) return;
    setGuardandoGestion(true);

    try {
      const token = await getToken();
      let sincronizado = false;

      // Si no es un id offline, intentamos guardar en el servidor
      if (!selectedProc.isOffline) {
        try {
          const currentUrl = getApiUrl() || API_URL;
          const res = await fetch(`${currentUrl}/api/registro-genetico/${selectedProc._id}/prenez`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              estadoPrenez: nuevoEstadoPrenez,
              observaciones: novedadesTexto
            })
          });
          const data = await res.json();
          if (data.success) {
            sincronizado = true;
          }
        } catch (netErr) {
          console.log('Error de red al actualizar preñez, guardando localmente:', netErr);
        }
      }

      // Actualizar estado en memoria
      const actualizarItem = (p) => p._id === selectedProc._id 
        ? { ...p, estadoPrenez: nuevoEstadoPrenez, observaciones: novedadesTexto } 
        : p;

      setProcedimientos(prev => prev.map(actualizarItem));

      // Actualizar en caché local
      const cacheRaw = await AsyncStorage.getItem('cacheProcedimientos');
      if (cacheRaw) {
        const cacheData = JSON.parse(cacheRaw).map(actualizarItem);
        await AsyncStorage.setItem('cacheProcedimientos', JSON.stringify(cacheData));
      }

      if (sincronizado) {
        Alert.alert('Actualizado ✅', 'Diagnóstico y novedades guardadas en el servidor y panel administrativo.');
      } else {
        Alert.alert('Guardado Offline 📡', 'Diagnóstico guardado en la memoria del celular. Se sincronizará con el servidor al reconectar.');
      }

      setModalGestionVisible(false);
      cargarProcedimientos();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo guardar la gestión del procedimiento.');
    } finally {
      setGuardandoGestion(false);
    }
  };

  // Función para compartir Reporte Clínico Oficial por WhatsApp con el Ganadero
  const compartirReporteWhatsApp = (proc) => {
    if (!proc) return;

    const arete = proc.arete || proc.animalId || 'Sin Chapeta';
    const finca = proc.finca || 'No especificada';
    const productor = proc.productor || 'Ganadero';
    const procedimiento = proc.tipoProcedimiento || 'Reproducción';
    const raza = proc.raza || 'Bovino';
    const genetica = proc.geneticaUtilizada || proc.pajillaId || 'Convencional';
    const prenez = proc.estadoPrenez || 'Pendiente Evaluación';
    const vet = proc.veterinarioAsignado || 'Equipo Veterinario Sembriogan';
    const dia0 = proc.fechasProtocolo?.dia0_sincronizacion || proc.createdAt;
    const dia0Str = dia0 ? new Date(dia0).toLocaleDateString('es-CO') : 'N/A';
    const observaciones = proc.observaciones ? `\n📝 *Novedades / Observaciones:* ${proc.observaciones}` : '';

    const mensaje = 
`📋 *REPORTE CLÍNICO REPRODUCTIVO - SEMBRIOGAN*
----------------------------------------
🐮 *Animal / Chapeta:* ${arete}
🏡 *Finca:* ${finca}
👤 *Productor:* ${productor}
🧬 *Procedimiento:* ${procedimiento} (${raza})
💉 *Genética / Pajilla:* ${genetica}
📅 *Fecha Inicio (Día 0):* ${dia0Str}
🩺 *Diagnóstico Actual:* ${prenez}${observaciones}
👨‍⚕️ *Veterinario Asignado:* ${vet}
----------------------------------------
_Generado desde la App Veterinaria Sembriogan (Somos EPSEA)._`;

    const encoded = encodeURIComponent(mensaje);
    const url = `whatsapp://send?text=${encoded}`;
    const webUrl = `https://wa.me/?text=${encoded}`;

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(webUrl).catch(() => {
          Alert.alert('Aviso', 'No se pudo abrir la aplicación de WhatsApp.');
        });
      }
    }).catch(() => {
      Linking.openURL(webUrl);
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleAbrirGestion(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.arete}>
          {item.arete || item.animalId} {item.isOffline && '📡'}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.tipoProcedimiento}</Text>
        </View>
      </View>
      <Text style={styles.detail}>Finca: {item.finca ? `${item.finca} (${item.productor})` : item.productor}</Text>
      <Text style={styles.detail}>Día 0: {new Date(item.fechasProtocolo?.dia0_sincronizacion || item.createdAt).toLocaleDateString()}</Text>
      {item.observaciones ? <Text style={styles.obsPreview} numberOfLines={2}>📝 {item.observaciones}</Text> : null}
      
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <View style={[
            styles.statusBadge, 
            item.estadoPrenez === 'Preñada' ? styles.statusSuccess : (item.estadoPrenez === 'Vacía' ? styles.statusDanger : styles.statusWarning)
          ]}>
            <Text style={[
              styles.statusText,
              item.estadoPrenez === 'Preñada' ? styles.statusSuccessText : (item.estadoPrenez === 'Vacía' ? styles.statusDangerText : styles.statusWarningText)
            ]}>{item.estadoPrenez}</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TouchableOpacity 
              style={styles.btnWhatsappCard}
              onPress={(e) => {
                compartirReporteWhatsApp(item);
              }}
            >
              <MessageCircle color="#16a34a" size={15} />
              <Text style={styles.btnWhatsappCardText}>WhatsApp</Text>
            </TouchableOpacity>

            <View style={styles.touchAction}>
              <Edit3 color="#0ea5e9" size={15} />
              <Text style={styles.touchActionText}>Ficha</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Procedimientos</Text>
        <View style={styles.headerIcons}>
          {offlineCount > 0 && (
            <TouchableOpacity style={styles.iconButton} onPress={cargarProcedimientos}>
              <CloudOff color="#f59e0b" size={24} />
              <View style={[styles.badgeNotif, { backgroundColor: '#f59e0b' }]}>
                <Text style={styles.badgeNotifText}>{offlineCount}</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconButton} onPress={() => setModalAlertasVisible(true)}>
            <Bell color="#0ea5e9" size={24} />
            {alertas.length > 0 && (
              <View style={styles.badgeNotif}>
                <Text style={styles.badgeNotifText}>{alertas.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => {
              setInputUrlServidor(servidorActual);
              setModalServidorVisible(true);
            }}
          >
            <Server color="#0284c7" size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <LogOut color="#ef4444" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra de Estado del Servidor */}
      <View style={styles.serverBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
          <View style={[styles.dotStatus, { backgroundColor: servidorConectado ? '#22c55e' : '#f59e0b' }]} />
          <Text style={styles.serverBarText} numberOfLines={1}>
            Servidor: <Text style={{ fontWeight: 'bold' }}>{servidorActual}</Text>
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.serverBarAction}
          onPress={() => {
            setInputUrlServidor(servidorActual);
            setModalServidorVisible(true);
          }}
        >
          <Globe size={14} color="#0284c7" />
          <Text style={styles.serverBarActionText}>Cambiar</Text>
        </TouchableOpacity>
      </View>

      {/* ACCESO AL DIRECTORIO DE FINCAS Y MAPA GPS */}
      <View style={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 }}>
        <TouchableOpacity 
          style={styles.fincasGpsBanner}
          onPress={() => {
            cargarFincas();
            setModalFincasVisible(true);
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
            <View style={styles.fincasGpsIcon}>
              <MapPin color="#ffffff" size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fincasGpsTitle}>Directorio de Fincas (GPS)</Text>
              <Text style={styles.fincasGpsSubtitle}>Predios georreferenciados y rutas Waze / Maps</Text>
            </View>
          </View>
          <View style={styles.fincasGpsBadge}>
            <Text style={styles.fincasGpsBadgeText}>{fincas.length} Predios</Text>
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={procedimientos}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={cargarProcedimientos} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay procedimientos registrados.</Text>
        }
      />

      {/* Modal de Alertas del Día */}
      <Modal visible={modalAlertasVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alertas del Día</Text>
              <TouchableOpacity onPress={() => setModalAlertasVisible(false)}>
                <Text style={styles.modalClose}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={alertas}
              keyExtractor={(item) => item._id}
              ListEmptyComponent={<Text style={styles.emptyText}>No tienes tareas pendientes para hoy.</Text>}
              renderItem={({ item }) => (
                <View style={styles.alertCard}>
                  <View>
                    <Text style={styles.alertArete}>Chapeta: {item.arete || item.animalId}</Text>
                    <Text style={styles.alertFinca}>{item.finca || item.productor}</Text>
                    <Text style={[styles.alertTask, item.retrasado && styles.alertTaskLate]}>
                      {item.pasoNombre} {item.retrasado ? '(RETRASADO)' : ''}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.confirmButton}
                    onPress={() => confirmarPaso(item._id, item.endpointPaso)}
                  >
                    <CheckCircle color="#fff" size={20} />
                    <Text style={styles.confirmText}>Completar</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Modal Interactivo de Gestión de Ficha */}
      <Modal visible={modalGestionVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Ficha: {selectedProc?.arete || selectedProc?.animalId}</Text>
                <Text style={styles.modalSubTitle}>
                  {selectedProc?.finca ? `${selectedProc?.finca} - ` : ''}{selectedProc?.productor} ({selectedProc?.tipoProcedimiento})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalGestionVisible(false)}>
                <X color="#ef4444" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Diagnóstico de Gestación */}
              <Text style={styles.modalSectionLabel}>Diagnóstico de Gestación</Text>
              <View style={styles.diagGroup}>
                <TouchableOpacity 
                  style={[styles.diagBtn, nuevoEstadoPrenez === 'Preñada' && styles.diagBtnPreñadaActive]}
                  onPress={() => setNuevoEstadoPrenez('Preñada')}
                >
                  <Text style={[styles.diagBtnText, nuevoEstadoPrenez === 'Preñada' && styles.diagBtnTextActive]}>
                    🐄 Preñada
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.diagBtn, nuevoEstadoPrenez === 'Vacía' && styles.diagBtnVaciaActive]}
                  onPress={() => setNuevoEstadoPrenez('Vacía')}
                >
                  <Text style={[styles.diagBtnText, nuevoEstadoPrenez === 'Vacía' && styles.diagBtnTextActive]}>
                    ❌ Vacía
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.diagBtn, nuevoEstadoPrenez === 'Pendiente Evaluación' && styles.diagBtnPendienteActive]}
                  onPress={() => setNuevoEstadoPrenez('Pendiente Evaluación')}
                >
                  <Text style={[styles.diagBtnText, nuevoEstadoPrenez === 'Pendiente Evaluación' && styles.diagBtnTextActive]}>
                    ⏳ Pendiente
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Novedades y Observaciones Clínicas */}
              <Text style={styles.modalSectionLabel}>Novedades Clínicas / Observaciones de Campo</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="Ej: Se cayó el dispositivo intravaginal al día 4 / Celo visible temprano / Vaca en buena condición corporal..."
                placeholderTextColor="#94a3b8"
                value={novedadesTexto}
                onChangeText={setNovedadesTexto}
              />

              {/* Botón Guardar */}
              <TouchableOpacity 
                style={styles.saveActionBtn} 
                onPress={handleGuardarGestion}
                disabled={guardandoGestion}
              >
                {guardandoGestion ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Save color="#fff" size={20} style={{ marginRight: 8 }} />
                    <Text style={styles.saveActionText}>Guardar Diagnóstico y Novedad</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Botón Compartir Reporte por WhatsApp */}
              <TouchableOpacity 
                style={styles.whatsappActionBtn} 
                onPress={() => compartirReporteWhatsApp({
                  ...selectedProc,
                  estadoPrenez: nuevoEstadoPrenez,
                  observaciones: novedadesTexto
                })}
              >
                <MessageCircle color="#fff" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.whatsappActionText}>📲 Compartir Reporte Clínico WhatsApp</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de Configuración de Servidor */}
      <Modal visible={modalServidorVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Server color="#0284c7" size={22} />
                <Text style={styles.modalTitle}>Conexión con el Servidor</Text>
              </View>
              <TouchableOpacity onPress={() => setModalServidorVisible(false)}>
                <X color="#64748b" size={22} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Si estás en el SENA, fuera de tu casa o en otra red, ingresa la dirección HTTPS del túnel de compartir (o la IP de tu PC):
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="https://ejemplo.loca.lt o http://192.168.1.X:3000"
              placeholderTextColor="#94a3b8"
              value={inputUrlServidor}
              onChangeText={setInputUrlServidor}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity 
              style={[styles.saveBtn, probandoConexion && { opacity: 0.7 }]}
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
              disabled={probandoConexion}
            >
              <RotateCcw size={16} color="#475569" style={{ marginRight: 6 }} />
              <Text style={styles.resetBtnText}>Restaurar Detección Automática</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: DIRECTORIO DE FINCAS GEORREFERENCIADAS */}
      <Modal visible={modalFincasVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '92%', height: '92%' }]}>
            {/* Header del Modal */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[styles.fincasGpsIcon, { width: 36, height: 36 }]}>
                  <MapPin color="#fff" size={20} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Directorio de Fincas</Text>
                  <Text style={styles.modalSubTitle}>Geolocalización satelital y rutas GPS</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setModalFincasVisible(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            {/* Buscador y Botón Crear */}
            <View style={{ marginBottom: 12, gap: 8 }}>
              <View style={styles.searchBoxFinca}>
                <Search size={18} color="#94a3b8" />
                <TextInput
                  style={styles.searchInputFinca}
                  placeholder="Buscar finca, productor o municipio..."
                  placeholderTextColor="#94a3b8"
                  value={busquedaFinca}
                  onChangeText={setBusquedaFinca}
                />
                {busquedaFinca ? (
                  <TouchableOpacity onPress={() => setBusquedaFinca('')}>
                    <X size={16} color="#94a3b8" />
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.btnCrearFincaMobile}
                onPress={() => {
                  capturarGpsFinca();
                  setModalNuevaFincaVisible(true);
                }}
              >
                <Plus color="#ffffff" size={18} />
                <Text style={styles.btnCrearFincaMobileText}>+ Georreferenciar Finca en Campo</Text>
              </TouchableOpacity>
            </View>

            {/* Listado de Fincas */}
            <FlatList
              data={fincas.filter(f => {
                if (!busquedaFinca.trim()) return true;
                const q = busquedaFinca.toLowerCase();
                return (
                  f.nombreFinca?.toLowerCase().includes(q) ||
                  f.propietarioNombre?.toLowerCase().includes(q) ||
                  f.municipio?.toLowerCase().includes(q) ||
                  f.vereda?.toLowerCase().includes(q)
                );
              })}
              keyExtractor={(item) => item._id}
              refreshControl={<RefreshControl refreshing={fincasLoading} onRefresh={cargarFincas} />}
              ListEmptyComponent={
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <MapPin size={36} color="#cbd5e1" />
                  <Text style={{ fontWeight: 'bold', color: '#64748b', marginTop: 8 }}>No se encontraron predios</Text>
                  <Text style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
                    Usa el botón superior para capturar las coordenadas de una finca con el GPS del celular.
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.fincaCardMobile}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.fincaCardNombre}>🏡 {item.nombreFinca}</Text>
                      <Text style={styles.fincaCardPropietario}>👤 {item.propietarioNombre}</Text>
                      <Text style={styles.fincaCardUbicacion}>
                        📍 {item.municipio} {item.vereda ? `• ${item.vereda}` : ''}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <View style={{ backgroundColor: '#e0f2fe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: '#bae6fd' }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0369a1' }}>
                          🐄 {item.tipoProduccion || 'Doble Propósito'}
                        </Text>
                      </View>
                      <View style={styles.fincaCardBadgeAnimales}>
                        <Text style={styles.fincaCardBadgeAnimalesText}>{item.numeroAnimales || 0} reses</Text>
                      </View>
                    </View>
                  </View>

                  {/* Coordenadas GPS */}
                  <View style={styles.fincaCoordsBox}>
                    <Text style={styles.fincaCoordsText}>
                      🌐 GPS: {item.coordenadas?.lat?.toFixed(5)}, {item.coordenadas?.lng?.toFixed(5)}
                    </Text>
                  </View>

                  {/* Acciones de la finca */}
                  <View style={styles.fincaCardAcciones}>
                    <TouchableOpacity
                      style={styles.fincaBtnNavegar}
                      onPress={() => abrirRutaEnMaps(item.coordenadas?.lat, item.coordenadas?.lng)}
                    >
                      <Navigation size={15} color="#ffffff" />
                      <Text style={styles.fincaBtnNavegarText}>Cómo llegar (GPS)</Text>
                    </TouchableOpacity>

                    {item.propietarioTelefono ? (
                      <TouchableOpacity
                        style={styles.fincaBtnWhatsApp}
                        onPress={() => {
                          const cleanTel = item.propietarioTelefono.replace(/\D/g, '');
                          const url = `whatsapp://send?phone=57${cleanTel}&text=${encodeURIComponent(`Hola ${item.propietarioNombre}, te saluda el equipo veterinario de Sembriogan.`)}`;
                          Linking.openURL(url).catch(() => {
                            Linking.openURL(`https://wa.me/57${cleanTel}`);
                          });
                        }}
                      >
                        <MessageCircle size={15} color="#16a34a" />
                        <Text style={styles.fincaBtnWhatsAppText}>WhatsApp</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL: GEORREFERENCIAR NUEVA FINCA DESDE LA APP */}
      <Modal visible={modalNuevaFincaVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MapPin color="#10b981" size={22} />
                <Text style={styles.modalTitle}>Georreferenciar Predio</Text>
              </View>
              <TouchableOpacity onPress={() => setModalNuevaFincaVisible(false)}>
                <X color="#64748b" size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.labelFormFinca}>Nombre de la Finca *</Text>
              <TextInput
                style={styles.inputFormFinca}
                placeholder="Ej. Hacienda El Progreso"
                value={nuevaFinca.nombreFinca}
                onChangeText={(v) => setNuevaFinca({ ...nuevaFinca, nombreFinca: v })}
              />

              <Text style={styles.labelFormFinca}>Nombre del Cliente / Productor *</Text>
              <TextInput
                style={styles.inputFormFinca}
                placeholder="Ej. Pedro Gómez"
                value={nuevaFinca.propietarioNombre}
                onChangeText={(v) => setNuevaFinca({ ...nuevaFinca, propietarioNombre: v })}
              />

              <Text style={styles.labelFormFinca}>Teléfono / WhatsApp de Contacto</Text>
              <TextInput
                style={styles.inputFormFinca}
                placeholder="Ej. 3123456789"
                keyboardType="phone-pad"
                value={nuevaFinca.propietarioTelefono}
                onChangeText={(v) => setNuevaFinca({ ...nuevaFinca, propietarioTelefono: v })}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.labelFormFinca}>Municipio</Text>
                  <TextInput
                    style={styles.inputFormFinca}
                    placeholder="Ej. Neiva"
                    value={nuevaFinca.municipio}
                    onChangeText={(v) => setNuevaFinca({ ...nuevaFinca, municipio: v })}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.labelFormFinca}>Vereda</Text>
                  <TextInput
                    style={styles.inputFormFinca}
                    placeholder="Ej. El Caguán"
                    value={nuevaFinca.vereda}
                    onChangeText={(v) => setNuevaFinca({ ...nuevaFinca, vereda: v })}
                  />
                </View>
              </View>

              <Text style={styles.labelFormFinca}>Número de Animales / Cabezas</Text>
              <TextInput
                style={styles.inputFormFinca}
                placeholder="Ej. 120"
                keyboardType="numeric"
                value={nuevaFinca.numeroAnimales}
                onChangeText={(v) => setNuevaFinca({ ...nuevaFinca, numeroAnimales: v })}
              />

              <Text style={styles.labelFormFinca}>Tipo de Producción Ganadera</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {['Doble Propósito', 'Leche', 'Carne', 'Genética/Biotecnología', 'Cría y Levante', 'Otro'].map((tipo) => {
                  const activo = (nuevaFinca.tipoProduccion || 'Doble Propósito') === tipo;
                  return (
                    <TouchableOpacity
                      key={tipo}
                      onPress={() => setNuevaFinca({ ...nuevaFinca, tipoProduccion: tipo })}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 12,
                        backgroundColor: activo ? '#047857' : '#f8fafc',
                        borderWidth: 1,
                        borderColor: activo ? '#047857' : '#cbd5e1'
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: activo ? '#ffffff' : '#334155' }}>
                        {tipo}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Botón de Captura Satelital GPS */}
              <View style={styles.boxGpsCapturaForm}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#0f172a' }}>Coordenadas Satelitales GPS</Text>
                  <TouchableOpacity
                    style={styles.btnCapturaGpsAccion}
                    onPress={capturarGpsFinca}
                    disabled={capturandoGpsFinca}
                  >
                    <Compass size={14} color="#047857" />
                    <Text style={styles.btnCapturaGpsAccionText}>
                      {capturandoGpsFinca ? 'Detectando...' : 'Actualizar GPS'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Latitud</Text>
                    <TextInput
                      style={styles.inputCoordsMini}
                      placeholder="Latitud"
                      keyboardType="numeric"
                      value={nuevaFinca.lat ? String(nuevaFinca.lat) : ''}
                      onChangeText={(v) => setNuevaFinca({ ...nuevaFinca, lat: v })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>Longitud</Text>
                    <TextInput
                      style={styles.inputCoordsMini}
                      placeholder="Longitud"
                      keyboardType="numeric"
                      value={nuevaFinca.lng ? String(nuevaFinca.lng) : ''}
                      onChangeText={(v) => setNuevaFinca({ ...nuevaFinca, lng: v })}
                    />
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.btnGuardarFincaMobile, guardandoFinca && { opacity: 0.6 }]}
                onPress={guardarNuevaFinca}
                disabled={guardandoFinca}
              >
                {guardandoFinca ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Save color="#fff" size={18} style={{ marginRight: 6 }} />
                    <Text style={styles.btnGuardarFincaMobileText}>Guardar Predio en Mapa</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
    marginLeft: 10,
    position: 'relative',
  },
  badgeNotif: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeNotifText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  arete: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  badge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: 'bold',
  },
  detail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  obsPreview: {
    fontSize: 13,
    color: '#475569',
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusSuccess: {
    backgroundColor: '#dcfce7',
  },
  statusDanger: {
    backgroundColor: '#fee2e2',
  },
  statusWarning: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusSuccessText: {
    color: '#15803d',
  },
  statusDangerText: {
    color: '#b91c1c',
  },
  statusWarningText: {
    color: '#b45309',
  },
  touchAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  touchActionText: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 40,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalSubTitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  modalClose: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalSectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 10,
    marginTop: 10,
  },
  diagGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  diagBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  diagBtnPreñadaActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  diagBtnVaciaActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  diagBtnPendienteActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  diagBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  diagBtnTextActive: {
    color: '#0f172a',
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
    textAlignVertical: 'top',
    minHeight: 90,
    marginBottom: 20,
  },
  saveActionBtn: {
    flexDirection: 'row',
    backgroundColor: '#0ea5e9',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  whatsappActionBtn: {
    flexDirection: 'row',
    backgroundColor: '#16a34a',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  whatsappActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  btnWhatsappCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  btnWhatsappCardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  alertCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  alertArete: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1e293b',
  },
  alertFinca: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 4,
  },
  alertTask: {
    color: '#f59e0b',
    fontWeight: 'bold',
  },
  alertTaskLate: {
    color: '#ef4444',
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  confirmText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  serverBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  serverBarText: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
  },
  dotStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  serverBarAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  serverBarActionText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0284c7',
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
  // Estilos de Geolocalización de Fincas GPS
  fincasGpsBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  fincasGpsIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fincasGpsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  fincasGpsSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  fincasGpsBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  fincasGpsBadgeText: {
    color: '#047857',
    fontWeight: '800',
    fontSize: 11,
  },
  searchBoxFinca: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 44,
  },
  searchInputFinca: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  btnCrearFincaMobile: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  btnCrearFincaMobileText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  fincaCardMobile: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  fincaCardNombre: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  fincaCardPropietario: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  fincaCardUbicacion: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  fincaCardBadgeAnimales: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  fincaCardBadgeAnimalesText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16a34a',
  },
  fincaCoordsBox: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fincaCoordsText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#047857',
    fontWeight: '600',
  },
  fincaCardAcciones: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  fincaBtnNavegar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingVertical: 8,
    borderRadius: 10,
  },
  fincaBtnNavegarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fincaBtnWhatsApp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  fincaBtnWhatsAppText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  labelFormFinca: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 8,
    marginBottom: 4,
  },
  inputFormFinca: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0f172a',
  },
  boxGpsCapturaForm: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  btnCapturaGpsAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#6ee7b7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  btnCapturaGpsAccionText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: 'bold',
  },
  inputCoordsMini: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#0f172a',
  },
  btnGuardarFincaMobile: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 40,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  btnGuardarFincaMobileText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  }
});
