document.addEventListener("DOMContentLoaded", () => {
    
    /* ====================================================
       1. MARCAR EL MENÚ LATERAL ACTIVO SEGÚN LA PÁGINA
    ==================================================== */
    const path = window.location.pathname;
    const navLinks = {
        "dashboard.html": "nav-dash",
        "gestion_animal.html": "nav-animal",
        "catalogo_genetico.html": "nav-cata",
        "pedidos_web.html": "nav-pedi",
        "usuarios_roles.html": "nav-user",
        "configuracion.html": "nav-conf",
        "Admin.html": "nav-dash"
    };

    const activeId = Object.keys(navLinks).find(key => path.includes(key));
    if (activeId && document.getElementById(navLinks[activeId])) {
        document.querySelectorAll('.sidebar-nav a').forEach(link => link.classList.remove('active'));
        document.getElementById(navLinks[activeId]).classList.add('active');
    }

    /* ====================================================
       2. MENÚ HAMBURGUESA PARA MÓVILES
    ==================================================== */
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenu = document.getElementById('close-menu');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && closeMenu && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('open-mobile');
        });

        closeMenu.addEventListener('click', () => {
            sidebar.classList.remove('open-mobile');
        });

        document.addEventListener('click', (event) => {
            if (!sidebar.contains(event.target) && !menuToggle.contains(event.target) && sidebar.classList.contains('open-mobile')) {
                sidebar.classList.remove('open-mobile');
            }
        });
    }

    /* ====================================================
       3. CAMBIO DE PESTAÑAS (TABS) EN CONFIGURACIÓN
    ==================================================== */
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    if (tabBtns.length > 0 && tabPanels.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');

                // Desactivar todos los botones y paneles
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanels.forEach(p => p.classList.remove('active'));

                // Activar el botón y el panel seleccionado
                btn.classList.add('active');
                const selectedPanel = document.getElementById(targetTab);
                if (selectedPanel) {
                    selectedPanel.classList.add('active');
                }
            });
        });
    }
});
/* ====================================================
       4. FUNCIONALIDAD DE LA BARRA DE BÚSQUEDA EN TIEMPO REAL
    ==================================================== */
    const searchInput = document.querySelector('.search-bar input');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();

            // A. Si estamos en Gestión Animal, Pedidos o Usuarios (Filtrar Tablas)
            const tableRows = document.querySelectorAll('.data-table tbody tr, .animal-table tbody tr');
            if (tableRows.length > 0) {
                tableRows.forEach(row => {
                    // Obtiene todo el texto de la fila para buscar la coincidencia
                    const rowText = row.textContent.toLowerCase();
                    if (rowText.includes(searchTerm)) {
                        row.style.display = ''; // Muestra la fila
                    } else {
                        row.style.display = 'none'; // Oculta la fila
                    }
                });
            }

            // B. Si estamos en el Catálogo Genético (Filtrar Tarjetas de Producto)
            const productCards = document.querySelectorAll('.product-card');
            if (productCards.length > 0) {
                productCards.forEach(card => {
                    // Busca coincidencias en el título del toro o la raza
                    const cardTitle = card.querySelector('h3')?.textContent.toLowerCase() || '';
                    const cardBreed = card.querySelector('.product-breed')?.textContent.toLowerCase() || '';
                    
                    if (cardTitle.includes(searchTerm) || cardBreed.includes(searchTerm)) {
                        card.style.display = ''; // Muestra la tarjeta
                    } else {
                        card.style.display = 'none'; // Oculta la tarjeta
                    }
                });
            }
        });
    }
    /* ====================================================
       5. GESTIÓN DE MODO OSCURO CON LOCALSTORAGE (PERSISTENTE)
    ==================================================== */
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // 1. Comprobar si ya existe una preferencia guardada en LocalStorage
    const currentTheme = localStorage.getItem('theme');
    
    if (currentTheme) {
        // Aplicar el tema guardado al elemento <html> o <body>
        document.documentElement.setAttribute('data-theme', currentTheme);
        
        // Ajustar el icono del botón según el estado guardado
        if (currentTheme === 'dark' && themeToggleBtn) {
            themeToggleBtn.innerHTML = `<i class="fas fa-sun"></i>`;
        }
    }

    // 2. Escuchar el evento de clic en el botón para alternar el tema
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            // Leer el tema actual aplicado
            let theme = document.documentElement.getAttribute('data-theme');
            
            if (theme === 'dark') {
                // Cambiar a Modo Claro
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                themeToggleBtn.innerHTML = `<i class="fas fa-moon"></i>`;
            } else {
                // Cambiar a Modo Oscuro
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                themeToggleBtn.innerHTML = `<i class="fas fa-sun"></i>`;
            }
        });
    }
