document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    const inputEmail = document.getElementById('email');
    const inputPassword = document.getElementById('password');
    const errorContainer = document.getElementById('error-mensaje');

    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = inputEmail.value.trim();
            const password = inputPassword.value.trim();

            if (!email || !password) {
                mostrarError("Por favor ingresa tu correo y contraseña.");
                return;
            }

            try {
                // Petición al backend MERN
                const response = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.mensaje || 'Credenciales incorrectas');
                }

                // Validar que el usuario sea Veterinario o Administrador
                if (data.usuario.rol !== 'Veterinario' && data.usuario.rol !== 'Admin') {
                    throw new Error('Acceso denegado: Esta aplicación es exclusiva para personal veterinario.');
                }

                // Guardar sesión con las llaves exactas que requiere el dashboard
                localStorage.setItem('tokenVet', data.token);
                localStorage.setItem('usuarioVet', JSON.stringify(data.usuario));

                // Redirigir al panel operativo de campo
                window.location.href = 'dashboard.html';

            } catch (error) {
                mostrarError(error.message);
            }
        });
    }

    function mostrarError(mensaje) {
        if (errorContainer) {
            errorContainer.textContent = mensaje;
            errorContainer.classList.remove('hidden');
        } else {
            alert(mensaje);
        }
    }
});