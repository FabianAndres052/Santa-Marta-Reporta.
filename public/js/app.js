// ==============================================================================
// Lógica Frontend: Santa Marta Reporta (Réplica Exacta)
// ==============================================================================

const API_REPORTS_URL = '/api/reports';

let santaMartaMap = null;
let markersLayerGroup = null;
let currentReports = [];
let activeCategory = 'Todas';
let activeStatus = 'Todos';
let searchDebounceTimeout = null;
let geocodeDebounceTimeout = null;

// Coordenadas centrales de la Bahía y Centro de Santa Marta
const SANTA_MARTA_CENTER = [11.238, -74.205];

// Notificación Flotante (Toast)
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = (isError ? '⚠️ ' : '✅ ') + message;
    toast.style.background = isError ? '#dc2626' : '#0a2942';
    toast.className = 'show';
    setTimeout(() => { toast.className = toast.className.replace('show', ''); }, 3400);
}

// Formatear Fecha idéntica a la maqueta (ej. "20 oct 2026, 05:06 a. m.")
function formatDateCustom(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'p. m.' : 'a. m.';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, '0');

    return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`;
}

// Crear Pin Personalizado de Leaflet Idéntico a la Maqueta
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
        zoomControl: false // Usamos controles personalizados
    }).setView(SANTA_MARTA_CENTER, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(santaMartaMap);

    markersLayerGroup = L.layerGroup().addTo(santaMartaMap);

    // Clic en el mapa para radicar incidencia en ese punto
    santaMartaMap.on('click', (e) => {
        document.getElementById('latitude').value = e.latlng.lat.toFixed(6);
        document.getElementById('longitude').value = e.latlng.lng.toFixed(6);
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
            showToast('Navegador sin soporte de GPS', true);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                santaMartaMap.setView([lat, lng], 15);
                document.getElementById('latitude').value = lat.toFixed(6);
                document.getElementById('longitude').value = lng.toFixed(6);
                reverseGeocode(lat, lng);
            },
            () => showToast('No se pudo acceder a tu ubicación', true),
            { enableHighAccuracy: true }
        );
    });
}

// ------------------------------------------------------------------------------
// Renderizar Marcadores en el Mapa
// ------------------------------------------------------------------------------
function updateMapMarkers(reports) {
    if (!santaMartaMap || !markersLayerGroup) return;

    markersLayerGroup.clearLayers();

    reports.forEach(report => {
        const lat = report.latitude || 11.238;
        const lng = report.longitude || -74.205;
        const status = report.status || 'Pendiente';

        const customPin = createCustomPin(status);
        const marker = L.marker([lat, lng], { icon: customPin });

        const popupHtml = `
            <div style="font-family:'Plus Jakarta Sans', sans-serif; max-width:220px;">
                ${report.image_url ? `<img src="${report.image_url}" style="width:100%; height:95px; object-fit:cover; border-radius:4px; margin-bottom:5px;">` : ''}
                <strong style="color:#0c385b; font-size:12px; display:block;">${report.category}</strong>
                <p style="margin:2px 0; font-size:11px; font-weight:600; color:#0284c7;">📍 ${report.location}</p>
                <p style="margin:2px 0 6px; font-size:11px; color:#475569; line-height:1.35;">${report.description}</p>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:10px; font-weight:700; color:#0c385b;">${report.status}</span>
                    <button type="button" onclick="openReportModal(${report.id})" style="background:#0c385b; color:white; border:none; padding:3px 7px; border-radius:3px; font-size:10px; cursor:pointer;">
                        Ver Detalle
                    </button>
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
// Cargar Reportes
// ------------------------------------------------------------------------------
async function fetchReports() {
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

        // Título estilizado amigable
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
                        <span class="badge-pill-status ${badgeClass}">
                            <span style="font-size:8px;">●</span> ${r.status}
                        </span>
                    </div>
                </div>
                <div style="color:var(--text-light); font-size:1.1rem; font-weight:700;">&rsaquo;</div>
            </div>
        `;
    }).join('');
}

// ------------------------------------------------------------------------------
// Modal de Detalle
// ------------------------------------------------------------------------------
const trackingModal = document.getElementById('trackingModal');
const btnCloseModal = document.getElementById('btnCloseModal');

function openReportModal(id) {
    const r = currentReports.find(item => item.id === id);
    if (!r) return;

    document.getElementById('modalRadicado').textContent = r.radicado || `SMR-2026-${String(r.id).padStart(4, '0')}`;
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

    const noteBox = document.getElementById('modalAdminNoteContainer');
    if (r.admin_notes) {
        noteBox.style.display = 'block';
        document.getElementById('modalAdminNote').textContent = r.admin_notes;
    } else {
        noteBox.style.display = 'none';
    }

    const imgBox = document.getElementById('modalImageContainer');
    if (r.image_url) {
        imgBox.innerHTML = `<img src="${r.image_url}" style="width:100%; max-height:220px; object-fit:cover; border-radius:6px; border:1px solid #e2e8f0;">`;
    } else {
        imgBox.innerHTML = '';
    }

    trackingModal.style.display = 'flex';
}

btnCloseModal?.addEventListener('click', () => {
    trackingModal.style.display = 'none';
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
// Envío del Formulario
// ------------------------------------------------------------------------------
document.getElementById('reportForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;

    try {
        const formData = new FormData(e.target);
        
        // Si no hay descripción, generar una amigable basada en la categoría
        const categoryVal = document.getElementById('category').value;
        formData.set('description', `Incidencia de ${categoryVal} reportada en el sector.`);

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
        showToast('Error de conexión', true);
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
// Carrusel Infinito Continuo del Hero (Fotos de Santa Marta que nunca se detiene)
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

    // Intervalo infinito continuo: nunca se detiene (cada 3.8 segundos)
    setInterval(goToNextSlide, 3800);
}

// ------------------------------------------------------------------------------
// Comportamiento del Encabezado: Clic en Santa Marta Distrito devuelve al inicio
// ------------------------------------------------------------------------------
function initBrandHeaderNavigation() {
    const brandLinks = document.querySelectorAll('.brand-link-header, .brand-system-link');
    brandLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Si ya estamos en index o raíz, hacer scroll suave al inicio
            const currentPath = window.location.pathname;
            if (currentPath === '/' || currentPath.endsWith('index.html') || currentPath === '') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
}

// ------------------------------------------------------------------------------
// Inicialización
// ------------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    fetchReports();
    initInfiniteHeroCarousel();
    initBrandHeaderNavigation();
});
