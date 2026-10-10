const fs = require('fs');

let regContent = fs.readFileSync('src/screens/RegistroScreen.js', 'utf8');

// Ensure AsyncStorage is imported
if (!regContent.includes("import AsyncStorage")) {
  regContent = regContent.replace(
    /import \{ View, Text/g,
    "import AsyncStorage from '@react-native-async-storage/async-storage';\nimport { View, Text"
  );
}

const oldHandleGuardar = `      const res = await fetch(\`\${API_URL}/api/registro-genetico\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        Alert.alert('Éxito', 'Procedimiento registrado correctamente.');
        navigation.goBack();
      } else {
        Alert.alert('Error', data.mensaje || 'Hubo un error al registrar.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo conectar al servidor.');
    } finally {
      setLoading(false);
    }`;

const newHandleGuardar = `      try {
        const res = await fetch(\`\${API_URL}/api/registro-genetico\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
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
    }`;

regContent = regContent.replace(oldHandleGuardar, newHandleGuardar);
fs.writeFileSync('src/screens/RegistroScreen.js', regContent);
console.log('RegistroScreen updated with offline capability!');
