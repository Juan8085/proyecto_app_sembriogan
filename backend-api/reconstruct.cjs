const fs = require('fs');

const originalHTML = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Sembriogan Vet - Panel Operativo</title>
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Fuentes modernas: Outfit -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- Iconos modernos: Phosphor Icons -->
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
</head>
<body class="bg-slate-100 min-h-screen flex flex-col">

    <header class="bg-white shadow-sm py-4 px-6 flex justify-between items-center sticky top-0 z-50 border-b border-slate-200">
        <div class="flex items-center space-x-3">
            <img src="img/logo.png" alt="Logo Sembriogan" class="h-10 object-contain">
            <div>
                <h1 id="nombre-vet" class="text-sm font-bold text-slate-800">Veterinario</h1>
                <p class="text-xs text-sky-600 font-semibold">Modo Campo (Offline Ready)</p>
            </div>
        </div>
        <button id="btn-notificaciones" onclick="abrirAlertas()" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-xl text-xs font-bold transition mr-2 flex items-center gap-1">
            <span class="animate-pulse">🔔</span> Alertas
        </button>
        <button id="btn-salir" class="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-xl text-xs font-bold transition">
            Salir
        </button>
    </header>

    <main class="flex-1 p-5 max-w-md mx-auto w-full space-y-5">
        
        <!-- Estado de Red / Sincronización -->
        <div id="estado-red" class="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-colors">
            <span id="texto-conexion" class="flex items-center gap-2">🟢 Conectado al Servidor</span>
            <button id="btn-sync" onclick="sincronizarPendientes()" class="bg-emerald-200 px-2.5 py-1 rounded-full cursor-pointer hover:bg-emerald-300">0 pendientes</button>
        </div>

        <!-- Módulos de Operación de Campo -->
        <div class="grid grid-cols-2 gap-3">
            <div class="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition cursor-pointer" onclick="window.location.href='registro.html'">
                <div>
                    <div class="w-10 h-10 bg-sky-50 rounded-2xl flex items-center justify-center text-xl mb-2">💉</div>
                    <h3 class="font-bold text-slate-800 text-sm">Registro IATF</h3>
                </div>
                <span class="text-sky-600 font-bold text-xs mt-3 block">Nuevo →</span>
            </div>

            <div class="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition cursor-pointer" onclick="window.location.href='catalogo.html'">
                <div>
                    <div class="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-xl mb-2">📦</div>
                    <h3 class="font-bold text-slate-800 text-sm">Catálogo</h3>
                </div>
                <span class="text-amber-600 font-bold text-xs mt-3 block">Explorar →</span>
            </div>
        </div>

        <!-- MÓDULO NUEVO: ASISTENTE DE IA -->
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 rounded-3xl shadow-sm flex items-center justify-between hover:shadow-md transition cursor-pointer" onclick="window.location.href='chat.html'">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🤖</div>
                <div>
                    <h3 class="font-bold text-white text-sm">Asistente IA Ganadero</h3>
                    <p class="text-indigo-100 text-xs mt-0.5">Consultas y protocolos técnicos</p>
                </div>
            </div>
            <span class="text-white font-bold text-xl">→</span>
        </div>

        <!-- MIS PROCEDIMIENTOS ACTIVOS -->
        <div class="space-y-3 pb-8">
            <div class="flex justify-between items-center">
                <h3 class="font-bold text-slate-800 text-sm">Mis Procedimientos en Proceso</h3>
                <button onclick="cargarMisProcedimientos()" class="text-xs text-sky-600 font-bold bg-sky-50 px-3 py-1.5 rounded-lg hover:bg-sky-100">↻ Actualizar</button>
            </div>
            
            <div id="lista-procedimientos" class="space-y-3">
                <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-center text-xs text-slate-500">
                    Cargando procedimientos...
                </div>
            </div>
        </div>

    </main>

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

    <script>
        let procedimientosGlobales = [];

        document.addEventListener('DOMContentLoaded', () => {
            const token = localStorage.getItem('tokenVet');
            const usuarioStr = localStorage.getItem('usuarioVet');

            if (!token || !usuarioStr) {
                window.location.href = 'index.html';
                return;
            }

            const usuario = JSON.parse(usuarioStr);
            document.getElementById('nombre-vet').textContent = usuario.nombre || 'Veterinario';

            document.getElementById('btn-salir').addEventListener('click', () => {
                localStorage.removeItem('tokenVet');
                localStorage.removeItem('usuarioVet');
                window.location.href = 'index.html';
            });

            window.addEventListener('online', () => {
                actualizarEstadoRed();
                sincronizarPendientes(); 
            });
            window.addEventListener('offline', actualizarEstadoRed);
            
            actualizarEstadoRed();
            cargarMisProcedimientos();
        });

        function actualizarEstadoRed() {
            const btnSync = document.getElementById('btn-sync');
            const estadoRed = document.getElementById('estado-red');
            const textoConexion = document.getElementById('texto-conexion');
            const cola = JSON.parse(localStorage.getItem('colaRegistros') || '[]');
            
            btnSync.textContent = \`\${cola.length} pendientes\`;

            if (navigator.onLine) {
                estadoRed.className = "bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-colors";
                textoConexion.innerHTML = "🟢 Conectado al Servidor";
                if (cola.length > 0) btnSync.classList.add('animate-pulse', 'bg-emerald-300');
                else btnSync.classList.remove('animate-pulse', 'bg-emerald-300');
            } else {
                estadoRed.className = "bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-colors";
                textoConexion.innerHTML = "🔴 Modo Offline Activo";
                btnSync.classList.remove('animate-pulse', 'bg-emerald-300');
            }
        }

        async function sincronizarPendientes() {
            if (!navigator.onLine) return;
            let cola = JSON.parse(localStorage.getItem('colaRegistros') || '[]');
            if (cola.length === 0) return;

            const token = localStorage.getItem('tokenVet');
            let noSincronizados = [];
            let exitosos = 0;

            for (let registro of cola) {
                try {
                    const res = await fetch('http://localhost:3000/api/registro-genetico', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
                        body: JSON.stringify(registro)
                    });
                    
                    const data = await res.json();
                    if (data.success) exitosos++;
                    else noSincronizados.push(registro);
                } catch (error) {
                    noSincronizados.push(registro);
                }
            }

            localStorage.setItem('colaRegistros', JSON.stringify(noSincronizados));
            actualizarEstadoRed();
            cargarMisProcedimientos();
            if (exitosos > 0) alert(\`¡Se sincronizaron \${exitosos} registros pendientes con éxito!\`);
        }

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
                contenedor.innerHTML = \`<div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-center text-xs font-bold text-slate-500">\${soloAlertas ? '¡Todo al día! No hay tareas urgentes para hoy.' : 'No tienes procedimientos pendientes.'}</div>\`;
            } else {
                contenedor.innerHTML = html;
            }
        }

        async function confirmarPaso(id, pasoKey, nombrePaso) {
            if (!confirm(\`¿Confirmas que se completó exitosamente: \${nombrePaso}?\`)) return;
            const token = localStorage.getItem('tokenVet');
            try {
                const res = await fetch(\`http://localhost:3000/api/registro-genetico/\${id}/paso\`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
                    body: JSON.stringify({ paso: pasoKey })
                });

                const data = await res.json();
                if (data.success) {
                    alert('✅ Paso actualizado.');
                    cargarMisProcedimientos(); 
                    if (!document.getElementById('modal-alertas').classList.contains('hidden')) {
                        abrirAlertas(); 
                    }
                } else alert('Error: ' + data.mensaje);
            } catch (error) {
                alert('No se pudo actualizar el paso. Verifica tu conexión.');
            }
        }

        async function actualizarEstadoProcedimiento(id, nuevoEstado) {
            if (!confirm(\`¿Confirmas el resultado final: \${nuevoEstado}?\`)) return;
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
                        abrirAlertas();
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
    </script>
</body>
</html>`;

fs.writeFileSync('../app-veterinario/dashboard.html', originalHTML);
