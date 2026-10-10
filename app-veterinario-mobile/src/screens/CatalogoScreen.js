import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator, Linking } from 'react-native';
import { API_URL } from '../config/api';
import { ShoppingBag } from 'lucide-react-native';

export default function CatalogoScreen() {
  const [productos, setProductos] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

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
      Alert.alert('Error', 'No se pudo cargar el catálogo.');
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
      if (data.success) {
        signature = data.signature;
      }
    } catch (err) {
      console.error('Error fetching signature', err);
    }

    // Wompi Web Checkout Link
    const finalKey = (config.wompiPublicKey && config.wompiPublicKey !== 'undefined') ? config.wompiPublicKey : 'pub_test_ljKW2orNya3GoWqfTCl1wu6vOy50mnnh';
    let wompiUrl = `https://checkout.wompi.co/p/?public-key=${finalKey}&currency=COP&amount-in-cents=${amountInCents}&reference=${reference}&redirect-url=https://sembriogan.com/gracias`;
    
    // Add signature if successfully generated
    if (signature) {
      wompiUrl += `&signature:integrity=${signature}`;
    }

    // Abriendo el navegador nativo del dispositivo para seguridad del pago
    Linking.openURL(wompiUrl).catch(err => {
      console.error('Failed to open URL:', err);
      Alert.alert('Error', 'No se pudo abrir el navegador para el pago.');
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image 
        source={{ uri: item.imagen ? (item.imagen.startsWith('http') ? item.imagen : `${API_URL}${item.imagen}`) : 'https://via.placeholder.com/150?text=Sembriogan' }} 
        style={styles.image} 
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.title}>{item.nombre}</Text>
        <Text style={styles.raza}>{item.raza} - {item.categoria}</Text>
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
  }
});
