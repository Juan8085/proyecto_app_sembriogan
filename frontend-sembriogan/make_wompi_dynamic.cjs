const fs = require('fs');
let c = fs.readFileSync('src/pages/PublicHome.jsx', 'utf8');

if (!c.includes('const [configGlobal, setConfigGlobal] = useState(null);')) {
    c = c.replace(
        "const [infoNosotros, setInfoNosotros] = useState(null);",
        "const [infoNosotros, setInfoNosotros] = useState(null);\n  const [configGlobal, setConfigGlobal] = useState(null);"
    );
    c = c.replace(
        "fetch('http://localhost:3000/api/nosotros').then(res => res.json()).then(data => { if (data.success && data.data) setInfoNosotros(data.data); }).catch(console.error);",
        "fetch('http://localhost:3000/api/nosotros').then(res => res.json()).then(data => { if (data.success && data.data) setInfoNosotros(data.data); }).catch(console.error);\n    fetch('http://localhost:3000/api/configuracion').then(res => res.json()).then(data => { if (data.success) setConfigGlobal(data.data); }).catch(console.error);"
    );
    c = c.replace(
        "publicKey: 'pub_test_1jKw2orNya3GdwqfTCl1wU6V0yS0mnnh'",
        "publicKey: configGlobal?.wompiPublicKey || 'pub_test_1jKw2orNya3GdwqfTCl1wU6V0yS0mnnh'"
    );
    
    fs.writeFileSync('src/pages/PublicHome.jsx', c);
}
