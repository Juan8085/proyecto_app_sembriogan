import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator, Linking, Modal, TextInput } from 'react-native';
import { API_URL, getApiUrl, setCustomApiUrl, getDefaultApiUrl, initApiUrl } from '../config/api';
import { ShoppingBag, CheckCircle, ExternalLink, X, CreditCard, Server, Globe, RotateCcw } from 'lucide-react-native';

export default function CatalogoScreen({ navigation }) {
  const [productos, setProductos] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagoPendiente, setPagoPendiente] = useState(null);
  const [verificandoPago, setVerificandoPago] = useState(false);

  // Estados para configuración de servidor
  const [servidorActual, setServidorActual] = useState(API_URL);
  const [modalServidorVisible, setModalServidorVisible] = useState(false);
  const [inputUrlServidor, setInputUrlServidor] = useState('');
  const [probandoConexion, setProbandoConexion] = useState(false);

  useEffect(() => {
    initApiUrl().then(url => {
      setServidorActual(url);
      cargarDatos();
    });

    const unsubscribe = navigation?.addListener?.('focus', () => {
      initApiUrl().then(url => {
        setServidorActual(url);
        cargarDatos();
      });
    });
    return unsubscribe;
  }, [navigation]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const currentUrl = getApiUrl() || API_URL;
      const [resCat, resConf] = await Promise.all([
        fetch(`${currentUrl}/api/catalogo`),
        fetch(`${currentUrl}/api/configuracion`)
      ]);
      const dataCat = await resCat.json();
      const dataConf = await resConf.json();
      
      if (dataCat.success) setProductos(dataCat.data);
      if (dataConf.success) setConfig(dataConf.data);
    } catch (error) {
      console.error('Error cargando catálogo:', error);
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
        cargarDatos();
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
    cargarDatos();
  };

  const generarPagoWompi = async (producto) => {
    const currentUrl = getApiUrl() || API_URL;

    if (!config || !config.wompiPublicKey) {
      Alert.alert('Error', 'El sistema de pagos no está configurado (Falta Llave Pública).');
      return;
    }

    const amountInCents = Math.round((producto.costo || 0) * 100);
    if (amountInCents === 0) { Alert.alert('Error', 'Precio inválido'); return; }
    const reference = `VET-${Date.now()}-${producto._id.substring(0, 5)}`;
    
    // Fetch signature from backend to comply with Wompi's Integrity requirement
    let signature = '';
    try {
      const res = await fetch(`${currentUrl}/api/configuracion/generar-firma`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, amountInCents, currency: 'COP' })
      });
      const data = await res.json();
      if (data.success && data.signature) {
        signature = data.signature;
      }
    } catch (err) {
      console.error('Error fetching signature', err);
    }

    // Wompi Web Checkout Link
    const finalKey = (config.wompiPublicKey && config.wompiPublicKey !== 'undefined') ? config.wompiPublicKey : 'pub_test_ljKW2orNya3GoWqfTCl1wu6vOy50mnnh';
    let wompiUrl = `https://checkout.wompi.co/p/?public-key=${finalKey}&currency=COP&amount-in-cents=${amountInCents}&reference=${reference}`;
    
    // Si la API está en un túnel público HTTPS (localtunnel o ngrok), Wompi permite redirect-url para confirmación automática
    if (currentUrl.startsWith('https://')) {
      const redirectUrl = `${currentUrl}/api/pagos/confirmar-wompi?ref=${reference}&prodId=${producto._id}&cantidad=1`;
      wompiUrl += `&redirect-url=${encodeURIComponent(redirectUrl)}`;
    }

    // Add signature if successfully generated
    if (signature) {
      wompiUrl += `&signature:integrity=${signature}`;
    }

    // Guardar referencia para confirmación del veterinario
    setPagoPendiente({
      producto,
      reference,
      amountInCents,
      wompiUrl
    });

    // Abriendo el navegador nativo del dispositivo para seguridad del pago
    Linking.openURL(wompiUrl).catch(err => {
      console.error('Failed to open URL:', err);
      Alert.alert('Error', 'No se pudo abrir el navegador para el pago.');
    });
  };

  const confirmarPagoManual = async () => {
    if (!pagoPendiente) return;
    setVerificandoPago(true);

    try {
      const currentUrl = getApiUrl() || API_URL;
      const res = await fetch(`${currentUrl}/api/pagos/verificar-transaccion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: pagoPendiente.reference,
          prodId: pagoPendiente.producto._id,
          cantidad: 1,
          total: pagoPendiente.producto.costo,
          cliente: {
            nombre: 'Veterinario Móvil',
            email: 'veterinario@sembriogan.com'
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        Alert.alert(
          '✅ ¡Pago Registrado Exitosamente!',
          `La transacción fue guardada en el panel administrativo y el inventario de "${pagoPendiente.producto.tipo || pagoPendiente.producto.nombre}" ha sido actualizado.`
        );
        setPagoPendiente(null);
        cargarDatos();
      } else {
        Alert.alert('Aviso', data.mensaje || 'No se pudo confirmar la transacción.');
      }
    } catch (err) {
      console.error('Error verificando pago:', err);
      Alert.alert('Error de conexión', 'No fue posible validar la transacción con el servidor.');
    } finally {
      setVerificandoPago(false);
    }
  };

  const currentUrl = getApiUrl() || API_URL;

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image 
        source={{ uri: item.imagen ? (item.imagen.startsWith('http') ? item.imagen : `${currentUrl}${item.imagen}`) : 'https://via.placeholder.com/150?text=Sembriogan' }} 
        style={styles.image} 
        resizeMode="cover"
      />
      <View style={styles.info}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={[styles.title, { flex: 1, marginRight: 8 }]}>{item.tipo || item.nombre}</Text>
          <View style={[styles.typeBadge, item.esServicio ? styles.serviceBadge : styles.productBadge]}>
            <Text style={[styles.typeBadgeText, item.esServicio ? styles.serviceBadgeText : styles.productBadgeText]}>
              {item.esServicio ? 'Servicio' : 'Producto'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.description} numberOfLines={2}>
          {item.descripcion || 'Sin descripción disponible'}
        </Text>
        
        <View style={styles.metaRow}>
          <Text style={styles.price}>
            ${new Intl.NumberFormat('es-CO').format(item.costo || 0)} COP
          </Text>
          
          {!item.esServicio && (
            <Text style={[styles.stock, item.stock <= 5 ? styles.stockLow : styles.stockOk]}>
              Stock: {item.stock || 0}
            </Text>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.buyButton, (!item.esServicio && item.stock <= 0) && styles.buyButtonDisabled]}
          onPress={() => generarPagoWompi(item)}
          disabled={!item.esServicio && item.stock <= 0}
        >
          <CreditCard color="#ffffff" size={16} />
          <Text style={styles.buyButtonText}>
            {(!item.esServicio && item.stock <= 0) ? 'Agotado' : 'Cobrar con Wompi'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ShoppingBag color="#0ea5e9" size={28} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Catálogo de Ventas</Text>
          <Text style={styles.headerSubtitle}>Productos y servicios veterinarios</Text>
        </View>
      </View>

      {/* Barra de Servidor / Red */}
      <TouchableOpacity 
        style={styles.serverBar} 
        onPress={() => { setInputUrlServidor(servidorActual); setModalServidorVisible(true); }}
      >
        <Server size={14} color="#0284c7" />
        <Text style={styles.serverBarText} numberOfLines={1}>
          Servidor: {servidorActual}
        </Text>
        <Text style={styles.serverBarAction}>Cambiar</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Cargando catálogo...</Text>
        </View>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay productos disponibles en este momento.</Text>
            </View>
          }
        />
      )}

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
              Si estás en el SENA o fuera de tu casa, pega aquí la URL del túnel público (ej: localtunnel o ngrok):
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

      {/* MODAL DE CONFIRMACIÓN DE PAGO */}
      {pagoPendiente && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CreditCard color="#0ea5e9" size={24} />
                  <Text style={styles.modalTitle}>Pago en Proceso</Text>
                </View>
                <TouchableOpacity onPress={() => setPagoPendiente(null)} style={{ padding: 4 }}>
                  <X color="#94a3b8" size={22} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Hemos abierto la pasarela segura de Wompi en tu navegador. Completa la transacción allí y regresa a confirmar.
              </Text>

              <View style={styles.productSummary}>
                <Text style={styles.summaryLabel}>Producto / Ítem:</Text>
                <Text style={styles.summaryValue}>{pagoPendiente.producto.tipo || pagoPendiente.producto.nombre}</Text>

                <Text style={[styles.summaryLabel, { marginTop: 8 }]}>Valor a Pagar:</Text>
                <Text style={[styles.summaryValue, { color: '#10b981', fontSize: 18 }]}>
                  ${new Intl.NumberFormat('es-CO').format(pagoPendiente.producto.costo)} COP
                </Text>

                <Text style={[styles.summaryLabel, { marginTop: 8 }]}>Referencia:</Text>
                <Text style={[styles.summaryValue, { fontFamily: 'monospace', fontSize: 11, color: '#64748b' }]}>
                  {pagoPendiente.reference}
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={confirmarPagoManual}
                disabled={verificandoPago}
              >
                {verificandoPago ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <CheckCircle color="#ffffff" size={20} />
                    <Text style={styles.confirmButtonText}>Ya completé el pago en Wompi</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.reopenButton} 
                onPress={() => Linking.openURL(pagoPendiente.wompiUrl)}
              >
                <ExternalLink color="#0ea5e9" size={18} />
                <Text style={styles.reopenButtonText}>Reabrir Pasarela Wompi</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setPagoPendiente(null)}
              >
                <Text style={styles.cancelButtonText}>Cerrar sin confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  serverBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderBottomWidth: 1,
    borderBottomColor: '#bae6fd',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  serverBarText: {
    flex: 1,
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
  },
  serverBarAction: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0284c7',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: '#e2e8f0',
  },
  info: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  serviceBadge: {
    backgroundColor: '#e0f2fe',
  },
  productBadge: {
    backgroundColor: '#fef3c7',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  serviceBadgeText: {
    color: '#0369a1',
  },
  productBadgeText: {
    color: '#b45309',
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0ea5e9',
  },
  stock: {
    fontSize: 12,
    fontWeight: '600',
  },
  stockOk: {
    color: '#10b981',
  },
  stockLow: {
    color: '#ef4444',
  },
  buyButton: {
    backgroundColor: '#0ea5e9',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  buyButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  buyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
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
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
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
  productSummary: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 2,
  },
  confirmButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 10,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  reopenButton: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 10,
  },
  reopenButtonText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
});
