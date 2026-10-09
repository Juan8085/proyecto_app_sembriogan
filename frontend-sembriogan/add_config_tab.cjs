const fs = require('fs');
let c = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');

c = c.replace(
    "import GestorCarrusel from '../components/GestorCarrusel';",
    "import GestorCarrusel from '../components/GestorCarrusel';\nimport AdminConfiguracion from '../components/AdminConfiguracion';"
);

c = c.replace(
    "case 'carrusel':\n        return <GestorCarrusel />;",
    "case 'carrusel':\n        return <GestorCarrusel />;\n      case 'configuracion':\n        return <AdminConfiguracion />;"
);

c = c.replace(
    "<button \n            onClick={() => handleTabChange('carrusel')}",
    "<button \n            onClick={() => handleTabChange('configuracion')}\n            className={`w-full text-left p-3 rounded-lg font-semibold transition ${activeTab === 'configuracion' ? 'bg-primary text-white' : 'hover:bg-gray-800 text-gray-300'}`}\n          >\n            ⚙️ Configuración\n          </button>\n          <button \n            onClick={() => handleTabChange('carrusel')}"
);

c = c.replace(
    "{activeTab === 'carrusel' && 'Gestión de Imágenes Web'}",
    "{activeTab === 'carrusel' && 'Gestión de Imágenes Web'}\n            {activeTab === 'configuracion' && 'Ajustes de Sistema y Perfil'}"
);

fs.writeFileSync('src/pages/AdminDashboard.jsx', c);