/* ====================================================
       6. INTERACTIVIDAD DE PANTALLA DE LOGIN / REGISTRO
    ==================================================== */
    const tabLoginBtn = document.getElementById('tab-login-btn');
    const tabRegisterBtn = document.getElementById('tab-register-btn');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');

    if (tabLoginBtn && tabRegisterBtn && formLogin && formRegister) {
        // Alternar a Formulario de Inicio de Sesión
        tabLoginBtn.addEventListener('click', () => {
            tabLoginBtn.classList.add('active');
            tabRegisterBtn.classList.remove('active');
            formLogin.classList.add('active');
            formRegister.classList.remove('active');
        });

        // Alternar a Formulario de Registro
        tabRegisterBtn.addEventListener('click', () => {
            tabRegisterBtn.classList.add('active');
            tabLoginBtn.classList.remove('active');
            formRegister.classList.add('active');
            formLogin.classList.remove('active');
        });

        // Mostrar / Ocultar Contraseña
        const togglePass = document.getElementById('toggle-login-pass');
        const loginPassInput = document.getElementById('login-pass');
        if (togglePass && loginPassInput) {
            togglePass.addEventListener('click', () => {
                const type = loginPassInput.getAttribute('type') === 'password' ? 'text' : 'password';
                loginPassInput.setAttribute('type', type);
                togglePass.classList.toggle('fa-eye-slash');
            });
        }

        // Simulación de Envío de Formulario e Ingreso a Admin.html
        formLogin.addEventListener('submit', () => {
            const userInput = document.getElementById('login-user').value;
            if (userInput.trim() !== '') {
                // Redirecciona a la pantalla principal de administración
                window.location.href = 'Admin.html';
            }
        });

        formRegister.addEventListener('submit', () => {
            alert('Solicitud de registro enviada con éxito. Un administrador debe aprobar su cuenta.');
            tabLoginBtn.click(); // Regresa al login
        });
    }
/* ====================================================
       7. LÓGICA DE CERRAR SESIÓN (LOGOUT)
    ==================================================== */
    const logoutBtn = document.getElementById('logout-btn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Mensaje de confirmación al usuario
            const confirmLogout = confirm('¿Está seguro de que desea cerrar la sesión?');

            if (confirmLogout) {
                // Limpiar variables de sesión temporales (mantiene la preferencia de tema en localStorage)
                sessionStorage.clear();

                // Redireccionar al login
                window.location.href = 'login.html';
            }
        });
    }
/* ====================================================
       8. CIERRE DE SESIÓN AUTOMÁTICO POR INACTIVIDAD
    ==================================================== */
    // No aplica si el usuario está en la pantalla de login
    if (!window.location.pathname.includes('login.html')) {
        
        const TIEMPO_INACTIVIDAD = 5 * 60 * 1000; // 5 Minutos en milisegundos (Ajustable)
        let temporizadorInactividad;

        // Función que ejecuta el cierre de sesión definitivo
        const cerrarSesionPorInactividad = () => {
            alert('Su sesión ha expirado debido a 5 minutos de inactividad por seguridad.');
            sessionStorage.clear();
            window.location.href = 'login.html';
        };

        // Función que reinicia el reloj cada vez que el usuario interactúa
        const reiniciarTemporizador = () => {
            clearTimeout(temporizadorInactividad);
            temporizadorInactividad = setTimeout(cerrarSesionPorInactividad, TIEMPO_INACTIVIDAD);
        };

        // Eventos del sistema que indican que el usuario sigue activo
        const eventosActividad = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        // Escuchar cada evento en el documento global
        eventosActividad.forEach(evento => {
            document.addEventListener(evento, reiniciarTemporizador, true);
        });

        // Iniciar el conteo inmediatamente al cargar la página
        reiniciarTemporizador();
    }
