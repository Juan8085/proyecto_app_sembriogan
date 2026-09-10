const consultarIA = async (req, res) => {
    try {
        const { mensaje } = req.body;
        if (!mensaje) {
            return res.status(400).json({ success: false, mensaje: "Mensaje requerido" });
        }

        const txt = mensaje.toLowerCase();
        let respuesta = "Comprendo tu consulta sobre el manejo del hato en nuestra región. Como asistente técnico de Sembriogan, te sugiero programar una evaluación directa con nuestro equipo médico veterinario para darte un diagnóstico preciso en finca.";

        // PRIORIDAD 1: Patologías, infecciones, sangrados y emergencias clínicas (¡NUNCA COMERCIAL!)
        if (txt.includes("sangrado") || txt.includes("sangre") || txt.includes("descarga") || txt.includes("pus") || txt.includes("infeccion") || txt.includes("secrecion") || txt.includes("metritis")) {
            respuesta = "🚨 **Alerta Clínica (Sangrado o Flujo Anormal):** Un sangrado vaginal fuera de lo normal o presencia de descargas purulentas meses después del parto indica un problema patológico grave (como metritis crónica, piometra, quistes ováricos foliculares o lesiones en el tracto reproductivo). **No se debe aplicar ningún protocolo hormonal ni inseminar** en estas condiciones. Es una urgencia clínica que requiere revisión ginecológica con ecógrafo por parte de un médico veterinario. ¿Deseas que agendemos una visita prioritaria a tu finca?";
        } 
        // PRIORIDAD 2: Anestro prolongado (> 3-4 meses postparto) e inapetencia
        else if (txt.includes("meses") || txt.includes("pario") || txt.includes("comiendo") || txt.includes("apetito") || txt.includes("anestro") || txt.includes("flaca")) {
            respuesta = "🐄 **Evaluación de Anestro Prolongado (Post-parto prolongado):** Si una vaca supera los 90 a 120 días post-parto sin mostrar celo, estamos ante un *anestro prolongado*. Esto puede deberse a desbalance nutricional, baja condición corporal, subinvolución uterina o cuerpos lúteos persistentes. Se requiere un diagnóstico palpatorio o ecográfico para determinar el tratamiento adecuado. ¿Te gustaría que nuestro equipo técnico visite el hato?";
        } 
        // PRIORIDAD 3: Biotecnología de embriones
        else if (txt.includes("embrion") || txt.includes("aspiracion") || txt.includes("opu") || txt.includes("donadora")) {
            respuesta = "🧬 **Biotecnología de Embriones y OPU:** La Aspiración Folicular (OPU) y Producción In Vitro (IVP) nos permite multiplicar la descendencia de vacas élite sin interrumpir su ciclo productivo. Obtenemos embriones de alta genética adaptados al trópico. ¿Deseas evaluar a tus mejores vacas como donadoras?";
        } 
        // PRIORIDAD 4: Manejo de partos y obstetricia
        else if (txt.includes("parto") || txt.includes("distocia") || txt.includes("obstetricia") || txt.includes("calostro")) {
            respuesta = "⚠️ **Manejo Obstétrico y Asistencia al Parto:** Ante una distocia (dificultad en el parto), es vital actuar con higiene estricta y evaluar la posición del ternero tras 2 horas de pujas sin progreso. **Recomendación clave:** Suministra calostro de calidad en las primeras 6 horas de vida. Si hay riesgo de retención placentaria o inversión uterina, contacta de inmediato a nuestro servicio clínico de emergencia.";
        } 
        // PRIORIDAD 5: Preguntas puramente informativas sobre IATF (Solo si pregunta por el servicio en general)
        else if (txt.includes("que es iatf") || txt.includes("servicio de iatf") || txt.includes("cotizar iatf")) {
            respuesta = "🐂 **Sobre IATF (Inseminación Artificial a Tiempo Fijo):** Es nuestra especialidad en Sembriogan. Permite concentrar las labores reproductivas sin depender de la detección visual de celo mediante protocolos hormonales con dispositivos intravaginales. *Nota:* Para aplicar IATF con éxito, la vaca debe estar completamente sana y con su útero involucionado.";
        } 
        // PRIORIDAD 6: Contacto general
        else if (txt.includes("contacto") || txt.includes("visita") || txt.includes("agendar") || txt.includes("telefono")) {
            respuesta = "📞 ¡Claro que sí! Puedes registrar una solicitud de servicio directamente en nuestro catálogo web o contactarnos vía WhatsApp. Nuestro equipo técnico en Garzón, Huila, coordinará la visita a tu finca.";
        }

        res.status(200).json({ success: true, respuesta });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { consultarIA };