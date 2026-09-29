// Controlador de IA Avanzado para Veterinarios de Sembriogan
// Utiliza Google Gemini API con contexto experto en biotecnología bovina

const consultarIA = async (req, res) => {
    try {
        const { mensaje } = req.body;
        if (!mensaje) {
            return res.status(400).json({ success: false, mensaje: "Mensaje requerido" });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        // Si hay una clave de API configurada, consultamos a Gemini con el perfil experto de Sembriogan
        if (apiKey) {
            const promptSistema = `
            Eres el Dr. Sembriogan, un Asistente Veterinario e Investigador Sénior especializado en Biotecnología Reproductiva Bovina, IATF (Inseminación Artificial a Tiempo Fijo), Transferencia de Embriones (TE), Aspiración Folicular (OPU) y Clínicas de Grandes Animales en el trópico (Colombia).
            
            Tus interlocutores son médicos veterinarios y técnicos de campo que necesitan respuestas precisas, científicas, directas y basadas en protocolos reales:
            - Protocolos IATF estándar: Día 0 (Dispositivo intravaginal P4 + Benzoato de Estradiol), Día 8 (Retiro de dispositivo + PGF2a + eCG/Cipionato), Día 10 (IATF a las 48-52h).
            - Protocolos TE: Sincronización de receptoras, evaluación de Cuerpo Lúteo (CL > 15mm en día 7-8), transferencia y diagnóstico al día 45 y 90.
            - Urgencias clínicas: Metritis, retención placentaria, distocias, anestro nutricional o patológico.
            
            Mantén un tono profesional, técnico, de colega a colega, estructurado con viñetas o negritas cuando sea necesario para lectura rápida en el potrero.
            `;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: promptSistema + "\n\nConsulta del Veterinario en campo: " + mensaje }
                            ]
                        }
                    ]
                })
            });

            const data = await response.json();
            
            if (data.candidates && data.candidates[0].content.parts[0].text) {
                const respuestaIA = data.candidates[0].content.parts[0].text;
                return res.status(200).json({ success: true, respuesta: respuestaIA });
            }
        }

        // --- SISTEMA DE RESPALDO EXPERTO (Si no se ha configurado la API Key todavía) ---
        const txt = mensaje.toLowerCase();
        let respuesta = "Colega, analizando su consulta sobre el manejo del hato: Le sugiero verificar la condición corporal y el historial clínico del animal en la plataforma Sembriogan para un dictamen clínico exacto.";

        if (txt.includes("iatf") || txt.includes("protocolo") || txt.includes("dia 0") || txt.includes("sincronizacion")) {
            respuesta = "🐂 **Protocolo IATF Estándar Sembriogan:**\n- **Día 0:** Colocación de dispositivo intravaginal de Progesterona + Aplicación intramuscular de 2mg de Benzoato de Estradiol.\n- **Día 8:** Retiro de dispositivo + Aplicación de Prostaglandina (PGF2a) + Análogo de GnRH o Ciprosterona + eCG (según condición corporal).\n- **Día 10:** Inseminación Artificial a Tiempo Fijo (IATF) entre 48 y 52 horas posteriores al retiro.\n- **Día 45:** Diagnóstico de preñez por ecografía.";
        } else if (txt.includes("embrion") || txt.includes("te") || txt.includes("receptoras") || txt.includes("cuerpo luteo")) {
            respuesta = "🧬 **Protocolo Transferencia de Embriones (TE):**\n- **Evaluación de Receptoras (Día 7-8 post-estro):** Verificar la presencia de un Cuerpo Lúteo (CL) de excelente calidad (diámetro mayor a 15mm, vascularizado y firme).\n- **Transferencia:** Realizar con técnica de alta asepsia en el cuerno uterino ipsilateral al ovario portador del CL.\n- **Diagnóstico:** Evaluación temprana al día 30-45 y confirmación definitiva al día 90.";
        } else if (txt.includes("metritis") || txt.includes("secrecion") || txt.includes("pus") || txt.includes("infeccion") || txt.includes("sangrado")) {
            respuesta = "🚨 **Manejo Clínico de Metritis / Infecciones Uterinas:**\n- **Diagnóstico:** Presencia de moco floculento con estrías purulentas o mal olor post-parto.\n- **Tratamiento sugerido:** Lavado uterino con solución salina estéril y antibiótico intrauterino de amplio espectro según criterio profesional. Evitar protocolos hormonales de reproducción hasta lograr involución uterina limpia.";
        } else if (txt.includes("distocia") || txt.includes("parto") || txt.includes("calostro")) {
            respuesta = "⚠️ **Manejo de Distocias y Neonatos:**\n- Tras 2 horas de pujas intensas sin avance del ternero, realizar tacto obstétrico con lubricación y estricta higiene.\n- Asegurar la ingesta de al menos 2 a 3 litros de calostro limpio en las primeras 6 horas de vida del ternero para garantizar transferencia pasiva de inmunidad.";
        }

        res.status(200).json({ success: true, respuesta });

    } catch (error) {
        console.error("Error en el controlador de IA:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { consultarIA };