import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Home, PlusCircle, ShoppingBag, User } from 'lucide-react-native';

// Componente Especializado de Ícono Médico / Enfermero IA
import DoctorNurseIcon from './src/components/DoctorNurseIcon';

// Pantallas
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CatalogoScreen from './src/screens/CatalogoScreen';
import RegistroScreen from './src/screens/RegistroScreen';
import AsistenteScreen from './src/screens/AsistenteScreen';
import PerfilScreen from './src/screens/PerfilScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true, // Para que en Android no flote sobre el teclado
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'android' ? 16 : 28,
          left: 16,
          right: 16,
          elevation: 10,
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          backgroundColor: '#ffffff',
          borderRadius: 26,
          height: 72,
          borderTopWidth: 0,
        }
      }}
    >
      {/* 1. INICIO (DASHBOARD) */}
      <Tab.Screen 
        name="Inicio" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <Home color={focused ? '#fff' : color} size={22} strokeWidth={focused ? 2.4 : 2} />
            </View>
          ),
        }}
      />

      {/* 2. CATÁLOGO / TIENDA */}
      <Tab.Screen 
        name="Catálogo" 
        component={CatalogoScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <ShoppingBag color={focused ? '#fff' : color} size={22} strokeWidth={focused ? 2.4 : 2} />
            </View>
          ),
        }}
      />

      {/* 3. REGISTRAR (BOTÓN PRINCIPAL RESALTADO EN EL CENTRO EXACTO) */}
      <Tab.Screen 
        name="Registrar" 
        component={RegistroScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              top: -18,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <View style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: '#10b981', // Verde esmeralda Sembriogan
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.45,
                shadowRadius: 10,
                elevation: 6,
                borderWidth: 4,
                borderColor: '#ffffff'
              }}>
                <PlusCircle color="#ffffff" size={32} strokeWidth={2.4} />
              </View>
            </View>
          ),
        }}
      />

      {/* 4. ASISTENTE CLÍNICO IA (CON EL NUEVO ÍCONO MÉDICO/ENFERMERO VETERINARIO) */}
      <Tab.Screen 
        name="Asistente" 
        component={AsistenteScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <DoctorNurseIcon 
                size={24} 
                color={focused ? '#ffffff' : color} 
                secondaryColor={focused ? '#bae6fd' : '#0284c7'} 
              />
            </View>
          ),
        }}
      />

      {/* 5. PERFIL DE USUARIO VETERINARIO */}
      <Tab.Screen 
        name="Perfil" 
        component={PerfilScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <User color={focused ? '#fff' : color} size={22} strokeWidth={focused ? 2.4 : 2} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Dashboard" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    padding: 10,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  iconActive: {
    backgroundColor: '#0284c7',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  }
});
