document.addEventListener('DOMContentLoaded', () => {
    cargarSolicitudes();

    const formSolicitud = document.getElementById('form-solicitud');
    formSolicitud.addEventListener('submit', async (e) => {
        e.preventDefault();

        const productor = document.getElementById('productor').value;
        const finca = document.getElementById('finca').value;
        const servicio = document.getElementById('servicio').value;

        try {
            const respuesta = await fetch('http://localhost:3000/api/solicitudes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productor, finca, servicio })
            });

            const resultado = await respuesta.json();

            if (resultado.success) {
                alert('¡Solicitud registrada con éxito!');
                formSolicitud.reset();
                cargarSolicitudes(); // Recargar la tabla automáticamente
            } else {
                alert('Error al registrar: ' + resultado.mensaje);
            }
        } catch (error) {
            console.error('Error de red:', error);
            alert('No se pudo conectar con el servidor.');
        }
    });
});

const cargarSolicitudes = async () => {
    try {
        const respuesta = await fetch('http://localhost:3000/api/solicitudes');
        const resultado = await respuesta.json();

        if (resultado.success) {
            const tbody = document.querySelector('#tabla-solicitudes tbody');
            tbody.innerHTML = ''; 

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