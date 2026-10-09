const fs = require('fs');
let c = fs.readFileSync('src/pages/PublicHome.jsx', 'utf8');

c = c.replace(
  "publicKey: 'pub_test_b9Wif8x93ek97Eo0wrRazU19DefFIiQX'",
  "publicKey: 'pub_test_Q5yDA9xoKdePzhX8as4jPtXmOvXGGO0f'"
);

fs.writeFileSync('src/pages/PublicHome.jsx', c);
