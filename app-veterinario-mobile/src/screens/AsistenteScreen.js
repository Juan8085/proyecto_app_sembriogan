import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { API_URL, getApiUrl } from '../config/api';
import { Send, Sparkles } from 'lucide-react-native';
import DoctorNurseIcon from '../components/DoctorNurseIcon';

export default function AsistenteScreen() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      text: '¡Hola colega! Soy tu Médico Asistente IA de Sembriogan (SOMOS EPSEA). ¿En qué te puedo orientar hoy sobre protocolos de IATF, diagnóstico gestacional, pajillas o salud del hato?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);
  const flatListRef = useRef();

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');
    
    const newUserMsg = { id: Date.now().toString(), role: 'user', text: userText };
    setMessages(prev => [...prev, newUserMsg]);
    setLoading(true);

    try {
      const currentUrl = getApiUrl() || API_URL;
      const res = await fetch(`${currentUrl}/api/ia/consultar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: userText, rol: 'veterinario' })
      });
      const data = await res.json();

      if (data.success) {
        setMessages(prev => [
          ...prev, 
          { id: (Date.now() + 1).toString(), role: 'assistant', text: data.respuesta }
        ]);
      } else {
        setMessages(prev => [
          ...prev, 
          { id: (Date.now() + 1).toString(), role: 'assistant', text: 'Lo siento, tuve un problema de conexión con el modelo clínico.' }
        ]);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev, 
        { id: (Date.now() + 1).toString(), role: 'assistant', text: 'Error de conexión: ' + error.message }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {!isUser && (
          <View style={styles.assistantAvatarSmall}>
            <DoctorNurseIcon size={18} color="#0284c7" secondaryColor="#38bdf8" />
          </View>
        )}
        <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      {/* CABECERA CON EL ÍCONO DEL MÉDICO ASISTENTE IA */}
      <View style={styles.header}>
        <View style={styles.headerAvatarContainer}>
          <DoctorNurseIcon size={28} color="#0284c7" secondaryColor="#38bdf8" />
        </View>
        <View style={styles.headerTextGroup}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Médico Asistente IA</Text>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>EPSEA</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Orientación Clínica y Reproductiva 24/7</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Consulta sobre síntomas, IATF, pajillas..."
          placeholderTextColor="#94a3b8"
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Send color="#ffffff" size={20} />
          )}
        </TouchableOpacity>
      </View>
      {!isKeyboardVisible && <View style={{ height: 80, backgroundColor: '#ffffff' }} />}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 45 : 55,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTextGroup: {
    marginLeft: 12,
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  headerBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  list: {
    padding: 16,
    paddingBottom: 120, // Espacio para tab bar flotante
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: 'row',
  },
  assistantAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0284c7',
    borderBottomRightRadius: 4,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    flexShrink: 1,
    lineHeight: 22,
  },
  userText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  assistantText: {
    color: '#334155',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: 15,
    color: '#1e293b',
  },
  sendButton: {
    backgroundColor: '#0284c7',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginBottom: 2,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  }
});
