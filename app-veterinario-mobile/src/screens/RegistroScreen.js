import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config/api';
import { ArrowLeft, Save } from 'lucide-react-native';

export default function RegistroScreen({ navigation }) {
  const [form, setForm] = useState({
    arete: '',
    raza: '',
    fechaProcedimiento: new Date().toISOString().split('T')[0],
    tipoProcedimiento: 'IATF',
    semenToro: '',
    finca: '',
    productor: '',
    productorEmail: '',
    estadoPrenez: 'Pendiente Evaluación'
  });
  const [loading, setLoading] = useState(false);

  const handleGuardar = async () => {
    if (!form.arete || !form.tipoProcedimiento || !form.productor) {
      Alert.alert('Error', 'Por favor llena los campos obligatorios (Chapeta, Tipo, Productor)');
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      // Asegurar estructura
      const payload = {
        ...form,
        geneticaUtilizada: form.semenToro || 'N/A',
        fechasProtocolo: { dia0_sincronizacion: form.fechaProcedimiento }
      };

      try {
        const res = await fetch(`${API_URL}/api/registro-genetico`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.success) {
          Alert.alert('Éxito', 'Procedimiento registrado correctamente en el servidor.');
          navigation.goBack();
        } else {
          Alert.alert('Error', data.mensaje || 'Hubo un error al registrar.');
        }
      } catch (networkError) {
        // MODO OFFLINE
        console.log('Guardando en modo offline debido a error de red:', networkError);
        const guardados = await AsyncStorage.getItem('offlineRegistros');
        const offlineData = guardados ? JSON.parse(guardados) : [];
        
        // Asignar ID temporal y marcar como offline
        payload._id = 'offline-' + Date.now();
        payload.isOffline = true;
        payload.createdAt = new Date().toISOString();
        
        offlineData.push(payload);
        await AsyncStorage.setItem('offlineRegistros', JSON.stringify(offlineData));
        
        Alert.alert('Modo Offline Activo 📡', 'No hay conexión. El registro se ha guardado localmente en tu celular y podrás sincronizarlo luego.');
        navigation.goBack();
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Error crítico procesando el registro.');
    } finally {
      setLoading(false);
    }
  };

  const setField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.title}>Nuevo Procedimiento</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Datos del Animal</Text>
          
          <Text style={styles.label}>N° Chapeta / Arete *</Text>
          <TextInput style={styles.input} value={form.arete} onChangeText={(v) => setField('arete', v)} placeholder="Ej: TH-01" />

          <Text style={styles.label}>Raza</Text>
          <TextInput style={styles.input} value={form.raza} onChangeText={(v) => setField('raza', v)} placeholder="Ej: Brahman" />

          <Text style={styles.label}>Toro (Semen/Embrión)</Text>
          <TextInput style={styles.input} value={form.semenToro} onChangeText={(v) => setField('semenToro', v)} placeholder="Nombre del Toro" />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Protocolo</Text>
          
          <Text style={styles.label}>Tipo de Procedimiento *</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={[styles.typeButton, form.tipoProcedimiento === 'IATF' && styles.typeButtonActive]} onPress={() => setField('tipoProcedimiento', 'IATF')}>
              <Text style={[styles.typeButtonText, form.tipoProcedimiento === 'IATF' && styles.typeButtonTextActive]}>IATF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeButton, form.tipoProcedimiento === 'TE' && styles.typeButtonActive]} onPress={() => setField('tipoProcedimiento', 'TE')}>
              <Text style={[styles.typeButtonText, form.tipoProcedimiento === 'TE' && styles.typeButtonTextActive]}>T.E.</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={[styles.typeButton, form.tipoProcedimiento === 'IA' && styles.typeButtonActive]} onPress={() => setField('tipoProcedimiento', 'IA')}>
              <Text style={[styles.typeButtonText, form.tipoProcedimiento === 'IA' && styles.typeButtonTextActive]}>IA</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeButton, form.tipoProcedimiento === 'Diagnostico' && styles.typeButtonActive]} onPress={() => setField('tipoProcedimiento', 'Diagnostico')}>
              <Text style={[styles.typeButtonText, form.tipoProcedimiento === 'Diagnostico' && styles.typeButtonTextActive]}>Diag. Preñez</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Fecha Día 0 (YYYY-MM-DD) *</Text>
          <TextInput style={styles.input} value={form.fechaProcedimiento} onChangeText={(v) => setField('fechaProcedimiento', v)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Productor / Cliente</Text>
          
          <Text style={styles.label}>Nombre del Productor *</Text>
          <TextInput style={styles.input} value={form.productor} onChangeText={(v) => setField('productor', v)} placeholder="Ej: Juan Pérez" />

          <Text style={styles.label}>Nombre de la Finca</Text>
          <TextInput style={styles.input} value={form.finca} onChangeText={(v) => setField('finca', v)} placeholder="Ej: La Esperanza" />

          <Text style={styles.label}>Correo del Cliente (Para la App)</Text>
          <TextInput style={styles.input} value={form.productorEmail} onChangeText={(v) => setField('productorEmail', v)} keyboardType="email-address" autoCapitalize="none" placeholder="correo@ejemplo.com" />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleGuardar} disabled={loading}>
          <Save color="#fff" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.submitBtnText}>{loading ? 'Guardando...' : 'Guardar Registro'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  scroll: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0ea5e9',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeButtonActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  typeButtonText: {
    fontWeight: 'bold',
    color: '#64748b',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#10b981',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 80,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
