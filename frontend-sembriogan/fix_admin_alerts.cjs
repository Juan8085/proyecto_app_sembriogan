const fs = require('fs');

let c = fs.readFileSync('src/components/AdminTrazabilidad.jsx', 'utf8');

const newAlertaFunction = `  const obtenerAlertaProtocolo = (registro) => {
    if (registro.estadoPrenez === 'Preñada') {
      return { texto: 'Ciclo Cerrado (Preñez Confirmada)', color: 'bg-green-50 text-green-700 border border-green-200' };
    }
    if (registro.estadoPrenez === 'Vacía') {
      return { texto: 'Ciclo Cerrado (Animal Vacío)', color: 'bg-gray-100 text-gray-500 border border-gray-200' };
    }

    const hoy = new Date();
    const fechaBase = registro.fechasProtocolo?.dia0_sincronizacion || registro.fechaProcedimiento;
    
    if (!fechaBase) return { texto: 'Sin fecha de inicio', color: 'bg-gray-100 text-gray-600' };

    const dia0 = new Date(fechaBase);
    const sumarDias = (fecha, dias) => {
      const nueva = new Date(fecha);
      nueva.setDate(nueva.getDate() + dias);
      return nueva;
    };

    const pasos = [];
    const comp = registro.pasosCompletados || {};

    if (!comp.dia8_retiro) {
        pasos.push({ nombre: 'Retiro Dispositivo (Día 8)', fecha: sumarDias(dia0, 8) });
    }

    if (registro.tipoProcedimiento === 'IATF') {
        if (!comp.dia10_inseminacion) pasos.push({ nombre: 'Inseminación (Día 10)', fecha: sumarDias(dia0, 10) });
    } else if (registro.tipoProcedimiento === 'TE') {
        if (!comp.dia17_transferencia) pasos.push({ nombre: 'Transferencia (Día 17)', fecha: sumarDias(dia0, 17) });
    }
    
    pasos.push({ nombre: 'Conf. Preñez (Día 45)', fecha: sumarDias(dia0, 45) });
    
    if (registro.tipoProcedimiento === 'TE') {
        pasos.push({ nombre: 'Entrega (Día 90)', fecha: sumarDias(dia0, 90) });
    }

    // El próximo paso será el primero que no esté completado en la secuencia lógica
    const proximoPaso = pasos[0]; 

    if (!proximoPaso) return { texto: 'Protocolo Finalizado. Pendiente Estado.', color: 'bg-yellow-50 text-yellow-700 border border-yellow-200' };

    const diasFaltantes = Math.ceil((proximoPaso.fecha - new Date()) / (1000 * 60 * 60 * 24));
    
    // Función para formatear fecha a dd/mm/yyyy localmente
    const formatear = (f) => {
        const d = new Date(f);
        return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
    };
    
    const fechaPasoStr = formatear(proximoPaso.fecha);
    
    if (diasFaltantes < 0) return { texto: \`¡RETRASADO! \${proximoPaso.nombre} (\${Math.abs(diasFaltantes)} días)\`, color: 'bg-red-200 text-red-800 font-bold animate-pulse' };
    if (diasFaltantes === 0) return { texto: \`¡HOY! \${proximoPaso.nombre}\`, color: 'bg-red-100 text-red-700 font-bold animate-pulse' };
    if (diasFaltantes <= 3) return { texto: \`En \${diasFaltantes} días: \${proximoPaso.nombre} (\${fechaPasoStr})\`, color: 'bg-amber-100 text-amber-800 font-bold' };
    return { texto: \`Próximo: \${proximoPaso.nombre} (\${fechaPasoStr})\`, color: 'bg-blue-50 text-blue-700' };
  };`;

// Replace from 'const obtenerAlertaProtocolo =' to '  if (loading) return'
const startToken = '  const obtenerAlertaProtocolo = (registro) => {';
const endToken = '  if (loading) return <div className="text-center p-6 text-gray-500">Cargando trazabilidad y protocolos...</div>;';

const startIndex = c.indexOf(startToken);
const endIndex = c.indexOf(endToken);

if (startIndex !== -1 && endIndex !== -1) {
    c = c.substring(0, startIndex) + newAlertaFunction + '\n\n' + c.substring(endIndex);
    fs.writeFileSync('src/components/AdminTrazabilidad.jsx', c);
    console.log("Replaced successfully in AdminTrazabilidad.jsx");
} else {
    console.log("Could not find start or end tokens");
}
