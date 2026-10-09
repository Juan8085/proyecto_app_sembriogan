const fs = require('fs');
let c = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');

c = c.split('</nav>').join(`<button 
            onClick={() => handleTabChange('configuracion')}
            className={\`w-full text-left p-3 rounded-lg font-semibold transition \${activeTab === 'configuracion' ? 'bg-primary text-white' : 'hover:bg-gray-800 text-gray-300'}\`}
          >
            ⚙️ Configuración
          </button>
        </nav>`);

c = c.split("import GestorCarrusel from '../components/GestorCarrusel';").join("import GestorCarrusel from '../components/GestorCarrusel';\nimport AdminConfiguracion from '../components/AdminConfiguracion';");

c = c.split("case 'carrusel':").join("case 'configuracion':\n        return <AdminConfiguracion />;\n      case 'carrusel':");

c = c.split("{activeTab === 'carrusel' && 'Gestión de Imágenes Web'}").join("{activeTab === 'carrusel' && 'Gestión de Imágenes Web'}\n            {activeTab === 'configuracion' && 'Ajustes de Sistema y Perfil'}");

fs.writeFileSync('src/pages/AdminDashboard.jsx', c);
