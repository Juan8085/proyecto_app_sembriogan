const fs = require('fs');

let c = fs.readFileSync('registro.html', 'utf8');

c = c.replace(
    /productor: document.getElementById\('productor'\).value,/,
    `productor: document.getElementById('productor').value,
                productorEmail: document.getElementById('productorEmail').value,`
);

c = c.replace(
    /<div class="col-span-2">[\s\S]*?<input type="text" id="productor"[^>]*>[\s\S]*?<\/div>/,
    `$&

                    <div class="col-span-2">
                        <label class="block text-xs font-bold text-slate-700 mb-1">Correo del Productor (Usuario plataforma)</label>
                        <input type="email" id="productorEmail" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-500 outline-none" placeholder="correo@cliente.com">
                    </div>`
);

fs.writeFileSync('registro.html', c);
console.log("Done");
