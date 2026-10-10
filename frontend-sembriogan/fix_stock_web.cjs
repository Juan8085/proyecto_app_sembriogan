const fs = require('fs');

let pubContent = fs.readFileSync('src/pages/PublicHome.jsx', 'utf8');

const oldButton = `                <button onClick={() => agregarAlCarrito(item)} className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 transition flex justify-center items-center gap-2">
                  <ShoppingCart size={18}/> Agregar
                </button>`;

const newButton = `                <button 
                  onClick={() => agregarAlCarrito(item)} 
                  disabled={!item.esServicio && item.stock <= 0}
                  className={\`w-full text-white font-bold py-3.5 rounded-xl transition flex justify-center items-center gap-2 \${(!item.esServicio && item.stock <= 0) ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700'}\`}>
                  <ShoppingCart size={18}/> {(!item.esServicio && item.stock <= 0) ? 'Agotado' : 'Agregar'}
                </button>`;

pubContent = pubContent.replace(oldButton, newButton);
fs.writeFileSync('src/pages/PublicHome.jsx', pubContent);
console.log('PublicHome out of stock validation added!');
