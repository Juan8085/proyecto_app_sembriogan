const fs = require('fs');

let c = fs.readFileSync('dashboard.html', 'utf8');

c = c.replace(/<button onclick="dispararPrueba\(\)"[^>]*>[\s\S]*?<\/button>/, '');
c = c.replace(/async function dispararPrueba\(\) {[\s\S]*?}/, '');

fs.writeFileSync('dashboard.html', c);
console.log("Removed Test Push");
