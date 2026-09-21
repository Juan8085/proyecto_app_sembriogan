document.addEventListener('DOMContentLoaded', () => {
    // Si ya está logueado, pasarlo directo al panel de trabajo
    if (localStorage.getItem('tokenVetSembriogan')) {
        window.location.href = 'dashboard.html';
    }

    const formLogin = document.getElementById('form-login-vet');
    const errorMsg = document.getElementById('error-msg');

    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Botón en estado de carga
            const btn = formLogin.querySelector('.btn');
            const textoOriginal = btn.textContent;
            btn.textContent = 'Verificando...';
            btn.disabled = true;

            try {
                const res = await fetch('http://localhost:3000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await res.json();

                if (data.success) {
                    // Verificamos que sea Veterinario o Admin (por si tú quieres entrar a probar)
                    if (data.usuario.rol === 'Veterinario' || data.usuario.rol === 'Admin') {
                        // Usamos un nombre diferente en localStorage para no cruzar sesiones con el admin si usas la misma PC
                        localStorage.setItem('tokenVetSembriogan', data.token);
                        localStorage.setItem('datosVetSembriogan', JSON.stringify(data.usuario));
                        window.location.href = 'dashboard.html';
                    } else {
                        throw new Error('Acceso denegado. No tienes rol de Veterinario operativo.');
                    }
                } else {
                    throw new Error(data.mensaje);
                }
            } catch (err) {
                errorMsg.textContent = err.message || 'Error de conexión. Revisa tu internet.';
                errorMsg.style.display = 'block';
            } finally {
                btn.textContent = textoOriginal;
                btn.disabled = false;
            }
        });
    }
});