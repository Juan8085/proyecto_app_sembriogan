import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Home, PlusCircle, ShoppingBag, Bot, User } from 'lucide-react-native';

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
        tabBarHideOnKeyboard: true, // ESENCIAL para que en Android no flote sobre el teclado
        tabBarActiveTintColor: '#0ea5e9',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'android' ? 20 : 30,
          left: 16,
          right: 16,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          backgroundColor: '#ffffff',
          borderRadius: 24,
          height: 70,
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
              <Home color={focused ? '#fff' : color} size={22} />
            </View>
          ),
        }}
      />

      {/* 2. CATÁLOGO / PRODUCTOS */}
      <Tab.Screen 
        name="Catálogo" 
        component={CatalogoScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <ShoppingBag color={focused ? '#fff' : color} size={22} />
            </View>
          ),
        }}
      />

      {/* 3. REGISTRAR PROCEDIMIENTO (BOTÓN CENTRADO RESALTADO EN LA MITAD EXACTA) */}
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
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: '#10b981', // Verde resaltado Sembriogan
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
                <PlusCircle color="#ffffff" size={30} />
              </View>
            </View>
          ),
        }}
      />

      {/* 4. ASISTENTE CLÍNICO IA */}
      <Tab.Screen 
        name="Asistente" 
        component={AsistenteScreen} 
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconActive]}>
              <Bot color={focused ? '#fff' : color} size={22} />
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
              <User color={focused ? '#fff' : color} size={22} />
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
    backgroundColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  }
});
