import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator, Linking, Modal } from 'react-native';
import { API_URL } from '../config/api';
import { ShoppingBag, CheckCircle, ExternalLink, X, CreditCard } from 'lucide-react-native';

export default function CatalogoScreen({ navigation }) {
  const [productos, setProductos] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagoPendiente, setPagoPendiente] = useState(null);
  const [verificandoPago, setVerificandoPago] = useState(false);

  useEffect(() => {
    cargarDatos();
    const unsubscribe = navigation?.addListener?.('focus', () => {
      cargarDatos();
    });
    return unsubscribe;
  }, [navigation]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resCat, resConf] = await Promise.all([
        fetch(`${API_URL}/api/catalogo`),
        fetch(`${API_URL}/api/configuracion`)
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

  const generarPagoWompi = async (producto) => {
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
      const res = await fetch(`${API_URL}/api/configuracion/generar-firma`, {
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

    // Wompi Web Checkout Link sin redirect-url local para evitar bloqueo CloudFront 403
    const finalKey = (config.wompiPublicKey && config.wompiPublicKey !== 'undefined') ? config.wompiPublicKey : 'pub_test_ljKW2orNya3GoWqfTCl1wu6vOy50mnnh';
    let wompiUrl = `https://checkout.wompi.co/p/?public-key=${finalKey}&currency=COP&amount-in-cents=${amountInCents}&reference=${reference}`;
    
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
      const res = await fetch(`${API_URL}/api/pagos/verificar-transaccion`, {
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

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image 
        source={{ uri: item.imagen ? (item.imagen.startsWith('http') ? item.imagen : `${API_URL}${item.imagen}`) : 'https://via.placeholder.com/150?text=Sembriogan' }} 
        style={styles.image} 
        resizeMode="cover"
      />
      <View style={styles.info}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={[styles.title, { flex: 1, marginRight: 8 }]}>{item.tipo || item.nombre}</Text>
          <View style={[styles.typeBadge, item.esServicio ? styles.serviceBadge : styles.productBadge]}>
            <Text style={[styles.typeBadgeText, item.esServicio ? styles.serviceBadgeText : styles.productBadgeText]}>
              {item.esServicio ? 'Servicio' : `Stock: ${item.stock}`}
            </Text>
          </View>
        </View>
        <Text style={styles.raza}>{item.descripcion || item.categoria || 'Sin descripción'}</Text>
        <Text style={styles.price}>
          ${new Intl.NumberFormat('es-CO').format(item.costo)} COP
        </Text>
        <TouchableOpacity 
          style={[styles.buyButton, (!item.esServicio && item.stock <= 0) && { backgroundColor: '#cbd5e1' }]}
          onPress={() => generarPagoWompi(item)}
          disabled={!item.esServicio && item.stock <= 0}
        >
          <Text style={styles.buyText}>{(!item.esServicio && item.stock <= 0) ? 'Agotado' : 'Generar Pago Wompi'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ShoppingBag color="#0ea5e9" size={28} />
        <Text style={styles.headerTitle}>Catálogo Móvil</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={productos}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* MODAL DE CONFIRMACIÓN DE PAGO WOMPI */}
      {pagoPendiente && (
        <Modal transparent animationType="fade" visible={!!pagoPendiente}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
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
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    marginLeft: 12,
  },
  list: {
    padding: 16,
    paddingBottom: 100, // Espacio para el Tab Bar flotante
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 180,
  },
  info: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  raza: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '900',
    color: '#10b981',
    marginTop: 10,
    marginBottom: 16,
  },
  buyButton: {
    backgroundColor: '#0ea5e9',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  serviceBadge: {
    backgroundColor: '#e0f2fe',
  },
  productBadge: {
    backgroundColor: '#dcfce7',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  serviceBadgeText: {
    color: '#0284c7',
  },
  productBadgeText: {
    color: '#15803d',
  },
  // Estilos del Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  productSummary: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 18,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    textTransform: 'uppercase',
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
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  reopenButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#e0f2fe',
    marginBottom: 10,
  },
  reopenButtonText: {
    color: '#0284c7',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  }
});
