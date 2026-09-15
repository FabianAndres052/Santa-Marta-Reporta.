const API_URL = '/api/reports';

// Función para mostrar notificaciones (Toast)
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#ef4444' : '#10b981';
    toast.className = 'show';
    setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3000);
}

// Función para formatear fechas
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { 
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// Cambiar el estado de un reporte
async function changeStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_URL}/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Estado actualizado correctamente');
            fetchAdminReports(); // Recargar tabla
        } else {
            showToast(data.error || 'Error al actualizar estado', true);
            fetchAdminReports(); // Revertir el select visualmente en caso de error
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', true);
    }
}

// Cargar reportes en la tabla de administración
async function fetchAdminReports() {
    try {
        const response = await fetch(API_URL);
        const reports = await response.json();
        const tbody = document.getElementById('adminReportsTable');
        
        if (reports.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No hay reportes registrados</td></tr>';
            return;
        }

        tbody.innerHTML = reports.map(report => `
            <tr>
                <td>#${report.id}</td>
                <td>${formatDate(report.created_at)}</td>
                <td><strong>${report.category}</strong></td>
                <td>${report.location}</td>
                <td><small>${report.description}</small></td>
                <td>
                    ${report.image_url 
                        ? `<a href="${report.image_url}" target="_blank" style="color:var(--primary-color);">Ver Foto</a>`
                        : `<span style="color:var(--text-muted);">Sin foto</span>`
                    }
                </td>
                <td>
                    <select class="select-status" onchange="changeStatus(${report.id}, this.value)">
                        <option value="Pendiente" ${report.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="En proceso" ${report.status === 'En proceso' ? 'selected' : ''}>En proceso</option>
                        <option value="Resuelto" ${report.status === 'Resuelto' ? 'selected' : ''}>Resuelto</option>
                    </select>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error cargando reportes:', error);
        document.getElementById('adminReportsTable').innerHTML = 
            '<tr><td colspan="7" style="text-align: center; color: red;">Error al cargar los reportes</td></tr>';
    }
}

// Cargar reportes al iniciar
document.addEventListener('DOMContentLoaded', fetchAdminReports);
