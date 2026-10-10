const fs = require('fs');

let dashContent = fs.readFileSync('src/screens/DashboardScreen.js', 'utf8');

// Ensure AsyncStorage is imported
if (!dashContent.includes("import AsyncStorage")) {
  dashContent = dashContent.replace(
    /import \{ View, Text/g,
    "import AsyncStorage from '@react-native-async-storage/async-storage';\nimport { View, Text"
  );
}

// Ensure CloudSync icon is imported
if (!dashContent.includes("CloudLightning") && !dashContent.includes("CloudOff")) {
  dashContent = dashContent.replace(
    /import \{ LogOut, Bell/g,
    "import { LogOut, Bell, CloudOff, RefreshCw "
  );
}

const oldCargarProcedimientos = `  const cargarProcedimientos = async () => {
    try {
      setLoading(true);
      const res = await fetch(\`\${API_URL}/api/registro-genetico\`);
      const data = await res.json();
      if (data.success) {
        setProcedimientos(data.data);
      }
    } catch (error) {
      console.error('Error fetching procedimientos', error);
      Alert.alert('Error', 'No se pudieron cargar los procedimientos');
    } finally {
      setLoading(false);
    }
  };`;

const newCargarProcedimientos = `  const [offlineCount, setOfflineCount] = useState(0);

  const cargarProcedimientos = async () => {
    try {
      setLoading(true);
      
      // Intentar sincronizar si hay internet
      await sincronizarOffline();

      const res = await fetch(\`\${API_URL}/api/registro-genetico\`);
      const data = await res.json();
      if (data.success) {
        // Mezclar con los registros offline locales (si los hay y no se pudieron sincronizar)
        const offlineRaw = await AsyncStorage.getItem('offlineRegistros');
        const offlineData = offlineRaw ? JSON.parse(offlineRaw) : [];
        setOfflineCount(offlineData.length);
        
        setProcedimientos([...offlineData, ...data.data]);
      }
    } catch (error) {
      console.error('Modo Offline: No se pudieron cargar procedimientos del servidor');
      // MODO OFFLINE: Cargar lo que haya localmente (solo muestra los nuevos que no han subido, o caché si tuviéramos)
      const offlineRaw = await AsyncStorage.getItem('offlineRegistros');
      const offlineData = offlineRaw ? JSON.parse(offlineRaw) : [];
      setOfflineCount(offlineData.length);
      setProcedimientos(offlineData);
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
      
      // Intentar subir cada registro offline
      let subidos = 0;
      let fallidos = [];

      for (let reg of offlineData) {
        // Remover propiedades temporales
        const { _id, isOffline, ...payload } = reg;
        
        try {
          const res = await fetch(\`\${API_URL}/api/registro-genetico\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.success) {
            subidos++;
          } else {
            fallidos.push(reg); // Falló, mantener local
          }
        } catch (e) {
          fallidos.push(reg); // Sigue sin internet
        }
      }

      // Actualizar storage con los que fallaron
      await AsyncStorage.setItem('offlineRegistros', JSON.stringify(fallidos));
      setOfflineCount(fallidos.length);
      
      if (subidos > 0) {
        Alert.alert('Sincronización Exitosa', \`Se subieron \${subidos} registros a la nube.\`);
      }
    } catch (error) {
      console.error('Error sincronizando', error);
    }
  };`;

dashContent = dashContent.replace(oldCargarProcedimientos, newCargarProcedimientos);

const oldHeaderIcons = `<TouchableOpacity style={styles.iconButton} onPress={() => setModalAlertasVisible(true)}>`;
const newHeaderIcons = `          {offlineCount > 0 && (
            <TouchableOpacity style={styles.iconButton} onPress={cargarProcedimientos}>
              <CloudOff color="#f59e0b" size={24} />
              <View style={[styles.badgeNotif, { backgroundColor: '#f59e0b' }]}>
                <Text style={styles.badgeNotifText}>{offlineCount}</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconButton} onPress={() => setModalAlertasVisible(true)}>`;

dashContent = dashContent.replace(oldHeaderIcons, newHeaderIcons);

fs.writeFileSync('src/screens/DashboardScreen.js', dashContent);
console.log('DashboardScreen updated with offline capability!');
