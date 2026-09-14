let db;
const DB_NAME = 'SembrioganVetDB';
const STORE_REPORTES = 'registros_offline';
const STORE_CATALOGO = 'catalogo_cache';
let carrito = [];

document.addEventListener('DOMContentLoaded', () => {
    inicializarDB();
    registrarServiceWorker();
    configurarRed();
    
    document.getElementById('form-vet-offline').addEventListener('submit', guardarRegistroLocal);
    document.getElementById('btn-sync').addEventListener('click', sincronizarConServidor);
});

// ==========================================
// 1. CONFIGURACIÓN DE INDEXEDDB (Ampliación)
// ==========================================
const inicializarDB = () => {
    const request = indexedDB.open(DB_NAME, 2); // Incrementamos versión para actualizar la BD

    request.onerror = (e) => console.error("Error al abrir IndexedDB", e);
    
    request.onsuccess = (e) => {
        db = e.target.result;
        actualizarContadorPendientes();
        cargarCatalogoVet();
    };

    request.onupgradeneeded = (e) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains(STORE_REPORTES)) {
            database.createObjectStore(STORE_REPORTES, { keyPath: 'id', autoIncrement: true });
        }
        if (!database.objectStoreNames.contains(STORE_CATALOGO)) {
            database.createObjectStore(STORE_CATALOGO, { keyPath: '_id' });
        }
    };
};

const registrarServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(err => console.error(err));
    }
};

const configurarRed = () => {
    const badge = document.getElementById('network-status');

    const actualizarEstadoRed = () => {
        if (navigator.onLine) {
            badge.textContent = 'Online';
            badge.className = 'status-badge online';
            sincronizarConServidor();
            sincronizarCatalogoRemoto(); // Descarga catálogo actualizado si hay red
        } else {
            badge.textContent = 'Offline';
            badge.className = 'status-badge offline';
        }
    };

    window.addEventListener('online', actualizarEstadoRed);
    window.addEventListener('offline', actualizarEstadoRed);
    actualizarEstadoRed();
};

// ==========================================
// 2. CONTROL DE PESTAÑAS EN LA VISTA MÓVIL
// ==========================================
window.cambiarVista = (vista) => {
    const vReportes = document.getElementById('vista-reportes');
    const vCatalogo = document.getElementById('vista-catalogo');
    const btnR = document.getElementById('btn-v-reportes');
    const btnC = document.getElementById('btn-v-catalogo');

    if (vista === 'reportes') {
        vReportes.style.display = 'block';
        vCatalogo.style.display = 'none';
        btnR.style.background = '#0284c7';
        btnR.style.color = 'white';
        btnC.style.background = '#e2e8f0';
        btnC.style.color = '#1e293b';
    } else {
        vReportes.style.display = 'none';
        vCatalogo.style.display = 'block';
        btnC.style.background = '#0284c7';
        btnC.style.color = 'white';
        btnR.style.background = '#e2e8f0';
        btnR.style.color = '#1e293b';
    }
};

// ==========================================
// 3. GESTIÓN DE CATÁLOGO Y CARRITO OFFLINE
// ==========================================
const sincronizarCatalogoRemoto = async () => {
    try {
        const res = await fetch('http://localhost:3000/api/catalogo');
        const data = await res.json();
        
        if (data.success && db) {
            const tx = db.transaction([STORE_CATALOGO], 'readwrite');
            const store = tx.objectStore(STORE_CATALOGO);
            
            // Limpiamos la caché vieja y guardamos los nuevos
            store.clear();
            data.data.forEach(item => {
                store.put(item);
            });

            tx.oncomplete = () => {
                console.log('Catálogo sincronizado y guardado en IndexedDB');
                cargarCatalogoVet(); // <--- Llamamos a pintar los productos de inmediato
            };
        }
    } catch (e) {
        console.error('No se pudo actualizar catálogo remoto, cargando caché local:', e);
        cargarCatalogoVet(); // Si falla la red, cargamos lo que haya guardado
    }
};

const cargarCatalogoVet = () => {
    if (!db) return;
    const tx = db.transaction([STORE_CATALOGO], 'readonly');
    const store = tx.objectStore(STORE_CATALOGO);
    const req = store.getAll();

    req.onsuccess = (e) => {
        const productos = e.target.result;
        const grid = document.getElementById('vet-catalog-grid');
        grid.innerHTML = '';

        if (productos.length === 0) {
            grid.innerHTML = '<p style="color:#64748b;">No hay productos en caché. Conéctate a internet para descargarlos.</p>';
            return;
        }

        const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

        productos.forEach(p => {
            const div = document.createElement('div');
            div.style.background = 'white';
            div.style.padding = '12px';
            div.style.borderRadius = '8px';
            div.style.border = '1px solid #cbd5e1';
            div.innerHTML = `
                <h4 style="color: #0284c7;">${p.tipo}</h4>
                <p style="font-size: 0.85rem; color: #64748b; margin: 5px 0;">${p.descripcion}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                    <strong>${formatoCOP.format(p.costo)}</strong>
                    <button onclick="agregarAlCarrito('${p.tipo}', ${p.costo})" style="background:#22c55e; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Añadir</button>
                </div>
            `;
            grid.appendChild(div);
        });
    };
};

window.agregarAlCarrito = (tipo, costo) => {
    carrito.push({ tipo, costo });
    renderizarCarrito();
};

