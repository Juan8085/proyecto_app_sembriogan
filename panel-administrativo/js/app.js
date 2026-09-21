// ==========================================
// SEGURIDAD: VERIFICACIÓN DE SESIÓN (JWT)
// ==========================================
const token = localStorage.getItem('tokenSembriogan');
const usuarioData = JSON.parse(localStorage.getItem('usuarioSembriogan'));
const navGenetica = document.getElementById('nav-genetica');
const vistaGenetica = document.getElementById('vista-genetica');

// Si no hay token, lo devolvemos al login
if (!token) {
    window.location.href = 'login.html';
}

document.addEventListener('DOMContentLoaded', () => {

    // Mostrar el nombre del usuario logueado
    if (usuarioData && usuarioData.nombre) {
        const nombreUsuarioElem = document.getElementById('nombre-usuario');
        if (nombreUsuarioElem) {
            nombreUsuarioElem.textContent = `${usuarioData.nombre} (${usuarioData.rol})`;
        }
    }

    // Lógica para cerrar sesión
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('tokenSembriogan');
            localStorage.removeItem('usuarioSembriogan');
            window.location.href = 'login.html';
        });
    }

    // 1. Cargar datos iniciales de todas las secciones
    cargarSolicitudes();
    cargarCatalogo();
    cargarTestimoniosAdmin();
    cargarContactosAdmin();

    // 2. Control de Navegación del Menú Lateral
    const navSolicitudes = document.getElementById('nav-solicitudes');
    const navCatalogo = document.getElementById('nav-catalogo');
    const navConfiguracion = document.getElementById('nav-configuracion');
    const navUsuarios = document.getElementById('nav-usuarios');

    const vistaSolicitudes = document.getElementById('vista-solicitudes');
    const vistaCatalogo = document.getElementById('vista-catalogo');
    const vistaConfiguracion = document.getElementById('vista-configuracion');
    const vistaUsuarios = document.getElementById('vista-usuarios');
    
    const tituloSeccion = document.getElementById('titulo-seccion');

    // ==========================================
    // CONEXIÓN WEBSOCKETS (TIEMPO REAL)
    // ==========================================
    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
        console.log('⚡ Conectado al servidor WebSocket en tiempo real');
    });

    socket.on('actualizar-solicitudes', () => {
        console.log('🔄 Sincronización en tiempo real: actualizando tabla y KPIs');
        cargarSolicitudes();
    });
    
    // Función auxiliar para ocultar todas las vistas
    const ocultarVistas = () => {
        if (vistaSolicitudes) vistaSolicitudes.style.display = 'none';
        if (vistaCatalogo) vistaCatalogo.style.display = 'none';
        if (vistaConfiguracion) vistaConfiguracion.style.display = 'none';
        if (vistaUsuarios) vistaUsuarios.style.display = 'none';
        if (vistaGenetica) vistaGenetica.style.display = 'none';
        if (navGenetica) navGenetica.classList.remove('active');

        if (navSolicitudes) navSolicitudes.classList.remove('active');
        if (navCatalogo) navCatalogo.classList.remove('active');
        if (navConfiguracion) navConfiguracion.classList.remove('active');
        if (navUsuarios) navUsuarios.classList.remove('active');
    };

    if (navSolicitudes) {
        navSolicitudes.addEventListener('click', (e) => {
            e.preventDefault();
            ocultarVistas();
            vistaSolicitudes.style.display = 'block';
            navSolicitudes.classList.add('active');
            tituloSeccion.textContent = 'Gestión de Solicitudes';
        });
    }

    if (navCatalogo) {
        navCatalogo.addEventListener('click', (e) => {
            e.preventDefault();
            ocultarVistas();
            vistaCatalogo.style.display = 'block';
            navCatalogo.classList.add('active');
            tituloSeccion.textContent = 'Catálogo de Servicios';
        });
    }

    if (navConfiguracion) {
        navConfiguracion.addEventListener('click', (e) => {
            e.preventDefault();
            ocultarVistas();
            vistaConfiguracion.style.display = 'block';
            navConfiguracion.classList.add('active');
            tituloSeccion.textContent = 'Configuración de la Página Web';
            cargarCarruselAdmin();
            cargarTestimoniosAdmin();
            cargarContactosAdmin();
        });
    }

    if (navUsuarios) {
        navUsuarios.addEventListener('click', (e) => {
            e.preventDefault();
            ocultarVistas();
            vistaUsuarios.style.display = 'block';
            navUsuarios.classList.add('active');
            tituloSeccion.textContent = 'Gestión de Personal y Roles';
            cargarUsuariosAdmin(); // <-- ¡Esta línea es la que dibuja la tabla!
        });
    }

    if (navGenetica) {
        navGenetica.addEventListener('click', (e) => {
            e.preventDefault();
            ocultarVistas();
            vistaGenetica.style.display = 'block';
            navGenetica.classList.add('active');
            tituloSeccion.textContent = 'Trazabilidad Genética Reproductiva';
            cargarRegistrosGeneticos(); // Llama a la BD al entrar
        });
    }

    // Actualización en tiempo real si un Vet envía un dato desde la finca
    socket.on('nuevo-registro-genetico', () => {
        cargarRegistrosGeneticos();
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
                    body: formData
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
                    cargarCarruselAdmin();
                } else {
                    alert('Error: ' + resultado.mensaje);
                }
            } catch (error) {
                console.error('Error al subir imagen:', error);
            }
        });
    }

    // 6. Manejo de Formulario de Registro de Usuarios (Veterinarios/Admin)
    const formUsuario = document.getElementById('form-usuario');
    if (formUsuario) {
        formUsuario.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const payload = {
                nombre: document.getElementById('nuevo-nombre').value,
                email: document.getElementById('nuevo-email').value,
                password: document.getElementById('nuevo-password').value,
                rol: document.getElementById('nuevo-rol').value
            };

            try {
                const res = await fetch('http://localhost:3000/api/auth/registro', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                
                const data = await res.json();
                if (data.success) {
                    alert('¡Cuenta creada exitosamente para el personal!');
                    formUsuario.reset();
                } else {
                    alert('Error: ' + data.mensaje);
                }
            } catch (err) {
                console.error('Error al registrar usuario:', err);
                alert('Error de conexión con el servidor.');
            }
        });
    }
});

