if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('PWA Service Worker registrado con éxito');
        });
    });
}

const token = localStorage.getItem('tokenVetSembriogan');
const datosVet = JSON.parse(localStorage.getItem('datosVetSembriogan'));

if (!token) {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mostrar nombre del Veterinario
    if (datosVet && datosVet.nombre) {
        const el = document.getElementById('nombre-vet');
        if (el) el.textContent = datosVet.nombre;
    }

    // 2. Cerrar Sesión
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('tokenVetSembriogan');
            localStorage.removeItem('datosVetSembriogan');
            window.location.href = 'index.html';
        });
    }

    // 3. Navegación (Tabs) segura
    const tabRegistro = document.getElementById('tab-registro');
    const tabOtros = document.getElementById('tab-otros');
    const tabTienda = document.getElementById('tab-tienda');
    const tabHistorial = document.getElementById('tab-historial');
    
    const vistaRegistro = document.getElementById('vista-registro');
    const vistaOtros = document.getElementById('vista-otros');
    const vistaTienda = document.getElementById('vista-tienda');
    const vistaHistorial = document.getElementById('vista-historial');

    const ocultarVistasVet = () => {
        if (vistaRegistro) vistaRegistro.classList.add('hidden');
        if (vistaOtros) vistaOtros.classList.add('hidden');
        if (vistaTienda) vistaTienda.classList.add('hidden');
        if (vistaHistorial) vistaHistorial.classList.add('hidden');
        
        if (tabRegistro) tabRegistro.classList.remove('active');
        if (tabOtros) tabOtros.classList.remove('active'); // Corregido: tabOtros en lugar de tabOthers
        if (tabTienda) tabTienda.classList.remove('active');
        if (tabHistorial) tabHistorial.classList.remove('active');
    };

    if (tabRegistro) {
        tabRegistro.addEventListener('click', () => {
            ocultarVistasVet();
            tabRegistro.classList.add('active');
            if (vistaRegistro) vistaRegistro.classList.remove('hidden');
        });
    }

    if (tabOtros) {
        tabOtros.addEventListener('click', () => {
            ocultarVistasVet();
            tabOtros.classList.add('active');
            if (vistaOtros) vistaOtros.classList.remove('hidden');
        });
    }

    if (tabTienda) {
        tabTienda.addEventListener('click', () => {
            ocultarVistasVet();
            tabTienda.classList.add('active');
            if (vistaTienda) vistaTienda.classList.remove('hidden');
        });
    }

    if (tabHistorial) {
        tabHistorial.addEventListener('click', () => {
            ocultarVistasVet();
            tabHistorial.classList.add('active');
            if (vistaHistorial) vistaHistorial.classList.remove('hidden');
            cargarMiHistorial();
        });
    }

    // 4. Guardar Registro Genético (Robusto para Offline)
    const formGenetica = document.getElementById('form-genetica');
    if (formGenetica) {
        formGenetica.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                productor: document.getElementById('reg-productor').value,
                finca: document.getElementById('reg-finca').value,
                animalId: document.getElementById('reg-animal').value,
                tipoProcedimiento: document.getElementById('reg-tecnica').value,
                geneticaUtilizada: document.getElementById('reg-genetica').value,
                veterinarioAsignado: datosVet.nombre
            };

            try {
                const res = await fetch('http://localhost:3000/api/registro-genetico', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                
                if (data.success) {
                    alert('¡Procedimiento guardado exitosamente en la nube!');
                    formGenetica.reset();
                } else {
                    throw new Error(data.mensaje || 'Error al guardar');
                }
            } catch (error) {
                let offlineData = JSON.parse(localStorage.getItem('sembriogan_offline_genetica')) || [];
                offlineData.push(payload);
                localStorage.setItem('sembriogan_offline_genetica', JSON.stringify(offlineData));
                alert('📱 Sin conexión detectada. Registro guardado localmente en el dispositivo. Se sincronizará automáticamente al restablecer la señal.');
                formGenetica.reset();
            }
        });
    }

    // 5. Tienda / POS Wompi Dinámica (Cargada desde el Catálogo)
    const posProducto = document.getElementById('pos-producto');
    const posCantidad = document.getElementById('pos-cantidad');
    const posTotalText = document.getElementById('pos-total-text');
    let totalPagoWompi = 0;
    let nombreProductoPago = '';

    const cargarCatalogoPOS = async () => {
        if (!posProducto) return;
        try {
            const res = await fetch('http://localhost:3000/api/catalogo');
            const data = await res.json();

            if (data.success && data.data.length > 0) {
                posProducto.innerHTML = '';
                data.data.forEach((item) => {
                    const option = document.createElement('option');
                    option.value = `${item.costo}|${item.tipo}`;
                    option.textContent = `${item.tipo} - $${new Intl.NumberFormat('es-CO').format(item.costo)}`;
                    posProducto.appendChild(option);
                });
                calcularTotalPOS();
            } else {
                posProducto.innerHTML = '<option value="0|Sin productos">No hay productos disponibles</option>';
            }
        } catch (error) {
            console.error('Error al cargar catálogo para POS:', error);
        }
    };

    const calcularTotalPOS = () => {
        if (!posProducto || !posCantidad || !posTotalText) return;
        if (!posProducto.value) return;
        
        const valores = posProducto.value.split('|');
        const precioUnitario = parseInt(valores[0]) || 0;
        nombreProductoPago = valores[1] || 'Servicio Sembriogan';
        const cantidad = parseInt(posCantidad.value) || 1;
        
        totalPagoWompi = precioUnitario * cantidad;
        posTotalText.textContent = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalPagoWompi);
    };

    if (posProducto) posProducto.addEventListener('change', calcularTotalPOS);
    if (posCantidad) posCantidad.addEventListener('input', calcularTotalPOS);

    cargarCatalogoPOS();

    const btnPagarWompi = document.getElementById('btn-pagar-wompi');
    if (btnPagarWompi) {
        btnPagarWompi.addEventListener('click', () => {
            if (!navigator.onLine) {
                alert('❌ Necesitas conexión a internet para procesar pagos con tarjeta en Wompi.');
                return;
            }

            if (totalPagoWompi <= 0) {
                alert('❌ Selecciona un producto válido.');
                return;
            }

            const referenciaUnica = 'POS-VET-' + Date.now();
            
            const checkout = new WidgetCheckout({
                currency: 'COP',
                amountInCents: totalPagoWompi * 100,
                reference: referenciaUnica,
                publicKey: 'pub_test_b9Wif8x93ek97Eo0wrRazU19DefFIiQX', 
                taxes: { vat: { amountInCents: 0 } }
            });

            checkout.open((result) => {
                const transaction = result.transaction;
                if (transaction.status === 'APPROVED') {
                    alert(`✅ ¡Pago Exitoso!\nSe han cobrado ${posTotalText.textContent} por ${posCantidad.value}x ${nombreProductoPago}.\nReferencia: ${transaction.id}`);
                } else {
                    alert('❌ El pago fue rechazado. Estado: ' + transaction.status);
                }
            });
        });
    }
});

