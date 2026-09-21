// Seguridad: Validar Token
const token = localStorage.getItem('tokenVetSembriogan');
const datosVet = JSON.parse(localStorage.getItem('datosVetSembriogan'));

if (!token) {
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mostrar nombre del Veterinario
    if (datosVet && datosVet.nombre) {
        document.getElementById('nombre-vet').textContent = datosVet.nombre;
    }

    // 2. Lógica de Cerrar Sesión
    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('tokenVetSembriogan');
        localStorage.removeItem('datosVetSembriogan');
        window.location.href = 'index.html';
    });

    // 3. Navegación (Tabs)
    const tabRegistro = document.getElementById('tab-registro');
    const tabHistorial = document.getElementById('tab-historial');
    const vistaRegistro = document.getElementById('vista-registro');
    const vistaHistorial = document.getElementById('vista-historial');

    tabRegistro.addEventListener('click', () => {
        tabRegistro.classList.add('active');
        tabHistorial.classList.remove('active');
        vistaRegistro.classList.remove('hidden');
        vistaHistorial.classList.add('hidden');
    });

    tabHistorial.addEventListener('click', () => {
        tabHistorial.classList.add('active');
        tabRegistro.classList.remove('active');
        vistaHistorial.classList.remove('hidden');
        vistaRegistro.classList.add('hidden');
        cargarMiHistorial();
    });

    // 4. Guardar Registro Genético
    const formGenetica = document.getElementById('form-genetica');
    formGenetica.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            productor: document.getElementById('reg-productor').value,
            finca: document.getElementById('reg-finca').value,
            animalId: document.getElementById('reg-animal').value,
            tipoProcedimiento: document.getElementById('reg-tecnica').value,
            geneticaUtilizada: document.getElementById('reg-genetica').value,
            veterinarioAsignado: datosVet.nombre // Se asigna automáticamente quien inició sesión
        };

        const btn = formGenetica.querySelector('.btn-submit');
        btn.textContent = 'Guardando...';
        btn.disabled = true;

        try {
            const res = await fetch('http://localhost:3000/api/registro-genetico', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                alert('¡Procedimiento guardado exitosamente en la nube!');
                formGenetica.reset();
            } else {
                alert('Error al guardar: ' + data.mensaje);
            }
        } catch (error) {
            alert('Error de conexión. Intenta nuevamente.');
        } finally {
            btn.textContent = 'Guardar en Sistema';
            btn.disabled = false;
        }
    });
});

// 5. Cargar Historial
const cargarMiHistorial = async () => {
    const lista = document.getElementById('lista-historial');
    lista.innerHTML = '<p style="text-align:center; color:#64748b;">Cargando registros...</p>';

    try {
        const res = await fetch('http://localhost:3000/api/registro-genetico', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success) {
            lista.innerHTML = '';
            // Filtramos solo los registros hechos por este veterinario
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