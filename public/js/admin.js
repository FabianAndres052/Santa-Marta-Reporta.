// ==============================================================================
// Lógica Frontend: Panel de Administración - Santa Marta Reporta
// ==============================================================================

const API_REPORTS_URL = '/api/reports';

let allAdminReports = [];
let searchDebounceTimeout = null;

// Notificación Flotante (Toast)
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = isError ? '#dc2626' : '#059669';
    toast.className = 'show';
    setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3200);
}

// Formatear Fecha
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', { 
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// ------------------------------------------------------------------------------
// Cargar Estadísticas en Administración
// ------------------------------------------------------------------------------
async function fetchAdminStats() {
    try {
        const response = await fetch(`${API_REPORTS_URL}/stats`);
        if (!response.ok) return;
        const stats = await response.json();

        document.getElementById('adminStatTotal').textContent = stats.total || 0;
        document.getElementById('adminStatPending').textContent = stats.pending || 0;
        document.getElementById('adminStatInProcess').textContent = stats.inProcess || 0;
        document.getElementById('adminStatResolved').textContent = stats.resolved || 0;
        document.getElementById('adminStatVotes').textContent = stats.totalVotes || 0;
    } catch (error) {
        console.error('Error al cargar estadísticas de admin:', error);
    }
}

// ------------------------------------------------------------------------------
// Cargar Reportes en la Tabla de Gestión
// ------------------------------------------------------------------------------
async function fetchAdminReports() {
    const tbody = document.getElementById('adminReportsTable');
    try {
        const searchVal = document.getElementById('adminSearchInput')?.value || '';
        const categoryVal = document.getElementById('adminCategoryFilter')?.value || 'Todas';
        const statusVal = document.getElementById('adminStatusFilter')?.value || 'Todos';

        const params = new URLSearchParams();
        if (categoryVal !== 'Todas') params.append('category', categoryVal);
        if (statusVal !== 'Todos') params.append('status', statusVal);
        if (searchVal.trim()) params.append('search', searchVal.trim());

        const response = await fetch(`${API_REPORTS_URL}?${params.toString()}`);
        allAdminReports = await response.json();

        if (allAdminReports.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align:center; padding:3rem; color:var(--text-muted);">
                        No se encontraron incidencias que coincidan con los criterios seleccionados.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = allAdminReports.map(report => `
            <tr id="row-${report.id}">
                <td><strong style="color:var(--primary-800); font-weight:700;">#${report.id}</strong></td>
                <td><small style="color:var(--text-muted);">${formatDate(report.created_at)}</small></td>
                <td>
                    <span style="font-weight:600; color:var(--text-heading); font-size:0.86rem;">${report.category}</span>
                </td>
                <td>
                    <div style="font-weight:600; font-size:0.86rem; color:var(--text-heading);">${report.location}</div>
                    <small style="color:var(--text-muted); font-size:0.75rem;">(${report.latitude || '11.240'}, ${report.longitude || '-74.199'})</small>
                </td>
                <td>
                    <div style="max-width:280px; font-size:0.84rem; color:var(--text-body); line-height:1.4;">
                        ${report.description}
                    </div>
                    ${report.admin_notes ? `
                        <div style="margin-top:6px; font-size:0.78rem; background:#ecfdf5; color:#065f46; padding:3px 6px; border-radius:4px; border-left:2px solid #059669;">
                            <strong>Nota Oficial:</strong> ${report.admin_notes}
                        </div>
                    ` : ''}
                </td>
                <td>
                    ${report.image_url 
                        ? `<a href="${report.image_url}" target="_blank" class="btn-table-action" style="color:var(--primary-700);">
                             <svg class="svg-icon" style="width:13px; height:13px;" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                             Ver Foto
                           </a>`
                        : `<span style="color:var(--text-light); font-size:0.8rem;">Sin foto</span>`
                    }
                </td>
                <td>
                    <span style="color:#0f172a; font-weight:700; font-size:0.84rem; display:inline-flex; align-items:center; gap:3px;">
                        <svg class="svg-icon" style="width:12px; height:12px; color:#64748b;" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                        ${report.votes || 0}
                    </span>
                </td>
                <td>
                    <select class="select-field" style="padding:0.35rem 0.6rem; font-size:0.82rem; font-weight:600;" onchange="changeStatus(${report.id}, this.value)">
                        <option value="Pendiente" ${report.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="En proceso" ${report.status === 'En proceso' ? 'selected' : ''}>En proceso</option>
                        <option value="Resuelto" ${report.status === 'Resuelto' ? 'selected' : ''}>Resuelto</option>
                    </select>
                </td>
                <td>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <button type="button" class="btn-table-action" onclick="openNotesModal(${report.id})" title="Registrar respuesta oficial">
                            <svg class="svg-icon" style="width:13px; height:13px;" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            ${report.admin_notes ? 'Editar Nota' : 'Responder'}
                        </button>
                        <button type="button" class="btn-table-action btn-table-danger" onclick="deleteReport(${report.id})" title="Eliminar registro">
                            <svg class="svg-icon" style="width:13px; height:13px;" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        fetchAdminStats();
    } catch (error) {
        console.error('Error cargando reportes en admin:', error);
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:red; padding:2rem;">Error al cargar datos del servidor</td></tr>';
    }
}

// ------------------------------------------------------------------------------
// Cambiar Estado del Reporte
// ------------------------------------------------------------------------------
async function changeStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_REPORTS_URL}/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();

        if (response.ok) {
            showToast(`Estado del reporte #${id} actualizado a "${newStatus}"`);
            fetchAdminStats();
        } else {
            showToast(data.error || 'Error al actualizar estado', true);
            fetchAdminReports();
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de comunicación con el servidor', true);
    }
}

// ------------------------------------------------------------------------------
// Modal de Notas Administrativas
// ------------------------------------------------------------------------------
const notesModal = document.getElementById('notesModal');
const modalReportId = document.getElementById('modalReportId');
const modalNotesText = document.getElementById('modalNotesText');
const btnCancelModal = document.getElementById('btnCancelModal');
const btnSaveModalNotes = document.getElementById('btnSaveModalNotes');

function openNotesModal(id) {
    const report = allAdminReports.find(r => r.id === id);
    if (!report) return;

    modalReportId.value = id;
    modalNotesText.value = report.admin_notes || '';
    notesModal.style.display = 'flex';
}

btnCancelModal?.addEventListener('click', () => {
    notesModal.style.display = 'none';
});

btnSaveModalNotes?.addEventListener('click', async () => {
    const id = modalReportId.value;
    const notes = modalNotesText.value.trim();

    try {
        const response = await fetch(`${API_REPORTS_URL}/${id}/notes`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notes })
        });

        if (response.ok) {
            showToast('Nota oficial de resolución guardada');
            notesModal.style.display = 'none';
            fetchAdminReports();
        } else {
            showToast('Error al guardar la nota', true);
        }
    } catch (error) {
        showToast('Error de comunicación con el servidor', true);
    }
});

