import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert, 
  ActivityIndicator, 
  Linking, 
  Modal, 
  TextInput,
  ScrollView,
  Platform
} from 'react-native';
import { API_URL, getApiUrl, setCustomApiUrl, getDefaultApiUrl, initApiUrl } from '../config/api';
import { 
  ShoppingBag, 
  ShoppingCart,
  CheckCircle, 
  ExternalLink, 
  X, 
  CreditCard, 
  Globe, 
  RotateCcw,
  Plus,
  Minus,
  Trash,
  ArrowRight,
  Package
} from 'lucide-react-native';

export default function CatalogoScreen({ navigation }) {
  const [productos, setProductos] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado del Carrito Multi-ítem y Cantidades
  // Estructura: { [productoId]: { producto, cantidad } }
  const [carrito, setCarrito] = useState({});
  const [modalCarritoVisible, setModalCarritoVisible] = useState(false);

  // Estado de Pago en Proceso
  const [pagoPendiente, setPagoPendiente] = useState(null);
  const [verificandoPago, setVerificandoPago] = useState(false);

  // Estados para configuración de servidor
  const [servidorActual, setServidorActual] = useState(API_URL);
  const [modalServidorVisible, setModalServidorVisible] = useState(false);
  const [inputUrlServidor, setInputUrlServidor] = useState('');
  const [probandoConexion, setProbandoConexion] = useState(false);

  useEffect(() => {
    initApiUrl().then(url => {
      setServidorActual(url);
      cargarDatos();
    });

    const unsubscribe = navigation?.addListener?.('focus', () => {
      initApiUrl().then(url => {
        setServidorActual(url);
        cargarDatos();
      });
    });
    return unsubscribe;
  }, [navigation]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const currentUrl = getApiUrl() || API_URL;
      const [resCat, resConf] = await Promise.all([
        fetch(`${currentUrl}/api/catalogo`),
        fetch(`${currentUrl}/api/configuracion`)
      ]);
      const dataCat = await resCat.json();
      const dataConf = await resConf.json();
      
      if (dataCat.success) setProductos(dataCat.data);
      if (dataConf.success) setConfig(dataConf.data);
    } catch (error) {
      console.error('Error cargando catálogo:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- OPERACIONES DEL CARRITO MULTI-ÍTEM ---
  const agregarAlCarrito = (producto) => {
    setCarrito(prev => {
      const actual = prev[producto._id]?.cantidad || 0;
      if (!producto.esServicio && producto.stock !== undefined && actual >= producto.stock) {
        Alert.alert('Stock Máximo', `Solo hay ${producto.stock} unidades disponibles en inventario.`);
        return prev;
      }
      return {
        ...prev,
        [producto._id]: {
          producto,
          cantidad: actual + 1
        }
      };
    });
  };

  const decrementarDelCarrito = (productoId) => {
    setCarrito(prev => {
      const actual = prev[productoId]?.cantidad || 0;
      if (actual <= 1) {
        const copia = { ...prev };
        delete copia[productoId];
        return copia;
      }
      return {
        ...prev,
        [productoId]: {
          ...prev[productoId],
          cantidad: actual - 1
        }
      };
    });
  };

  const eliminarDelCarrito = (productoId) => {
    setCarrito(prev => {
      const copia = { ...prev };
      delete copia[productoId];
      return copia;
    });
  };

  const vaciarCarrito = () => {
    setCarrito({});
    setModalCarritoVisible(false);
  };

  // Totales calculados
  const itemsCarrito = Object.values(carrito);
  const totalCantidadItems = itemsCarrito.reduce((sum, item) => sum + item.cantidad, 0);
  const totalMontoCarrito = itemsCarrito.reduce((sum, item) => sum + ((item.producto.costo || 0) * item.cantidad), 0);

  // --- CONFIGURACIÓN DE SERVIDOR ---
  const probarYGuardarServidor = async (urlAProbar) => {
    const urlLimpia = (urlAProbar || '').trim().replace(/\/$/, '');
    if (!urlLimpia) {
      Alert.alert('Error', 'Por favor ingresa una URL válida.');
      return;
    }

    setProbandoConexion(true);
    try {
      const res = await fetch(`${urlLimpia}/api/configuracion`);
      const data = await res.json();
      if (data && data.success !== undefined) {
        const nuevaUrl = await setCustomApiUrl(urlLimpia);
        setServidorActual(nuevaUrl);
        setModalServidorVisible(false);
        Alert.alert('✅ Conexión Exitosa', `Servidor configurado correctamente en:\n${nuevaUrl}`);
        cargarDatos();
      } else {
        Alert.alert('Aviso', 'El servidor respondió pero no es un backend de Sembriogan válido.');
      }
    } catch (e) {
      Alert.alert('Error de Conexión', `No se pudo conectar a "${urlLimpia}". Verifica que el túnel o servidor esté encendido.`);
    } finally {
      setProbandoConexion(false);
    }
  };

  const restaurarDeteccionAuto = async () => {
    const defaultUrl = await setCustomApiUrl(null);
    setServidorActual(defaultUrl);
    setModalServidorVisible(false);
    Alert.alert('🔄 Restaurado', `Se restauró la detección automática de Wi-Fi:\n${defaultUrl}`);
    cargarDatos();
  };

  // --- PROCESO DE COBRO CON WOMPI (MULTI-ÍTEM O DIRECTO) ---
  const iniciarCobroDirecto = (producto) => {
    // Si ya hay otros productos en carrito, sugerimos abrir el pedido
    if (totalCantidadItems > 0 && !carrito[producto._id]) {
      agregarAlCarrito(producto);
      setModalCarritoVisible(true);
      return;
    }
    // Si no hay nada más en carrito, procesa el cobro de esta 1 unidad directamente
    procesarCobroWompi([{ producto, cantidad: 1 }], producto.costo || 0);
  };

  const procesarCobroWompi = async (listaItems, montoTotal) => {
    if (!listaItems || listaItems.length === 0) {
      Alert.alert('Aviso', 'No hay ítems seleccionados para cobrar.');
      return;
    }

    const currentUrl = getApiUrl() || API_URL;

    if (!config || !config.wompiPublicKey) {
      Alert.alert('Error', 'El sistema de pagos no está configurado (Falta Llave Pública de Wompi).');
      return;
    }

    const amountInCents = Math.round((montoTotal || 0) * 100);
    if (amountInCents <= 0) {
      Alert.alert('Error', 'El monto a cobrar debe ser mayor a 0 COP.');
      return;
    }

    const reference = `VET-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Obtener firma de integridad del backend
    let signature = '';
    try {
      const res = await fetch(`${currentUrl}/api/configuracion/generar-firma`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, amountInCents, currency: 'COP' })
      });
      const data = await res.json();
      if (data.success && data.signature) {
        signature = data.signature;
      }
    } catch (err) {
      console.error('Error fetching signature:', err);
    }

    const finalKey = (config.wompiPublicKey && config.wompiPublicKey !== 'undefined')
      ? config.wompiPublicKey
      : 'pub_test_ljKW2orNya3GoWqfTCl1wu6vOy50mnnh';

    let wompiUrl = `https://checkout.wompi.co/p/?public-key=${finalKey}&currency=COP&amount-in-cents=${amountInCents}&reference=${reference}`;

    // Si la API está en túnel público HTTPS o Render, Wompi permite redirect-url
    if (currentUrl.startsWith('https://')) {
      const redirectUrl = `${currentUrl}/api/pagos/confirmar-wompi?ref=${reference}`;
      wompiUrl += `&redirect-url=${encodeURIComponent(redirectUrl)}`;
    }

    if (signature) {
      wompiUrl += `&signature:integrity=${signature}`;
    }

    // Guardar detalles del pago pendiente para confirmación
    setPagoPendiente({
      items: listaItems.map(it => ({
        _id: it.producto._id,
        nombre: it.producto.tipo || it.producto.nombre,
        costo: it.producto.costo || 0,
        cantidad: it.cantidad,
        esServicio: it.producto.esServicio
      })),
      total: montoTotal,
      amountInCents,
      reference,
      wompiUrl
    });

    setModalCarritoVisible(false);

    // Abrir pasarela de Wompi en navegador nativo seguro
    Linking.openURL(wompiUrl).catch(err => {
      console.error('Failed to open Wompi URL:', err);
      Alert.alert('Error', 'No se pudo abrir el navegador para el pago.');
    });
  };

  const confirmarPagoManual = async () => {
    if (!pagoPendiente) return;
    setVerificandoPago(true);
    try {
      const currentUrl = getApiUrl() || API_URL;
      const res = await fetch(`${currentUrl}/api/pagos/verificar-transaccion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: pagoPendiente.reference,
          items: pagoPendiente.items.map(it => ({
            catalogoItem: it._id,
            tipo: it.nombre,
            costo: it.costo,
            cantidad: it.cantidad
          })),
          total: pagoPendiente.total,
          cliente: {
            nombre: 'Veterinario Móvil (Campo)',
            email: 'veterinario@sembriogan.com'
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        Alert.alert(
          '✅ ¡Pago Registrado Exitosamente!',
          `La transacción por $${new Intl.NumberFormat('es-CO').format(pagoPendiente.total)} COP fue registrada en el panel administrativo y el inventario ha sido actualizado.`
        );
        setCarrito({});
        setPagoPendiente(null);
        cargarDatos();
      } else {
        Alert.alert('Aviso', data.mensaje || 'No se pudo confirmar la transacción.');
      }
    } catch (err) {
      console.error('Error verificando pago:', err);
      Alert.alert('Error de conexión', 'No fue posible validar la transacción con el servidor.');
    } finally {
      setVerificandoPago(false);
    }
  };

  const currentUrl = getApiUrl() || API_URL;

  const renderItem = ({ item }) => {
    const cantidadEnCarrito = carrito[item._id]?.cantidad || 0;
    const agotado = !item.esServicio && (item.stock || 0) <= 0;

    return (
      <View style={styles.card}>
        <Image 
          source={{ uri: item.imagen ? (item.imagen.startsWith('http') ? item.imagen : `${currentUrl}${item.imagen}`) : 'https://via.placeholder.com/150?text=Sembriogan' }} 
          style={styles.image} 
          resizeMode="cover"
        />
        <View style={styles.info}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={[styles.title, { flex: 1, marginRight: 8 }]}>{item.tipo || item.nombre}</Text>
            <View style={[styles.typeBadge, item.esServicio ? styles.serviceBadge : styles.productBadge]}>
              <Text style={[styles.typeBadgeText, item.esServicio ? styles.serviceBadgeText : styles.productBadgeText]}>
                {item.esServicio ? 'Servicio' : 'Producto'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.description} numberOfLines={2}>
            {item.descripcion || 'Sin descripción disponible'}
          </Text>
          
          <View style={styles.metaRow}>
            <Text style={styles.price}>
              ${new Intl.NumberFormat('es-CO').format(item.costo || 0)} COP
            </Text>
            
            {!item.esServicio && (
              <Text style={[styles.stock, (item.stock || 0) <= 5 ? styles.stockLow : styles.stockOk]}>
                Stock: {item.stock || 0}
              </Text>
            )}
          </View>

          {/* Acciones de Selección / Cantidad */}
          {agotado ? (
            <View style={styles.agotadoContainer}>
              <Text style={styles.agotadoText}>Agotado en Inventario</Text>
            </View>
          ) : cantidadEnCarrito > 0 ? (
            <View style={styles.qtyContainer}>
              <View style={styles.qtyControlsRow}>
                <TouchableOpacity 
                  style={styles.qtyButton} 
                  onPress={() => decrementarDelCarrito(item._id)}
                  activeOpacity={0.7}
                >
                  <Minus size={16} color="#0284c7" />
                </TouchableOpacity>

                <View style={styles.qtyInfo}>
                  <Text style={styles.qtyCountText}>{cantidadEnCarrito}</Text>
                  <Text style={styles.qtyLabelText}>en pedido</Text>
                </View>

                <TouchableOpacity 
                  style={styles.qtyButton} 
                  onPress={() => agregarAlCarrito(item)}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color="#0284c7" />
                </TouchableOpacity>
              </View>

              <View style={styles.subtotalBadge}>
                <Text style={styles.subtotalLabel}>Subtotal: </Text>
                <Text style={styles.subtotalValue}>
                  ${new Intl.NumberFormat('es-CO').format((item.costo || 0) * cantidadEnCarrito)} COP
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.cardActionsRow}>
              <TouchableOpacity 
                style={styles.addCartBtn}
                onPress={() => agregarAlCarrito(item)}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#0284c7" />
                <Text style={styles.addCartBtnText}>Agregar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.quickPayBtn}
                onPress={() => iniciarCobroDirecto(item)}
                activeOpacity={0.8}
              >
                <CreditCard size={15} color="#ffffff" />
                <Text style={styles.quickPayBtnText}>Cobrar 1</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER PRINCIPAL */}
      <View style={styles.header}>
        <ShoppingBag color="#0ea5e9" size={28} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Catálogo de Ventas</Text>
          <Text style={styles.headerSubtitle}>Productos y servicios veterinarios</Text>
        </View>

        {/* Botón Carrito en Header */}
        {totalCantidadItems > 0 && (
          <TouchableOpacity 
            style={styles.headerCartBtn}
            onPress={() => setModalCarritoVisible(true)}
            activeOpacity={0.8}
          >
            <ShoppingCart size={20} color="#0284c7" />
            <View style={styles.headerCartBadge}>
              <Text style={styles.headerCartBadgeText}>{totalCantidadItems}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.loadingText}>Cargando catálogo...</Text>
        </View>
      ) : (
        <FlatList
          data={productos}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay productos disponibles en este momento.</Text>
            </View>
          }
        />
      )}

      {/* BARRA FLOTANTE DE RESUMEN DE PEDIDO (Ubicada exactamente arriba del TabBar) */}
      {totalCantidadItems > 0 && (
        <View style={styles.floatingOrderBar}>
          <TouchableOpacity 
            style={styles.floatingOrderInner}
            onPress={() => setModalCarritoVisible(true)}
            activeOpacity={0.9}
          >
            <View style={styles.floatingOrderLeft}>
              <View style={styles.floatingCartIconCircle}>
                <ShoppingCart size={20} color="#ffffff" />
                <View style={styles.floatingBadge}>
                  <Text style={styles.floatingBadgeText}>{totalCantidadItems}</Text>
                </View>
              </View>
              <View>
                <Text style={styles.floatingOrderCount}>
                  {totalCantidadItems === 1 ? '1 ítem seleccionado' : `${totalCantidadItems} ítems seleccionados`}
                </Text>
                <Text style={styles.floatingOrderTotal}>
                  Total: ${new Intl.NumberFormat('es-CO').format(totalMontoCarrito)} COP
                </Text>
              </View>
            </View>

            <View style={styles.floatingOrderAction}>
              <Text style={styles.floatingOrderActionText}>Ver / Cobrar</Text>
              <ArrowRight size={16} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL DETALLADO DE CARRITO / PEDIDO MULTI-ÍTEM */}
      <Modal visible={modalCarritoVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCarritoContent}>
            {/* Cabecera del Carrito */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8 }}>
                <ShoppingCart size={22} color="#0284c7" />
                <Text style={styles.modalTitle}>Resumen de Cobro y Venta</Text>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setModalCarritoVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Revisa los productos y servicios a cobrar. Puedes ajustar cantidades o eliminar ítems:
            </Text>

            {itemsCarrito.length === 0 ? (
              <View style={styles.carritoVacio}>
                <Package size={44} color="#94a3b8" />
                <Text style={styles.carritoVacioText}>No tienes ítems en el pedido actual.</Text>
              </View>
            ) : (
              <ScrollView style={styles.carritoListScroll} showsVerticalScrollIndicator={false}>
                {itemsCarrito.map(({ producto, cantidad }) => {
                  const subtotal = (producto.costo || 0) * cantidad;
                  return (
                    <View key={producto._id} style={styles.carritoItemRow}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <Text style={styles.carritoItemTitle} numberOfLines={1}>
                            {producto.tipo || producto.nombre}
                          </Text>
                          <View style={[styles.typeBadgeSmall, producto.esServicio ? styles.serviceBadge : styles.productBadge]}>
                            <Text style={[styles.typeBadgeSmallText, producto.esServicio ? styles.serviceBadgeText : styles.productBadgeText]}>
                              {producto.esServicio ? 'Servicio' : 'Prod'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.carritoItemUnitPrice}>
                          ${new Intl.NumberFormat('es-CO').format(producto.costo || 0)} COP c/u
                        </Text>
                        <Text style={styles.carritoItemSubtotal}>
                          Subtotal: ${new Intl.NumberFormat('es-CO').format(subtotal)} COP
                        </Text>
                      </View>

                      {/* Controles de cantidad en el modal */}
                      <View style={styles.modalQtyControls}>
                        <TouchableOpacity 
                          style={styles.modalQtyBtn} 
                          onPress={() => decrementarDelCarrito(producto._id)}
                        >
                          <Minus size={14} color="#0284c7" />
                        </TouchableOpacity>

                        <Text style={styles.modalQtyText}>{cantidad}</Text>

                        <TouchableOpacity 
                          style={styles.modalQtyBtn} 
                          onPress={() => agregarAlCarrito(producto)}
                        >
                          <Plus size={14} color="#0284c7" />
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={styles.modalDeleteBtn} 
                          onPress={() => eliminarDelCarrito(producto._id)}
                        >
                          <Trash size={15} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {/* Totalizador del Carrito */}
            {itemsCarrito.length > 0 && (
              <View style={styles.carritoTotalBox}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Unidades:</Text>
                  <Text style={styles.totalValueItems}>{totalCantidadItems} ítems</Text>
                </View>
                <View style={[styles.totalRow, { marginTop: 4 }]}>
                  <Text style={styles.totalLabelPrincipal}>Gran Total a Cobrar:</Text>
                  <Text style={styles.totalValuePrincipal}>
                    ${new Intl.NumberFormat('es-CO').format(totalMontoCarrito)} COP
                  </Text>
                </View>
              </View>
            )}

            {/* Botones de Acción del Modal */}
            {itemsCarrito.length > 0 && (
              <TouchableOpacity 
                style={styles.btnCobrarTotal}
                onPress={() => procesarCobroWompi(itemsCarrito, totalMontoCarrito)}
                activeOpacity={0.85}
              >
                <CreditCard size={18} color="#ffffff" />
                <Text style={styles.btnCobrarTotalText}>
                  Cobrar ${new Intl.NumberFormat('es-CO').format(totalMontoCarrito)} con Wompi
                </Text>
              </TouchableOpacity>
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              {itemsCarrito.length > 0 && (
                <TouchableOpacity 
                  style={styles.btnVaciar}
                  onPress={vaciarCarrito}
                >
                  <Text style={styles.btnVaciarText}>Vaciar Pedido</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.btnSeguir, itemsCarrito.length === 0 && { flex: 1 }]}
                onPress={() => setModalCarritoVisible(false)}
              >
                <Text style={styles.btnSeguirText}>Seguir Seleccionando</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CONFIGURACIÓN DE SERVIDOR */}
      <Modal visible={modalServidorVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8 }}>
                <Globe size={20} color="#0284c7" />
                <Text style={styles.modalTitle}>Configurar Servidor</Text>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseBtn}
                onPress={() => setModalServidorVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Si estás en el SENA o fuera de tu casa, pega aquí la URL del túnel público (ej: localtunnel o ngrok):
            </Text>

            <TextInput 
              style={styles.modalInput} 
              placeholder="https://tu-tunel.loca.lt"
              value={inputUrlServidor}
              onChangeText={setInputUrlServidor}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={() => probarYGuardarServidor(inputUrlServidor)}
              disabled={probandoConexion}
            >
              {probandoConexion ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Guardar y Probar Conexión</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.resetBtn} 
              onPress={restaurarDeteccionAuto}
            >
              <RotateCcw size={16} color="#475569" style={{ marginRight: 6 }} />
              <Text style={styles.resetBtnText}>Restaurar Detección Wi-Fi Automática</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE CONFIRMACIÓN DE PAGO WOMPI */}
      {pagoPendiente && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8 }}>
                  <CreditCard color="#0ea5e9" size={24} />
                  <Text style={styles.modalTitle}>Pago en Proceso</Text>
                </View>
                <TouchableOpacity 
                  style={styles.modalCloseBtn}
                  onPress={() => setPagoPendiente(null)} 
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X color="#475569" size={18} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Hemos abierto la pasarela segura de Wompi en tu navegador. Completa la transacción allí y regresa a confirmar.
              </Text>

              <View style={styles.productSummary}>
                <Text style={styles.summaryLabel}>Ítems a Cobrar ({pagoPendiente.items?.length || 1}):</Text>
                <ScrollView style={{ maxHeight: 110, marginVertical: 6 }} showsVerticalScrollIndicator={false}>
                  {pagoPendiente.items?.map((it, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
                      <Text style={[styles.summaryValue, { fontSize: 13, flex: 1, marginRight: 6 }]}>
                        • {it.nombre} x{it.cantidad}
                      </Text>
                      <Text style={[styles.summaryValue, { fontSize: 13, fontWeight: '700', color: '#0f172a' }]}>
                        ${new Intl.NumberFormat('es-CO').format((it.costo || 0) * it.cantidad)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>

                <Text style={[styles.summaryLabel, { marginTop: 6 }]}>Total a Pagar:</Text>
                <Text style={[styles.summaryValue, { color: '#10b981', fontSize: 19, fontWeight: '900' }]}>
                  ${new Intl.NumberFormat('es-CO').format(pagoPendiente.total)} COP
                </Text>

                <Text style={[styles.summaryLabel, { marginTop: 6 }]}>Referencia:</Text>
                <Text style={[styles.summaryValue, { fontFamily: 'monospace', fontSize: 11, color: '#64748b' }]}>
                  {pagoPendiente.reference}
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={confirmarPagoManual}
                disabled={verificandoPago}
              >
                {verificandoPago ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <CheckCircle color="#ffffff" size={20} />
                    <Text style={styles.confirmButtonText}>Ya completé el pago en Wompi</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.reopenButton} 
                onPress={() => Linking.openURL(pagoPendiente.wompiUrl)}
              >
                <ExternalLink color="#0ea5e9" size={18} />
                <Text style={styles.reopenButtonText}>Reabrir Pasarela Wompi</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setPagoPendiente(null)}
              >
                <Text style={styles.cancelButtonText}>Cerrar sin confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
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
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  headerCartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  headerCartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#10b981',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  headerCartBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 220, // Espacio suficiente para evitar que la barra flotante y el tab bar oculten contenido
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: '#e2e8f0',
  },
  info: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  serviceBadge: {
    backgroundColor: '#e0f2fe',
  },
  productBadge: {
    backgroundColor: '#fef3c7',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  typeBadgeSmallText: {
    fontSize: 9,
    fontWeight: '800',
  },
  serviceBadgeText: {
    color: '#0369a1',
  },
  productBadgeText: {
    color: '#b45309',
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0ea5e9',
  },
  stock: {
    fontSize: 12,
    fontWeight: '600',
  },
  stockOk: {
    color: '#10b981',
  },
  stockLow: {
    color: '#ef4444',
  },
  agotadoContainer: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  agotadoText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 'bold',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  addCartBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    borderWidth: 1.5,
    borderColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addCartBtnText: {
    color: '#0284c7',
    fontSize: 13,
    fontWeight: 'bold',
  },
  quickPayBtn: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickPayBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  qtyContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  qtyControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  qtyInfo: {
    alignItems: 'center',
  },
  qtyCountText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  qtyLabelText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  subtotalBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  subtotalLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  subtotalValue: {
    fontSize: 13,
    color: '#10b981',
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },

  /* BARRA FLOTANTE DE PEDIDO */
  floatingOrderBar: {
    position: 'absolute',
    bottom: 96, // Ubicado flotante exactamente arriba del TabBar
    left: 16,
    right: 16,
    zIndex: 99,
  },
  floatingOrderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  floatingOrderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floatingCartIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#10b981',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#0f172a',
  },
  floatingBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  floatingOrderCount: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  floatingOrderTotal: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  floatingOrderAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  floatingOrderActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  /* MODAL CARRITO */
  modalCarritoContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  carritoVacio: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  carritoVacioText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  carritoListScroll: {
    maxHeight: 250,
    marginVertical: 10,
  },
  carritoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  carritoItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    maxWidth: 150,
  },
  carritoItemUnitPrice: {
    fontSize: 11,
    color: '#64748b',
  },
  carritoItemSubtotal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
    marginTop: 2,
  },
  modalQtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalQtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  modalQtyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    minWidth: 20,
    textAlign: 'center',
  },
  modalDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  carritoTotalBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  totalValueItems: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  totalLabelPrincipal: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '800',
  },
  totalValuePrincipal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10b981',
  },
  btnCobrarTotal: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnCobrarTotalText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  btnVaciar: {
    flex: 1,
    backgroundColor: '#fee2e2',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnVaciarText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnSeguir: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnSeguirText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },

  /* MODALES GENERALES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginLeft: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: '#0284c7',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  resetBtn: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  resetBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  productSummary: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 2,
  },
  confirmButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 10,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  reopenButton: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 10,
  },
  reopenButtonText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
});
