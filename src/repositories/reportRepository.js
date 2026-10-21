const { getDb } = require('../config/database');

// Crear un nuevo reporte en la base de datos y asignar radicado oficial
async function createReport(reportData) {
    const db = await getDb();
    const { 
        description, 
        category, 
        location, 
        latitude = 11.24079, 
        longitude = -74.19904, 
        image_url 
    } = reportData;
    
    const result = await db.run(
        `INSERT INTO reports (description, category, location, latitude, longitude, image_url, votes, status, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, 0, 'Pendiente', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [description, category, location, latitude, longitude, image_url]
    );

    const newId = result.lastID;
    const radicado = `SMR-2026-${String(newId).padStart(4, '0')}`;
    
    await db.run(
        'UPDATE reports SET radicado = ? WHERE id = ?',
        [radicado, newId]
    );

    return await getReportById(newId);
}

// Obtener reportes con soporte para filtros opcionales (categoría, estado, búsqueda por radicado/texto)
async function getAllReports(filters = {}) {
    const db = await getDb();
    const { category, status, search } = filters;

    let query = 'SELECT * FROM reports WHERE 1=1';
    const params = [];

    if (category && category !== 'Todas') {
        query += ' AND category = ?';
        params.push(category);
    }

    if (status && status !== 'Todos') {
        query += ' AND status = ?';
        params.push(status);
    }

    if (search && search.trim() !== '') {
        query += ' AND (radicado LIKE ? OR location LIKE ? OR description LIKE ?)';
        const searchTerm = `%${search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    return await db.all(query, params);
}

// Obtener un reporte específico por su ID
async function getReportById(id) {
    const db = await getDb();
    return await db.get('SELECT * FROM reports WHERE id = ?', [id]);
}

// Obtener un reporte por su número de Radicado
async function getReportByRadicado(radicado) {
    const db = await getDb();
    const cleanRadicado = radicado.trim().toUpperCase();
    return await db.get('SELECT * FROM reports WHERE UPPER(radicado) = ?', [cleanRadicado]);
}

// Actualizar el estado de un reporte
async function updateReportStatus(id, newStatus) {
    const db = await getDb();
    await db.run(
        'UPDATE reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newStatus, id]
    );
    
    return await getReportById(id);
}

// Incrementar votos comunitarios de un reporte ("Respaldar reporte")
async function incrementVote(id) {
    const db = await getDb();
    await db.run(
        'UPDATE reports SET votes = votes + 1 WHERE id = ?',
        [id]
    );
    return await getReportById(id);
}

// Actualizar notas de resolución o seguimiento administrativo
async function updateAdminNotes(id, adminNotes) {
    const db = await getDb();
    await db.run(
        'UPDATE reports SET admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [adminNotes, id]
    );
    return await getReportById(id);
}

// Eliminar un reporte
async function deleteReport(id) {
    const db = await getDb();
    const report = await getReportById(id);
    if (!report) return null;
    await db.run('DELETE FROM reports WHERE id = ?', [id]);
    return report;
}

// Obtener estadísticas y métricas para el Dashboard
async function getStats() {
    const db = await getDb();
    
    const total = await db.get('SELECT COUNT(*) as count FROM reports');
    const pending = await db.get("SELECT COUNT(*) as count FROM reports WHERE status = 'Pendiente'");
    const inProcess = await db.get("SELECT COUNT(*) as count FROM reports WHERE status = 'En proceso'");
    const resolved = await db.get("SELECT COUNT(*) as count FROM reports WHERE status = 'Resuelto'");
    const totalVotes = await db.get("SELECT COALESCE(SUM(votes), 0) as count FROM reports");
    const categoryCounts = await db.all("SELECT category, COUNT(*) as count FROM reports GROUP BY category ORDER BY count DESC");

    // Cálculo de efectividad porcentual de resolución
    const totalCount = total.count || 0;
    const resolvedCount = resolved.count || 0;
    const effectivenessRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

    return {
        total: totalCount,
        pending: pending.count || 0,
        inProcess: inProcess.count || 0,
        resolved: resolvedCount,
        totalVotes: totalVotes.count || 0,
        effectivenessRate,
        categoryCounts
    };
}

module.exports = {
    createReport,
    getAllReports,
    getReportById,
    getReportByRadicado,
    updateReportStatus,
    incrementVote,
    updateAdminNotes,
    deleteReport,
    getStats
};
