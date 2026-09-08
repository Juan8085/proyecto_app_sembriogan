document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar datos iniciales
    cargarSolicitudes();
    cargarCatalogo();

    // 2. Control de Navegación del Menú Lateral
    const navSolicitudes = document.getElementById('nav-solicitudes');
    const navCatalogo = document.getElementById('nav-catalogo');
    const vistaSolicitudes = document.getElementById('vista-solicitudes');
    const vistaCatalogo = document.getElementById('vista-catalogo');
    const tituloSeccion = document.getElementById('titulo-seccion');

    navSolicitudes.addEventListener('click', (e) => {
        e.preventDefault();
        vistaSolicitudes.style.display = 'block';
        vistaCatalogo.style.display = 'none';
        navSolicitudes.classList.add('active');
        navCatalogo.classList.remove('active');
        tituloSeccion.textContent = 'Gestión de Solicitudes';
    });

    navCatalogo.addEventListener('click', (e) => {
        e.preventDefault();
        vistaCatalogo.style.display = 'block';
        vistaSolicitudes.style.display = 'none';
        navCatalogo.classList.add('active');
        navSolicitudes.classList.remove('active');
        tituloSeccion.textContent = 'Catálogo de Servicios';
    });

    // 3. Manejo de Formulario de Solicitudes
    const formSolicitud = document.getElementById('form-solicitud');
    formSolicitud.addEventListener('submit', async (e) => {
        e.preventDefault();
        const productor = document.getElementById('productor').value;
        const finca = document.getElementById('finca').value;
        const servicio = document.getElementById('servicio').value;

        try {
            const respuesta = await fetch('http://localhost:3000/api/solicitudes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productor, finca, servicio })
            });
            const resultado = await respuesta.json();

            if (resultado.success) {
                alert('¡Solicitud registrada con éxito!');
                formSolicitud.reset();
                cargarSolicitudes();
            } else {
                alert('Error al registrar: ' + resultado.mensaje);
            }
        } catch (error) {
            console.error('Error de red:', error);
        }
    });

    // 4. Manejo de Formulario del Catálogo
    const formCatalogo = document.getElementById('form-catalogo');
    formCatalogo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tipo = document.getElementById('tipo').value;
        const descripcion = document.getElementById('descripcion').value;
        const costo = document.getElementById('costo').value;

        try {
            const respuesta = await fetch('http://localhost:3000/api/catalogo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipo, descripcion, costo })
            });
            const resultado = await respuesta.json();

            if (resultado.success) {
                alert('¡Servicio agregado al catálogo exitosamente!');
                formCatalogo.reset();
                cargarCatalogo();
            } else {
                alert('Error al registrar servicio: ' + resultado.mensaje);
            }
        } catch (error) {
            console.error('Error de red:', error);
        }
    });
});

// ==========================================
// FUNCIONES PARA CARGAR DATOS DESDE LA API
// ==========================================

const cargarSolicitudes = async () => {
    try {
        const respuesta = await fetch('http://localhost:3000/api/solicitudes');
        const resultado = await respuesta.json();

        if (resultado.success) {
            const tbody = document.querySelector('#tabla-solicitudes tbody');
            tbody.innerHTML = ''; 
            resultado.data.forEach(solicitud => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td>${solicitud.productor}</td>
                    <td>${solicitud.finca}</td>
                    <td>${solicitud.servicio}</td>
                    <td><span class="badge ${solicitud.estado.toLowerCase()}">${solicitud.estado}</span></td>
                    <td>${solicitud.fecha}</td>
                `;
                tbody.appendChild(fila);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

const cargarCatalogo = async () => {
    try {
        const respuesta = await fetch('http://localhost:3000/api/catalogo');
        const resultado = await respuesta.json();

        if (resultado.success) {
            const tbody = document.querySelector('#tabla-catalogo tbody');
            tbody.innerHTML = ''; 

            // Formateador para pesos colombianos (COP)
            const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

            resultado.data.forEach(item => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td><strong>${item.tipo}</strong></td>
                    <td>${item.descripcion}</td>
                    <td>${formatoCOP.format(item.costo)}</td>
                `;
                tbody.appendChild(fila);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
};