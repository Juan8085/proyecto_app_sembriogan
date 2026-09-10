document.addEventListener('DOMContentLoaded', () => {
    cargarCatalogoPublico();
    configurarChatbot();
    cargarCarruselPublico();
    cargarTestimoniosPublicos();
    configurarFormularioTestimonio();
});

// ==========================================
// 1. CARGAR CATÁLOGO DESDE EL BACKEND
// ==========================================
const cargarCatalogoPublico = async () => {
    try {
        const respuesta = await fetch('http://localhost:3000/api/catalogo');
        const resultado = await respuesta.json();

        if (resultado.success) {
            const catalogGrid = document.getElementById('catalog-grid');
            if(!catalogGrid) return;
            catalogGrid.innerHTML = ''; 

            const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

            resultado.data.forEach(item => {
                const urlImagen = item.imagen ? `http://localhost:3000${item.imagen}` : '';
                const imgHtml = urlImagen 
                    ? `<img src="${urlImagen}" alt="${item.tipo}">` 
                    : `<div style="height: 150px; background: #e2e8f0; border-radius: 8px; display:flex; align-items:center; justify-content:center;">Sin imagen</div>`;

                const card = document.createElement('div');
                card.className = 'product-card';
                card.innerHTML = `
                    ${imgHtml}
                    <h3 style="margin: 15px 0 10px; color: var(--primary-color);">${item.tipo}</h3>
                    <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 15px; min-height: 40px;">${item.descripcion}</p>
                    <p style="font-size: 1.3rem; font-weight: bold; color: var(--text-dark); margin-bottom: 15px;">${formatoCOP.format(item.costo)}</p>
                    <button class="btn-primary" style="width: 100%; border: none; cursor: pointer; text-transform: uppercase;" onclick="iniciarCompra('${item.tipo}', ${item.costo})">
                        Comprar / Solicitar
                    </button>
                `;
                catalogGrid.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error al cargar el catálogo:', error);
        const grid = document.getElementById('catalog-grid');
        if(grid) grid.innerHTML = '<p>Error al conectar con el servidor. El veterinario podría estar trabajando offline.</p>';
    }
};

// ==========================================
// 2. SIMULACIÓN DE PASARELA DE PAGOS Y MODO OFFLINE
// ==========================================
window.iniciarCompra = (producto, precio) => {
    const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
    alert(`🛒 Iniciando proceso de compra seguro.\n\nProducto: ${producto}\nTotal a pagar: ${formatoCOP.format(precio)}\n\n(Aquí se desplegará el widget de pago o se guardará la orden offline en la tablet del veterinario).`);
    
    let countElem = document.getElementById('cart-count');
    if(countElem) {
        let count = parseInt(countElem.innerText);
        countElem.innerText = count + 1;
    }
};

// ==========================================
// 3. LÓGICA DEL CHATBOT VETERINARIO IA
// ==========================================
const configurarChatbot = () => {
    const btnToggle = document.getElementById('chatbot-toggle');
    const chatWindow = document.getElementById('chatbot-window');
    const btnClose = document.getElementById('close-chat');
    const btnSend = document.getElementById('send-chat');
    const chatInput = document.getElementById('chat-input');
    const chatBody = document.getElementById('chat-body');

    if (!btnToggle || !chatWindow) return;

    // Mensaje de bienvenida inicial personalizado
    chatBody.innerHTML = `
        <div class="message ai-message">
            ¡Hola! Soy Don Aso, tu asistente virtual. Junto con Majo, estamos aquí para guiarte en biotecnología reproductiva en todo el Huila. ¿En qué podemos ayudarte hoy?
        </div>
    `;

    // Abrir / Cerrar Chat
    btnToggle.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
        if(!chatWindow.classList.contains('hidden')) chatInput.focus();
    });
    
    btnClose.addEventListener('click', () => chatWindow.classList.add('hidden'));

    // Función interna para procesar y enviar el mensaje
    const enviarMensaje = async () => {
        const texto = chatInput.value.trim();
        if (!texto) return;

        // Mostrar mensaje del usuario
        chatBody.innerHTML += `<div class="message" style="background: var(--primary-color); color: white; align-self: flex-end; margin-left: auto; max-width: 80%; padding: 10px; border-radius: 8px; margin-bottom: 10px;">${texto}</div>`;
        chatInput.value = '';
        chatBody.scrollTop = chatBody.scrollHeight;

        // Indicador de escribiendo
        const idTyping = 'typing-' + Date.now();
        chatBody.innerHTML += `<div id="${idTyping}" class="message ai-message" style="opacity: 0.7;"><i>Don Aso está consultando la base de conocimiento veterinario...</i></div>`;
        chatBody.scrollTop = chatBody.scrollHeight;

        try {
            const res = await fetch('http://localhost:3000/api/ia/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensaje: texto })
            });
            const data = await res.json();
            
            const typingElem = document.getElementById(idTyping);
            if (typingElem) typingElem.remove();
            
            const respuestaIA = data.success ? data.respuesta : "Lo siento, en este momento tengo problemas de conexión con el servidor.";
            chatBody.innerHTML += `<div class="message ai-message">${respuestaIA}</div>`;
            chatBody.scrollTop = chatBody.scrollHeight;
        } catch (err) {
            const typingElem = document.getElementById(idTyping);
            if (typingElem) typingElem.remove();
            chatBody.innerHTML += `<div class="message ai-message">Error de red al consultar al asistente veterinario.</div>`;
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    };

    btnSend.addEventListener('click', enviarMensaje);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarMensaje();
    });
};

