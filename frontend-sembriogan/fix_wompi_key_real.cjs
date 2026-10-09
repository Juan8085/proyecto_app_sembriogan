const fs = require('fs');
let c = fs.readFileSync('src/pages/PublicHome.jsx', 'utf8');

c = c.replace(
  "publicKey: 'pub_test_Q5yDA9xoKdePzhX8as4jPtXmOvXGGO0f'",
  "publicKey: 'pub_test_1jKw2orNya3GdwqfTCl1wU6V0yS0mnnh'"
);

fs.writeFileSync('src/pages/PublicHome.jsx', c);