// ------------------------------------------------------------------------------
// Eliminar Reporte
// ------------------------------------------------------------------------------
async function deleteReport(id) {
    if (!confirm(`¿Está seguro de eliminar la incidencia #${id}? Esta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_REPORTS_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast(`Incidencia #${id} eliminada del sistema`);
            fetchAdminReports();
        } else {
            showToast('No fue posible eliminar la incidencia', true);
        }
    } catch (error) {
        showToast('Error de conexión', true);
    }
}

// ------------------------------------------------------------------------------
// Exportación de Datos a CSV
// ------------------------------------------------------------------------------
document.getElementById('btnExportCsv')?.addEventListener('click', () => {
    if (!allAdminReports || allAdminReports.length === 0) {
        showToast('No existen registros para exportar', true);
        return;
    }

    const headers = ['ID', 'Fecha_Radicacion', 'Categoria', 'Ubicacion', 'Latitud', 'Longitud', 'Descripcion', 'Estado_Actual', 'Respaldos_Ciudadanos', 'Nota_Oficial'];
    
    const rows = allAdminReports.map(r => [
        r.id,
        `"${r.created_at}"`,
        `"${r.category}"`,
        `"${(r.location || '').replace(/"/g, '""')}"`,
        r.latitude || '',
        r.longitude || '',
        `"${(r.description || '').replace(/"/g, '""')}"`,
        `"${r.status}"`,
        r.votes || 0,
        `"${(r.admin_notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reportes_Santa_Marta_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Base de datos exportada en formato CSV');
});

// ------------------------------------------------------------------------------
// Filtros y Búsqueda
// ------------------------------------------------------------------------------
document.getElementById('adminCategoryFilter')?.addEventListener('change', fetchAdminReports);
document.getElementById('adminStatusFilter')?.addEventListener('change', fetchAdminReports);
document.getElementById('adminSearchInput')?.addEventListener('input', () => {
    clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = setTimeout(fetchAdminReports, 300);
});

// ------------------------------------------------------------------------------
// Inicialización
// ------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    fetchAdminStats();
    fetchAdminReports();
});
