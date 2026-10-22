const { spawn, execSync } = require('child_process');
const https = require('https');
const path = require('path');
const os = require('os');
const net = require('net');
const localtunnel = require('localtunnel');

// 0. Bloqueo de instancia única (Mutex en puerto 49152)
// Evita que el usuario abra dos terminales con compartir y colisionen entre sí
const lockServer = net.createServer();
lockServer.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('\n===========================================================');
    console.log('⚠️ Sembriogan YA se está ejecutando en otra terminal.');
    console.log('Solo necesitas UNA SOLA ventana con "npm run compartir".');
    console.log('Esta ventana se cerrará automáticamente para evitar conflictos.');
    console.log('===========================================================\n');
    process.exit(0);
  }
});
lockServer.listen(49152, '127.0.0.1');

console.log('\n===========================================================');
console.log('🚀 INICIANDO SEMBRIOGAN COMPLETO PARA COMPARTIR');
console.log('===========================================================\n');

// 0.1 Limpieza preventiva de puertos anteriores (3000, 5173, 5174)
try {
  execSync('npx --yes kill-port 3000 5173 5174', { stdio: 'ignore' });
} catch (e) {}

// 1. Iniciar Backend (Puerto 3000)
console.log('⏳ [1/3] Iniciando Backend API (puerto 3000)...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, '..', 'backend-api'),
  shell: true,
  stdio: 'inherit'
});

// 2. Compilar Frontend y Servir Bundle Optimizado (Puerto 5173)
// El bundle optimizado reduce 120 peticiones sueltas a solo 1 archivo, eliminando el error 502 Bad Gateway
console.log('⏳ [2/3] Preparando bundle optimizado de Frontend...');
try {
  execSync('npm run build', {
    cwd: path.join(__dirname, '..', 'frontend-sembriogan'),
    stdio: 'ignore'
  });
} catch (e) {}

console.log('⏳ [2/3] Iniciando Frontend de alta velocidad (puerto 5173)...');
const frontend = spawn('npx', ['vite', 'preview', '--port', '5173', '--host', '0.0.0.0'], {
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
let activeTunnel = null;
let isShuttingDown = false;

// 3. Esperar a que los servidores estén listos y abrir el túnel
setTimeout(async () => {
  if (isShuttingDown) return;
  console.log('\n⏳ [3/3] Creando túnel público seguro y permanente...');

  // Obtener contraseña del túnel
  https.get('https://loca.lt/mytunnelpassword', (res) => {
    let password = '';
    res.on('data', chunk => password += chunk);
    res.on('end', () => {
      iniciarTunelProgramatico(password.trim());
    });
  }).on('error', () => {
    iniciarTunelProgramatico('');
  });

}, 4500);

async function iniciarTunelProgramatico(tunnelPassword) {
  if (isShuttingDown) return;

  try {
    if (activeTunnel) {
      try { activeTunnel.close(); } catch (e) {}
    }

    activeTunnel = await localtunnel({
      port: 5173,
      local_host: '127.0.0.1',
      subdomain: 'sembriogan-app'
    });

    if (activeTunnel.url !== 'https://sembriogan-app.loca.lt') {
      console.log(`\n⏳ El servidor asignó temporalmente (${activeTunnel.url}).`);
      console.log('🔄 Reclamando el enlace oficial https://sembriogan-app.loca.lt en 3 segundos...');
      try { activeTunnel.close(); } catch (e) {}
      setTimeout(() => iniciarTunelProgramatico(tunnelPassword), 3000);
      return;
    }

    console.log('\n===========================================================');
    console.log('🎉 ¡PROYECTO LISTO Y COMPARTIDO CON ÉXITO!');
    console.log('===========================================================');
    console.log(`\n🌍 ENLACE PÚBLICO FIJO (Para abrir en cualquier celular o equipo):`);
    console.log(`   👉 \x1b[32m\x1b[1mhttps://sembriogan-app.loca.lt\x1b[0m`);
    if (tunnelPassword) {
      console.log(`\n🔑 Contraseña del túnel (si la página te la pide al entrar):`);
      console.log(`   👉 \x1b[33m\x1b[1m${tunnelPassword}\x1b[0m (y clic en "Click to Submit")`);
    }
    console.log(`\n📶 ENLACE DE RED LOCAL (Para la misma red Wi-Fi en el SENA / Casa):`);
    console.log(`   👉 \x1b[36mhttp://${localIP}:5173\x1b[0m (Sin túnel ni contraseñas)`);
    console.log('\n===========================================================');
    console.log('💡 Presiona Ctrl + C en cualquier momento para detener todo.\n');

    activeTunnel.on('close', () => {
      if (!isShuttingDown) {
        console.log('\n⚠️ Túnel desconectado por inactividad. Reconectando en 3s...');
        setTimeout(() => iniciarTunelProgramatico(tunnelPassword), 3000);
      }
    });

    activeTunnel.on('error', (err) => {
      if (!isShuttingDown) {
        console.log('\n⚠️ Reconectando túnel...', err.message);
        setTimeout(() => iniciarTunelProgramatico(tunnelPassword), 3000);
      }
    });

  } catch (err) {
    if (!isShuttingDown) {
      console.log('⚠️ Reintentando conexión con loca.lt en 4s...', err.message);
      setTimeout(() => iniciarTunelProgramatico(tunnelPassword), 4000);
    }
  }
}

function cleanup() {
  isShuttingDown = true;
  console.log('\nApagando servidores y túnel...');
  if (activeTunnel) {
    try { activeTunnel.close(); } catch (e) {}
  }
  backend.kill();
  frontend.kill();
  try { lockServer.close(); } catch (e) {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
