document.addEventListener('DOMContentLoaded', () => {
    cargarSolicitudes();
});

const cargarSolicitudes = async () => {
    try {
        const respuesta = await fetch('http://localhost:3000/api/solicitudes');
        const resultado = await respuesta.json();

        if (resultado.success) {
            const tbody = document.querySelector('#tabla-solicitudes tbody');
            tbody.innerHTML = ''; // Limpiar tabla

            resultado.data.forEach(solicitud => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td>${solicitud.productor}</td>
                    <td>${solicitud.finca}</td>
                    <td>${solicitud.servicio}</td>
                    <td><span class="badge ${solicitud.estado.toLowerCase()}">${solicitud.estado}</span></td>
                    <td>${solicitud.fecha}</td>
                `;
                tbody.appendChild(fila);
            });
        }
    } catch (error) {
        console.error('Error al conectar con la API de Sembriogan:', error);
    }
};