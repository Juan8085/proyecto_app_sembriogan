const fs = require('fs');

let dashContent = fs.readFileSync('src/screens/DashboardScreen.js', 'utf8');

const oldRender = `  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.arete}>{item.arete || item.animalId}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.tipoProcedimiento}</Text>
        </View>
      </View>
      <Text style={styles.detail}>Finca: {item.finca || item.productor}</Text>
      <Text style={styles.detail}>Día 0: {new Date(item.fechasProtocolo?.dia0_sincronizacion || item.createdAt).toLocaleDateString()}</Text>
      
      <View style={[styles.statusBadge, item.estadoPrenez === 'Preñada' ? styles.statusSuccess : styles.statusWarning]}>
        <Text style={styles.statusText}>{item.estadoPrenez}</Text>
      </View>
    </View>
  );`;

const newRender = `  const handleOpcionesProcedimiento = (item) => {
    Alert.alert(
      \`Procedimiento: \${item.arete || item.animalId}\`,
      \`¿Qué deseas gestionar para este protocolo de \${item.tipoProcedimiento}?\`,
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
        <Text style={styles.arete}>{item.arete || item.animalId}</Text>
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
  );`;

dashContent = dashContent.replace(oldRender, newRender);
fs.writeFileSync('src/screens/DashboardScreen.js', dashContent);
console.log('DashboardScreen updated with clickable cards!');
