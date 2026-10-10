const fs = require('fs');

// 1. UPDATE BACKEND MODEL
let modelContent = fs.readFileSync('../backend-api/models/registro_genetico.model.js', 'utf8');
modelContent = modelContent.replace(/enum: \['IATF', 'TE', 'Diagnostico'\]/g, "enum: ['IATF', 'TE', 'Diagnostico', 'IA']");

if (!modelContent.includes("=== 'IA'")) {
    modelContent = modelContent.replace(
        /} else if \(this\.tipoProcedimiento === 'Diagnostico'\) {/g,
        `} else if (this.tipoProcedimiento === 'IA') {\n            this.fechasProtocolo.dia45_confirmacion = sumarDias(dia0, 45);\n        } else if (this.tipoProcedimiento === 'Diagnostico') {`
    );
}
fs.writeFileSync('../backend-api/models/registro_genetico.model.js', modelContent);

// 2. UPDATE APP.JS (BOTTOM TABS)
const appContent = `import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Home, PlusCircle, Settings } from 'lucide-react-native';

// Pantallas
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import RegistroScreen from './src/screens/RegistroScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
        }
      }}
    >
      <Tab.Screen 
        name="Inicio" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tab.Screen 
        name="Registrar" 
        component={RegistroScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
`;
fs.writeFileSync('App.js', appContent);

// 3. UPDATE REGISTRO SCREEN
let regContent = fs.readFileSync('src/screens/RegistroScreen.js', 'utf8');

// Change padding to fit inside tab navigation better
regContent = regContent.replace(/marginBottom: 40,/g, 'marginBottom: 80,');
// Remove back button from RegistroScreen if we want since it's a tab now
regContent = regContent.replace(/<TouchableOpacity onPress=\{\(\) => navigation\.goBack\(\)\} style=\{styles\.backButton\}>[\s\S]*?<\/TouchableOpacity>/g, '<View style={{ width: 24 }} />');

// Update buttons group
const btnGroupOrig = `<View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.typeButton, form.tipoProcedimiento === 'IATF' && styles.typeButtonActive]}
              onPress={() => setField('tipoProcedimiento', 'IATF')}
            >
              <Text style={[styles.typeButtonText, form.tipoProcedimiento === 'IATF' && styles.typeButtonTextActive]}>IATF</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeButton, form.tipoProcedimiento === 'TE' && styles.typeButtonActive]}
              onPress={() => setField('tipoProcedimiento', 'TE')}
            >
              <Text style={[styles.typeButtonText, form.tipoProcedimiento === 'TE' && styles.typeButtonTextActive]}>T.E.</Text>
            </TouchableOpacity>
          </View>`;

const btnGroupNew = `<View style={styles.buttonGroup}>
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
          </View>`;

regContent = regContent.replace(btnGroupOrig, btnGroupNew);

// Replace default state
regContent = regContent.replace(/tipoProcedimiento: 'IATF',/g, "tipoProcedimiento: 'IATF',");

fs.writeFileSync('src/screens/RegistroScreen.js', regContent);

// 4. UPDATE DASHBOARD SCREEN (Remove FAB since it's now in bottom tabs)
let dashContent = fs.readFileSync('src/screens/DashboardScreen.js', 'utf8');
dashContent = dashContent.replace(/<TouchableOpacity[\s\S]*?style=\{styles\.fab\}[\s\S]*?<\/TouchableOpacity>/g, '');
fs.writeFileSync('src/screens/DashboardScreen.js', dashContent);

console.log("Updated files for bottom tabs and new types.");
