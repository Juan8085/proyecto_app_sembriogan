const fs = require('fs');

let lines = fs.readFileSync('src/pages/PublicHome.jsx', 'utf8').split(/\r?\n/);

let index = lines.findIndex(l => l.includes('<button type="submit" className="w-full bg-slate-800 text-white'));

if (index !== -1 && !lines.some(l => l.includes('<GoogleLogin'))) {
    const injection = [
        '            <div className="flex items-center gap-3 my-6">',
        '              <div className="h-px bg-slate-200 flex-1"></div>',
        '              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">O también</span>',
        '              <div className="h-px bg-slate-200 flex-1"></div>',
        '            </div>',
        '            <div className="flex justify-center w-full">',
        '              <GoogleLogin',
        '                onSuccess={handleGoogleSuccess}',
        '                onError={() => alert(\'No se pudo iniciar sesión con Google\')}',
        '                useOneTap',
        '                theme="outline"',
        '                shape="pill"',
        '                locale="es"',
        '              />',
        '            </div>'
    ];
    lines.splice(index + 2, 0, ...injection);
    fs.writeFileSync('src/pages/PublicHome.jsx', lines.join('\n'));
    console.log("Injected GoogleLogin successfully!");
} else {
    console.log("Could not find insertion point or already injected.");
}
