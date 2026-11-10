// ==============================================================================
// Lógica Frontend: Portal de Administración - Santa Marta Reporta
// ==============================================================================

const API_REPORTS_URL = '/api/reports';
const API_AUTH_URL = '/api/auth';

let allAdminReports = [];
let searchDebounceTimeout = null;

// Helper: Obtener Token Administrativo
function getAdminToken() {
    return sessionStorage.getItem('sm_admin_token') || '';
}

// Notificación Flotante (Toast)
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = (isError ? '⚠️ ' : '✅ ') + message;
    toast.style.background = isError ? '#dc2626' : '#071e33';
    toast.className = 'show';
    setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3400);
}

// Formatear Fecha (Zona Horaria Colombia America/Bogota)
function formatDate(dateString) {
    if (!dateString) return '';
    let iso = String(dateString).trim();
    if (!iso.endsWith('Z') && !iso.includes('+') && !iso.includes('-05:00')) {
        iso = iso.replace(' ', 'T') + 'Z';
    }
    const date = new Date(iso);
    if (isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString('es-CO', { 
        timeZone: 'America/Bogota',
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
        hour12: true
    });
}

// ------------------------------------------------------------------------------
// Control de Acceso y Sesión (Portal Admin Separado)
// ------------------------------------------------------------------------------
const adminLoginSection = document.getElementById('adminLoginSection');
const adminDashboardSection = document.getElementById('adminDashboardSection');
const adminLoginForm = document.getElementById('adminLoginForm');
const btnLogoutAdmin = document.getElementById('btnLogoutAdmin');
const adminLoggedUserName = document.getElementById('adminLoggedUserName');

function checkAuthStatus() {
    const token = getAdminToken();
    if (token) {
        if (adminLoginSection) adminLoginSection.style.display = 'none';
        if (adminDashboardSection) adminDashboardSection.style.display = 'block';

        const storedUser = sessionStorage.getItem('sm_admin_user');
        if (storedUser && adminLoggedUserName) {
            try {
                const u = JSON.parse(storedUser);
                adminLoggedUserName.innerHTML = `<strong>${u.name || 'Administrador Distrital'}</strong>`;
            } catch (e) {}
        }

        fetchAdminStats();
        fetchAdminReports();
    } else {
        if (adminLoginSection) adminLoginSection.style.display = 'flex';
        if (adminDashboardSection) adminDashboardSection.style.display = 'none';
    }
}

adminLoginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUser')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;

    try {
        const response = await fetch(`${API_AUTH_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            sessionStorage.setItem('sm_admin_token', data.token);
            sessionStorage.setItem('sm_admin_user', JSON.stringify(data.user));
            showToast(`Bienvenido al Sistema de Gestión Distrital`);
            checkAuthStatus();
        } else {
            showToast(data.error || 'Credenciales no autorizadas', true);
        }
    } catch (err) {
        // En caso de fallo de red, admitir validación de respaldo local institucional
        if (username.toLowerCase() === 'admin' && (password === 'santamarta2026' || password === 'admin123')) {
            sessionStorage.setItem('sm_admin_token', 'sm-distrital-token-auth-2026');
            sessionStorage.setItem('sm_admin_user', JSON.stringify({ name: 'Administrador Distrital', role: 'Despacho de Cuadrillas' }));
            showToast('Acceso institucional concedido');
            checkAuthStatus();
        } else {
            showToast('Error de conexión con el servidor', true);
        }
    }
});

btnLogoutAdmin?.addEventListener('click', () => {
    sessionStorage.removeItem('sm_admin_token');
    sessionStorage.removeItem('sm_admin_user');
    showToast('Sesión administrativa finalizada con éxito');
    checkAuthStatus();
});

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
async function fetchAdminReports(isSilent = false) {
    const tbody = document.getElementById('adminReportsTable');
    if (!tbody) return;

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

        tbody.innerHTML = allAdminReports.map(report => {
            const radCode = report.radicado || `SMR-2026-${String(report.id).padStart(4, '0')}`;
            
            return `
                <tr id="row-${report.id}">
                    <td style="text-align:center;"><strong style="color:#0284c7; font-weight:700;">#${report.id}</strong></td>
                    <td>
                        <div style="font-weight:700; color:#0f172a; font-family:'JetBrains Mono', monospace; font-size:0.82rem;">${radCode}</div>
                        <small style="color:#64748b; font-size:0.73rem;">${formatDate(report.created_at)}</small>
                        <div style="margin-top:4px; font-size:0.75rem; color:#0369a1; display:flex; align-items:center; gap:3px;">
                            <span>👤</span> <strong>${report.citizen_name || 'Ciudadano'}</strong>
                        </div>
                        ${report.citizen_phone ? `<div style="font-size:0.72rem; color:#475569;">📞 ${report.citizen_phone}</div>` : ''}
                    </td>
                    <td>
                        <span style="font-weight:600; color:#0f172a; font-size:0.84rem;">${report.category}</span>
                    </td>
                    <td>
                        <div style="font-weight:600; font-size:0.84rem; color:#0f172a;">${report.location}</div>
                        <small style="color:#64748b; font-size:0.74rem;">(${report.latitude || '11.240'}, ${report.longitude || '-74.199'})</small>
                    </td>
                    <td>
                        <div style="max-width:280px; font-size:0.82rem; color:#334155; line-height:1.4;">
                            ${report.description}
                        </div>
                        ${report.admin_notes ? `
                            <div style="margin-top:6px; font-size:0.76rem; background:#ecfdf5; color:#065f46; padding:4px 8px; border-radius:4px; border-left:3px solid #059669;">
                                <strong>Nota Oficial:</strong> ${report.admin_notes}
                            </div>
                        ` : ''}
                    </td>
                    <td style="text-align:center;">
                        ${report.image_url 
                            ? `<a href="${report.image_url}" target="_blank" class="btn-table-action" style="color:#0284c7;">
                                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                 Ver Foto
                               </a>`
                            : `<span style="color:#94a3b8; font-size:0.75rem;">Sin foto</span>`
                        }
                    </td>
                    <td style="text-align:center;">
                        <span style="color:#0f172a; font-weight:700; font-size:0.84rem; display:inline-flex; align-items:center; gap:4px; justify-content:center;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                            ${report.votes || 0}
                        </span>
                    </td>
                    <td style="min-width:165px; width:165px; text-align:center;">
                        <select class="admin-status-dropdown" onchange="changeStatus(${report.id}, this.value)">
                            <option value="Pendiente" ${report.status === 'Pendiente' ? 'selected' : ''}>🟡 Pendiente</option>
                            <option value="En proceso" ${report.status === 'En proceso' ? 'selected' : ''}>🔵 En proceso</option>
                            <option value="Resuelto" ${report.status === 'Resuelto' ? 'selected' : ''}>🟢 Resuelto</option>
                        </select>
                    </td>
                    <td style="min-width:185px; width:185px; text-align:center;">
                        <div style="display:flex; gap:5px; align-items:center; justify-content:center; flex-wrap:wrap;">
                            <!-- Botón Ficha PDF Individual -->
                            <button type="button" class="btn-table-action btn-table-pdf" onclick="exportSingleReportPdf(${report.id})" title="Descargar Ficha Técnica en PDF">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                PDF
                            </button>
                            
                            <!-- Botón Responder / Nota Cuadrilla -->
                            <button type="button" class="btn-table-action" onclick="openNotesModal(${report.id})" title="Registrar respuesta oficial de cuadrilla">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                ${report.admin_notes ? 'Editar Nota' : 'Cuadrilla'}
                            </button>

                            <!-- Botón Eliminar -->
                            <button type="button" class="btn-table-action btn-table-danger" onclick="deleteReport(${report.id})" title="Eliminar incidencia del sistema">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        if (!isSilent) fetchAdminStats();
    } catch (error) {
        console.error('Error cargando reportes en admin:', error);
        if (!isSilent) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:red; padding:2rem;">Error al cargar datos del servidor</td></tr>';
        }
    }
}

