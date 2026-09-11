let db;
const DB_NAME = 'SembrioganVetDB';
const STORE_NAME = 'registros_offline';

document.addEventListener('DOMContentLoaded', () => {
    inicializarDB();
    registrarServiceWorker();
    configurarRed();
    
    document.getElementById('form-vet-offline').addEventListener('submit', guardarRegistroLocal);
    document.getElementById('btn-sync').addEventListener('click', sincronizarConServidor);
});

// ==========================================
// 1. CONFIGURACIÓN DE INDEXEDDB
// ==========================================
const inicializarDB = () => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = (e) => console.error("Error al abrir IndexedDB", e);
    
    request.onsuccess = (e) => {
        db = e.target.result;
        actualizarContadorPendientes();
    };

    request.onupgradeneeded = (e) => {
        const database = e.target.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
            database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
    };
};

// ==========================================
// 2. REGISTRO DE SERVICE WORKER
// ==========================================
const registrarServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Service Worker registrado con éxito'))
            .catch((err) => console.error('Error al registrar Service Worker', err));
    }
};

// ==========================================
// 3. DETECTOR DE CONEXIÓN (ONLINE / OFFLINE)
// ==========================================
const configurarRed = () => {
    const badge = document.getElementById('network-status');

    const actualizarEstadoRed = () => {
        if (navigator.onLine) {
            badge.textContent = 'Online (Conectado)';
            badge.className = 'status-badge online';
            sincronizarConServidor(); // Auto-sincronizar al recuperar red
        } else {
            badge.textContent = 'Offline (Sin Señal)';
            badge.className = 'status-badge offline';
        }
    };

    window.addEventListener('online', actualizarEstadoRed);
    window.addEventListener('offline', actualizarEstadoRed);
    actualizarEstadoRed();
};

// ==========================================
// 4. GUARDAR REGISTRO LOCALMENTE
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

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(nuevoReporte);

    request.onsuccess = () => {
        alert('✅ Reporte guardado localmente en el dispositivo.');
        document.getElementById('form-vet-offline').reset();
        actualizarContadorPendientes();
        
        // Si hay internet, intentamos sincronizar de inmediato
        if (navigator.onLine) {
            sincronizarConServidor();
        }
    };

    request.onerror = (err) => console.error('Error al guardar local', err);
};

// ==========================================
// 5. ACTUALIZAR CONTADOR Y VISTA LOCAL
// ==========================================
const actualizarContadorPendientes = () => {
    if (!db) return;
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = (e) => {
        const registros = e.target.result;
        document.getElementById('sync-counter').textContent = `${registros.length} pendientes`;
        
        const contenedor = document.getElementById('lista-offline');
        contenedor.innerHTML = '';

        registros.forEach(r => {
            const item = document.createElement('div0'); // Usamos div
            // Renderizamos elementos visuales limpios
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

// ==========================================
// 6. SINCRONIZAR CON EL BACKEND (MONGODB)
// ==========================================
const sincronizarConServidor = async () => {
    if (!navigator.onLine) {
        alert('⚠️ No hay conexión a internet. La sincronización se realizará al recuperar señal.');
        return;
    }

    if (!db) return;
    
    // Transacción 1: Solo lectura para obtener los registros
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = async (e) => {
        const registros = e.target.result;
        if (registros.length === 0) {
            alert('No hay registros pendientes por sincronizar.');
            return;
        }

        let idsParaBorrar = [];

        // Hacemos las peticiones HTTP al servidor
        for (const reg of registros) {
            try {
                const respuesta = await fetch('http://localhost:3000/api/solicitudes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productor: reg.productor,
                        finca: reg.finca,
                        servicio: `[CAMPO] ${reg.servicio}: ${reg.observaciones}`
                    })
                });

                const resultado = await respuesta.json();
                if (resultado.success) {
                    idsParaBorrar.push(reg.id); // Guardamos el ID del registro exitoso
                }
            } catch (err) {
                console.error('Error sincronizando registro individual:', err);
            }
        }

        // Transacción 2: Abrimos una nueva transacción para borrar los que sí subieron
        if (idsParaBorrar.length > 0) {
            const deleteTx = db.transaction([STORE_NAME], 'readwrite');
            const deleteStore = deleteTx.objectStore(STORE_NAME);
            
            idsParaBorrar.forEach(id => deleteStore.delete(id));

            deleteTx.oncomplete = () => {
                alert(`🔄 ¡Sincronización exitosa! Se subieron y limpiaron ${idsParaBorrar.length} registros locales.`);
                actualizarContadorPendientes();
            };
        }
    };
};