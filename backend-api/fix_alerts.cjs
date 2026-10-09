const fs = require('fs');
let c = fs.readFileSync('../app-veterinario/dashboard.html', 'utf8');

// Remove the old push button from header
c = c.replace(
    `<button id="btn-notificaciones" onclick="activarNotificaciones()" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-xl text-xs font-bold transition mr-2">
            🔔 Alertas
        </button>`,
    ""
);

// Update cargarMisProcedimientos to calculate 45 days
const newCargar = `
                    listaDiv.innerHTML = misRegistros.map(reg => {
                        const hoy = new Date();
                        const fechaRegistro = new Date(reg.createdAt || reg.fechaProcedimiento || new Date());
                        const diffTime = Math.abs(hoy - fechaRegistro);
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        
                        let alertaHTML = '';
                        let borderClass = 'border-slate-200';
                        
                        // Si cumple 45 o más, es alerta!
                        if (diffDays === 45) {
                            alertaHTML = '<div class="bg-amber-100 text-amber-700 font-bold text-xs p-2 rounded-lg mb-3 flex items-center gap-2">⚠️ ¡ALERTA! Cumple 45 días hoy. Chequeo IATF requerido.</div>';
                            borderClass = 'border-amber-400 border-2 shadow-md';
                        } else if (diffDays > 45) {
                            alertaHTML = \`<div class="bg-red-100 text-red-700 font-bold text-xs p-2 rounded-lg mb-3 flex items-center gap-2">🚨 ¡RETRASADO! Han pasado \${diffDays} días (Límite: 45).</div>\`;
                            borderClass = 'border-red-400 border-2 shadow-md';
                        } else {
                            alertaHTML = \`<div class="bg-slate-50 text-slate-500 font-semibold text-xs p-2 rounded-lg mb-3">⏳ Faltan \${45 - diffDays} días para chequeo</div>\`;
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
                            <div class="border-t border-slate-100 pt-3 flex justify-between gap-2 mt-2">
                                <button onclick="actualizarEstadoProcedimiento('\${reg._id}', 'Preñada')" class="flex-1 bg-green-50 text-green-700 hover:bg-green-100 font-bold py-2.5 rounded-xl text-xs transition border border-green-200 shadow-sm">✅ Confirmar Preñez</button>
                                <button onclick="actualizarEstadoProcedimiento('\${reg._id}', 'Vacía')" class="flex-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold py-2.5 rounded-xl text-xs transition border border-red-200 shadow-sm">❌ Marcar Vacía</button>
                            </div>
                        </div>
                    \`}).join('');
`;

c = c.replace(/listaDiv\.innerHTML = misRegistros\.map\(reg => `[\s\S]*?`\)\.join\(''\);/, newCargar);

fs.writeFileSync('../app-veterinario/dashboard.html', c);
