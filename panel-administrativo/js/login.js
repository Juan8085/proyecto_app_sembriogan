// Alternar entre vistas de Login y Registro
const btnMostrarRegistro = document.getElementById('btn-mostrar-registro');
const btnMostrarLogin = document.getElementById('btn-mostrar-login');
const contenedorLogin = document.getElementById('contenedor-login');
const contenedorRegistro = document.getElementById('contenedor-registro');

if (btnMostrarRegistro && btnMostrarLogin) {
    btnMostrarRegistro.addEventListener('click', () => {
        contenedorLogin.classList.add('hidden');
        contenedorRegistro.classList.remove('hidden');
    });

    btnMostrarLogin.addEventListener('click', () => {
        contenedorRegistro.classList.add('hidden');
        contenedorLogin.classList.remove('hidden');
    });
}

// Lógica de Inicio de Sesión
const formLogin = document.getElementById('form-login');
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
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
                localStorage.setItem('tokenSembriogan', resultado.token);
                localStorage.setItem('usuarioSembriogan', JSON.stringify(resultado.usuario));
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
}

// Lógica de Registro Inicial
const formRegistro = document.getElementById('form-registro-inicial');
if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('reg-nombre').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const mensajeRegistro = document.getElementById('mensaje-registro');

        try {
            const respuesta = await fetch('http://localhost:3000/api/auth/registro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email, password, rol: 'Admin' })
            });

            const resultado = await respuesta.json();

            if (resultado.success) {
                mensajeRegistro.style.color = 'green';
                mensajeRegistro.textContent = '¡Administrador creado con éxito! Ya puedes iniciar sesión.';
                mensajeRegistro.style.display = 'block';
                formRegistro.reset();
                setTimeout(() => {
                    contenedorRegistro.classList.add('hidden');
                    contenedorLogin.classList.remove('hidden');
                }, 2000);
            } else {
                mensajeRegistro.style.color = 'red';
                mensajeRegistro.textContent = resultado.mensaje;
                mensajeRegistro.style.display = 'block';
            }
        } catch (error) {
            console.error('Error:', error);
            mensajeRegistro.style.color = 'red';
            mensajeRegistro.textContent = 'Error al conectar con el servidor.';
            mensajeRegistro.style.display = 'block';
        }
    });
}