// ==========================================
// FUNCIONES GLOBALES DE CARGA Y GESTIÓN
// ==========================================

const cargarSolicitudes = async () => {
    try {
        const respuesta = await fetch('http://localhost:3000/api/solicitudes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
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

            const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

            resultado.data.forEach(solicitud => {
                if (solicitud.estado === 'Pendiente') pendientes++;
                if (solicitud.estado === 'En Proceso') enProceso++;
                if (solicitud.estado === 'Completadas' || solicitud.estado === 'Completada') {
                    completadas++;
                    ventasTotales += (solicitud.costo || 150000);
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
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
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
            cargarCarruselAdmin();
        } else {
            alert('Error al eliminar: ' + resultado.mensaje);
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

// ==========================================
// GESTIÓN DE TESTIMONIOS
// ==========================================
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

// ==========================================
// GESTIÓN DE SUCURSALES
// ==========================================
document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'form-contacto') {
        e.preventDefault();
        
        const payload = {
            sucursal: document.getElementById('contacto-sucursal').value,
            direccion: document.getElementById('contacto-direccion').value,
            telefono: document.getElementById('contacto-telefono').value,
            email: document.getElementById('contacto-email').value,
            whatsapp: document.getElementById('contacto-whatsapp').value
        };

        try {
            const res = await fetch('http://localhost:3000/api/contacto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (data.success) {
                alert('¡Sucursal agregada exitosamente!');
                e.target.reset();
                cargarContactosAdmin();
            } else {
                alert('Error al guardar: ' + data.mensaje);
            }
        } catch (err) {
            console.error('Error al agregar sucursal:', err);
            alert('Error de conexión con el servidor.');
        }
    }
});

const cargarContactosAdmin = async () => {
    try {
        const res = await fetch('http://localhost:3000/api/contacto');
        const data = await res.json();
        if (data.success) {
            const tbody = document.querySelector('#tabla-contactos tbody');
            if(!tbody) return;
            tbody.innerHTML = '';
            
            data.data.forEach(c => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${c.sucursal}</strong></td>
                    <td>${c.direccion}</td>
                    <td>📞 ${c.telefono} <br> ✉️ ${c.email} <br> 💬 ${c.whatsapp}</td>
                    <td>
                        <button onclick="eliminarSucursal('${c._id}')" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Eliminar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Error al cargar sucursales:', error);
    }
};

const eliminarSucursal = async (id) => {
    if(!confirm('¿Estás seguro de eliminar esta sucursal de la página web?')) return;
    try {
        await fetch(`http://localhost:3000/api/contacto/${id}`, { method: 'DELETE' });
        cargarContactosAdmin();
    } catch (error) {
        console.error(error);
    }
};

// ==========================================
// GESTIÓN DE TRAZABILIDAD GENÉTICA
// ==========================================
const cargarRegistrosGeneticos = async () => {
    try {
        const respuesta = await fetch('http://localhost:3000/api/registro-genetico', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resultado = await respuesta.json();
        
        if (resultado.success) {
            const tbody = document.querySelector('#tabla-genetica tbody');
            if(!tbody) return;
            tbody.innerHTML = '';
            
            resultado.data.forEach(reg => {
                const tr = document.createElement('tr');
                
                // Formatear fechas para que se vean bien
                const fechaProc = new Date(reg.fechaProcedimiento).toLocaleDateString('es-CO');
                const fechaPalp = reg.fechaPalpacion ? new Date(reg.fechaPalpacion).toLocaleDateString('es-CO') : 'Pendiente';
                
                // Colores para la técnica y el resultado
                const colorTecnica = reg.tipoProcedimiento === 'TE' ? '#fce7f3; color: #db2777' : '#e0f2fe; color: #0284c7';
                let colorPrenez = '#fef9c3; color: #854d0e'; // Pendiente (Amarillo)
                if(reg.estadoPrenez === 'Preñada') colorPrenez = '#dcfce7; color: #166534'; // Verde
                if(reg.estadoPrenez === 'Vacía' || reg.estadoPrenez === 'Aborto') colorPrenez = '#fee2e2; color: #991b1b'; // Rojo

                tr.innerHTML = `
                    <td><strong>${reg.productor}</strong><br><small>📍 ${reg.finca}</small></td>
                    <td><span style="font-weight: bold; font-size: 1.1rem;">${reg.animalId}</span></td>
                    <td><span style="background: ${colorTecnica}; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.85rem;">${reg.tipoProcedimiento}</span></td>
                    <td>🐂 ${reg.geneticaUtilizada}</td>
                    <td><small><strong>Proc:</strong> ${fechaProc}<br><strong>Rev:</strong> ${fechaPalp}</small></td>
                    <td><span style="padding: 4px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: bold; background: ${colorPrenez}">${reg.estadoPrenez}</span></td>
                    <td>👨‍⚕️ ${reg.veterinarioAsignado}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Error al cargar historial genético:', error);
    }
};

// Cargar la lista de usuarios en el Panel Admin
const cargarUsuariosAdmin = async () => {
    try {
        const res = await fetch('http://localhost:3000/api/auth/usuarios', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
            const tbody = document.querySelector('#tabla-usuarios tbody');
            if (!tbody) return;
            tbody.innerHTML = '';

            data.data.forEach(u => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #e2e8f0';
                
                tr.innerHTML = `
                    <td style="padding: 10px;"><strong>${u.nombre}</strong></td>
                    <td style="padding: 10px;">${u.email}</td>
                    <td style="padding: 10px;"><span style="background: #e0f2fe; color: #0284c7; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem;">${u.rol}</span></td>
                    <td style="padding: 10px;"><span style="color: ${u.estado ? '#166534' : '#991b1b'}; font-weight: bold;">${u.estado ? 'Activo' : 'Inactivo'}</span></td>
                    <td style="padding: 10px;">
                        <button onclick="cambiarEstadoUsuario('${u._id}', ${!u.estado})" style="background: ${u.estado ? '#ef4444' : '#22c55e'}; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-right: 5px;">
                            ${u.estado ? 'Desactivar' : 'Activar'}
                        </button>
                        <button onclick="restablecerPassword('${u._id}')" style="background: #f59e0b; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                            Cambiar Clave
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error('Error al cargar usuarios:', e);
    }
};

const cambiarEstadoUsuario = async (id, nuevoEstado) => {
    try {
        await fetch(`http://localhost:3000/api/auth/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        cargarUsuariosAdmin();
    } catch (e) { console.error(e); }
};

const restablecerPassword = async (id) => {
    const nuevaClave = prompt("Ingresa la nueva contraseña para este usuario:");
    if (!nuevaClave) return;

    try {
        const res = await fetch(`http://localhost:3000/api/auth/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ password: nuevaClave })
        });
        const data = await res.json();
        if (data.success) {
            alert('¡Contraseña actualizada con éxito!');
        }
    } catch (e) { console.error(e); }
};

// Llama a esta función cuando el usuario haga clic en la pestaña de Gestión de Personal
// (Asegúrate de agregar cargarUsuariosAdmin(); dentro del evento de clic de navUsuarios en tu app.js)