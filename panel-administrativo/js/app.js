document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar datos iniciales
    cargarSolicitudes();
    cargarCatalogo();

    // 2. Control de Navegación del Menú Lateral
    const navSolicitudes = document.getElementById('nav-solicitudes');
    const navCatalogo = document.getElementById('nav-catalogo');
    const navConfiguracion = document.getElementById('nav-configuracion');
    const vistaSolicitudes = document.getElementById('vista-solicitudes');
    const vistaCatalogo = document.getElementById('vista-catalogo');
    const vistaConfiguracion = document.getElementById('vista-configuracion');
    const tituloSeccion = document.getElementById('titulo-seccion');

    // Función auxiliar para ocultar todo
    const ocultarVistas = () => {
        vistaSolicitudes.style.display = 'none';
        vistaCatalogo.style.display = 'none';
        vistaConfiguracion.style.display = 'none';
        navSolicitudes.classList.remove('active');
        navCatalogo.classList.remove('active');
        navConfiguracion.classList.remove('active');
    };

    navSolicitudes.addEventListener('click', (e) => {
        e.preventDefault();
        ocultarVistas();
        vistaSolicitudes.style.display = 'block';
        navSolicitudes.classList.add('active');
        tituloSeccion.textContent = 'Gestión de Solicitudes';
    });

    navCatalogo.addEventListener('click', (e) => {
        e.preventDefault();
        ocultarVistas();
        vistaCatalogo.style.display = 'block';
        navCatalogo.classList.add('active');
        tituloSeccion.textContent = 'Catálogo de Servicios';
    });

    // Evento de la nueva pestaña
    navConfiguracion.addEventListener('click', (e) => {
        e.preventDefault();
        ocultarVistas();
        vistaConfiguracion.style.display = 'block';
        navConfiguracion.classList.add('active');
        tituloSeccion.textContent = 'Configuración de la Página Web';
        cargarCarruselAdmin(); // Carga las fotos al entrar a la pestaña
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

// 5. Manejo de Formulario del Carrusel
    const formCarrusel = document.getElementById('form-carrusel');
    if (formCarrusel) {
        formCarrusel.addEventListener('submit', async (e) => {
            e.preventDefault();
            const archivoInput = document.getElementById('imagen-carrusel');
            if (!archivoInput.files[0]) return;

            const formData = new FormData();
            formData.append('imagen', archivoInput.files[0]);

            try {
                const respuesta = await fetch('http://localhost:3000/api/carrusel', {
                    method: 'POST',
                    body: formData
                });
                const resultado = await respuesta.json();

                if (resultado.success) {
                    alert('¡Imagen subida al carrusel exitosamente!');
                    formCarrusel.reset();
                    cargarCarruselAdmin(); // Recargar la galería
                } else {
                    alert('Error: ' + resultado.mensaje);
                }
            } catch (error) {
                console.error('Error al subir imagen:', error);
            }
        });
    }

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

const cargarCarruselAdmin = async () => {
    try {
        const respuesta = await fetch('http://localhost:3000/api/carrusel');
        const resultado = await respuesta.json();

        if (resultado.success) {
            const galeria = document.getElementById('galeria-carrusel');
            if (!galeria) return;
            galeria.innerHTML = ''; 

            resultado.data.forEach(item => {
                const urlImagen = `http://localhost:3000${item.imagen}`;
                
                const cardContenedor = document.createElement('div');
                cardContenedor.style.border = '1px solid #cbd5e1';
                cardContenedor.style.borderRadius = '8px';
                cardContenedor.style.padding = '10px';
                cardContenedor.style.textAlign = 'center';
                cardContenedor.style.background = '#fff';

                cardContenedor.innerHTML = `
                    <img src="${urlImagen}" alt="Carrusel" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; margin-bottom: 10px;">
                    <button onclick="eliminarImagenCarrusel('${item._id}')" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; width: 100%;">
                        Eliminar
                    </button>
                `;
                galeria.appendChild(cardContenedor);
            });
        }
    } catch (error) {
        console.error('Error al cargar carrusel:', error);
    }
};

const eliminarImagenCarrusel = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen del carrusel de la página pública?')) return;

    try {
        const respuesta = await fetch(`http://localhost:3000/api/carrusel/${id}`, {
            method: 'DELETE'
        });
        const resultado = await respuesta.json();

        if (resultado.success) {
            cargarCarruselAdmin(); // Recargamos para que desaparezca
        } else {
            alert('Error al eliminar: ' + resultado.mensaje);
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

const formTestimonio = document.getElementById('form-testimonio');
if (formTestimonio) {
    formTestimonio.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bodyData = {
            productor: document.getElementById('testimonio-productor').value,
            finca: document.getElementById('testimonio-finca').value,
            comentario: document.getElementById('testimonio-comentario').value
        };

        try {
            const res = await fetch('http://localhost:3000/api/testimonios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });
            const data = await res.json();
            if (data.success) {
                alert('Testimonio guardado con éxito');
                formTestimonio.reset();
                cargarTestimoniosAdmin();
            }
        } catch (err) {
            console.error('Error:', err);
        }
    });
}

const cargarTestimoniosAdmin = async () => {
    try {
        const res = await fetch('http://localhost:3000/api/testimonios');
        const data = await res.json();
        if (data.success) {
            const tbody = document.querySelector('#tabla-testimonios tbody');
            if(!tbody) return;
            tbody.innerHTML = '';
            
            data.data.forEach(t => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${t.productor}</strong><br><small>${t.finca}</small></td>
                    <td>${t.comentario}</td>
                    <td><span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; background: ${t.aprobado ? '#dcfce7; color: #166534;' : '#fef9c3; color: #854d0e;'}">${t.aprobado ? 'Aprobado' : 'Pendiente'}</span></td>
                    <td>
                        ${!t.aprobado ? `<button onclick="aprobarTestimonio('${t._id}')" style="background:#22c55e; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-right: 5px;">Aprobar</button>` : ''}
                        <button onclick="eliminarTestimonioAdmin('${t._id}')" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Eliminar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error(e);
    }
};

const aprobarTestimonio = async (id) => {
    try {
        const res = await fetch(`http://localhost:3000/api/testimonios/${id}/aprobar`, { method: 'PUT' });
        const data = await res.json();
        if (data.success) {
            cargarTestimoniosAdmin();
        }
    } catch (e) {
        console.error(e);
    }
};

const eliminarTestimonioAdmin = async (id) => {
    if(!confirm('¿Eliminar este testimonio?')) return;
    await fetch(`http://localhost:3000/api/testimonios/${id}`, { method: 'DELETE' });
    cargarTestimoniosAdmin();
};

const eliminarTestimonio = async (id) => {
    if(!confirm('¿Eliminar testimonio?')) return;
    await fetch(`http://localhost:3000/api/testimonios/${id}`, { method: 'DELETE' });
    cargarTestimoniosAdmin();
};