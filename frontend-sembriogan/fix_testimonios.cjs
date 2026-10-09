const fs = require('fs');

let c = fs.readFileSync('src/pages/PublicHome.jsx', 'utf8');

const searchRegex = /  const handleUpdateProfile = \(e\) => \{[\s\S]+?alert\('✅ Datos de perfil y contraseña actualizados correctamente.'\);\s*\};\s*return \(/;

const match = c.match(searchRegex);

if (match) {
  const newText = match[0].replace('return (', `const enviarTestimonio = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/api/testimonios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoTestimonio)
      });
      const data = await res.json();
      if (data.success) {
        setMensajeTestimonioExito(data.mensaje);
        setNuevoTestimonio({ nombre: '', rol: '', mensaje: '' });
        setTimeout(() => {
          setIsTestimonioOpen(false);
          setMensajeTestimonioExito('');
        }, 3000);
      } else {
        alert("Error al enviar testimonio: " + data.mensaje);
      }
    } catch (error) {
      alert("Error de conexión al enviar el testimonio.");
    }
  };

  return (`);
  
  c = c.replace(searchRegex, newText);
  fs.writeFileSync('src/pages/PublicHome.jsx', c);
  console.log("Fixed!");
} else {
  console.log("Not found");
}
