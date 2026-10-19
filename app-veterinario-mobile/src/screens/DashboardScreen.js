import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, FlatList, Alert, Modal, RefreshControl, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView, Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config/api';
import { LogOut, Bell, CloudOff, RefreshCw, CheckCircle, Edit3, X, Save, MessageCircle, Share2 } from 'lucide-react-native';

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

  const cargarProcedimientos = async () => {
    setLoading(true);
    try {
      await sincronizarOffline();

      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`${API_URL}/api/registro-genetico`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
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

      const token = await SecureStore.getItemAsync('token');
      let subidos = 0;
      let fallidos = [];

      for (let reg of offlineData) {
        const { _id, isOffline, ...payload } = reg;
        try {
          const res = await fetch(`${API_URL}/api/registro-genetico`, {
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
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('usuario');
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
              const token = await SecureStore.getItemAsync('token');
              const res = await fetch(`${API_URL}/api/registro-genetico/${idProcedimiento}/paso`, {
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
      const token = await SecureStore.getItemAsync('token');
      let sincronizado = false;

      // Si no es un id offline, intentamos guardar en el servidor
      if (!selectedProc.isOffline) {
        try {
          const res = await fetch(`${API_URL}/api/registro-genetico/${selectedProc._id}/prenez`, {
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
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <LogOut color="#ef4444" size={24} />
          </TouchableOpacity>
        </View>
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
  }
});
