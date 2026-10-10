const fs = require('fs');

let catContent = fs.readFileSync('src/screens/CatalogoScreen.js', 'utf8');

const oldButton = `        <TouchableOpacity 
          style={styles.buyButton}
          onPress={() => generarPagoWompi(item)}
        >
          <Text style={styles.buyText}>Generar Pago Wompi</Text>
        </TouchableOpacity>`;

const newButton = `        <TouchableOpacity 
          style={[styles.buyButton, (!item.esServicio && item.stock <= 0) && { backgroundColor: '#cbd5e1' }]}
          onPress={() => generarPagoWompi(item)}
          disabled={!item.esServicio && item.stock <= 0}
        >
          <Text style={styles.buyText}>{(!item.esServicio && item.stock <= 0) ? 'Agotado' : 'Generar Pago Wompi'}</Text>
        </TouchableOpacity>`;

catContent = catContent.replace(oldButton, newButton);
fs.writeFileSync('src/screens/CatalogoScreen.js', catContent);
console.log('CatalogoScreen out of stock validation added!');
