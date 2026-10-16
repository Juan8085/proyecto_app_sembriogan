// Controlador de IA de Doble Perfil (Veterinarios y Ganaderos)
const consultarIA = async (req, res) => {
    try {
        const { mensaje, historial, rol } = req.body; // 'veterinario' o 'ganadero'
        
        // Si no hay mensaje y tampoco hay historial
        if (!mensaje && (!historial || historial.length === 0)) {
            return res.status(400).json({ success: false, mensaje: "Mensaje o historial requerido" });
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
            SIEMPRE que el usuario acepte que lo contactemos por WhatsApp, pida enviar un mensaje o desee agendar una visita, entrégale este enlace en formato Markdown para que nos escriba:
            [Haga clic aquí para escribir a nuestro WhatsApp](https://wa.me/573106663472)
            `;
        }

        // 2. CONEXIÓN CON GEMINI API (Si hay clave configurada)
        if (apiKey) {
            
            // Construir el historial en formato Gemini
            let contents = [];
            if (historial && Array.isArray(historial)) {
                contents = historial.map(msg => ({
                    role: msg.isUser ? "user" : "model",
                    parts: [{ text: msg.texto }]
                }));
            } else {
                contents = [{ role: "user", parts: [{ text: mensaje }] }];
            }

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: promptSistema }] },
                        contents: contents
                    })
                });

                const data = await response.json();
                if (response.ok && data.candidates && data.candidates[0].content.parts[0].text) {
                    return res.status(200).json({ success: true, respuesta: data.candidates[0].content.parts[0].text });
                } else {
                    console.error("Error desde Gemini API:", data);
                }
            } catch (errFetch) {
                console.error("Error en conexión con Gemini API:", errFetch.message);
            }
        }

        // 3. SISTEMA DE RESPALDO VETERINARIO (Por si no hay API Key activa)
        let fallbackMsg = mensaje || (historial && historial.length > 0 ? historial[historial.length-1].texto : "");
        const txt = fallbackMsg.toLowerCase();
        let respuesta = "";

        if (rol === 'veterinario') {
            if (txt.includes("ternero") || txt.includes("parto") || txt.includes("nacido") || txt.includes("recibir") || txt.includes("neonato")) {
                respuesta = "🩺 Protocolo de Atención Inmediata al Ternero Neonato:\n\n1. Despeje de vías aéreas: Limpiar flemas y mucosidad de boca y fosas nasales inmediatamente.\n2. Estimulación cardiorrespiratoria: Fricción vigorosa del dorso y tórax con sacos secos o toallas.\n3. Desinfección del ombligo: Inmersión total del cordón umbilical en tintura de Yodo al 7% - 10% (previene onfaloflebitis).\n4. Calostrado vital: Suministrar calostro de alta calidad dentro de las primeras 2 a 4 horas (mínimo el 10% de su peso vivo, aprox. 3 a 4 litros).\n5. Ambiente y abrigo: Garantizar cama limpia, seca y protegida de corrientes de aire.\n6. Pesaje e identificación: Registro de peso al nacer y colocación de chapeta.";
            } else if (txt.includes("iatf") || txt.includes("sincroniz") || txt.includes("protocolo")) {
                respuesta = "📋 Protocolo IATF Bovino Convencional:\n• Día 0: Dispositivo P4 (0.5g/1.0g) + 2mg Benzoato de Estradiol IM.\n• Día 8: Retiro de dispositivo + 150µg D-Cloprostenol (PGF2α) + 300-400 UI eCG + 1mg Cipionato de Estradiol IM.\n• Día 10 (48-54h post-retiro): Inseminación Artificial a Tiempo Fijo + aplicación opcional de GnRH (10µg Buserelina).";
            } else if (txt.includes("te") || txt.includes("transferencia") || txt.includes("embrion")) {
                respuesta = "🔬 Protocolo de Transferencia de Embriones (TE):\n• Día 0: Sincronización de receptora (P4 + Benzoato de Estradiol).\n• Día 8: Retiro de P4 + PGF2α + Cipionato de Estradiol.\n• Día 10: Celo previsto / referencia día 0 embrionario.\n• Día 17 (7 días post-celo): Evaluación ecográfica de cuerpo lúteo funcional (>18mm) e implantación transcervical en el cuerno ipsilateral al CL.";
            } else if (txt.includes("mastitis") || txt.includes("ubre")) {
                respuesta = "🥛 Manejo Clínico de Mastitis Bovina:\n• Diagnóstico: Test de California (CMT) o conductividad.\n• Grado 1-2 (Subclínica/Clínica leve): Terapia intramamaria con antibiótico de amplio espectro (Cefalosporinas de 1ra/2da gen o Penicilinas asociadas).\n• Grado 3 (Sistémica/Aguda): Terapia parenteral (antibioticoterapia sistémica + AINEs tipo Flunixin Meglumine 2.2 mg/kg) + fluidoterapia si hay shock endotóxico.";
            } else if (txt.includes("placenta") || txt.includes("retencion")) {
                respuesta = "⚠️ Retención de Placenta (>12 horas post-parto):\n• NUNCA traccionar o arrancar manualmente (riesgo de hemorragia e infección severa).\n• Tratamiento médico: Oxitocina temprana (si es <24h) o PGF2α.\n• Si hay metritis/fiebre: Antibiótico sistémico (Ceftiofur 1-2 mg/kg IM por 3-5 días) + AINEs. Evaluar lavados uterinos solo con solución salina tibia sin antisépticos agresivos.";
            } else if (txt.includes("fiebre de leche") || txt.includes("hipocalcemia") || txt.includes("caida")) {
                respuesta = "🐄 Hipocalcemia Puerperal (Fiebre de Leche):\n• Signos: Paresia flácida, decúbito esternal/lateral, extremidades frías, pupila midriática.\n• Tratamiento de urgencia: Gluconato de Calcio al 23% (500 ml IV lento en 15-20 min, auscultando frecuencia cardíaca para evitar paro por fibrilación) + 500 ml vía SC.";
            } else {
                respuesta = "Colega, por favor evalúe el historial clínico y constantes fisiológicas del animal. (Nota: Para realizar consultas abiertas sobre cualquier caso libre con Inteligencia Artificial generativa, se requiere una clave activa de Google AI Studio en el servidor).";
            }
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