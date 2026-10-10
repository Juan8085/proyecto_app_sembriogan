const fs = require('fs');

let asisContent = fs.readFileSync('src/screens/AsistenteScreen.js', 'utf8');

// Ensure the greeting is '¡Hola colega!'
asisContent = asisContent.replace(
  /¡Hola! Soy tu asistente de Sembriogan IA/g,
  '¡Hola colega! Soy tu asistente de Sembriogan IA'
);

// Fix the UI overlapping issue.
// We need to restore the padding so it's not hidden by the absolute tab bar.
// We will use a paddingBottom of 90 on the container when the keyboard is NOT open.
// To keep it simple, we wrap the input in a View that has marginBottom 90, but we remove it when keyboard is active if possible.
// Actually, since React Native Android adjustResize usually pushes the whole screen, an absolute TabBar might get pushed up too!
// Let's just give the inputContainer a paddingBottom of 90. Yes, there might be a gap when keyboard is open on iOS, but it's better than being invisible.
asisContent = asisContent.replace(/paddingBottom: 20,/g, "paddingBottom: 100, // Espacio para que flote sobre el TabBar");

fs.writeFileSync('src/screens/AsistenteScreen.js', asisContent);
console.log("Asistente UI fixed");
