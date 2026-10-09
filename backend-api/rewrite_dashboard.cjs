const fs = require('fs');

let c = fs.readFileSync('../app-veterinario/dashboard.html', 'utf8');

// 1. Añadir de nuevo el botón de Alertas en el header, que abra un modal o haga scroll
const btnAlertas = `
        <button id="btn-notificaciones" onclick="abrirAlertas()" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-xl text-xs font-bold transition mr-2 flex items-center gap-1">
            <span class="animate-pulse">🔔</span> Alertas
        </button>
        `;

c = c.replace(/<button id="btn-salir"/, btnAlertas + '<button id="btn-salir"');

// 2. Nuevo modal de alertas en el HTML
const modalAlertas = `
    <!-- Modal Alertas -->
    <div id="modal-alertas" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 hidden flex flex-col justify-end">
        <div class="bg-white rounded-t-3xl p-5 w-full max-w-md mx-auto h-[80vh] flex flex-col shadow-2xl transform transition-transform duration-300 translate-y-full" id="modal-alertas-content">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">🔔 Alertas para Hoy</h2>
                <button onclick="cerrarAlertas()" class="bg-slate-100 text-slate-500 w-8 h-8 rounded-full font-bold hover:bg-slate-200">✕</button>
            </div>
            <div id="lista-alertas" class="flex-1 overflow-y-auto space-y-3 pb-6">
                <div class="text-center text-slate-500 text-sm mt-10">Cargando alertas...</div>
            </div>
        </div>
    </div>
</main>
`;
c = c.replace(/<\/main>/, modalAlertas);

// 3. Reemplazar la lógica JS completa
const scriptStart = c.indexOf('async function cargarMisProcedimientos()');
const scriptEnd = c.indexOf('</script>');

const oldScript = c.substring(scriptStart, scriptEnd);

