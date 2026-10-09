const fs = require('fs');
let lines = fs.readFileSync('src/pages/PublicHome.jsx', 'utf8').split(/\r?\n/);

let index = lines.findIndex(l => l.includes('{/* MODAL: CONFIGURAR PERFIL (NUEVO) */}'));

if (index !== -1 && !lines.some(l => l.includes('Mis Procedimientos (Genética)'))) {
    // We want to insert just before `            </div>` that closes the scrolling container, which is 4 lines above the `MODAL: CONFIGURAR PERFIL`
    // Let's just walk up to find the `</div>` that corresponds to `<div className="flex-1 overflow-y-auto space-y-6">`
    let targetLine = index - 5;
    
    const procedimientosHTML = [
        '              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-6">',
        '                <h4 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2"><Star size={18}/> Mis Procedimientos (Genética)</h4>',
        '                {misProcedimientosCliente.length === 0 ? (',
        '                  <p className="text-sm text-slate-500 py-4">No hay procedimientos genéticos vinculados a este correo.</p>',
        '                ) : (',
        '                  <div className="space-y-3">',
        '                    {misProcedimientosCliente.map(proc => (',
        '                      <div key={proc._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">',
        '                        <div className="flex justify-between items-start">',
        '                           <div>',
        '                             <p className="font-bold text-slate-800 text-sm">Chapeta: <span className="text-primary">{proc.arete || proc.animalId}</span></p>',
        '                             <p className="text-slate-500 text-xs">Finca: {proc.finca || proc.productor}</p>',
        '                           </div>',
        '                           <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${proc.tipoProcedimiento === \'IATF\' ? \'bg-purple-100 text-purple-700\' : \'bg-indigo-100 text-indigo-700\'}`}>',
        '                             {proc.tipoProcedimiento}',
        '                           </span>',
        '                        </div>',
        '                        <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-1">',
        '                           <span className="text-xs text-slate-400">Día 0: {new Date(proc.fechasProtocolo?.dia0_sincronizacion || proc.createdAt).toLocaleDateString()}</span>',
        '                           <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${(proc.estadoPrenez === \'Pendiente\' || proc.estadoPrenez === \'Pendiente Evaluación\') ? \'bg-yellow-100 text-yellow-700\' : (proc.estadoPrenez === \'Preñada\' ? \'bg-green-100 text-green-700\' : \'bg-red-100 text-red-700\')}`}>',
        '                             {proc.estadoPrenez}',
        '                           </span>',
        '                        </div>',
        '                      </div>',
        '                    ))}',
        '                  </div>',
        '                )}',
        '              </div>'
    ];
    
    lines.splice(targetLine, 0, ...procedimientosHTML);
    fs.writeFileSync('src/pages/PublicHome.jsx', lines.join('\n'));
    console.log("Injected procedures successfully!");
} else {
    console.log("Could not find insertion point or already injected.");
}
