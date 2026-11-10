// ==============================================================================
// Lógica Frontend: Santa Marta Reporta (Portal Ciudadano)
// ==============================================================================

const API_REPORTS_URL = '/api/reports';

let santaMartaMap = null;
let markersLayerGroup = null;
let currentReports = [];
let activeCategory = 'Todas';
let activeStatus = 'Todos';
let searchDebounceTimeout = null;
let geocodeDebounceTimeout = null;
let currentModalReport = null;

// Coordenadas centrales de la Bahía y Centro de Santa Marta
const SANTA_MARTA_CENTER = [11.238, -74.205];

// Notificación Flotante (Toast)
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = (isError ? '⚠️ ' : '✅ ') + message;
    toast.style.background = isError ? '#dc2626' : '#0a2942';
    toast.className = 'show';
    setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3400);
}

// Formatear Fecha idéntica a la maqueta con soporte estricto de Zona Horaria de Colombia (America/Bogota, UTC-5)
function formatDateCustom(dateString) {
    if (!dateString) return '';
    let iso = String(dateString).trim();
    // Normalizar timestamp de SQLite a ISO UTC si no incluye zona horaria
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

// Crear Pin Personalizado de Leaflet
function createCustomPin(status) {
    let bg = '#f59e0b'; // Amber (Pendiente)
    let innerHtml = '<span style="font-weight:900; font-size:13px; color:white; font-family:sans-serif;">!</span>';

    if (status === 'En proceso') {
        bg = '#2563eb'; // Blue (En proceso / Intervención)
        innerHtml = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
    } else if (status === 'Resuelto') {
        bg = '#059669'; // Green (Resuelto)
        innerHtml = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
    }

    return L.divIcon({
        className: 'leaflet-pin-wrapper',
        html: `
            <div style="
                width: 30px;
                height: 30px;
                background: ${bg};
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                border: 2px solid #ffffff;
            ">
                <div style="transform: rotate(45deg); display:flex; align-items:center; justify-content:center;">
                    ${innerHtml}
                </div>
            </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });
}

// ------------------------------------------------------------------------------
// Geocodificación Inversa
// ------------------------------------------------------------------------------
async function reverseGeocode(lat, lng) {
    const locInput = document.getElementById('location');
    if (!locInput) return;

    clearTimeout(geocodeDebounceTimeout);
    geocodeDebounceTimeout = setTimeout(async () => {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
            const response = await fetch(url, { headers: { 'Accept-Language': 'es' } });
            if (response.ok) {
                const data = await response.json();
                if (data && data.address) {
                    const addr = data.address;
                    const parts = [];
                    if (addr.road) parts.push(addr.road);
                    const neigh = addr.neighbourhood || addr.suburb || addr.city_district;
                    if (neigh) parts.push(neigh);
                    const finalAddr = parts.join(' - ') || data.display_name.split(',')[0] || 'Santa Marta';
                    locInput.value = finalAddr;
                    showToast(`📍 Ubicación seleccionada: ${finalAddr}`);
                    return;
                }
            }
        } catch (e) {
            console.warn(e);
        }
        locInput.value = `Sector Santa Marta (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }, 250);
}

// ------------------------------------------------------------------------------
// Inicializar Mapa Principal Leaflet
// ------------------------------------------------------------------------------
function initMap() {
    if (santaMartaMap) return;

    santaMartaMap = L.map('santaMartaMainMap', {
        zoomControl: false
    }).setView(SANTA_MARTA_CENTER, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(santaMartaMap);

    markersLayerGroup = L.layerGroup().addTo(santaMartaMap);

    // Clic en el mapa para radicar incidencia en ese punto
    santaMartaMap.on('click', (e) => {
        const latInput = document.getElementById('latitude');
        const lngInput = document.getElementById('longitude');
        if (latInput) latInput.value = e.latlng.lat.toFixed(6);
        if (lngInput) lngInput.value = e.latlng.lng.toFixed(6);
        reverseGeocode(e.latlng.lat, e.latlng.lng);

        // Marcador temporal de selección
        L.popup()
            .setLatLng(e.latlng)
            .setContent('<strong style="font-size:12px; color:#0c385b;">📍 Punto fijado para reporte</strong>')
            .openOn(santaMartaMap);
    });

    // Conectar botones personalizados de zoom y GPS
    document.getElementById('btnZoomIn')?.addEventListener('click', () => santaMartaMap.zoomIn());
    document.getElementById('btnZoomOut')?.addEventListener('click', () => santaMartaMap.zoomOut());
    document.getElementById('btnGpsLocate')?.addEventListener('click', () => {
        if (!navigator.geolocation) {
            showToast('Tu navegador no soporta geolocalización', true);
            return;
        }
        showToast('Obteniendo tu ubicación GPS...');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                document.getElementById('latitude').value = lat.toFixed(6);
                document.getElementById('longitude').value = lng.toFixed(6);
                santaMartaMap.setView([lat, lng], 16);
                reverseGeocode(lat, lng);
                L.popup()
                    .setLatLng([lat, lng])
                    .setContent('<strong style="font-size:12px; color:#059669;">🎯 Tu ubicación actual</strong>')
                    .openOn(santaMartaMap);
            },
            () => showToast('No se pudo acceder a tu ubicación GPS', true),
            { timeout: 7000 }
        );
    });

    // Pestañas Cuadrícula / Mapa
    const btnTabGrid = document.getElementById('btnTabGrid');
    const btnTabMap = document.getElementById('btnTabMap');
    btnTabGrid?.addEventListener('click', () => {
        btnTabGrid.classList.add('active');
        btnTabMap?.classList.remove('active');
        document.getElementById('recentReportsSection')?.scrollIntoView({ behavior: 'smooth' });
    });
    btnTabMap?.addEventListener('click', () => {
        btnTabMap.classList.add('active');
        btnTabGrid?.classList.remove('active');
        document.getElementById('mapCanvasSection')?.scrollIntoView({ behavior: 'smooth' });
    });
}

// ------------------------------------------------------------------------------
// Actualizar Marcadores en el Mapa
// ------------------------------------------------------------------------------
function updateMapMarkers(reports) {
    if (!santaMartaMap || !markersLayerGroup) return;
    markersLayerGroup.clearLayers();

    reports.forEach(report => {
        const lat = parseFloat(report.latitude) || 11.24079;
        const lng = parseFloat(report.longitude) || -74.19904;

        const pinIcon = createCustomPin(report.status);
        const marker = L.marker([lat, lng], { icon: pinIcon });

        const radCode = report.radicado || `SMR-2026-${String(report.id).padStart(4, '0')}`;
        const popupHtml = `
            <div style="font-family:'Plus Jakarta Sans', sans-serif; font-size:12px; min-width:180px;">
                <div style="font-weight:700; color:#071e33; font-size:13px; margin-bottom:2px;">${report.category}</div>
                <div style="color:#0284c7; font-size:11px; font-weight:600; margin-bottom:4px;">${report.location}</div>
                <p style="color:#475569; font-size:11px; margin-bottom:6px; line-height:1.3;">${report.description}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:4px;">
                    <span style="font-size:10px; font-weight:700; color:#64748b;">${radCode}</span>
                    <button type="button" onclick="openReportModal(${report.id})" style="background:#0284c7; color:white; border:none; border-radius:4px; font-size:10px; font-weight:700; padding:3px 8px; cursor:pointer;">Ver Detalle</button>
                </div>
            </div>
        `;

        marker.bindPopup(popupHtml);
        markersLayerGroup.addLayer(marker);
    });
}

// ------------------------------------------------------------------------------
// Cargar Estadísticas (KPIs)
// ------------------------------------------------------------------------------
async function fetchStats() {
    try {
        const response = await fetch(`${API_REPORTS_URL}/stats`);
        if (!response.ok) return;
        const stats = await response.json();

        document.getElementById('kpiTotal').textContent = stats.total || 0;
        document.getElementById('kpiPending').textContent = stats.pending || 0;
        document.getElementById('kpiInProcess').textContent = stats.inProcess || 0;
        document.getElementById('kpiResolved').textContent = stats.resolved || 0;
    } catch (e) {
        console.error('Error stats:', e);
    }
}

// ------------------------------------------------------------------------------
// Cargar Reportes (Con sincronización en tiempo real)
// ------------------------------------------------------------------------------
async function fetchReports(isSilent = false) {
    try {
        const searchVal = document.getElementById('searchInput')?.value || '';
        const params = new URLSearchParams();
        if (activeCategory !== 'Todas') params.append('category', activeCategory);
        if (activeStatus !== 'Todos') params.append('status', activeStatus);
        if (searchVal.trim()) params.append('search', searchVal.trim());

        const response = await fetch(`${API_REPORTS_URL}?${params.toString()}`);
        currentReports = await response.json();

        renderRecentReports(currentReports);
        updateMapMarkers(currentReports);
        fetchStats();

        // Si el modal está abierto, sincronizar su información en vivo
        if (currentModalReport && trackingModal.style.display === 'flex') {
            const updated = currentReports.find(x => x.id === currentModalReport.id);
            if (updated) {
                currentModalReport = updated;
                updateVisualStepper(updated.status);
                const votesEl = document.getElementById('modalVotesCount');
                if (votesEl) votesEl.textContent = updated.votes || 0;
                const noteBox = document.getElementById('modalAdminNoteContainer');
                if (updated.admin_notes && noteBox) {
                    noteBox.style.display = 'block';
                    document.getElementById('modalAdminNote').textContent = updated.admin_notes;
                }
            }
        }
    } catch (e) {
        console.error('Error fetch reports:', e);
    }
}

// Renderizar la Columna Derecha: "Últimos Reportes"
function renderRecentReports(reports) {
    const container = document.getElementById('recentReportsList');
    if (!reports || reports.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:2rem 0;">No hay incidencias registradas con estos filtros.</p>';
        return;
    }

    container.innerHTML = reports.map(r => {
        const isProcess = r.status === 'En proceso';
        const isResolved = r.status === 'Resuelto';
        
        let iconBg = '#fef3c7';
        let iconColor = '#d97706';
        let badgeClass = 'badge-pill-amber';
        let iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="4"/></svg>';

        if (isProcess) {
            iconBg = '#e0f2fe';
            iconColor = '#2563eb';
            badgeClass = 'badge-pill-blue';
            iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>';
        } else if (isResolved) {
            iconBg = '#d1fae5';
            iconColor = '#059669';
            badgeClass = 'badge-pill-green';
            iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
        }

        let displayTitle = r.category;
        if (r.category.includes('Malla Vial')) displayTitle = 'Hueco en la vía';
        else if (r.category.includes('Alumbrado')) displayTitle = 'Falla en alumbrado público';
        else if (r.category.includes('Residuos') || r.category.includes('Aseo')) displayTitle = 'Acumulación de basuras';
        else if (r.category.includes('Acueducto')) displayTitle = 'Fuga en red de acueducto';

        return `
            <div class="report-compact-item" onclick="openReportModal(${r.id})">
                <div class="report-item-left">
                    <div class="report-square-icon" style="background:${iconBg}; color:${iconColor};">
                        ${iconSvg}
                    </div>
                    <div class="report-details">
                        <h4>${displayTitle}</h4>
                        <div class="rep-location">${r.location}</div>
                        <div class="rep-date">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            ${formatDateCustom(r.created_at)}
                        </div>
                        <div style="display:flex; align-items:center; gap:8px; margin-top:2px;">
                            <span class="badge-pill-status ${badgeClass}">
                                <span style="font-size:8px;">●</span> ${r.status}
                            </span>
                            <span style="font-size:0.72rem; color:var(--text-muted); font-weight:600; display:inline-flex; align-items:center; gap:2px;">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                                ${r.votes || 0}
                            </span>
                        </div>
                    </div>
                </div>
                <div style="color:var(--text-light); font-size:1.1rem; font-weight:700;">&rsaquo;</div>
            </div>
        `;
    }).join('');
}

// ------------------------------------------------------------------------------
// Modal de Detalle y Trazabilidad Visual (Línea de Vida)
// ------------------------------------------------------------------------------
const trackingModal = document.getElementById('trackingModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnDownloadCitizenPdf = document.getElementById('btnDownloadCitizenPdf');
const btnVoteModal = document.getElementById('btnVoteModal');

function updateVisualStepper(status) {
    const lineFill = document.getElementById('modalStepperLine');
    const step2 = document.getElementById('stepNode2');
    const step3 = document.getElementById('stepNode3');
    const circle2 = document.getElementById('stepCircle2');
    const circle3 = document.getElementById('stepCircle3');

    if (!lineFill || !step2 || !step3) return;

    step2.className = 'stepper-step';
    step3.className = 'stepper-step';
    circle2.textContent = '2';
    circle3.textContent = '3';

    if (status === 'Pendiente') {
        lineFill.style.width = '15%';
    } else if (status === 'En proceso') {
        lineFill.style.width = '55%';
        step2.className = 'stepper-step active';
        circle2.textContent = '⚡';
    } else if (status === 'Resuelto') {
        lineFill.style.width = '100%';
        step2.className = 'stepper-step completed';
        circle2.textContent = '✓';
        step3.className = 'stepper-step completed';
        circle3.textContent = '✓';
    }
}

function openReportModal(id) {
    const r = currentReports.find(item => item.id === id);
    if (!r) return;
    currentModalReport = r;

    const radCode = r.radicado || `SMR-2026-${String(r.id).padStart(4, '0')}`;
    document.getElementById('modalRadicado').textContent = radCode;
    document.getElementById('modalCategory').textContent = r.category;
    document.getElementById('modalLocation').textContent = `📍 ${r.location}`;
    document.getElementById('modalDescription').textContent = r.description;

    let badgeBg = '#fef3c7', badgeColor = '#d97706';
    if (r.status === 'En proceso') { badgeBg = '#e0f2fe'; badgeColor = '#2563eb'; }
    if (r.status === 'Resuelto') { badgeBg = '#d1fae5'; badgeColor = '#059669'; }
    document.getElementById('modalStatusBadge').innerHTML = `
        <span style="background:${badgeBg}; color:${badgeColor}; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:700;">
            ● ${r.status}
        </span>
    `;

    // Actualizar Línea de Vida Visual
    updateVisualStepper(r.status);

    // Actualizar botón de apoyo ciudadano
    const votesCount = document.getElementById('modalVotesCount');
    if (votesCount) votesCount.textContent = r.votes || 0;

    const isVoted = localStorage.getItem('sm_voted_' + r.id) === 'true';
    if (btnVoteModal) {
        if (isVoted) {
            btnVoteModal.classList.add('voted');
            btnVoteModal.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                <span>¡Respaldaste este reporte! (<strong id="modalVotesCount">${r.votes || 0}</strong> apoyos)</span>
            `;
        } else {
            btnVoteModal.classList.remove('voted');
            btnVoteModal.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                <span>Me afecta este problema (<strong id="modalVotesCount">${r.votes || 0}</strong> apoyos)</span>
            `;
        }
    }

    // Nota de Cuadrilla Oficial
    const noteBox = document.getElementById('modalAdminNoteContainer');
    if (r.admin_notes) {
        noteBox.style.display = 'block';
        document.getElementById('modalAdminNote').textContent = r.admin_notes;
    } else {
        noteBox.style.display = 'none';
    }

    // Fotografía
    const imgBox = document.getElementById('modalImageContainer');
    if (r.image_url) {
        imgBox.innerHTML = `<img src="${r.image_url}" style="width:100%; max-height:220px; object-fit:cover; border-radius:6px; border:1px solid #e2e8f0; margin-bottom:1rem;">`;
    } else {
        imgBox.innerHTML = '';
    }

    trackingModal.style.display = 'flex';
}

btnCloseModal?.addEventListener('click', () => {
    trackingModal.style.display = 'none';
});

// Registrar Apoyo Ciudadano ("Me afecta")
btnVoteModal?.addEventListener('click', async () => {
    if (!currentModalReport) return;
    const reportId = currentModalReport.id;

    if (localStorage.getItem('sm_voted_' + reportId) === 'true') {
        showToast('Ya has manifestado tu respaldo a este reporte');
        return;
    }

    try {
        const response = await fetch(`${API_REPORTS_URL}/${reportId}/vote`, {
            method: 'POST'
        });

        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('sm_voted_' + reportId, 'true');
            showToast('¡Gracias por tu apoyo! Incidencia priorizada en el sistema');
            currentModalReport.votes = data.votes;
            
            const votesCount = document.getElementById('modalVotesCount');
            if (votesCount) votesCount.textContent = data.votes;
            if (btnVoteModal) {
                btnVoteModal.classList.add('voted');
                btnVoteModal.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>¡Respaldaste este reporte! (<strong id="modalVotesCount">${data.votes}</strong> apoyos)</span>
                `;
            }
            fetchReports(true);
        } else {
            showToast(data.error || 'Error al registrar apoyo', true);
        }
    } catch (e) {
        showToast('Error de conexión con el servidor', true);
    }
});

// Generar Comprobante de Radicación PDF para el Ciudadano
btnDownloadCitizenPdf?.addEventListener('click', () => {
    if (!currentModalReport || !window.jspdf) {
        showToast('No fue posible generar el comprobante', true);
        return;
    }

    try {
        const report = currentModalReport;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();

        // Cabecera Distrital
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
        doc.text('COMPROBANTE OFICIAL DE RADICACIÓN CIUDADANA', 14, 18);
        doc.text('Sistema Distrital de Incidencias Urbanas • Santa Marta Reporta', 14, 23);

        const radCode = report.radicado || `SMR-2026-${String(report.id).padStart(4, '0')}`;

        // Recuadro de Radicado
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, 36, pageWidth - 28, 22, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('RADICADO OFICIAL:', 20, 43);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(2, 132, 199);
        doc.text(radCode, 20, 52);

        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(`ESTADO: ${report.status.toUpperCase()}`, pageWidth - 20, 52, { align: 'right' });

        const infoData = [
            ['Ciudadano Solicitante:', report.citizen_name || 'Ciudadano Registrado'],
            ['Teléfono de Contacto:', report.citizen_phone || 'No registrado'],
            ['Correo Electrónico:', report.citizen_email || 'No registrado'],
            ['Fecha de Radicación:', formatDateCustom(report.created_at)],
            ['Categoría de Incidencia:', report.category],
            ['Ubicación Notificada:', report.location],
            ['Coordenadas Cartográficas:', `Lat: ${report.latitude || '11.24079'}  |  Lng: ${report.longitude || '-74.19904'}`],
            ['Descripción Ciudadana:', report.description],
            ['Respuesta Oficial de Cuadrilla:', report.admin_notes || 'En espera de despacho técnico'],
            ['Apoyos Comunitarios Recibidos:', `${report.votes || 0} ciudadanos respaldan este caso`]
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

        const finalY = doc.lastAutoTable.finalY + 16;
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Este documento certifica la radicación formal ante el Distrito de Santa Marta.', 14, finalY);
        doc.text(`Generado en línea el ${new Date().toLocaleString('es-CO')}`, 14, finalY + 5);

        doc.save(`Comprobante_Ciudadano_${radCode}.pdf`);
        showToast(`Comprobante ${radCode} descargado en PDF`);
    } catch (e) {
        console.error('Error generando comprobante ciudadano PDF:', e);
        showToast('Error al generar comprobante PDF', true);
    }
});

// ------------------------------------------------------------------------------
// Manejo de Dropzone
// ------------------------------------------------------------------------------
const dropzoneBox = document.getElementById('dropzoneBox');
const imageInput = document.getElementById('imageInput');
const dropzonePrompt = document.getElementById('dropzonePrompt');
const dropzonePreview = document.getElementById('dropzonePreview');
const previewImg = document.getElementById('previewImg');
const btnRemovePreview = document.getElementById('btnRemovePreview');

if (dropzoneBox && imageInput) {
    dropzoneBox.addEventListener('click', (e) => {
        if (e.target !== btnRemovePreview) imageInput.click();
    });

    dropzoneBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzoneBox.classList.add('dragover');
    });

    ['dragleave', 'dragend'].forEach(t => dropzoneBox.addEventListener(t, () => dropzoneBox.classList.remove('dragover')));

    dropzoneBox.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzoneBox.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            imageInput.files = e.dataTransfer.files;
            handleImg(e.dataTransfer.files[0]);
        }
    });

    imageInput.addEventListener('change', () => {
        if (imageInput.files && imageInput.files[0]) handleImg(imageInput.files[0]);
    });

    btnRemovePreview?.addEventListener('click', (e) => {
        e.stopPropagation();
        imageInput.value = '';
        dropzonePreview.style.display = 'none';
        dropzonePrompt.style.display = 'block';
        previewImg.src = '';
    });
}

function handleImg(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Formato de imagen inválido', true);
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        dropzonePrompt.style.display = 'none';
        dropzonePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// ------------------------------------------------------------------------------
// Envío del Formulario Ciudadano (Asociado al Ciudadano Autenticado)
// ------------------------------------------------------------------------------
document.getElementById('reportForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');

    const citizen = getCurrentCitizen();
    if (!citizen) {
        showToast('Debes iniciar sesión para radicar una incidencia', true);
        openCitizenAuthModal('login');
        return;
    }

    btn.disabled = true;

    try {
        const formData = new FormData(e.target);
        const categoryVal = document.getElementById('category')?.value || '';
        const descInput = document.getElementById('description')?.value.trim();
        const locInput = document.getElementById('location')?.value.trim();

        if (!categoryVal) {
            showToast('Por favor selecciona una categoría', true);
            btn.disabled = false;
            return;
        }

        if (!descInput) {
            showToast('Por favor describe la incidencia', true);
            btn.disabled = false;
            return;
        }

        // Datos del ciudadano logueado
        formData.set('first_name', citizen.first_name);
        formData.set('last_name', citizen.last_name);
        formData.set('citizen_name', citizen.full_name);
        formData.set('citizen_email', citizen.email);
        formData.set('citizen_phone', citizen.phone);

        if (locInput) {
            formData.set('location', locInput);
        }

        const res = await fetch(API_REPORTS_URL, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (res.ok) {
            showToast(`¡Reporte radicado con éxito! Radicado: ${data.radicado}`);
            e.target.reset();
            btnRemovePreview?.click();
            await fetchReports();
            openReportModal(data.id);
        } else {
            showToast(data.error || 'Error al radicar reporte', true);
        }
    } catch (err) {
        showToast('Error de conexión con el servidor', true);
    } finally {
        btn.disabled = false;
    }
});

// ------------------------------------------------------------------------------
// Filtros de Categoría y Búsqueda
// ------------------------------------------------------------------------------
document.querySelectorAll('.category-tag-pill').forEach(pill => {
    pill.addEventListener('click', () => {
        document.querySelectorAll('.category-tag-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeCategory = pill.dataset.category;
        fetchReports();
    });
});

document.getElementById('statusFilter')?.addEventListener('change', (e) => {
    activeStatus = e.target.value;
    fetchReports();
});

document.getElementById('searchInput')?.addEventListener('input', (e) => {
    clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = setTimeout(fetchReports, 300);
});

function filterByKpi(status) {
    document.getElementById('statusFilter').value = status;
    activeStatus = status;
    fetchReports();
}

// ------------------------------------------------------------------------------
// Carrusel Infinito Continuo del Hero
// ------------------------------------------------------------------------------
function initInfiniteHeroCarousel() {
    const slides = document.querySelectorAll('.hero-slide');
    const locationTag = document.getElementById('heroLocationTag');
    const counterTag = document.getElementById('heroCarouselCounter');
    if (!slides || slides.length === 0) return;

    let currentSlideIndex = 0;
    const totalSlides = slides.length;

    function goToNextSlide() {
        slides[currentSlideIndex].classList.remove('active');
        currentSlideIndex = (currentSlideIndex + 1) % totalSlides;
        slides[currentSlideIndex].classList.add('active');

        const locName = slides[currentSlideIndex].getAttribute('data-location') || 'Santa Marta';
        if (locationTag) {
            locationTag.textContent = `📍 ${locName}`;
        }
        if (counterTag) {
            counterTag.textContent = `${currentSlideIndex + 1} / ${totalSlides}`;
        }
    }

    setInterval(goToNextSlide, 3800);
}

// ------------------------------------------------------------------------------
// Comportamiento del Encabezado
// ------------------------------------------------------------------------------
function initBrandHeaderNavigation() {
    const brandLinks = document.querySelectorAll('.brand-link-header, .brand-system-link');
    brandLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const currentPath = window.location.pathname;
            if (currentPath === '/' || currentPath.endsWith('index.html') || currentPath === '') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}

// ------------------------------------------------------------------------------
// Sincronización en Tiempo Real (Cada 6 Segundos)
// ------------------------------------------------------------------------------
setInterval(() => {
    fetchReports(true);
}, 6000);

// ------------------------------------------------------------------------------
// MÓDULO DE AUTENTICACIÓN CIUDADANA Y PERFIL DE USUARIO
// ------------------------------------------------------------------------------
const citizenAuthModal = document.getElementById('citizenAuthModal');
const citizenProfileModal = document.getElementById('citizenProfileModal');
const btnUserAvatar = document.getElementById('btnUserAvatar');
const btnOpenCitizenProfileFromBanner = document.getElementById('btnOpenCitizenProfileFromBanner');
const btnCloseProfileModal = document.getElementById('btnCloseProfileModal');
const btnLogoutCitizen = document.getElementById('btnLogoutCitizen');

function getCurrentCitizen() {
    try {
        const stored = localStorage.getItem('sm_citizen_user');
        return stored ? JSON.parse(stored) : null;
    } catch (e) {
        return null;
    }
}

function openCitizenAuthModal(tab = 'login') {
    if (citizenAuthModal) {
        citizenAuthModal.style.display = 'flex';
        switchCitizenTab(tab);
    }
}

function closeCitizenAuthModal() {
    if (citizenAuthModal) citizenAuthModal.style.display = 'none';
}

window.switchCitizenTab = function(tab) {
    const loginTab = document.getElementById('citizenLoginTab');
    const registerTab = document.getElementById('citizenRegisterTab');
    const tabBtnLogin = document.getElementById('tabBtnLogin');
    const tabBtnRegister = document.getElementById('tabBtnRegister');

    if (tab === 'login') {
        if (loginTab) loginTab.style.display = 'block';
        if (registerTab) registerTab.style.display = 'none';
        tabBtnLogin?.classList.add('active');
        tabBtnRegister?.classList.remove('active');
    } else {
        if (loginTab) loginTab.style.display = 'none';
        if (registerTab) registerTab.style.display = 'block';
        tabBtnRegister?.classList.add('active');
        tabBtnLogin?.classList.remove('active');
    }
};

function getInitials(name) {
    if (!name) return '👤';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

function checkCitizenAuth() {
    const citizen = getCurrentCitizen();
    const bannerName = document.getElementById('citizenBannerName');
    const bannerDetails = document.getElementById('citizenBannerDetails');
    const bannerAvatar = document.getElementById('citizenBannerAvatar');

    if (citizen) {
        closeCitizenAuthModal();
        if (btnUserAvatar) {
            btnUserAvatar.classList.add('logged-in');
            btnUserAvatar.innerHTML = `<span>${getInitials(citizen.full_name || citizen.first_name)}</span>`;
            btnUserAvatar.title = `${citizen.full_name} • Cuenta Activa`;
        }

        if (bannerName) bannerName.textContent = citizen.full_name || `${citizen.first_name} ${citizen.last_name}`;
        if (bannerDetails) bannerDetails.textContent = `${citizen.phone || 'S/N'} • ${citizen.email}`;
        if (bannerAvatar) bannerAvatar.textContent = getInitials(citizen.full_name || citizen.first_name);
    } else {
        if (btnUserAvatar) {
            btnUserAvatar.classList.remove('logged-in');
            btnUserAvatar.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
            btnUserAvatar.title = 'Iniciar Sesión / Registrarse';
        }

        if (bannerName) bannerName.textContent = 'Acceso Ciudadano Requerido';
        if (bannerDetails) bannerDetails.textContent = 'Inicia sesión para notificar una problemática';
        if (bannerAvatar) bannerAvatar.textContent = '🔒';

        // Mostrar el modal de inicio de sesión si no hay sesión activa
        openCitizenAuthModal('login');
    }
}

// Envío de Formulario Login Ciudadano
document.getElementById('formCitizenLogin')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('citLoginEmail')?.value.trim();
    const password = document.getElementById('citLoginPassword')?.value;
    const btn = document.getElementById('btnSubmitCitLogin');

    if (!email || !password) {
        showToast('Ingrese su correo y contraseña', true);
        return;
    }

    btn.disabled = true;
    try {
        const res = await fetch('/api/auth/citizen/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            localStorage.setItem('sm_citizen_user', JSON.stringify(data.citizen));
            if (data.token) localStorage.setItem('sm_citizen_token', data.token);
            showToast(`¡Bienvenido al portal, ${data.citizen.first_name}!`);
            checkCitizenAuth();
        } else {
            showToast(data.error || 'Credenciales no válidas', true);
        }
    } catch (err) {
        showToast('Error de conexión con el servidor', true);
    } finally {
        btn.disabled = false;
    }
});

// Envío de Formulario Registro Ciudadano
document.getElementById('formCitizenRegister')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const first_name = document.getElementById('citRegFirstName')?.value.trim();
    const last_name = document.getElementById('citRegLastName')?.value.trim();
    const email = document.getElementById('citRegEmail')?.value.trim();
    const phone = document.getElementById('citRegPhone')?.value.trim();
    const password = document.getElementById('citRegPassword')?.value;
    const btn = document.getElementById('btnSubmitCitReg');

    if (!first_name || !last_name || !email || !phone || !password) {
        showToast('Todos los campos son requeridos', true);
        return;
    }

    btn.disabled = true;
    try {
        const res = await fetch('/api/auth/citizen/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name, last_name, email, phone, password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            localStorage.setItem('sm_citizen_user', JSON.stringify(data.citizen));
            if (data.token) localStorage.setItem('sm_citizen_token', data.token);
            showToast('¡Cuenta creada con éxito! Bienvenido al portal');
            checkCitizenAuth();
        } else {
            showToast(data.error || 'Error al crear la cuenta', true);
        }
    } catch (err) {
        showToast('Error de conexión con el servidor', true);
    } finally {
        btn.disabled = false;
    }
});

// Abrir Drawer / Modal de Perfil Ciudadano
window.openCitizenProfileDrawer = async function() {
    const citizen = getCurrentCitizen();
    if (!citizen) {
        openCitizenAuthModal('login');
        return;
    }

    document.getElementById('citProfileAvatar').textContent = getInitials(citizen.full_name || citizen.first_name);
    document.getElementById('citProfileName').textContent = citizen.full_name || `${citizen.first_name} ${citizen.last_name}`;
    document.getElementById('citProfileEmail').textContent = citizen.email;
    document.getElementById('citProfilePhone').textContent = `📞 ${citizen.phone || 'S/N'}`;

    if (citizenProfileModal) citizenProfileModal.style.display = 'flex';

    await loadCitizenMyReports(citizen.email);
};

async function loadCitizenMyReports(email) {
    const container = document.getElementById('citMyReportsList');
    const badge = document.getElementById('citTotalReportsBadge');
    if (!container) return;

    try {
        const res = await fetch(`/api/reports/citizen/${encodeURIComponent(email)}`);
        const reports = await res.json();

        if (!Array.isArray(reports) || reports.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:2rem 1rem; color:#64748b;">
                    <div style="font-size:2rem; margin-bottom:6px;">📋</div>
                    <strong style="color:#0f172a; font-size:0.9rem;">Aún no tienes reportes radicados</strong>
                    <p style="font-size:0.78rem; margin-top:4px;">Utiliza el formulario del panel izquierdo para radicar una incidencia en tu barrio.</p>
                </div>
            `;
            if (badge) badge.textContent = '0 reportes';
            return;
        }

        if (badge) badge.textContent = `${reports.length} reporte${reports.length === 1 ? '' : 's'}`;

        container.innerHTML = reports.map(r => {
            let statusBadge = '<span style="background:#fef3c7; color:#d97706; padding:2px 8px; border-radius:4px; font-weight:700; font-size:0.72rem;">🟡 Pendiente</span>';
            if (r.status === 'En proceso') {
                statusBadge = '<span style="background:#e0f2fe; color:#2563eb; padding:2px 8px; border-radius:4px; font-weight:700; font-size:0.72rem;">🔵 En proceso</span>';
            } else if (r.status === 'Resuelto') {
                statusBadge = '<span style="background:#d1fae5; color:#059669; padding:2px 8px; border-radius:4px; font-weight:700; font-size:0.72rem;">🟢 Resuelto</span>';
            }

            return `
                <div class="citizen-report-item">
                    <div style="flex:1;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:3px;">
                            <span style="font-family:'JetBrains Mono', monospace; font-size:0.8rem; font-weight:800; color:#0284c7;">${r.radicado}</span>
                            ${statusBadge}
                        </div>
                        <div style="font-weight:700; font-size:0.84rem; color:#0f172a;">${r.category}</div>
                        <div style="font-size:0.75rem; color:#64748b;">📍 ${r.location}</div>
                        <div style="font-size:0.72rem; color:#94a3b8; margin-top:2px;">🕒 ${formatDateCustom(r.created_at)}</div>
                    </div>
                    <div style="margin-left:12px;">
                        <button type="button" onclick="downloadCitizenVoucher(${r.id})" style="background:#f0f9ff; border:1px solid #bae6fd; color:#0369a1; padding:0.4rem 0.7rem; border-radius:6px; font-size:0.74rem; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            PDF
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        container.innerHTML = '<p style="color:red; text-align:center; padding:1rem;">Error al cargar tus incidencias.</p>';
    }
}

window.downloadCitizenVoucher = async function(reportId) {
    try {
        const res = await fetch(`${API_REPORTS_URL}/${reportId}`);
        if (!res.ok) throw new Error('No se encontró el reporte');
        const report = await res.json();
        currentModalReport = report;
        document.getElementById('btnDownloadCitizenPdf')?.click();
    } catch (e) {
        showToast('Error al descargar el PDF', true);
    }
};

btnUserAvatar?.addEventListener('click', () => {
    const citizen = getCurrentCitizen();
    if (citizen) {
        openCitizenProfileDrawer();
    } else {
        openCitizenAuthModal('login');
    }
});

btnOpenCitizenProfileFromBanner?.addEventListener('click', openCitizenProfileDrawer);
btnCloseProfileModal?.addEventListener('click', () => {
    if (citizenProfileModal) citizenProfileModal.style.display = 'none';
});

btnLogoutCitizen?.addEventListener('click', () => {
    localStorage.removeItem('sm_citizen_user');
    localStorage.removeItem('sm_citizen_token');
    if (citizenProfileModal) citizenProfileModal.style.display = 'none';
    showToast('Sesión cerrada con éxito');
    checkCitizenAuth();
});

// ------------------------------------------------------------------------------
// Inicialización
// ------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    fetchReports();
    initInfiniteHeroCarousel();
    initBrandHeaderNavigation();
    checkCitizenAuth();
});
