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
        if (tabOtros) tabOtros.classList.remove('active');
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

    // 4. Guardar Registro Genético
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

            if (!navigator.onLine) {
                let offlineData = JSON.parse(localStorage.getItem('sembriogan_offline_genetica')) || [];
                offlineData.push(payload);
                localStorage.setItem('sembriogan_offline_genetica', JSON.stringify(offlineData));
                alert('📱 Sin conexión. Registro guardado en el celular.');
                formGenetica.reset();
                return;
            }

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
                }
            } catch (error) {
                alert('Error de conexión.');
            }
        });
    }

    // 5. Tienda / POS Wompi
    const posProducto = document.getElementById('pos-producto');
    const posCantidad = document.getElementById('pos-cantidad');
    const posTotalText = document.getElementById('pos-total-text');
    let totalPagoWompi = 50000;
    let nombreProductoPago = 'Pajilla Angus';

    const calcularTotalPOS = () => {
        if (!posProducto || !posCantidad || !posTotalText) return;
        const valores = posProducto.value.split('|');
        const precioUnitario = parseInt(valores[0]);
        nombreProductoPago = valores[1];
        const cantidad = parseInt(posCantidad.value) || 1;
        
        totalPagoWompi = precioUnitario * cantidad;
        posTotalText.textContent = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalPagoWompi);
    };

    if (posProducto) posProducto.addEventListener('change', calcularTotalPOS);
    if (posCantidad) posCantidad.addEventListener('input', calcularTotalPOS);

    const btnPagarWompi = document.getElementById('btn-pagar-wompi');
    if (btnPagarWompi) {
        btnPagarWompi.addEventListener('click', () => {
            if (!navigator.onLine) {
                alert('❌ Necesitas conexión a internet para procesar pagos con tarjeta en Wompi.');
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

// Cargar Historial
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
                const card = document.createElement('div');
                card.className = 'historial-card';
                card.innerHTML = `
                    <h4>Chapeta: ${reg.animalId} (${reg.tipoProcedimiento})</h4>
                    <p><strong>Productor:</strong> ${reg.productor} - ${reg.finca}</p>
                    <p><strong>Genética:</strong> ${reg.geneticaUtilizada}</p>
                    <p><strong>Fecha Proc:</strong> ${fecha}</p>
                    <p><strong>Estado:</strong> <span style="color: ${reg.estadoPrenez === 'Pendiente' ? '#d97706' : '#166534'}">${reg.estadoPrenez}</span></p>
                `;
                lista.appendChild(card);
            });
        }
    } catch (error) {
        lista.innerHTML = '<p style="text-align:center; color:red;">Error al cargar el historial.</p>';
    }
};