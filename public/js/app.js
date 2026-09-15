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

// Función para renderizar el estado
function renderStatusBadge(status) {
    let className = 'status-pendiente';
    if (status === 'En proceso') className = 'status-proceso';
    if (status === 'Resuelto') className = 'status-resuelto';
    return `<span class="status-badge ${className}">${status}</span>`;
}

// Cargar y mostrar los reportes
async function fetchReports() {
    try {
        const response = await fetch(API_URL);
        const reports = await response.json();
        const grid = document.getElementById('reportsGrid');
        
        if (reports.length === 0) {
            grid.innerHTML = '<p>No hay reportes registrados aún.</p>';
            return;
        }

        grid.innerHTML = reports.map(report => `
            <article class="report-card">
                ${report.image_url 
                    ? `<img src="${report.image_url}" alt="Evidencia" class="report-image" onerror="this.src=''; this.alt='Imagen no disponible';">`
                    : `<div class="report-image">Sin imagen de evidencia</div>`
                }
                <div class="report-content">
                    <div class="report-header">
                        <span class="category-badge">${report.category}</span>
                        ${renderStatusBadge(report.status)}
                    </div>
                    <p class="report-desc">${report.description}</p>
                    <div class="report-meta">
                        <span>📍 ${report.location}</span>
                        <span>🕒 ${formatDate(report.created_at)}</span>
                    </div>
                </div>
            </article>
        `).join('');

    } catch (error) {
        console.error('Error cargando reportes:', error);
        document.getElementById('reportsGrid').innerHTML = '<p>Error al cargar los reportes.</p>';
    }
}

// Manejar el envío del formulario
document.getElementById('reportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    try {
        const formData = new FormData(e.target);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData // Fetch establece el Content-Type a multipart/form-data automáticamente
        });

        const data = await response.json();

        if (response.ok) {
            showToast('¡Reporte enviado con éxito!');
            e.target.reset();
            fetchReports(); // Recargar la lista
        } else {
            showToast(data.error || 'Error al enviar el reporte', true);
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión con el servidor', true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Reporte';
    }
});

// Cargar reportes al iniciar
document.addEventListener('DOMContentLoaded', fetchReports);
