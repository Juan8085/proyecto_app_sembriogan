import React, { useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { API_URL, getApiUrl } from '../config/api';
import { getToken, clearSession, isTokenExpired } from '../utils/auth';
import { ArrowLeft, Save, MapPin, Compass, CheckCircle, Search, UserPlus, Users, Check, AlertTriangle, X, ChevronRight, Dna } from 'lucide-react-native';

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
    telefonoProductor: '',
    tipoProduccion: 'Doble Propósito',
    estadoPrenez: 'Pendiente Evaluación'
  });
  const [loading, setLoading] = useState(false);
  const [coordenadas, setCoordenadas] = useState(null);
  const [capturandoGps, setCapturandoGps] = useState(false);

  // Requerimiento Sembriogan: Opción para dejar genética pendiente para elección el día del procedimiento
  const [toroPendiente, setToroPendiente] = useState(true);

  // Requerimiento Sembriogan: Selección de clientes existentes o creación desde cero
  const [clientesDisponibles, setClientesDisponibles] = useState([]);
  const [modoCliente, setModoCliente] = useState('existente'); // 'existente' | 'nuevo'
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [cargandoClientes, setCargandoClientes] = useState(false);

  // Cargar lista de clientes de la base de datos (con soporte offline)
  const cargarClientes = async () => {
    try {
      setCargandoClientes(true);
      // 1. Cargar desde memoria local si se guardaron previamente (vital para zonas rurales sin internet)
      const offlineClientesRaw = await AsyncStorage.getItem('cachedClientes');
      if (offlineClientesRaw) {
        try {
          const parsed = JSON.parse(offlineClientesRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setClientesDisponibles(parsed);
          }
        } catch (e) {
          console.warn('Error leyendo clientes en caché:', e);
        }
      }

      // 2. Si hay conexión, sincronizar con la nube
      const token = await getToken();
      const currentUrl = getApiUrl() || API_URL;
      const res = await fetch(`${currentUrl}/api/auth/usuarios`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      const lista = data.data || data.usuarios || [];
      if (Array.isArray(lista)) {
        const clientesSolo = lista.filter(u => (u.rol || '').toLowerCase() === 'cliente');
        if (clientesSolo.length > 0) {
          setClientesDisponibles(clientesSolo);
          await AsyncStorage.setItem('cachedClientes', JSON.stringify(clientesSolo));
        }
      }
    } catch (err) {
      console.log('Aviso: modo offline o sin señal para cargar directorio de clientes');
    } finally {
      setCargandoClientes(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  // Filtrado de clientes para el buscador en tiempo real
  const clientesFiltrados = useMemo(() => {
    if (!busquedaCliente.trim()) {
      return clientesDisponibles.slice(0, 6);
    }
    const q = busquedaCliente.toLowerCase().trim();
    return clientesDisponibles.filter(c => 
      (c.nombre && c.nombre.toLowerCase().includes(q)) ||
      (c.fincaPrincipal && c.fincaPrincipal.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.municipio && c.municipio.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [clientesDisponibles, busquedaCliente]);

  const handleSeleccionarCliente = (c) => {
    setClienteSeleccionado(c);
    setForm(prev => ({
      ...prev,
      productor: c.nombre || '',
      productorEmail: c.email || '',
      telefonoProductor: c.telefono || '',
      finca: c.fincaPrincipal || '',
      tipoProduccion: c.tipoProduccion || 'Doble Propósito'
    }));
    setBusquedaCliente('');
  };

  const handleDesvincularCliente = () => {
    setClienteSeleccionado(null);
  };

  const handleCambiarANuevo = (nombreInicial = '') => {
    setModoCliente('nuevo');
    setClienteSeleccionado(null);
    setForm(prev => ({
      ...prev,
      productor: typeof nombreInicial === 'string' ? nombreInicial : '',
      productorEmail: '',
      telefonoProductor: '',
      finca: '',
      tipoProduccion: 'Doble Propósito'
    }));
  };

  const handleCambiarAExistente = () => {
    setModoCliente('existente');
    setBusquedaCliente('');
  };

  // Capturar coordenadas GPS del predio ganadero en campo
  const capturarGps = async () => {
    try {
      setCapturandoGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Requerido', 'Se necesita autorización de GPS para geolocalizar la finca en campo.');
        setCapturandoGps(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = {
        lat: parseFloat(loc.coords.latitude.toFixed(6)),
        lng: parseFloat(loc.coords.longitude.toFixed(6))
      };
      setCoordenadas(coords);
      Alert.alert('📍 Coordenadas Obtenidas', `Ubicación satelital del predio capturada:\nLatitud: ${coords.lat}\nLongitud: ${coords.lng}`);
    } catch (err) {
      Alert.alert('Error GPS', 'No se pudo obtener la posición satelital: ' + err.message);
    } finally {
      setCapturandoGps(false);
    }
  };

  // Guardar en la memoria del celular cuando no hay red o venció la sesión
  const guardarEnModoOffline = async (payload) => {
    try {
      const guardados = await AsyncStorage.getItem('offlineRegistros');
      const offlineData = guardados ? JSON.parse(guardados) : [];
      
      const registroLocal = {
        ...payload,
        _id: 'offline-' + Date.now(),
        isOffline: true,
        createdAt: new Date().toISOString()
      };
      
      offlineData.push(registroLocal);
      await AsyncStorage.setItem('offlineRegistros', JSON.stringify(offlineData));
      
      Alert.alert(
        'Modo Offline Activo 📡', 
        'El procedimiento se guardó de forma 100% segura en la memoria de tu celular. Se sincronizará automáticamente con el servidor cuando vuelvas a tener señal y sesión activa.',
        [{ text: 'Entendido', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      console.error('Error guardando offline:', e);
      Alert.alert('Error', 'No se pudo almacenar el registro en la memoria local.');
    }
  };

  const handleGuardar = async () => {
    if (!form.arete || !form.tipoProcedimiento || !form.productor) {
      Alert.alert('Datos Incompletos', 'Por favor llena los campos obligatorios: N° Chapeta/Arete, Tipo de Procedimiento y Nombre del Productor Ganadero.');
      return;
    }

    setLoading(true);

    const geneticaFinal = (toroPendiente || !form.semenToro.trim() || form.tipoProcedimiento === 'Atencion de Parto')
      ? (form.tipoProcedimiento === 'Atencion de Parto' ? 'N/A (Atención de Parto)' : 'Pendiente de Selección')
      : form.semenToro.trim();

    const payload = {
      ...form,
      geneticaUtilizada: geneticaFinal,
      toroPendiente: toroPendiente && form.tipoProcedimiento !== 'Atencion de Parto',
      fechasProtocolo: { dia0_sincronizacion: form.fechaProcedimiento },
      coordenadas: coordenadas || undefined
    };

    try {
      const token = await getToken();

      // Verificar si hay token y si aún está vigente
      if (!token || isTokenExpired(token)) {
        Alert.alert(
          'Sesión Vencida 🔒',
          'Tu sesión de usuario ha expirado. Puedes guardar el procedimiento localmente en tu celular o iniciar sesión para sincronizarlo de inmediato.',
          [
            {
              text: 'Guardar en Celular (Offline)',
              onPress: async () => {
                await guardarEnModoOffline(payload);
              }
            },
            {
              text: 'Iniciar Sesión',
              onPress: async () => {
                await clearSession();
                navigation.navigate('Login');
              }
            }
          ]
        );
        setLoading(false);
        return;
      }

      try {
        const currentUrl = getApiUrl() || API_URL;
        const res = await fetch(`${currentUrl}/api/registro-genetico`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        // Si el servidor indica 401 Unauthorized (Sesión inválida o expirada)
        if (res.status === 401) {
          Alert.alert(
            'Sesión No Autorizada 🔒',
            'El servidor rechazó la solicitud por sesión expirada. ¿Deseas guardar el registro en el celular mientras inicias sesión?',
            [
              {
                text: 'Guardar en Celular',
                onPress: async () => {
                  await guardarEnModoOffline(payload);
                }
              },
              {
                text: 'Reingresar',
                onPress: async () => {
                  await clearSession();
                  navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                }
              }
            ]
          );
          setLoading(false);
          return;
        }

        const data = await res.json();
        
        if (data.success) {
          Alert.alert(
            '✅ ¡Registro Exitoso!', 
            `El procedimiento del animal "${form.arete}" se guardó correctamente en el servidor central y se sincronizó con el panel administrativo.`,
            [{ text: 'Aceptar', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert('Error', data.mensaje || 'Hubo un error al registrar en el servidor.');
        }
      } catch (networkError) {
        console.log('Error de red al guardar en la nube. Activando guardado offline:', networkError);
        await guardarEnModoOffline(payload);
      }
    } catch (error) {
      console.error('Error crítico procesando registro:', error);
      Alert.alert('Error', 'Ocurrió un error al procesar el formulario.');
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
        
        {/* BLOQUE 1: PROTOCOLO / TIPO DE PROCEDIMIENTO */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Protocolo o Visita Técnica</Text>
          
          <Text style={styles.label}>Tipo de Procedimiento *</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.typeButton, form.tipoProcedimiento === 'IATF' && styles.typeButtonActive]} 
              onPress={() => {
                setField('tipoProcedimiento', 'IATF');
                setToroPendiente(true);
              }}
            >
              <Text style={[styles.typeButtonText, form.tipoProcedimiento === 'IATF' && styles.typeButtonTextActive]}>IATF</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeButton, form.tipoProcedimiento === 'TE' && styles.typeButtonActive]} 
              onPress={() => {
                setField('tipoProcedimiento', 'TE');
                setToroPendiente(true);
              }}
            >
              <Text style={[styles.typeButtonText, form.tipoProcedimiento === 'TE' && styles.typeButtonTextActive]}>T.E.</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.typeButton, form.tipoProcedimiento === 'IA' && styles.typeButtonActive]} 
              onPress={() => {
                setField('tipoProcedimiento', 'IA');
              }}
            >
              <Text style={[styles.typeButtonText, form.tipoProcedimiento === 'IA' && styles.typeButtonTextActive]}>IA Celo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeButton, form.tipoProcedimiento === 'Diagnostico' && styles.typeButtonActive]} 
              onPress={() => {
                setField('tipoProcedimiento', 'Diagnostico');
                setToroPendiente(false);
                setField('semenToro', 'N/A (Diagnóstico)');
              }}
            >
              <Text style={[styles.typeButtonText, form.tipoProcedimiento === 'Diagnostico' && styles.typeButtonTextActive]}>Diag. Preñez</Text>
            </TouchableOpacity>
          </View>

          {/* Botón especial Atención de Parto */}
          <TouchableOpacity 
            style={[styles.partoButton, form.tipoProcedimiento === 'Atencion de Parto' && styles.partoButtonActive]} 
            onPress={() => {
              setField('tipoProcedimiento', 'Atencion de Parto');
              setToroPendiente(false);
              setField('semenToro', 'N/A (Atención de Parto)');
            }}
          >
            <Text style={[styles.partoButtonText, form.tipoProcedimiento === 'Atencion de Parto' && styles.partoButtonTextActive]}>
              🚨 Atención de Parto / Urgencia Bovina
            </Text>
          </TouchableOpacity>

          <Text style={[styles.label, { marginTop: 12 }]}>Fecha Día 0 (YYYY-MM-DD) *</Text>
          <TextInput 
            style={styles.input} 
            value={form.fechaProcedimiento} 
            onChangeText={(v) => setField('fechaProcedimiento', v)} 
          />
        </View>

        {/* BLOQUE 2: DATOS DEL ANIMAL Y SELECCIÓN DE GENÉTICA / TORO */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>2. Identificación Bovina y Genética</Text>
          
          <Text style={styles.label}>N° Chapeta / Arete *</Text>
          <TextInput 
            style={styles.input} 
            value={form.arete} 
            onChangeText={(v) => setField('arete', v)} 
            placeholder="Ej: TH-01 o 5432" 
          />

          <Text style={styles.label}>Raza o Cruzamiento</Text>
          <TextInput 
            style={styles.input} 
            value={form.raza} 
            onChangeText={(v) => setField('raza', v)} 
            placeholder="Ej: Brahman, Gyr, F1..." 
          />

          {/* OPCIÓN: TORO / GENÉTICA PENDIENTE (REQUERIMIENTO SEMBRIOGAN) */}
          {form.tipoProcedimiento !== 'Diagnostico' && form.tipoProcedimiento !== 'Atencion de Parto' && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Genética Bovina / Toro</Text>
              <TouchableOpacity 
                style={[styles.checkboxContainer, toroPendiente && styles.checkboxContainerActivo]} 
                onPress={() => {
                  const nuevo = !toroPendiente;
                  setToroPendiente(nuevo);
                  if (nuevo) {
                    setField('semenToro', 'Pendiente de Selección');
                  } else {
                    setField('semenToro', '');
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.checkboxIconBox, toroPendiente && styles.checkboxIconBoxActivo]}>
                  {toroPendiente ? <Check size={14} color="#fff" /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkboxTitle}>
                    Dejar genética/toro pendiente para el día del servicio
                  </Text>
                  <Text style={styles.checkboxSubtitle}>
                    Permite que el ganadero elija la pajilla o toro a última hora el Día 10 (IATF) o Día 17 (TE).
                  </Text>
                </View>
              </TouchableOpacity>

              {!toroPendiente ? (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.label}>Nombre o Pajilla del Toro *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={form.semenToro} 
                    onChangeText={(v) => setField('semenToro', v)} 
                    placeholder="Ej: Fabuloso da Cal / Brahman Rojo 808" 
                  />
                </View>
              ) : (
                <View style={styles.avisoPendienteBox}>
                  <AlertTriangle size={15} color="#d97706" style={{ marginTop: 2, marginRight: 6 }} />
                  <Text style={styles.avisoPendienteTexto}>
                    Genética: "Pendiente de Selección". Podrás definir el toro directamente desde tu celular el día de la inseminación o transferencia.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* BLOQUE 3: PRODUCTOR GANADERO Y FINCA (EXISTENTE O NUEVO) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderFila}>
            <Text style={styles.sectionTitle}>3. Ganadero y Finca</Text>
            <View style={styles.selectorModoFila}>
              <TouchableOpacity
                onPress={handleCambiarAExistente}
                style={[styles.btnModo, modoCliente === 'existente' && styles.btnModoActivo]}
              >
                <Text style={[styles.btnModoTexto, modoCliente === 'existente' && styles.btnModoTextoActivo]}>
                  👥 Base de Datos ({clientesDisponibles.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleCambiarANuevo()}
                style={[styles.btnModo, modoCliente === 'nuevo' && styles.btnModoActivo]}
              >
                <Text style={[styles.btnModoTexto, modoCliente === 'nuevo' && styles.btnModoTextoActivo]}>
                  ➕ Nuevo
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* MODO 1: SELECCIONAR CLIENTE EXISTENTE */}
          {modoCliente === 'existente' && (
            <View style={{ marginBottom: 14 }}>
              {clienteSeleccionado ? (
                <View style={styles.clienteSeleccionadoCard}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <CheckCircle size={16} color="#059669" />
                      <Text style={styles.clienteSeleccionadoNombre}>{clienteSeleccionado.nombre}</Text>
                    </View>
                    <Text style={styles.clienteSeleccionadoDetalle}>
                      🏡 Predio: {clienteSeleccionado.fincaPrincipal || 'No especificado'}
                    </Text>
                    {clienteSeleccionado.telefono ? (
                      <Text style={styles.clienteSeleccionadoDetalle}>
                        📞 Tel: {clienteSeleccionado.telefono}
                      </Text>
                    ) : null}
                    <Text style={styles.clienteSeleccionadoEmail}>
                      ✉️ {clienteSeleccionado.email}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleDesvincularCliente} style={styles.btnCambiarCliente}>
                    <Text style={styles.btnCambiarClienteTexto}>Cambiar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={styles.label}>Buscar Ganadero en Base de Datos</Text>
                  <View style={styles.searchBox}>
                    <Search size={16} color="#64748b" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Buscar por nombre, finca o municipio..."
                      value={busquedaCliente}
                      onChangeText={setBusquedaCliente}
                      placeholderTextColor="#94a3b8"
                    />
                    {busquedaCliente ? (
                      <TouchableOpacity onPress={() => setBusquedaCliente('')} style={{ padding: 4 }}>
                        <X size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Lista de resultados */}
                  {clientesFiltrados.length > 0 ? (
                    <View style={styles.listaResultados}>
                      {clientesFiltrados.map((cli) => (
                        <TouchableOpacity
                          key={cli._id || cli.email}
                          style={styles.itemClienteFila}
                          onPress={() => handleSeleccionarCliente(cli)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemClienteNombre}>{cli.nombre}</Text>
                            <Text style={styles.itemClienteSub}>
                              🏡 {cli.fincaPrincipal || 'Sin predio registrado'} • 📍 {cli.municipio || 'Huila'}
                            </Text>
                          </View>
                          <ChevronRight size={18} color="#0284c7" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.noResultadosCard}>
                      <Text style={styles.noResultadosTexto}>
                        {busquedaCliente
                          ? `No se encontró "${busquedaCliente}" en la base de datos.`
                          : 'No hay clientes cargados en este momento.'}
                      </Text>
                      <TouchableOpacity
                        style={styles.btnCrearNuevoDirecto}
                        onPress={() => handleCambiarANuevo(busquedaCliente)}
                      >
                        <UserPlus size={15} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.btnCrearNuevoDirectoTexto}>Registrar ganadero desde cero</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* MODO 2: NUEVO CLIENTE */}
          {modoCliente === 'nuevo' && (
            <View style={styles.avisoNuevoBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.avisoNuevoTitulo}>Registrando Ganadero Nuevo</Text>
                <Text style={styles.avisoNuevoSub}>
                  Al guardar, se creará automáticamente su perfil de cliente en el sistema central.
                </Text>
              </View>
              <TouchableOpacity onPress={handleCambiarAExistente}>
                <Text style={styles.btnVolverBuscar}>Buscar existente</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* CAMPOS DEL PRODUCTOR (EDITABLES EN AMBOS CASOS) */}
          <Text style={styles.label}>Nombre del Productor *</Text>
          <TextInput 
            style={styles.input} 
            value={form.productor} 
            onChangeText={(v) => setField('productor', v)} 
            placeholder="Ej: Carlos Mendoza" 
          />

          <Text style={styles.label}>Nombre de la Finca / Predio *</Text>
          <TextInput 
            style={styles.input} 
            value={form.finca} 
            onChangeText={(v) => setField('finca', v)} 
            placeholder="Ej: La Esperanza" 
          />

          <Text style={styles.label}>Teléfono / WhatsApp de Contacto</Text>
          <TextInput 
            style={styles.input} 
            value={form.telefonoProductor} 
            onChangeText={(v) => setField('telefonoProductor', v)} 
            keyboardType="phone-pad"
            placeholder="Ej: 3123456789" 
          />

          <Text style={styles.label}>Tipo de Producción Ganadera</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {['Doble Propósito', 'Leche', 'Carne', 'Genética/Biotecnología', 'Cría y Levante', 'Otro'].map((tipo) => {
              const activo = (form.tipoProduccion || 'Doble Propósito') === tipo;
              return (
                <TouchableOpacity
                  key={tipo}
                  onPress={() => setField('tipoProduccion', tipo)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 12,
                    backgroundColor: activo ? '#0284c7' : '#f8fafc',
                    borderWidth: 1,
                    borderColor: activo ? '#0284c7' : '#cbd5e1'
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: activo ? '#ffffff' : '#334155' }}>
                    {tipo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Correo del Cliente (Opcional - Login Portal Web)</Text>
          <TextInput 
            style={styles.input} 
            value={form.productorEmail} 
            onChangeText={(v) => setField('productorEmail', v)} 
            keyboardType="email-address" 
            autoCapitalize="none" 
            placeholder="correo@ejemplo.com (Opcional)" 
          />

          {/* BOTÓN CAPTURAR GPS EN CAMPO */}
          <Text style={[styles.label, { marginTop: 6 }]}>Georreferenciación Satelital (GPS)</Text>
          <TouchableOpacity 
            style={[styles.btnGps, coordenadas && styles.btnGpsActivo]} 
            onPress={capturarGps}
            disabled={capturandoGps}
          >
            {capturandoGps ? (
              <Compass color="#0284c7" size={18} />
            ) : coordenadas ? (
              <CheckCircle color="#10b981" size={18} />
            ) : (
              <MapPin color="#0284c7" size={18} />
            )}
            <Text style={[styles.btnGpsText, coordenadas && styles.btnGpsTextActivo]}>
              {capturandoGps 
                ? 'Obteniendo señal GPS...' 
                : coordenadas 
                  ? `📍 GPS: ${coordenadas.lat}, ${coordenadas.lng}` 
                  : '📍 Capturar Ubicación GPS de la Finca'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* BOTÓN PRINCIPAL DE GUARDAR */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleGuardar} disabled={loading}>
          <Save color="#fff" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.submitBtnText}>{loading ? 'Guardando en Servidor...' : 'Guardar Procedimiento'}</Text>
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
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeaderFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0ea5e9',
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1e293b',
    marginBottom: 14,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
  },
  typeButtonActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  typeButtonText: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#475569',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  partoButton: {
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    marginTop: 2,
  },
  partoButtonActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  partoButtonText: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#be123c',
  },
  partoButtonTextActive: {
    color: '#fff',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 12,
  },
  checkboxContainerActivo: {
    backgroundColor: '#fefce8',
    borderColor: '#facc15',
  },
  checkboxIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94a3b8',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxIconBoxActivo: {
    backgroundColor: '#eab308',
    borderColor: '#eab308',
  },
  checkboxTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  checkboxSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  avisoPendienteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
  },
  avisoPendienteTexto: {
    flex: 1,
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
    lineHeight: 16,
  },
  selectorModoFila: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  btnModo: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  btnModoActivo: {
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  btnModoTexto: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
  },
  btnModoTextoActivo: {
    color: '#0284c7',
  },
  clienteSeleccionadoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#6ee7b7',
    borderRadius: 14,
    padding: 12,
  },
  clienteSeleccionadoNombre: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#065f46',
  },
  clienteSeleccionadoDetalle: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  clienteSeleccionadoEmail: {
    fontSize: 10,
    color: '#059669',
    marginTop: 2,
  },
  btnCambiarCliente: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  btnCambiarClienteTexto: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#047857',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#1e293b',
  },
  listaResultados: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  itemClienteFila: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemClienteNombre: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  itemClienteSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  noResultadosCard: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  noResultadosTexto: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  btnCrearNuevoDirecto: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  btnCrearNuevoDirectoTexto: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  avisoNuevoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  avisoNuevoTitulo: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065f46',
  },
  avisoNuevoSub: {
    fontSize: 10,
    color: '#047857',
  },
  btnVolverBuscar: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0284c7',
    textDecorationLine: 'underline',
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
  },
  btnGps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  btnGpsActivo: {
    backgroundColor: '#ecfdf5',
    borderColor: '#6ee7b7',
  },
  btnGpsText: {
    color: '#0284c7',
    fontWeight: 'bold',
    fontSize: 13,
  },
  btnGpsTextActivo: {
    color: '#059669',
  }
});
