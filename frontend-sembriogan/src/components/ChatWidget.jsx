import { API_BASE_URL, getApiUrl, getMediaUrl } from '../config/api';
import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react'; 

// Ícono de Médico / Enfermero Veterinario Especialista para el Asistente IA
const DoctorNurseIcon = ({ className = "w-6 h-6", size = 26 }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Cabeza / Rostro */}
        <circle cx="16" cy="10.5" r="4.8" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" />
        
        {/* Cofia / Gorro Médico con Cruz de Salud */}
        <path d="M11 9C11 6.2 13 4.5 16 4.5C19 4.5 21 6.2 21 9H11Z" fill="#0284C7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 5.8V7.8M15 6.8H17" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
        
        {/* Bata Médica / Uniforme */}
        <path d="M7.5 27.5C7.5 22.8 11 19 16 19C21 19 24.5 22.8 24.5 27.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        
        {/* Cuello en V de la bata */}
        <path d="M12.5 19L16 23.5L19.5 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Estetoscopio Profesional en el Cuello */}
        <path d="M11 20.5C11 23.8 13 25.5 16 25.5C19 25.5 21 23.8 21 20.5" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 25.5V27.8" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="16" cy="28.5" r="1.5" fill="#38BDF8" stroke="currentColor" strokeWidth="0.8" />
    </svg>
);

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [historial, setHistorial] = useState([
        { 
            texto: '¡Hola amigo ganadero! Soy el Médico Asistente IA de Sembriogan. ¿En qué le puedo orientar hoy sobre salud animal, protocolos de IATF, pajillas o insumos para su hato?', 
            isUser: false 
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const historialRef = useRef(null);

    // Auto-scroll
    useEffect(() => {
        if (historialRef.current) {
            historialRef.current.scrollTop = historialRef.current.scrollHeight;
        }
    }, [historial, isOpen]);

    const enviarMensaje = async (e) => {
        e.preventDefault();
        if (!mensaje.trim()) return;

        const textoEnviado = mensaje;
        const nuevoHistorial = [...historial, { texto: textoEnviado, isUser: true }];
        setHistorial(nuevoHistorial);
        setMensaje('');
        setIsLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/ia/consultar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ historial: nuevoHistorial, rol: 'ganadero' })
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

    const formatearTexto = (texto) => {
        const renderizarLinea = (linea) => {
            const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
            const boldRegex = /\*\*([^*]+)\*\*/g;

            let lineHtml = linea.replace(boldRegex, '<b>$1</b>');
            lineHtml = lineHtml.replace(linkRegex, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800 underline font-bold">$1</a>');

            return <span dangerouslySetInnerHTML={{ __html: lineHtml }} />;
        };

        return texto.split('\n').map((linea, i) => (
            <span key={i}>
                {renderizarLinea(linea)}
                <br />
            </span>
        ));
    };

    return (
        <>
            {/* BOTÓN FLOTANTE WHATSAPP (Usa SVG oficial de WP) */}
            <a 
                href="https://wa.me/573106663472?text=Hola,%20Sembriogan.%20Quiero%20información%20sobre%20sus%20servicios%20ganaderos." 
                target="_blank" 
                rel="noopener noreferrer"
                title="Contactar por WhatsApp"
                className="fixed bottom-6 right-6 bg-[#25D366] hover:bg-[#1EBE5C] text-white p-3.5 sm:p-4 rounded-full shadow-2xl z-[70] flex items-center justify-center transition transform hover:scale-110"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                </svg>
            </a>

            {/* BOTÓN FLOTANTE MÉDICO / ENFERMERO VETERINARIO IA */}
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                title="Consultar Médico Veterinario IA"
                className="fixed bottom-24 right-6 bg-gradient-to-tr from-blue-700 via-indigo-700 to-sky-600 hover:from-blue-600 hover:to-sky-500 text-white p-3.5 sm:p-4 rounded-full shadow-2xl z-[70] flex items-center justify-center transition transform hover:scale-110 group border-2 border-white/40 cursor-pointer"
            >
                <DoctorNurseIcon size={28} className="text-white drop-shadow group-hover:scale-105 transition-transform" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-ping"></span>
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
            </button>

            {/* VENTANA DEL CHAT IA */}
            {isOpen && (
                <div className="fixed bottom-40 right-6 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl z-[80] flex flex-col overflow-hidden border border-slate-200">
                    <div className="bg-gradient-to-r from-blue-800 via-indigo-900 to-slate-900 p-4 flex justify-between items-center text-white border-b border-blue-400/20">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 border border-white/30 p-2 rounded-2xl text-white">
                                <DoctorNurseIcon size={24} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
                                    Médico Asistente IA
                                    <span className="bg-emerald-400/20 text-emerald-300 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase">EPSEA</span>
                                </h3>
                                <p className="text-blue-200 text-[10px]">Orientación Clínica & Reproductiva 24/7</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white transition p-1 rounded-lg hover:bg-white/10 cursor-pointer">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div ref={historialRef} className="h-80 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3">
                        {historial.map((msg, index) => (
                            <div 
                                key={index} 
                                className={`text-xs p-3.5 rounded-2xl shadow-xs max-w-[85%] leading-relaxed ${
                                    msg.isUser 
                                        ? 'bg-blue-600 text-white rounded-tr-none self-end shadow-blue-500/10' 
                                        : msg.isError 
                                            ? 'bg-red-50 text-red-600 border border-red-200 rounded-tl-none self-start'
                                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none self-start'
                                }`}
                            >
                                {formatearTexto(msg.texto)}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="bg-white border border-slate-200 text-slate-500 text-[11px] p-3 rounded-2xl rounded-tl-none shadow-xs self-start flex items-center gap-2">
                                <DoctorNurseIcon size={15} className="animate-pulse text-blue-600" /> 
                                <span className="italic">El médico veterinario está evaluando su consulta...</span>
                            </div>
                        )}
                    </div>

                    <form onSubmit={enviarMensaje} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                        <input 
                            type="text" 
                            value={mensaje}
                            onChange={(e) => setMensaje(e.target.value)}
                            placeholder="Consulte sobre síntomas, IATF, pajillas..." 
                            className="flex-1 bg-slate-50 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-blue-500 focus:bg-white border border-slate-200 transition"
                        />
                        <button type="submit" disabled={isLoading} className="bg-blue-600 text-white p-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center shadow-sm cursor-pointer">
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default ChatWidget;