const renderizarCarrito = () => {
    const contenedor = document.getElementById('vet-carrito-items');
    if (carrito.length === 0) {
        contenedor.innerHTML = '<p style="color: #64748b;">No hay productos agregados.</p>';
        return;
    }

    const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
    let total = 0;
    let html = '<ul style="padding-left: 20px; margin-bottom: 10px;">';
    
    carrito.forEach((item, index) => {
        total += item.costo;
        html += `<li>${item.tipo} - ${formatoCOP.format(item.costo)} <button onclick="quitarDelCarrito(${index})" style="color:red; background:none; border:none; cursor:pointer;">[X]</button></li>`;
    });
    
    html += `</ul><strong>Total: ${formatoCOP.format(total)}</strong>`;
    contenedor.innerHTML = html;
};

window.quitarDelCarrito = (index) => {
    carrito.splice(index, 1);
    renderizarCarrito();
};

window.guardarPedidoOffline = () => {
    const productor = document.getElementById('cart-productor').value;
    const finca = document.getElementById('cart-finca').value;

    if (!productor || !finca || carrito.length === 0) {
        alert('Por favor completa el nombre, la finca y añade al menos un producto al carrito.');
        return;
    }

    const resumenServicios = carrito.map(i => i.tipo).join(', ');
    const totalPedido = carrito.reduce((acc, i) => acc + i.costo, 0);

    const nuevoReporte = {
        productor,
        finca,
        servicio: `[PEDIDO OFFLINE] ${resumenServicios} (Total: $${totalPedido})`,
        observaciones: 'Venta realizada en campo mediante App Móvil Offline.',
        fecha: new Date().toISOString()
    };

    const tx = db.transaction([STORE_REPORTES], 'readwrite');
    const store = tx.objectStore(STORE_REPORTES);
    const req = store.add(nuevoReporte);

    req.onsuccess = () => {
        alert('📦 ¡Pedido guardado localmente! Se sincronizará con el panel administrativo al recuperar red.');
        carrito = [];
        renderizarCarrito();
        document.getElementById('cart-productor').value = '';
        document.getElementById('cart-finca').value = '';
        actualizarContadorPendientes();
        cambiarVista('reportes');
    };
};

// ==========================================
// 4. REPORTES CLÍNICOS Y SINCRONIZACIÓN
// ==========================================
const guardarRegistroLocal = (e) => {
    e.preventDefault();
    const nuevoReporte = {
        productor: document.getElementById('vet-productor').value,
        finca: document.getElementById('vet-finca').value,
        servicio: document.getElementById('vet-servicio').value,
        observaciones: document.getElementById('vet-observaciones').value,
        fecha: new Date().toISOString()
    };

    const tx = db.transaction([STORE_REPORTES], 'readwrite');
    const store = tx.objectStore(STORE_REPORTES);
    const req = store.add(nuevoReporte);

    req.onsuccess = () => {
        alert('✅ Reporte clínico guardado localmente.');
        document.getElementById('form-vet-offline').reset();
        actualizarContadorPendientes();
        if (navigator.onLine) sincronizarConServidor();
    };
};

const actualizarContadorPendientes = () => {
    if (!db) return;
    const tx = db.transaction([STORE_REPORTES], 'readonly');
    const store = tx.objectStore(STORE_REPORTES);
    const req = store.getAll();

    req.onsuccess = (e) => {
        const registros = e.target.result;
        document.getElementById('sync-counter').textContent = `${registros.length} pendientes`;
        
        const contenedor = document.getElementById('lista-offline');
        contenedor.innerHTML = '';

        registros.forEach(r => {
            const div = document.createElement('div');
            div.style.background = '#f8fafc';
            div.style.padding = '8px';
            div.style.margin = '5px 0';
            div.style.borderRadius = '4px';
            div.style.borderLeft = '3px solid #0284c7';
            div.style.fontSize = '0.85rem';
            div.innerHTML = `<strong>${r.productor}</strong> (${r.finca}) - ${r.servicio}`;
            contenedor.appendChild(div);
        });
    };
};

const sincronizarConServidor = async () => {
    if (!navigator.onLine || !db) return;

    const tx = db.transaction([STORE_REPORTES], 'readonly');
    const store = tx.objectStore(STORE_REPORTES);
    const req = store.getAll();

    req.onsuccess = async (e) => {
        const registros = e.target.result;
        if (registros.length === 0) return;

        let idsParaBorrar = [];

        for (const reg of registros) {
            try {
                const respuesta = await fetch('http://localhost:3000/api/solicitudes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productor: reg.productor,
                        finca: reg.finca,
                        servicio: reg.servicio
                    })
                });

                const resultado = await respuesta.json();
                if (resultado.success) {
                    idsParaBorrar.push(reg.id);
                }
            } catch (err) {
                console.error('Error de sincronización:', err);
            }
        }

        if (idsParaBorrar.length > 0) {
            const deleteTx = db.transaction([STORE_REPORTES], 'readwrite');
            const deleteStore = deleteTx.objectStore(STORE_REPORTES);
            idsParaBorrar.forEach(id => deleteStore.delete(id));

            deleteTx.oncomplete = () => {
                alert(`🔄 Sincronización completa: ${idsParaBorrar.length} registros y pedidos subidos al servidor.`);
                actualizarContadorPendientes();
            };
        }
    };
};