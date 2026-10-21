const { spawn } = require('child_process');
const https = require('https');
const path = require('path');
const os = require('os');

console.log('\n===========================================================');
console.log('🚀 INICIANDO SEMBRIOGAN COMPLETO PARA COMPARTIR');
console.log('===========================================================\n');

// 1. Iniciar Backend (Puerto 3000)
console.log('⏳ [1/3] Iniciando Backend API (puerto 3000)...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, '..', 'backend-api'),
  shell: true,
  stdio: 'inherit'
});

// 2. Iniciar Frontend (Puerto 5173)
console.log('⏳ [2/3] Iniciando Frontend Vite (puerto 5173)...');
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, '..', 'frontend-sembriogan'),
  shell: true,
  stdio: 'inherit'
});

// Obtener IP local de la máquina
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();

// 3. Esperar a que los servidores estén listos y abrir el túnel
setTimeout(async () => {
  console.log('\n⏳ [3/3] Creando túnel público seguro (compatible con Avast / Windows Defender)...');

  // Obtener contraseña del túnel
  https.get('https://loca.lt/mytunnelpassword', (res) => {
    let password = '';
    res.on('data', chunk => password += chunk);
    res.on('end', () => {
      iniciarTunel(password.trim());
    });
  }).on('error', () => {
    iniciarTunel('');
  });

}, 4000);

function iniciarTunel(tunnelPassword) {
  const tunnel = spawn('npx', ['-y', 'localtunnel', '--port', '5173'], {
    shell: true,
  });

  tunnel.stdout.on('data', (data) => {
    const text = data.toString();
    const match = text.match(/https:\/\/[^\s]+/);
    if (match) {
      const publicUrl = match[0];
      console.log('\n===========================================================');
      console.log('🎉 ¡PROYECTO LISTO Y COMPARTIDO CON ÉXITO!');
      console.log('===========================================================');
      console.log(`\n🌍 ENLACE PÚBLICO (Para abrir en cualquier celular o equipo):`);
      console.log(`   👉 \x1b[32m\x1b[1m${publicUrl}\x1b[0m`);
      if (tunnelPassword) {
        console.log(`\n🔑 Contraseña del túnel (si la página te la pide al entrar):`);
        console.log(`   👉 \x1b[33m\x1b[1m${tunnelPassword}\x1b[0m (y clic en "Click to Submit")`);
      }
      console.log(`\n📶 ENLACE DE RED LOCAL (Para la misma red Wi-Fi en el SENA / Casa):`);
      console.log(`   👉 \x1b[36mhttp://${localIP}:5173\x1b[0m (Sin túnel ni contraseñas)`);
      console.log('\n===========================================================');
      console.log('💡 Presiona Ctrl + C en cualquier momento para detener todo.\n');
    }
  });

  tunnel.stderr.on('data', (data) => {
    // Silencioso
  });
}

function cleanup() {
  console.log('\nApagando servidores...');
  backend.kill();
  frontend.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
