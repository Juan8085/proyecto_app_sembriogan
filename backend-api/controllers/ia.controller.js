// Controlador de IA de Doble Perfil (Veterinarios y Ganaderos)
const consultarIA = async (req, res) => {
    try {
        const { mensaje, rol } = req.body; // 'veterinario' o 'ganadero'
        if (!mensaje) {
            return res.status(400).json({ success: false, mensaje: "Mensaje requerido" });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        // 1. DEFINIMOS LA PERSONALIDAD SEGÚN EL ROL
        let promptSistema = "";
        
        if (rol === 'veterinario') {
            promptSistema = `
            Eres el Dr. Sembriogan, un Asistente Veterinario Sénior especializado en Biotecnología Reproductiva Bovina.
            Respondes a médicos veterinarios en campo con protocolos técnicos exactos (IATF, OPU, TE, dosis hormonales, ecografía).
            Usa jerga médica, sé directo y científico.
            `;
        } else {
            promptSistema = `
            Eres el Asistente Virtual Comercial de Sembriogan, experto en ganadería.
            Tu objetivo es ayudar a ganaderos y dueños de fincas respondiendo dudas sobre mejoramiento genético, IATF y problemas reproductivos comunes (vacas vacías, partos).
            REGLA VITAL: NUNCA recetes medicamentos ni des dosis exactas. Tu objetivo final es persuadir al ganadero de contactar a nuestros veterinarios para agendar una visita o comprar en nuestro catálogo. Usa un tono muy amable, comercial y fácil de entender.
            `;
        }

        // 2. CONEXIÓN CON GEMINI API (Si hay clave configurada)
        if (apiKey) {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptSistema + "\n\nConsulta: " + mensaje }] }]
                })
            });

            const data = await response.json();
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                return res.status(200).json({ success: true, respuesta: data.candidates[0].content.parts[0].text });
            }
        }

        // 3. SISTEMA DE RESPALDO (Por si no hay API Key)
        const txt = mensaje.toLowerCase();
        let respuesta = "";

        if (rol === 'veterinario') {
            respuesta = "Colega, por favor evalúe el historial clínico. (El sistema de IA técnica requiere conexión a la API Key).";
            if (txt.includes("iatf")) respuesta = "Protocolo IATF Estándar: Día 0 (P4 + Benzoato 2mg), Día 8 (Retiro + PGF2a + eCG), Día 10 (Inseminación 48h).";
        } else {
            // Respuestas para Ganaderos
            respuesta = "¡Hola! Entiendo su situación en la finca. La mejor forma de darle un diagnóstico exacto es que nuestro equipo de Sembriogan lo visite. Puede escribirnos al WhatsApp que está en la pantalla.";
            
            if (txt.includes("preñan") || txt.includes("vacia") || txt.includes("celo")) {
                respuesta = "¡Las vacas vacías representan pérdida de dinero! 🐄 Si sus vacas no entran en celo, puede deberse a falta de minerales o problemas de útero. En Sembriogan somos expertos en IATF (Inseminación a Tiempo Fijo) para preñarlas a todas el mismo día. ¿Le gustaría agendar una visita?";
            } else if (txt.includes("embrion") || txt.includes("genetica")) {
                respuesta = "🧬 Trabajamos con la mejor genética del país. Mediante la Transferencia de Embriones podemos hacer que sus vacas comerciales paran terneros de altísimo valor genético. Escríbanos a WhatsApp para enviarle el catálogo.";
            }
        }

        res.status(200).json({ success: true, respuesta });

    } catch (error) {
        console.error("Error en IA:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { consultarIA };