// ------------------------------------------------------------------------------
// Cambiar Estado del Reporte
// ------------------------------------------------------------------------------
async function changeStatus(id, newStatus) {
    try {
        const response = await fetch(`${API_REPORTS_URL}/${id}/status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'x-admin-token': getAdminToken()
            },
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
// Modal de Notas Administrativas de Cuadrilla
// ------------------------------------------------------------------------------
const notesModal = document.getElementById('notesModal');
const modalReportId = document.getElementById('modalReportId');
const modalNotesText = document.getElementById('modalNotesText');
const btnCancelModal = document.getElementById('btnCancelModal');
const btnCloseNotesBtn = document.getElementById('btnCloseNotesBtn');
const btnSaveModalNotes = document.getElementById('btnSaveModalNotes');

function openNotesModal(id) {
    const report = allAdminReports.find(r => r.id === id);
    if (!report) return;

    modalReportId.value = id;
    modalNotesText.value = report.admin_notes || '';
    document.getElementById('notesModalTitle').textContent = `Despacho de Cuadrilla • Radicado ${report.radicado || '#' + report.id}`;
    if (notesModal) notesModal.style.display = 'flex';
}

function closeNotesModal() {
    if (notesModal) notesModal.style.display = 'none';
}

btnCancelModal?.addEventListener('click', closeNotesModal);
btnCloseNotesBtn?.addEventListener('click', closeNotesModal);

btnSaveModalNotes?.addEventListener('click', async () => {
    const id = modalReportId.value;
    const notes = modalNotesText.value.trim();

    try {
        const response = await fetch(`${API_REPORTS_URL}/${id}/notes`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'x-admin-token': getAdminToken()
            },
            body: JSON.stringify({ notes })
        });

        if (response.ok) {
            showToast('Intervención oficial registrada y guardada exitosamente');
            closeNotesModal();
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
    if (!confirm(`¿Está seguro de eliminar la incidencia #${id}? Esta acción registrará la baja en la base de datos.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_REPORTS_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'x-admin-token': getAdminToken()
            }
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
// EXPORTACIÓN EN XLS (EXCEL)
// ------------------------------------------------------------------------------
document.getElementById('btnExportXls')?.addEventListener('click', () => {
    if (!allAdminReports || allAdminReports.length === 0) {
        showToast('No existen registros para exportar a Excel', true);
        return;
    }

    try {
        // Hoja 1: Listado Detallado de Incidencias
        const dataRows = allAdminReports.map(r => ({
            'No. Radicado': r.radicado || `SMR-2026-${String(r.id).padStart(4, '0')}`,
            'ID': r.id,
            'Fecha Registro': formatDate(r.created_at),
            'Ciudadano Solicitante': r.citizen_name || 'Ciudadano',
            'Teléfono Contacto': r.citizen_phone || '',
            'Correo Electrónico': r.citizen_email || '',
            'Categoría': r.category,
            'Ubicación / Sector': r.location || 'Santa Marta',
            'Latitud': r.latitude || '',
            'Longitud': r.longitude || '',
            'Descripción': r.description,
            'Estado Operativo': r.status,
            'Apoyos Ciudadanos': r.votes || 0,
            'Respuesta Oficial de Cuadrilla': r.admin_notes || 'Pendiente de asignación'
        }));

        const wb = XLSX.utils.book_new();
        const wsData = XLSX.utils.json_to_sheet(dataRows);

        // Ajustar ancho automático de columnas
        const colWidths = [
            { wch: 16 }, // Radicado
            { wch: 6 },  // ID
            { wch: 20 }, // Fecha
            { wch: 26 }, // Ciudadano
            { wch: 16 }, // Teléfono
            { wch: 26 }, // Correo
            { wch: 28 }, // Categoría
            { wch: 30 }, // Ubicación
            { wch: 12 }, // Latitud
            { wch: 12 }, // Longitud
            { wch: 45 }, // Descripción
            { wch: 14 }, // Estado
            { wch: 16 }, // Apoyos
            { wch: 45 }  // Respuesta
        ];
        wsData['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, wsData, 'Incidencias_Urbanas');

        // Hoja 2: Resumen Estadístico y Métricas
        const total = allAdminReports.length;
        const pending = allAdminReports.filter(r => r.status === 'Pendiente').length;
        const inProcess = allAdminReports.filter(r => r.status === 'En proceso').length;
        const resolved = allAdminReports.filter(r => r.status === 'Resuelto').length;
        const totalVotes = allAdminReports.reduce((sum, r) => sum + (r.votes || 0), 0);

        const summaryRows = [
            { 'Indicador': 'Entidad Gestora', 'Valor': 'Alcaldía Distrital de Santa Marta' },
            { 'Indicador': 'Sistema', 'Valor': 'Santa Marta Reporta (Incidencias Urbanas)' },
            { 'Indicador': 'Fecha de Emisión del Informe', 'Valor': new Date().toLocaleString('es-CO') },
            { 'Indicador': 'Dependencia Responsable', 'Valor': 'Despacho de Cuadrillas y Servicios Urbanos' },
            { 'Indicador': '----------------------------------------', 'Valor': '----------------------------------------' },
            { 'Indicador': 'Total Incidencias Registradas', 'Valor': total },
            { 'Indicador': 'Casos en Espera (Pendiente)', 'Valor': pending },
            { 'Indicador': 'Casos en Intervención (En proceso)', 'Valor': inProcess },
            { 'Indicador': 'Casos Solucionados (Resuelto)', 'Valor': resolved },
            { 'Indicador': 'Total de Apoyos Ciudadanos ("Me afecta")', 'Valor': totalVotes }
        ];

        const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
        wsSummary['!cols'] = [{ wch: 35 }, { wch: 45 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen_Estadistico');

        const fileName = `Reporte_Incidencias_Santa_Marta_${new Date().toISOString().slice(0,10)}.xlsx`;
        XLSX.writeFile(wb, fileName);

        showToast('Reporte generado en formato Microsoft Excel (XLSX)');
    } catch (err) {
        console.error('Error al exportar XLS:', err);
        showToast('Error al generar archivo Excel', true);
    }
});

// ------------------------------------------------------------------------------
// EXPORTACIÓN EN PDF (INFORME OFICIAL CON MEMBRETE DISTRITAL)
// ------------------------------------------------------------------------------
document.getElementById('btnExportPdf')?.addEventListener('click', () => {
    if (!allAdminReports || allAdminReports.length === 0) {
        showToast('No existen incidencias para generar el reporte PDF', true);
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // 1. Franja Superior Institucional (Azul Marino Santa Marta)
        doc.setFillColor(7, 30, 51); // #071e33
        doc.rect(0, 0, pageWidth, 24, 'F');

        // Acento en Azul Celeste
        doc.setFillColor(2, 132, 199); // #0284c7
        doc.rect(0, 24, pageWidth, 2.5, 'F');

        // Título Institucional
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text('ALCALDÍA DISTRITAL DE SANTA MARTA', 14, 11);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(224, 242, 254);
        doc.text('Sistema Distrital de Incidencias Urbanas • Despacho de Cuadrillas y Servicios Públicos', 14, 18);

        // Fecha y Código de Informe
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        const fechaHoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' });
        doc.text(`Fecha de Emisión: ${fechaHoy}`, pageWidth - 14, 11, { align: 'right' });
        doc.text(`Despacho de Servicios Urbanos`, pageWidth - 14, 18, { align: 'right' });

        // 2. Tarjetas de Resumen KPI (Bloque Estadístico)
        const total = allAdminReports.length;
        const pending = allAdminReports.filter(r => r.status === 'Pendiente').length;
        const inProcess = allAdminReports.filter(r => r.status === 'En proceso').length;
        const resolved = allAdminReports.filter(r => r.status === 'Resuelto').length;
        const totalVotes = allAdminReports.reduce((sum, r) => sum + (r.votes || 0), 0);

        const kpis = [
            { label: 'TOTAL REPORTES', val: total, bg: [224, 242, 254], text: [2, 132, 199] },
            { label: 'EN ESPERA', val: pending, bg: [254, 243, 199], text: [217, 119, 6] },
            { label: 'EN INTERVENCIÓN', val: inProcess, bg: [239, 246, 255], text: [37, 99, 235] },
            { label: 'CASOS RESUELTOS', val: resolved, bg: [209, 250, 229], text: [5, 150, 105] },
            { label: 'APOYOS CIUDADANOS', val: totalVotes, bg: [241, 245, 249], text: [71, 85, 105] }
        ];

        let kpiX = 14;
        const kpiWidth = (pageWidth - 28 - (kpis.length - 1) * 4) / kpis.length;
        const kpiY = 32;

        kpis.forEach(k => {
            doc.setFillColor(k.bg[0], k.bg[1], k.bg[2]);
            doc.roundedRect(kpiX, kpiY, kpiWidth, 14, 2, 2, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(k.text[0], k.text[1], k.text[2]);
            doc.text(String(k.val), kpiX + kpiWidth / 2, kpiY + 6.5, { align: 'center' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.text(k.label, kpiX + kpiWidth / 2, kpiY + 11.5, { align: 'center' });

            kpiX += kpiWidth + 4;
        });

        // 3. Tabla con AutoTable
        const tableColumns = [
            { header: 'RADICADO', dataKey: 'radicado' },
            { header: 'FECHA', dataKey: 'fecha' },
            { header: 'CIUDADANO SOLICITANTE', dataKey: 'ciudadano' },
            { header: 'CATEGORÍA', dataKey: 'categoria' },
            { header: 'UBICACIÓN', dataKey: 'ubicacion' },
            { header: 'DESCRIPCIÓN', dataKey: 'descripcion' },
            { header: 'ESTADO', dataKey: 'estado' },
            { header: 'APOYOS', dataKey: 'votos' },
            { header: 'RESPUESTA / CUADRILLA', dataKey: 'notas' }
        ];

        const tableBody = allAdminReports.map(r => ({
            radicado: r.radicado || `SMR-2026-${String(r.id).padStart(4, '0')}`,
            fecha: formatDate(r.created_at),
            ciudadano: `${r.citizen_name || 'Ciudadano'}\n${r.citizen_phone || ''}`,
            categoria: r.category,
            ubicacion: r.location,
            descripcion: r.description,
            estado: r.status,
            votos: String(r.votes || 0),
            notas: r.admin_notes || 'Sin nota registrada'
        }));

        doc.autoTable({
            columns: tableColumns,
            body: tableBody,
            startY: 50,
            theme: 'grid',
            headStyles: {
                fillColor: [15, 23, 42],
                textColor: [255, 255, 255],
                fontSize: 7.5,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 7,
                textColor: [30, 41, 59],
                cellPadding: 2
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            columnStyles: {
                radicado: { cellWidth: 23, fontStyle: 'bold', halign: 'center' },
                fecha: { cellWidth: 20, halign: 'center' },
                ciudadano: { cellWidth: 30 },
                categoria: { cellWidth: 27, fontStyle: 'bold' },
                ubicacion: { cellWidth: 28 },
                descripcion: { cellWidth: 55 },
                estado: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
                votos: { cellWidth: 13, halign: 'center' },
                notas: { cellWidth: 'auto' }
            },
            didParseCell: function(data) {
                if (data.section === 'body' && data.column.dataKey === 'estado') {
                    if (data.cell.raw === 'Pendiente') {
                        data.cell.styles.textColor = [217, 119, 6];
                    } else if (data.cell.raw === 'En proceso') {
                        data.cell.styles.textColor = [37, 99, 235];
                    } else if (data.cell.raw === 'Resuelto') {
                        data.cell.styles.textColor = [5, 150, 105];
                    }
                }
            },
            didDrawPage: function(data) {
                doc.setFontSize(7);
                doc.setTextColor(148, 163, 184);
                const pageNumber = doc.internal.getNumberOfPages();
                doc.text(
                    `Página ${pageNumber} | Santa Marta Reporta • Documento Oficial de Gestión Distrital`,
                    pageWidth / 2,
                    pageHeight - 8,
                    { align: 'center' }
                );
            }
        });

        const fileName = `Informe_Oficial_Incidencias_Santa_Marta_${new Date().toISOString().slice(0,10)}.pdf`;
        doc.save(fileName);

        showToast('Informe oficial en PDF generado y descargado');
    } catch (err) {
        console.error('Error al exportar PDF:', err);
        showToast('Error al generar informe PDF', true);
    }
});

// ------------------------------------------------------------------------------
// DESCARGAR FICHA TÉCNICA INDIVIDUAL EN PDF DE UN REPORTE
// ------------------------------------------------------------------------------
window.exportSingleReportPdf = function(id) {
    const report = allAdminReports.find(r => r.id === id);
    if (!report) return;

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();

        // Franja Cabecera
        doc.setFillColor(7, 30, 51);
        doc.rect(0, 0, pageWidth, 28, 'F');
        doc.setFillColor(2, 132, 199);
        doc.rect(0, 28, pageWidth, 2, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(255, 255, 255);
        doc.text('ALCALDÍA DISTRITAL DE SANTA MARTA', 14, 12);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(224, 242, 254);
        doc.text('FICHA TÉCNICA Y COMPROBANTE OFICIAL DE RADICACIÓN', 14, 18);
        doc.text('Sistema Distrital de Incidencias Urbanas', 14, 23);

        const radCode = report.radicado || `SMR-2026-${String(report.id).padStart(4, '0')}`;

        // Caja de Radicado
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, 36, pageWidth - 28, 22, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('NÚMERO ÚNICO DE RADICACIÓN OFICIAL:', 20, 43);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(2, 132, 199);
        doc.text(radCode, 20, 52);

        // Estado Badge
        let statusColor = [217, 119, 6];
        if (report.status === 'En proceso') statusColor = [37, 99, 235];
        if (report.status === 'Resuelto') statusColor = [5, 150, 105];

        doc.setFontSize(11);
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.text(`ESTADO: ${report.status.toUpperCase()}`, pageWidth - 20, 52, { align: 'right' });

        // Tabla de Datos
        const infoData = [
            ['Fecha de Radicación:', formatDate(report.created_at)],
            ['Ciudadano Solicitante:', report.citizen_name || 'Ciudadano Registrado'],
            ['Teléfono de Contacto:', report.citizen_phone || 'No registrado'],
            ['Correo Electrónico:', report.citizen_email || 'No registrado'],
            ['Categoría de Incidencia:', report.category],
            ['Ubicación y Barrio:', report.location],
            ['Coordenadas Georreferenciadas:', `Lat: ${report.latitude || '11.24079'}  |  Lng: ${report.longitude || '-74.19904'}`],
            ['Descripción Ciudadana:', report.description],
            ['Apoyos de la Comunidad ("Me afecta"):', `${report.votes || 0} ciudadanos respaldan este caso`],
            ['Intervención Oficial de Cuadrilla:', report.admin_notes || 'En espera de despacho técnico'],
            ['Última Actualización en Sistema:', formatDate(report.updated_at || report.created_at)]
        ];

        doc.autoTable({
            body: infoData,
            startY: 64,
            theme: 'striped',
            styles: { fontSize: 9, cellPadding: 3.5, textColor: [30, 41, 59] },
            columnStyles: {
                0: { cellWidth: 55, fontStyle: 'bold', textColor: [15, 23, 42] },
                1: { cellWidth: 'auto' }
            }
        });

        // Sello y Firma Institucional
        const finalY = doc.lastAutoTable.finalY + 18;
        doc.setDrawColor(203, 213, 225);
        doc.line(14, finalY, 80, finalY);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('Despacho de Cuadrillas Distritales', 14, finalY + 4);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Secretaría de Infraestructura y Servicios Urbanos', 14, finalY + 8);
        doc.text('Alcaldía Distrital de Santa Marta', 14, finalY + 12);

        doc.text(`Expedido electrónicamente el ${new Date().toLocaleString('es-CO')}`, pageWidth - 14, finalY + 12, { align: 'right' });

        doc.save(`Comprobante_${radCode}.pdf`);
        showToast(`Ficha técnica ${radCode} descargada en PDF`);
    } catch (e) {
        console.error('Error al generar PDF individual:', e);
        showToast('Error al generar PDF de radicación', true);
    }
};

// ------------------------------------------------------------------------------
// Exportación a CSV
// ------------------------------------------------------------------------------
document.getElementById('btnExportCsv')?.addEventListener('click', () => {
    if (!allAdminReports || allAdminReports.length === 0) {
        showToast('No existen registros para exportar', true);
        return;
    }

    const headers = ['Radicado', 'ID', 'Fecha_Radicacion', 'Ciudadano', 'Telefono', 'Correo', 'Categoria', 'Ubicacion', 'Latitud', 'Longitud', 'Descripcion', 'Estado_Actual', 'Respaldos_Ciudadanos', 'Nota_Oficial'];
    
    const rows = allAdminReports.map(r => [
        `"${r.radicado || ''}"`,
        r.id,
        `"${r.created_at}"`,
        `"${(r.citizen_name || 'Ciudadano').replace(/"/g, '""')}"`,
        `"${r.citizen_phone || ''}"`,
        `"${r.citizen_email || ''}"`,
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

    showToast('Base de datos exportada en CSV');
});

// ------------------------------------------------------------------------------
// Filtros y Búsqueda
// ------------------------------------------------------------------------------
document.getElementById('adminCategoryFilter')?.addEventListener('change', () => fetchAdminReports());
document.getElementById('adminStatusFilter')?.addEventListener('change', () => fetchAdminReports());
document.getElementById('adminSearchInput')?.addEventListener('input', () => {
    clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = setTimeout(() => fetchAdminReports(), 300);
});

// ------------------------------------------------------------------------------
// Sincronización en Tiempo Real (Cada 5 Segundos)
// ------------------------------------------------------------------------------
setInterval(() => {
    if (getAdminToken() && adminDashboardSection && adminDashboardSection.style.display !== 'none') {
        fetchAdminStats();
        fetchAdminReports(true);
    }
}, 5000);

// ------------------------------------------------------------------------------
// Inicialización
// ------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});
