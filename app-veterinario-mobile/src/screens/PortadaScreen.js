import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { getToken, getUser, isTokenExpired } from '../utils/auth';
import { ArrowRight, ShieldCheck, Dna, MapPin, Sparkles } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function PortadaScreen({ navigation }) {
  const [usuarioGuardado, setUsuarioGuardado] = useState(null);
  const [sesionValida, setSesionValida] = useState(false);

  // Animaciones
  const fadeLogo = useRef(new Animated.Value(0)).current;
  const scaleLogo = useRef(new Animated.Value(0.6)).current;
  const fadeContent = useRef(new Animated.Value(0)).current;
  const slideContent = useRef(new Animated.Value(30)).current;
  const fadeButton = useRef(new Animated.Value(0)).current;
  const pulseAura = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Verificar si ya hay una sesión activa guardada
    const verificarSesion = async () => {
      try {
        const token = await getToken();
        const user = await getUser();
        if (token && !isTokenExpired(token) && user) {
          setUsuarioGuardado(user);
          setSesionValida(true);
        }
      } catch (e) {
        console.log('Error verificando sesión en portada:', e);
      }
    };
    verificarSesion();

    // 2. Orquestar la secuencia de animación interactiva de entrada
    Animated.parallel([
      Animated.timing(fadeLogo, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleLogo, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Entrada del contenido descriptivo
      Animated.parallel([
        Animated.timing(fadeContent, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideContent, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Entrada del botón interactivo
        Animated.timing(fadeButton, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    });

    // 3. Animación de aura / resplandor pulsante detrás del logo
    const loopPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAura, {
          toValue: 1.15,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAura, {
          toValue: 1.0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    loopPulse.start();

    return () => loopPulse.stop();
  }, []);

  const handleIngresar = () => {
    if (sesionValida) {
      navigation.replace('Dashboard');
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Formas decorativas orgánicas de fondo */}
      <View style={styles.bgBlobTop} />
      <View style={styles.bgBlobBottom} />

      <View style={styles.contentWrapper}>
        {/* LOGO INTERACTIVO CON AURA Y ANIMACIÓN */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={[
              styles.auraCircle,
              {
                transform: [{ scale: pulseAura }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.logoBox,
              {
                opacity: fadeLogo,
                transform: [{ scale: scaleLogo }],
              },
            ]}
          >
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* CONTENIDO DESCRIPTIVO DE MARCA */}
        <Animated.View
          style={[
            styles.infoSection,
            {
              opacity: fadeContent,
              transform: [{ translateY: slideContent }],
            },
          ]}
        >
          {/* Badge institucional */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <ShieldCheck size={14} color="#059669" />
              <Text style={styles.badgeText}>PORTAL VETERINARIO OFICIAL</Text>
            </View>
          </View>

          <Text style={styles.appTitle}>Sembriogan</Text>
          <Text style={styles.appSubtitle}>
            Biotecnología Reproductiva Bovina & Gestión de Campo
          </Text>

          {/* Chips informativos de capacidades */}
          <View style={styles.chipsContainer}>
            <View style={styles.chip}>
              <Dna size={14} color="#0284c7" />
              <Text style={styles.chipText}>Protocolos IATF y TE</Text>
            </View>
            <View style={styles.chip}>
              <MapPin size={14} color="#059669" />
              <Text style={styles.chipText}>Fincas Georreferenciadas</Text>
            </View>
            <View style={styles.chip}>
              <Sparkles size={14} color="#7c3aed" />
              <Text style={styles.chipText}>Asistente Clínico IA</Text>
            </View>
          </View>
        </Animated.View>

        {/* BOTÓN INTERACTIVO DE ACCESO */}
        <Animated.View
          style={[
            styles.bottomSection,
            {
              opacity: fadeButton,
            },
          ]}
        >
          {sesionValida && usuarioGuardado && (
            <View style={styles.activeUserBanner}>
              <Text style={styles.activeUserText} numberOfLines={1}>
                Sesión lista: Dr. {usuarioGuardado.nombre || usuarioGuardado.email}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleIngresar}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryButtonText}>
              {sesionValida ? 'Continuar al Panel' : 'Ingresar al Sistema'}
            </Text>
            <View style={styles.arrowCircle}>
              <ArrowRight size={18} color="#0284c7" />
            </View>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Sembriogan v1.0 • Entidad Prestadora del Servicio EPSEA
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'android' ? 60 : 70,
    paddingBottom: Platform.OS === 'android' ? 36 : 46,
    zIndex: 10,
  },
  bgBlobTop: {
    position: 'absolute',
    top: -height * 0.12,
    right: -width * 0.2,
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width * 0.425,
    backgroundColor: '#e0f2fe',
    opacity: 0.7,
  },
  bgBlobBottom: {
    position: 'absolute',
    bottom: -height * 0.1,
    left: -width * 0.2,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: '#dcfce7',
    opacity: 0.6,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.04,
  },
  auraCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(2, 132, 199, 0.15)',
  },
  logoBox: {
    width: width * 0.72,
    maxWidth: 290,
    height: 120,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  badgeRow: {
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    fontWeight: '500',
    maxWidth: width * 0.8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  activeUserBanner: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 12,
    maxWidth: '90%',
  },
  activeUserText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
  },
  primaryButton: {
    width: '100%',
    height: 60,
    backgroundColor: '#0284c7',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 14,
    fontWeight: '500',
  },
});
