const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'PublicHome.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update main wrapper
content = content.replace(
    /<div className="min-h-screen bg-white flex flex-col font-sans relative scroll-smooth">/,
    `<div className="min-h-screen bg-slate-50/50 flex flex-col font-sans relative scroll-smooth selection:bg-blue-600 selection:text-white">
      {/* Ambient Backgrounds for Softness */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/30 blur-[120px] -z-10 pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-100/30 blur-[120px] -z-10 pointer-events-none"></div>`
);

// 2. Update Header styling to be more glassmorphic
content = content.replace(
    /className="fixed top-4 left-1\/2 transform -translate-x-1\/2 w-\[95%\] max-w-6xl bg-white\/85 backdrop-blur-md shadow-sm py-3 px-6 flex justify-between items-center rounded-2xl z-50 border border-slate-200\/50"/,
    `className="fixed top-6 left-1/2 transform -translate-x-1/2 w-[95%] max-w-7xl bg-white/70 backdrop-blur-xl shadow-lg shadow-slate-200/20 py-4 px-8 flex justify-between items-center rounded-full z-50 border border-white"`
);

// 3. Update Hero Section
const heroRegex = /<section id="inicio" className="relative min-h-\[85vh\] w-full overflow-hidden bg-slate-900 flex items-center">[\s\S]*?<\/section>/;
const newHero = `<section id="inicio" className="relative min-h-[95vh] w-full overflow-hidden flex items-center">
        {imagenesHero.length > 0 ? (
            imagenesHero.map((img, index) => (
                <div key={img._id} className={\`absolute inset-0 transition-opacity duration-1000 ease-in-out \${index === indiceActual ? 'opacity-100 z-10' : 'opacity-0 z-0'}\`}>
                    <img src={\`http://localhost:3000\${img.imagenUrl}\`} alt={img.titulo} className="w-full h-full object-cover" />
                    {/* Gradient Overlay that fades into the page background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-50/50 z-10"></div>
                    <div className={\`absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto text-white transition-all duration-1000 \${index === indiceActual ? 'translate-y-0 scale-100' : 'translate-y-8 scale-95'}\`}>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight leading-tight drop-shadow-2xl">{img.titulo || "Biotecnología Reproductiva"}</h1>
                        <p className="text-lg md:text-2xl text-slate-100 mb-12 max-w-3xl font-light drop-shadow-lg leading-relaxed">{img.descripcion || "Maximizando la genética bovina con tecnología de punta."}</p>
                        <a href="#servicios" className="bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold py-4 px-10 rounded-full hover:bg-white hover:text-slate-900 transition-all duration-500 shadow-2xl text-lg flex items-center gap-3">
                           Explorar Catálogo <ChevronDown size={20} className="animate-bounce"/>
                        </a>
                    </div>
                </div>
            ))
        ) : (
            <div className="absolute inset-0 z-10 bg-slate-800 flex items-center justify-center text-white">Cargando experiencia...</div>
        )}
        {/* Soft bottom fade to blend with next section */}
        <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-slate-50/50 via-slate-50/30 to-transparent z-30 pointer-events-none"></div>
      </section>`;
content = content.replace(heroRegex, newHero);

// 4. Update Nosotros Section
const nosotrosRegex = /<section id="nosotros" className="py-24 px-6 max-w-6xl mx-auto w-full bg-white">[\s\S]*?<div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">/;
const newNosotros = `<section id="nosotros" className="py-32 px-6 max-w-7xl mx-auto w-full relative z-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">`;
content = content.replace(nosotrosRegex, newNosotros);

// Rounding image in nosotros
content = content.replace(/className="rounded-3xl shadow-2xl object-cover h-\[450px\] w-full"/, 'className="rounded-[2.5rem] shadow-2xl shadow-blue-900/10 object-cover h-[500px] w-full border border-white"');

// 5. Update Historias Section
const historiasRegex = /<section id="historias" className="bg-slate-50 py-24 px-6 border-y border-slate-100">/;
content = content.replace(historiasRegex, `<section id="historias" className="py-32 px-6 relative z-40">`);

// Historias cards glassmorphism
const historiaCardRegex = /className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between"/g;
content = content.replace(historiaCardRegex, `className="bg-white/60 backdrop-blur-xl p-10 rounded-[2rem] border border-white shadow-xl shadow-slate-200/50 flex flex-col justify-between hover:-translate-y-2 transition-transform duration-300"`);

// 6. Update Servicios Section
const serviciosRegex = /<section id="servicios" className="py-24 px-6 max-w-6xl mx-auto w-full bg-white">/;
content = content.replace(serviciosRegex, `<section id="servicios" className="py-32 px-6 max-w-7xl mx-auto w-full relative z-40">`);

// Servicios cards glassmorphism
const serviciosCardRegex = /className="bg-white rounded-3xl border border-slate-100 overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300 hover:-translate-y-1"/g;
content = content.replace(serviciosCardRegex, `className="bg-white/80 backdrop-blur-lg rounded-[2.5rem] border border-white overflow-hidden flex flex-col justify-between hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 hover:-translate-y-2"`);

// Remove bg-white from footer
content = content.replace(/<footer className="bg-white border-t border-slate-100 py-12 px-6 text-center text-sm mt-auto">/, `<footer className="bg-transparent border-t border-slate-200/50 py-12 px-6 text-center text-sm mt-auto relative z-40">`);

fs.writeFileSync(filePath, content);
console.log("PublicHome.jsx modernized successfully.");
