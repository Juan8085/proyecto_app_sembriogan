const fs = require('fs');

// 1. Fix AsistenteScreen
let asisContent = fs.readFileSync('src/screens/AsistenteScreen.js', 'utf8');

// Fix API Route and add Role
asisContent = asisContent.replace(
  /fetch\(`\$\{API_URL\}\/api\/ia\/chat`, \{\n\s*method: 'POST',\n\s*headers: \{ 'Content-Type': 'application\/json' \},\n\s*body: JSON\.stringify\(\{ mensaje: userText \}\)\n\s*\}\)/g,
  `fetch(\`\${API_URL}/api/ia/consultar\`, {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ mensaje: userText, rol: 'veterinario' })\n      })`
);

// Better catch message for debugging
asisContent = asisContent.replace(
  /text: 'Error de red\. Asegúrate de estar conectado a internet\.'/g,
  `text: 'Error: ' + error.message`
);

// Fix Keyboard Covering issue
// Change paddingBottom of inputContainer from 100 to 20 so it sits nicely when keyboard is up
asisContent = asisContent.replace(/paddingBottom: Platform\.OS === 'ios' \? 100 : 90,/g, "paddingBottom: 20,");
// Add a marginBottom to container to compensate for tab bar ONLY when keyboard is NOT visible (we can just use 80 margin bottom on the scrollview)
asisContent = asisContent.replace(/paddingBottom: 100, \/\/ Espacio para tab bar/g, "paddingBottom: 120, // Espacio para tab bar");


fs.writeFileSync('src/screens/AsistenteScreen.js', asisContent);


// 2. Fix CatalogoScreen
let catContent = fs.readFileSync('src/screens/CatalogoScreen.js', 'utf8');

// Fix Images
catContent = catContent.replace(
  /source=\{\{ uri: item\.imagenUrl \|\| 'https:\/\/via\.placeholder\.com\/150\?text=Sembriogan' \}\}/g,
  `source={{ uri: item.imagen ? (item.imagen.startsWith('http') ? item.imagen : \`\${API_URL}\${item.imagen}\`) : 'https://via.placeholder.com/150?text=Sembriogan' }}`
);

// Fix Wompi URL again just in case amountInCents has issues
catContent = catContent.replace(
  /const amountInCents = Math\.round\(producto\.costo \* 100\);/g,
  `const amountInCents = Math.round((producto.costo || 0) * 100);\n    if (amountInCents === 0) { Alert.alert('Error', 'Precio inválido'); return; }`
);

// Add API_URL missing in Catalogo
if(!catContent.includes('${API_URL}${item.imagen}')) {
    // The replace worked if it does
}

fs.writeFileSync('src/screens/CatalogoScreen.js', catContent);

console.log('Fixed Asistente and Catalogo!');