// ==========================================
// 4. CARRUSEL DINÁMICO DESDE EL BACKEND
// ==========================================
const cargarCarruselPublico = async () => {
    try {
        const respuesta = await fetch('http://localhost:3000/api/carrusel');
        const resultado = await respuesta.json();

        if (resultado.success && resultado.data.length > 0) {
            const hero = document.getElementById('inicio');
            if(!hero) return;
            
            const heroContent = hero.querySelector('.hero-content');
            hero.querySelectorAll('.carousel-slide').forEach(slide => slide.remove());

            resultado.data.forEach((item, index) => {
                const urlImagen = `http://localhost:3000${item.imagen}`;
                const slideDiv = document.createElement('div');
                slideDiv.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
                slideDiv.style.backgroundImage = `linear-gradient(rgba(2, 132, 199, 0.7), rgba(3, 105, 161, 0.7)), url('${urlImagen}')`;
                
                hero.insertBefore(slideDiv, heroContent);
            });

            if (resultado.data.length > 1) {
                iniciarRotacionCarrusel();
            }
        }
    } catch (error) {
        console.error('Error al cargar el carrusel público:', error);
    }
};

const iniciarRotacionCarrusel = () => {
    let slideActual = 0;
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides.length <= 1) return;

    setInterval(() => {
        slides[slideActual].classList.remove('active');
        slideActual = (slideActual + 1) % slides.length;
        slides[slideActual].classList.add('active');
    }, 5000);
};

// ==========================================
// 5. TESTIMONIOS PÚBLICOS Y FORMULARIO
// ==========================================
const cargarTestimoniosPublicos = async () => {
    try {
        const res = await fetch('http://localhost:3000/api/testimonios/public');
        const data = await res.json();
        if (data.success) {
            const grid = document.getElementById('testimonios-grid');
            if(!grid) return;
            grid.innerHTML = '';
            
            if(data.data.length === 0) {
                grid.innerHTML = '<p style="grid-column: 1/-1; color: #64748b;">Aún no hay testimonios publicados. ¡Sé el primero en compartir tu experiencia!</p>';
                return;
            }

            data.data.forEach(t => {
                const card = document.createElement('div');
                card.style.background = 'white';
                card.style.padding = '25px';
                card.style.borderRadius = '10px';
                card.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                card.style.textAlign = 'left';
                card.innerHTML = `
                    <p style="font-style: italic; color: #334155; margin-bottom: 15px;">"${t.comentario}"</p>
                    <h4 style="color: var(--primary-color); font-size: 1.05rem;">${t.productor}</h4>
                    <span style="font-size: 0.85rem; color: #64748b;">📍 ${t.finca}</span>
                `;
                grid.appendChild(card);
            });
        }
    } catch (e) {
        console.error('Error al cargar testimonios:', e);
    }
};

const configurarFormularioTestimonio = () => {
    const form = document.getElementById('form-nuevo-testimonio');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            productor: document.getElementById('nuevo-productor').value,
            finca: document.getElementById('nuevo-finca').value,
            comentario: document.getElementById('nuevo-comentario').value
        };

        try {
            const res = await fetch('http://localhost:3000/api/testimonios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            alert(data.mensaje);
            if (data.success) {
                form.reset();
            }
        } catch (err) {
            console.error('Error al enviar testimonio:', err);
        }
    });
};