// Detectar cuando vuelva el internet y enviar los datos pendientes
window.addEventListener('online', async () => {
    let offlineData = JSON.parse(localStorage.getItem('sembriogan_offline_genetica')) || [];
    if (offlineData.length > 0) {
        alert(`🔄 Conexión restablecida. Sincronizando ${offlineData.length} registros pendientes a la nube...`);
        try {
            for (let payload of offlineData) {
                await fetch('http://localhost:3000/api/registro-genetico', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
            }
            localStorage.removeItem('sembriogan_offline_genetica');
            alert('✅ ¡Sincronización completada con éxito!');
            cargarMiHistorial();
        } catch (err) {
            console.error('Error al sincronizar datos offline:', err);
        }
    }
});

// Cargar Historial y permitir actualización de diagnóstico
const cargarMiHistorial = async () => {
    const lista = document.getElementById('lista-historial');
    if (!lista) return;
    lista.innerHTML = '<p style="text-align:center; color:#64748b;">Cargando registros...</p>';

    try {
        const res = await fetch('http://localhost:3000/api/registro-genetico', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            lista.innerHTML = '';
            const misRegistros = data.data.filter(r => r.veterinarioAsignado === datosVet.nombre);

            if (misRegistros.length === 0) {
                lista.innerHTML = '<p style="text-align:center; color:#64748b;">Aún no tienes registros de procedimientos.</p>';
                return;
            }

            misRegistros.forEach(reg => {
                const fecha = new Date(reg.fechaProcedimiento).toLocaleDateString('es-CO');
                const fechaPalp = reg.fechaPalpacion ? new Date(reg.fechaPalpacion).toLocaleDateString('es-CO') : 'Pendiente';
                
                const card = document.createElement('div');
                card.className = 'historial-card';
                
                let accionesHTML = '';
                if (reg.estadoPrenez === 'Pendiente') {
                    accionesHTML = `
                        <div style="margin-top: 10px; display: flex; gap: 8px;">
                            <button onclick="cambiarEstadoPrenez('${reg._id}', 'Preñada')" style="flex:1; background: #22c55e; color: white; border: none; padding: 8px; border-radius: 4px; font-weight: bold; cursor: pointer;">✅ Preñada</button>
                            <button onclick="cambiarEstadoPrenez('${reg._id}', 'Vacía')" style="flex:1; background: #ef4444; color: white; border: none; padding: 8px; border-radius: 4px; font-weight: bold; cursor: pointer;">❌ Vacía</button>
                        </div>
                    `;
                }

                card.innerHTML = `
                    <h4>Chapeta: ${reg.animalId} (${reg.tipoProcedimiento})</h4>
                    <p><strong>Productor:</strong> ${reg.productor} (${reg.finca})</p>
                    <p><strong>Genética:</strong> ${reg.geneticaUtilizada}</p>
                    <p><strong>Fecha Proc:</strong> ${fecha} | <strong>Control Est.:</strong> ${fechaPalp}</p>
                    <p><strong>Estado:</strong> <span style="color: ${reg.estadoPrenez === 'Pendiente' ? '#d97706' : (reg.estadoPrenez === 'Preñada' ? '#166534' : '#991b1b')}; font-weight:bold;">${reg.estadoPrenez}</span></p>
                    ${accionesHTML}
                `;
                lista.appendChild(card);
            });
        }
    } catch (error) {
        lista.innerHTML = '<p style="text-align:center; color:red;">Error al cargar el historial.</p>';
    }
};

// Función global para actualizar el estado desde los botones de la card
window.cambiarEstadoPrenez = async (id, nuevoEstado) => {
    if (!confirm(`¿Confirmar diagnóstico como: ${nuevoEstado}?`)) return;

    try {
        const res = await fetch(`http://localhost:3000/api/registro-genetico/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ estadoPrenez: nuevoEstado })
        });
        const data = await res.json();

        if (data.success) {
            alert('¡Diagnóstico actualizado con éxito y sincronizado con la oficina!');
            cargarMiHistorial();
        } else {
            alert('Error al actualizar: ' + data.mensaje);
        }
    } catch (error) {
        alert('Error de red al actualizar el estado.');
    }
};