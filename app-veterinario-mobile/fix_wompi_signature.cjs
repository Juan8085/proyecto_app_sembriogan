const fs = require('fs');

let catContent = fs.readFileSync('src/screens/CatalogoScreen.js', 'utf8');

// Update generarPagoWompi to be async
if (!catContent.includes('const generarPagoWompi = async (producto) => {')) {
    catContent = catContent.replace(
        /const generarPagoWompi = \(producto\) => \{/g,
        'const generarPagoWompi = async (producto) => {'
    );
}

const oldWompiLogic = `    // Wompi Web Checkout Link
    const finalKey = (config.wompiPublicKey && config.wompiPublicKey !== 'undefined') ? config.wompiPublicKey : 'pub_test_ljKW2orNya3GoWqfTCl1wu6vOy50mnnh';
    const wompiUrl = \`https://checkout.wompi.co/p/?public-key=\${finalKey}&currency=COP&amount-in-cents=\${amountInCents}&reference=\${reference}&redirect-url=https://sembriogan.com/gracias\`;

    // Abriendo el navegador nativo del dispositivo para seguridad del pago
    Linking.openURL(wompiUrl).catch(err => {
      console.error('Failed to open URL:', err);
      Alert.alert('Error', 'No se pudo abrir el navegador para el pago.');
    });`;

const newWompiLogic = `    // Fetch signature from backend to comply with Wompi's Integrity requirement
    let signature = '';
    try {
      const res = await fetch(\`\${API_URL}/api/configuracion/generar-firma\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, amountInCents, currency: 'COP' })
      });
      const data = await res.json();
      if (data.success) {
        signature = data.signature;
      }
    } catch (err) {
      console.error('Error fetching signature', err);
    }

    // Wompi Web Checkout Link
    const finalKey = (config.wompiPublicKey && config.wompiPublicKey !== 'undefined') ? config.wompiPublicKey : 'pub_test_ljKW2orNya3GoWqfTCl1wu6vOy50mnnh';
    let wompiUrl = \`https://checkout.wompi.co/p/?public-key=\${finalKey}&currency=COP&amount-in-cents=\${amountInCents}&reference=\${reference}&redirect-url=https://sembriogan.com/gracias\`;
    
    // Add signature if successfully generated
    if (signature) {
      wompiUrl += \`&signature=\${signature}\`;
    }

    // Abriendo el navegador nativo del dispositivo para seguridad del pago
    Linking.openURL(wompiUrl).catch(err => {
      console.error('Failed to open URL:', err);
      Alert.alert('Error', 'No se pudo abrir el navegador para el pago.');
    });`;

catContent = catContent.replace(oldWompiLogic, newWompiLogic);

fs.writeFileSync('src/screens/CatalogoScreen.js', catContent);
console.log('CatalogoScreen updated with Wompi signature fetch!');
