import { useState, useRef, useEffect } from 'react';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [historial, setHistorial] = useState([
        { 
            texto: '¡Hola amigo ganadero! Soy la inteligencia artificial de Sembriogan. ¿En qué le puedo asesorar hoy para mejorar la genética de su hato?', 
            isUser: false 
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const historialRef = useRef(null);

    // Auto-scroll hacia abajo cuando hay mensajes nuevos
    useEffect(() => {
        if (historialRef.current) {
            historialRef.current.scrollTop = historialRef.current.scrollHeight;
        }
    }, [historial, isOpen]);

    const enviarMensaje = async (e) => {
        e.preventDefault();
        if (!mensaje.trim()) return;

        const textoEnviado = mensaje;
        // Agregamos el mensaje del usuario al historial
        setHistorial(prev => [...prev, { texto: textoEnviado, isUser: true }]);
        setMensaje('');
        setIsLoading(true);

        try {
            const res = await fetch('http://localhost:3000/api/ia/consultar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mensaje: textoEnviado, rol: 'ganadero' })
            });

            const data = await res.json();
            
            if (data.success) {
                setHistorial(prev => [...prev, { texto: data.respuesta, isUser: false }]);
            } else {
                throw new Error("Error en la respuesta de IA");
            }
        } catch (error) {
            setHistorial(prev => [...prev, { 
                texto: "Lo siento, tuvimos un problema de conexión. Por favor, escríbanos al WhatsApp.", 
                isUser: false, 
                isError: true 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Formatear saltos de línea y negritas básicas
    const formatearTexto = (texto) => {
        return texto.split('\n').map((linea, i) => (
            <span key={i}>
                {linea}
                <br />
            </span>
        ));
    };

    return (
        <>
            {/* BOTÓN FLOTANTE WHATSAPP */}
            <a 
                href="https://wa.me/573106663472?text=Hola,%20Sembriogan.%20Quiero%20información%20sobre%20sus%20servicios%20ganaderos." 
                target="_blank" 
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 bg-[#25D366] hover:bg-[#1EBE5C] text-white p-4 rounded-full shadow-2xl z-50 flex items-center justify-center transition transform hover:scale-110"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                </svg>
            </a>

            {/* BOTÓN FLOTANTE CHAT IA */}
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="fixed bottom-24 right-6 bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-full shadow-2xl z-50 flex items-center justify-center transition transform hover:scale-110"
            >
                <span className="text-2xl">🤖</span>
            </button>

            {/* VENTANA DEL CHAT IA */}
            {isOpen && (
                <div className="fixed bottom-40 right-6 w-80 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-slate-200">
                    <div className="bg-slate-800 p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🐄</span>
                            <div>
                                <h3 className="text-white font-bold text-sm">Asistente Sembriogan</h3>
                                <p className="text-slate-300 text-[10px]">Atención Ganadera 24/7</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:text-red-400 font-bold text-xl">✕</button>
                    </div>
                    
                    <div ref={historialRef} className="h-72 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3">
                        {historial.map((msg, index) => (
                            <div 
                                key={index} 
                                className={`text-xs p-3 rounded-2xl shadow-sm max-w-[85%] leading-relaxed ${
                                    msg.isUser 
                                        ? 'bg-blue-600 text-white rounded-tr-none self-end' 
                                        : msg.isError 
                                            ? 'bg-red-50 text-red-600 border border-red-200 rounded-tl-none self-start'
                                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none self-start'
                                }`}
                            >
                                {formatearTexto(msg.texto)}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="bg-white border border-slate-200 text-slate-400 italic text-[10px] p-2 rounded-2xl rounded-tl-none shadow-sm self-start">
                                Escribiendo...
                            </div>
                        )}
                    </div>

                    <form onSubmit={enviarMensaje} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                        <input 
                            type="text" 
                            value={mensaje}
                            onChange={(e) => setMensaje(e.target.value)}
                            placeholder="Escriba su duda aquí..." 
                            className="flex-1 bg-slate-100 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-slate-800 border border-transparent transition"
                        />
                        <button type="submit" disabled={isLoading} className="bg-slate-800 text-white p-2 rounded-xl text-xs font-bold hover:bg-slate-700 disabled:opacity-50">➔</button>
                    </form>
                </div>
            )}
        </>
    );
};

export default ChatWidget;