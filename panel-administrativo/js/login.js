document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const mensajeError = document.getElementById('mensaje-error');

    try {
        const respuesta = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const resultado = await respuesta.json();

        if (resultado.success) {
            // Guardamos el token y los datos del usuario en el navegador
            localStorage.setItem('tokenSembriogan', resultado.token);
            localStorage.setItem('usuarioSembriogan', JSON.stringify(resultado.usuario));
            
            // Redirigir al panel principal
            window.location.href = 'index.html';
        } else {
            mensajeError.textContent = resultado.mensaje;
            mensajeError.style.display = 'block';
        }
    } catch (error) {
        console.error('Error de red:', error);
        mensajeError.textContent = 'Error al conectar con el servidor.';
        mensajeError.style.display = 'block';
    }
});