const newScript = `
        let procedimientosGlobales = [];

        async function cargarMisProcedimientos() {
            const listaDiv = document.getElementById('lista-procedimientos');
            const token = localStorage.getItem('tokenVet');
            
            if (!navigator.onLine) {
                listaDiv.innerHTML = \`<div class="bg-amber-50 p-4 rounded-2xl shadow-sm border border-amber-200 text-center text-xs font-bold text-amber-700">Sin conexión. Visualización no disponible.</div>\`;
                return;
            }

            try {
                const res = await fetch('http://localhost:3000/api/registro-genetico', {
                    headers: { 'Authorization': \`Bearer \${token}\` }
                });
                const data = await res.json();

                if (data.success) {
                    const misRegistros = data.data.filter(reg => reg.estadoPrenez === 'Pendiente Evaluación' || reg.estadoPrenez === 'Pendiente');
                    procedimientosGlobales = misRegistros;

                    if (misRegistros.length === 0) {
                        listaDiv.innerHTML = \`<div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-center text-xs font-bold text-slate-500">No tienes procedimientos pendientes.</div>\`;
                        return;
                    }

                    renderizarProcedimientos(misRegistros, listaDiv, false);
                }
            } catch (error) {
                listaDiv.innerHTML = \`<div class="bg-red-50 p-4 rounded-2xl shadow-sm border border-red-200 text-center text-xs font-bold text-red-700">Error al cargar procedimientos.</div>\`;
            }
        }

        function renderizarProcedimientos(registros, contenedor, soloAlertas) {
            const hoy = new Date();
            hoy.setHours(0,0,0,0);

            const html = registros.map(reg => {
                const dia0 = new Date(reg.fechasProtocolo?.dia0_sincronizacion || reg.fechaProcedimiento || reg.createdAt);
                
                const sumarDias = (fecha, dias) => {
                    const nueva = new Date(fecha);
                    nueva.setDate(nueva.getDate() + dias);
                    return nueva;
                };

                const pasos = [
                    { key: 'dia8_retiro', nombre: 'Retiro Dispositivo (Día 8)', fecha: sumarDias(dia0, 8), completado: reg.pasosCompletados?.dia8_retiro }
                ];

                if (reg.tipoProcedimiento === 'IATF') {
                    pasos.push({ key: 'dia10_inseminacion', nombre: 'Inseminación (Día 10)', fecha: sumarDias(dia0, 10), completado: reg.pasosCompletados?.dia10_inseminacion });
                } else if (reg.tipoProcedimiento === 'TE') {
                    pasos.push({ key: 'dia17_transferencia', nombre: 'Transferencia (Día 17)', fecha: sumarDias(dia0, 17), completado: reg.pasosCompletados?.dia17_transferencia });
                }
                
                pasos.push({ key: 'dia45_confirmacion', nombre: 'Conf. Preñez (Día 45)', fecha: sumarDias(dia0, 45), completado: false });

                const pasoActual = pasos.find(p => !p.completado);
                if (!pasoActual) return ''; // Ya completó todo

                const fechaPaso = new Date(pasoActual.fecha);
                fechaPaso.setHours(0,0,0,0);
                const diffDays = Math.round((fechaPaso - hoy) / (1000 * 60 * 60 * 24));

                // Filtrar para el modal de alertas (solo si es HOY o RETRASADO)
                if (soloAlertas && diffDays > 0) return '';

                let alertaHTML = '';
                let borderClass = 'border-slate-200';
                
                if (diffDays < 0) {
                    alertaHTML = \`<div class="bg-red-100 text-red-700 font-bold text-xs p-2 rounded-lg mb-3 flex items-center gap-2">🚨 ¡RETRASADO \${Math.abs(diffDays)} DÍAS! \${pasoActual.nombre}</div>\`;
                    borderClass = 'border-red-400 border-2 shadow-md';
                } else if (diffDays === 0) {
                    alertaHTML = \`<div class="bg-amber-100 text-amber-700 font-bold text-xs p-2 rounded-lg mb-3 flex items-center gap-2">⚠️ ¡HOY! Requiere: \${pasoActual.nombre}</div>\`;
                    borderClass = 'border-amber-400 border-2 shadow-md';
                } else {
                    alertaHTML = \`<div class="bg-slate-50 text-slate-500 font-semibold text-xs p-2 rounded-lg mb-3">⏳ \${pasoActual.nombre} en \${diffDays} días</div>\`;
                }

                let btnHTML = '';
                if (pasoActual.key === 'dia45_confirmacion') {
                    btnHTML = \`
                        <div class="border-t border-slate-100 pt-3 flex justify-between gap-2 mt-2">
                            <button onclick="actualizarEstadoProcedimiento('\${reg._id}', 'Preñada')" class="flex-1 bg-green-50 text-green-700 hover:bg-green-100 font-bold py-2.5 rounded-xl text-xs transition border border-green-200 shadow-sm">✅ Preñada</button>
                            <button onclick="actualizarEstadoProcedimiento('\${reg._id}', 'Vacía')" class="flex-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold py-2.5 rounded-xl text-xs transition border border-red-200 shadow-sm">❌ Vacía</button>
                        </div>
                    \`;
                } else {
                    // Solo permitir marcar si ya es el día (o si va atrasado)
                    if (diffDays <= 0) {
                        btnHTML = \`
                        <div class="border-t border-slate-100 pt-3 mt-2">
                            <button onclick="confirmarPaso('\${reg._id}', '\${pasoActual.key}', '\${pasoActual.nombre}')" class="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold py-2.5 rounded-xl text-xs transition border border-blue-200 shadow-sm flex justify-center items-center gap-2">
                                👉 Confirmar que se realizó
                            </button>
                        </div>
                        \`;
                    }
                }

                return \`
                <div class="bg-white p-4 rounded-2xl shadow-sm \${borderClass}">
                    \${alertaHTML}
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <p class="font-bold text-slate-800 text-sm">\${reg.productor || reg.finca || 'Productor no especificado'}</p>
                            <p class="text-sky-600 font-bold text-xs">Chapeta: \${reg.arete || reg.animalId}</p>
                        </div>
                        <span class="bg-sky-100 text-sky-700 text-xs font-bold px-2 py-1 rounded-lg">\${reg.tipoProcedimiento}</span>
                    </div>
                    <p class="text-xs text-slate-500 mb-2">Genética: \${reg.geneticaUtilizada || 'No especificada'}</p>
                    \${btnHTML}
                </div>
                \`;
            }).join('');

            if (html.trim() === '') {
                contenedor.innerHTML = \`<div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-center text-xs font-bold text-slate-500">\${soloAlertas ? '¡Todo al día! No hay tareas para hoy.' : 'No tienes procedimientos pendientes.'}</div>\`;
            } else {
                contenedor.innerHTML = html;
            }
        }

        async function confirmarPaso(id, pasoKey, nombrePaso) {
            if (!confirm(\`¿Confirmas que se completó exitosamente el paso: \${nombrePaso}?\`)) return;
            const token = localStorage.getItem('tokenVet');
            try {
                const res = await fetch(\`http://localhost:3000/api/registro-genetico/\${id}/paso\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
                    body: JSON.stringify({ paso: pasoKey })
                });

                const data = await res.json();
                if (data.success) {
                    alert('✅ Paso actualizado en la nube.');
                    cargarMisProcedimientos(); 
                    if (!document.getElementById('modal-alertas').classList.contains('hidden')) {
                        abrirAlertas(); // Recargar modal
                    }
                } else alert('Error: ' + data.mensaje);
            } catch (error) {
                alert('No se pudo actualizar el paso. Verifica tu conexión.');
            }
        }

        async function actualizarEstadoProcedimiento(id, nuevoEstado) {
            if (!confirm(\`¿Confirmas que el resultado para este animal es: \${nuevoEstado}?\`)) return;
            const token = localStorage.getItem('tokenVet');
            try {
                const res = await fetch(\`http://localhost:3000/api/registro-genetico/\${id}/prenez\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
                    body: JSON.stringify({ estadoPrenez: nuevoEstado, observaciones: \`Diagnóstico actualizado en campo: \${nuevoEstado}\` })
                });

                const data = await res.json();
                if (data.success) {
                    alert(\`✅ Estado finalizado como \${nuevoEstado}\`);
                    cargarMisProcedimientos(); 
                    if (!document.getElementById('modal-alertas').classList.contains('hidden')) {
                        abrirAlertas(); // Recargar modal
                    }
                } else alert('Error: ' + data.mensaje);
            } catch (error) {
                alert('No se pudo actualizar el estado. Verifica tu conexión.');
            }
        }

        function abrirAlertas() {
            const modal = document.getElementById('modal-alertas');
            const content = document.getElementById('modal-alertas-content');
            modal.classList.remove('hidden');
            setTimeout(() => {
                content.classList.remove('translate-y-full');
            }, 10);
            
            const listaDiv = document.getElementById('lista-alertas');
            renderizarProcedimientos(procedimientosGlobales, listaDiv, true);
        }

        function cerrarAlertas() {
            const modal = document.getElementById('modal-alertas');
            const content = document.getElementById('modal-alertas-content');
            content.classList.add('translate-y-full');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }

`;

c = c.replace(oldScript, newScript);
fs.writeFileSync('../app-veterinario/dashboard.html', c);
