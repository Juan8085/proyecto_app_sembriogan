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

let keepAliveTimer = null;

async function iniciarTunelProgramatico(tunnelPassword) {
  if (isShuttingDown) return;

  try {
    if (activeTunnel) {
      try { activeTunnel.close(); } catch (e) {}
    }
    if (keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }

    activeTunnel = await localtunnel({
      port: 5173,
      local_host: '127.0.0.1',
      subdomain: 'sembriogan-app'
    });

    // Si el servidor loca.lt asignó un subdominio aleatorio temporal mientras libera el oficial
    if (activeTunnel.url !== 'https://sembriogan-app.loca.lt') {
      console.log(`\n⏳ Servidor loca.lt liberando subdominio oficial (asignó temporalmente ${activeTunnel.url})...`);
      console.log(`   Reclamando https://sembriogan-app.loca.lt en 6 segundos...`);
      try { activeTunnel.close(); } catch (e) {}
      setTimeout(() => iniciarTunelProgramatico(tunnelPassword), 6000);
      return;
    }

    console.log('\n===========================================================');
    console.log('🎉 ¡PROYECTO LISTO Y COMPARTIDO CON ÉXITO!');
    console.log('===========================================================');
    console.log(`\n🌍 ENLACE PÚBLICO OFICIAL:`);
    console.log(`   👉 \x1b[32m\x1b[1mhttps://sembriogan-app.loca.lt\x1b[0m`);
    if (tunnelPassword) {
      console.log(`\n🔑 Contraseña del túnel (si la página te la pide al entrar):`);
      console.log(`   👉 \x1b[33m\x1b[1m${tunnelPassword}\x1b[0m (y clic en "Click to Submit")`);
    }
    console.log(`\n📶 ENLACE DE RED LOCAL (Para la misma red Wi-Fi en el SENA / Casa):`);
    console.log(`   👉 \x1b[36mhttp://${localIP}:5173\x1b[0m (Sin túnel ni contraseñas)`);
    console.log('\n===========================================================');
    console.log('💡 Presiona Ctrl + C en cualquier momento para detener todo.\n');

    // Keep-alive continuo cada 20 segundos para evitar que loca.lt cierre el túnel por inactividad (Error 503)
    keepAliveTimer = setInterval(() => {
      if (isShuttingDown || !activeTunnel) return;
      https.get('https://sembriogan-app.loca.lt', (res) => {
        // Ping exitoso para mantener el socket caliente
      }).on('error', () => {
        // Silenciar errores temporales de ping
      });
    }, 20000);

    activeTunnel.on('close', () => {
      if (!isShuttingDown) {
        console.log('\n⚠️ Túnel desconectado por el servidor remoto. Reconectando en 3s...');
        if (keepAliveTimer) clearInterval(keepAliveTimer);
        setTimeout(() => iniciarTunelProgramatico(tunnelPassword), 3000);
      }
    });

    activeTunnel.on('error', (err) => {
      if (!isShuttingDown) {
        console.log('\n⚠️ Reconectando túnel...', err.message);
        if (keepAliveTimer) clearInterval(keepAliveTimer);
        setTimeout(() => iniciarTunelProgramatico(tunnelPassword), 3000);
      }
    });

  } catch (err) {
    if (!isShuttingDown) {
      console.log('⚠️ Reintentando conexión con loca.lt en 5s...', err.message);
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      setTimeout(() => iniciarTunelProgramatico(tunnelPassword), 5000);
    }
  }
}

function cleanup() {
  isShuttingDown = true;
  console.log('\nApagando servidores y túnel...');
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
  }
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
