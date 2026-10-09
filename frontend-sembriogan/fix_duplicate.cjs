const fs = require('fs');
let c = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');

c = c.replace(
    "import AdminConfiguracion from '../components/AdminConfiguracion';\nimport AdminConfiguracion from '../components/AdminConfiguracion';",
    "import AdminConfiguracion from '../components/AdminConfiguracion';"
);

c = c.replace(
    "import AdminConfiguracion from '../components/AdminConfiguracion';\r\nimport AdminConfiguracion from '../components/AdminConfiguracion';",
    "import AdminConfiguracion from '../components/AdminConfiguracion';"
);

fs.writeFileSync('src/pages/AdminDashboard.jsx', c);
