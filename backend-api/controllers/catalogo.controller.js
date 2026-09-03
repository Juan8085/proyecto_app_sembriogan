const obtenerCatalogo = (req, res) => {
    try {
        const catalogo = [
            { id: 1, tipo: "Inseminación Artificial", descripcion: "Servicio de sincronización y FTIA", costo: 150000 },
            { id: 2, tipo: "Aspiración Folicular (OPU)", descripcion: "Recuperación de ovocitos in vitro", costo: 450000 },
            { id: 3, tipo: "Transferencia de Embriones", descripcion: "Implantación en receptoras sincronizadas", costo: 300000 }
        ];
        res.status(200).json({
            success: true,
            mensaje: "Catálogo obtenido exitosamente",
            data: catalogo
        });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: "Error en el servidor", error: error.message });
    }
};

module.exports = {
    obtenerCatalogo
};