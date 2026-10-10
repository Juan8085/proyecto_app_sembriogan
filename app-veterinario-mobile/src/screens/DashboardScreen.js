import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, Modal, RefreshControl } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config/api';
import { LogOut, Bell, CloudOff, RefreshCw , CheckCircle } from 'lucide-react-native';

export default function DashboardScreen({ navigation }) {
  const [procedimientos, setProcedimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalAlertasVisible, setModalAlertasVisible] = useState(false);
  const [alertas, setAlertas] = useState([]);

  const [offlineCount, setOfflineCount] = useState(0);

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
        const offlineRaw = await AsyncStorage.getItem('offlineRegistros');
        const offlineData = offlineRaw ? JSON.parse(offlineRaw) : [];
        setOfflineCount(offlineData.length);
        
        const mergedData = [...offlineData, ...data.data];
        setProcedimientos(mergedData);
        calcularAlertas(mergedData);
      }
    } catch (error) {
      console.error('Modo Offline: No se pudieron cargar procedimientos del servidor');
      const offlineRaw = await AsyncStorage.getItem('offlineRegistros');
      const offlineData = offlineRaw ? JSON.parse(offlineRaw) : [];
      setOfflineCount(offlineData.length);
      setProcedimientos(offlineData);
      calcularAlertas(offlineData);
      Alert.alert('Modo Offline 📡', 'Mostrando únicamente registros guardados localmente sin sincronizar.');
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

      let pasoActual = null;
      let endpointPaso = null;

      if (proc.tipoProcedimiento === 'IA') {
        pasoActual = { nombre: 'Conf. Preñez (Día 45)', fecha: sumarDias(dia0, 45) };
        endpointPaso = 'dia45_confirmacion'; // Although we didn't add dia45 to pasosCompletados yet, it defaults to Preñada.
      } else if (proc.tipoProcedimiento === 'Diagnostico') {
         // No hay paso pendiente automático
      } else {
        if (!comp.dia8_retiro) {
          pasoActual = { nombre: 'Retiro Dispositivo (Día 8)', fecha: sumarDias(dia0, 8) };
          endpointPaso = 'dia8_retiro';
        } else if (proc.tipoProcedimiento === 'IATF' && !comp.dia10_inseminacion) {
          pasoActual = { nombre: 'Inseminación (Día 10)', fecha: sumarDias(dia0, 10) };
          endpointPaso = 'dia10_inseminacion';
        } else if (proc.tipoProcedimiento === 'TE' && !comp.dia17_transferencia) {
          pasoActual = { nombre: 'Transferencia (Día 17)', fecha: sumarDias(dia0, 17) };
          endpointPaso = 'dia17_transferencia';
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

  const handleOpcionesProcedimiento = (item) => {
    Alert.alert(
      `Procedimiento: ${item.arete || item.animalId}`,
      `¿Qué deseas gestionar para este protocolo de ${item.tipoProcedimiento}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: '✅ Confirmar Avance / Preñez', 
          onPress: () => Alert.alert('Confirmación', 'Próximamente: Pantalla de confirmación de diagnóstico de gestación.')
        },
        { 
          text: '⚠️ Reportar Novedad (Caída dispositivo, etc.)', 
          onPress: () => Alert.alert('Novedad', 'Próximamente: Pantalla para reportar novedades clínicas o caída de dispositivos.')
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleOpcionesProcedimiento(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.arete}>
          {item.arete || item.animalId} {item.isOffline && '📡'}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.tipoProcedimiento}</Text>
        </View>
      </View>
      <Text style={styles.detail}>Finca: {item.finca || item.productor}</Text>
      <Text style={styles.detail}>Día 0: {new Date(item.fechasProtocolo?.dia0_sincronizacion || item.createdAt).toLocaleDateString()}</Text>
      
      <View style={[styles.statusBadge, item.estadoPrenez === 'Preñada' ? styles.statusSuccess : styles.statusWarning]}>
        <Text style={styles.statusText}>{item.estadoPrenez}</Text>
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

      {/* Modal de Alertas */}
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
  statusBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusSuccess: {
    backgroundColor: '#dcfce7',
  },
  statusWarning: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 12,
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalClose: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 16,
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
