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
    if (formSolicitud) {
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
    }

    // 4. Manejo de Formulario del Catálogo (Con Imágenes)
    const formCatalogo = document.getElementById('form-catalogo');
    if (formCatalogo) {
        formCatalogo.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData();
            formData.append('tipo', document.getElementById('tipo').value);
            formData.append('descripcion', document.getElementById('descripcion').value);
            formData.append('costo', document.getElementById('costo').value);
            
            const archivoInput = document.getElementById('imagen');
            if (archivoInput.files[0]) {
                formData.append('imagen', archivoInput.files[0]);
            }

            try {
                const respuesta = await fetch('http://localhost:3000/api/catalogo', {
                    method: 'POST',
                    body: formData // Sin headers de tipo de contenido para permitir FormData
                });
                const resultado = await respuesta.json();

                if (resultado.success) {
                    alert('¡Servicio agregado al catálogo con éxito!');
                    formCatalogo.reset();
                    cargarCatalogo();
                } else {
                    alert('Error al registrar servicio: ' + resultado.mensaje);
                }
            } catch (error) {
                console.error('Error de red:', error);
            }
        });
    }
});

// ==========================================
// FUNCIONES GLOBALES DE CARGA Y GESTIÓN
// ==========================================

const cargarSolicitudes = async () => {
    try {
        const respuesta = await fetch('http://localhost:3000/api/solicitudes');
        const resultado = await respuesta.json();

        if (resultado.success) {
            const tbody = document.querySelector('#tabla-solicitudes tbody');
            if (!tbody) return;
            tbody.innerHTML = ''; 

            let total = resultado.data.length;
            let pendientes = 0;
            let enProceso = 0;
            let completadas = 0;
            let ventasTotales = 0;

            // Formateador de moneda colombiana
            const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

            resultado.data.forEach(solicitud => {
                // Conteo de KPIs según estado
                if (solicitud.estado === 'Pendiente') pendientes++;
                if (solicitud.estado === 'En Proceso') enProceso++;
                if (solicitud.estado === 'Completadas' || solicitud.estado === 'Completada') {
                    completadas++;
                    ventasTotales += (solicitud.costo || 150000); // Estimado base o costo real del servicio
                }

                const fila = document.createElement('tr');
                const opcionesEstado = ['Pendiente', 'En Proceso', 'Completada', 'Cancelada']
                    .map(estado => `<option value="${estado}" ${solicitud.estado === estado ? 'selected' : ''}>${estado}</option>`)
                    .join('');

                fila.innerHTML = `
                    <td>${solicitud.productor}</td>
                    <td>${solicitud.finca}</td>
                    <td>${solicitud.servicio}</td>
                    <td>
                        <select class="select-estado ${solicitud.estado.toLowerCase().replace(' ', '-')}" data-id="${solicitud._id}">
                            ${opcionesEstado}
                        </select>
                    </td>
                    <td>${solicitud.fecha}</td>
                `;
                tbody.appendChild(fila);
            });

            // Actualizar los elementos visuales de las tarjetas KPIs
            document.getElementById('kpi-total').textContent = total;
            document.getElementById('kpi-pendientes').textContent = pendientes;
            document.getElementById('kpi-proceso').textContent = enProceso;
            document.getElementById('kpi-completadas').textContent = completadas;
            document.getElementById('kpi-ventas').textContent = formatoCOP.format(ventasTotales);

            document.querySelectorAll('.select-estado').forEach(select => {
                select.addEventListener('change', async (e) => {
                    const idSolicitud = e.target.getAttribute('data-id');
                    const nuevoEstado = e.target.value;
                    await actualizarEstado(idSolicitud, nuevoEstado);
                });
            });
        }
    } catch (error) {
        console.error('Error al conectar con la API de Sembriogan:', error);
    }
};

const actualizarEstado = async (id, nuevoEstado) => {
    try {
        const respuesta = await fetch(`http://localhost:3000/api/solicitudes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        
        const resultado = await respuesta.json();
        if (resultado.success) {
            cargarSolicitudes();
        } else {
            alert('Error al actualizar: ' + resultado.mensaje);
        }
    } catch (error) {
        console.error('Error de red al actualizar estado:', error);
    }
};

const cargarCatalogo = async () => {
    try {
        const respuesta = await fetch('http://localhost:3000/api/catalogo');
        const resultado = await respuesta.json();

        if (resultado.success) {
            const tbody = document.querySelector('#tabla-catalogo tbody');
            if (!tbody) return;
            tbody.innerHTML = ''; 

            const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

            resultado.data.forEach(item => {
                const fila = document.createElement('tr');
                const urlImagen = item.imagen ? `http://localhost:3000${item.imagen}` : '';

                fila.innerHTML = `
                    <td>
                        ${urlImagen ? `<img src="${urlImagen}" alt="Miniatura" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">` : 'Sin imagen'}
                    </td>
                    <td><strong>${item.tipo}</strong></td>
                    <td>${item.descripcion}</td>
                    <td>${formatoCOP.format(item.costo)}</td>
                `;
                tbody.appendChild(fila);
            });
        }
    } catch (error) {
        console.error('Error al cargar catálogo:', error);
    }
};