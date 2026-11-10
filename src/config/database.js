const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

// Definir la ruta del archivo de base de datos
const dbPath = path.resolve(__dirname, '../../database.sqlite');

// Función para inicializar y obtener la conexión a la base de datos
async function initDatabase() {
    try {
        const db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        // Crear la tabla reports si no existe con campos robustos
        await db.exec(`
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                radicado TEXT UNIQUE,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                location TEXT NOT NULL,
                latitude REAL DEFAULT 11.24079,
                longitude REAL DEFAULT -74.19904,
                image_url TEXT,
                votes INTEGER DEFAULT 0,
                admin_notes TEXT,
                citizen_name TEXT,
                citizen_email TEXT,
                citizen_phone TEXT,
                status TEXT DEFAULT 'Pendiente',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Crear la tabla citizens para el registro y autenticación de ciudadanos
        await db.exec(`
            CREATE TABLE IF NOT EXISTS citizens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                full_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Migración dinámica segura: agregar columnas si la tabla ya existía de versiones previas
        const tableInfo = await db.all("PRAGMA table_info(reports)");
        const existingColumns = tableInfo.map(col => col.name);

        if (!existingColumns.includes('citizen_name')) {
            await db.exec("ALTER TABLE reports ADD COLUMN citizen_name TEXT");
        }
        if (!existingColumns.includes('citizen_email')) {
            await db.exec("ALTER TABLE reports ADD COLUMN citizen_email TEXT");
        }
        if (!existingColumns.includes('citizen_phone')) {
            await db.exec("ALTER TABLE reports ADD COLUMN citizen_phone TEXT");
        }
        if (!existingColumns.includes('radicado')) {
            await db.exec("ALTER TABLE reports ADD COLUMN radicado TEXT");
        }
        if (!existingColumns.includes('latitude')) {
            await db.exec("ALTER TABLE reports ADD COLUMN latitude REAL DEFAULT 11.24079");
        }
        if (!existingColumns.includes('longitude')) {
            await db.exec("ALTER TABLE reports ADD COLUMN longitude REAL DEFAULT -74.19904");
        }
        if (!existingColumns.includes('votes')) {
            await db.exec("ALTER TABLE reports ADD COLUMN votes INTEGER DEFAULT 0");
        }
        if (!existingColumns.includes('admin_notes')) {
            await db.exec("ALTER TABLE reports ADD COLUMN admin_notes TEXT");
        }
        if (!existingColumns.includes('updated_at')) {
            await db.exec("ALTER TABLE reports ADD COLUMN updated_at DATETIME");
        }

        // Asignar número de radicado oficial formal a registros existentes que no lo tengan
        await db.exec(`
            UPDATE reports 
            SET radicado = 'SMR-2026-' || printf('%04d', id) 
            WHERE radicado IS NULL OR radicado = ''
        `);

        // Reparación automática de categorías y caracteres con tildes corruptos en base de datos
        await repairDatabaseText(db);

        console.log('Base de datos SQLite inicializada, reparada y sincronizada en UTF-8.');
        return db;
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        throw error;
    }
}

// Función auxiliar para normalizar categorías y limpiar caracteres mal codificados
async function repairDatabaseText(db) {
    try {
        const rows = await db.all('SELECT id, category, location, description, admin_notes, citizen_name FROM reports');
        for (const r of rows) {
            let cat = r.category || '';
            if (cat.includes('Alumbrado')) cat = 'Alumbrado Público y Energía';
            else if (cat.includes('Malla') || cat.includes('Pavimentac')) cat = 'Malla Vial y Pavimentación';
            else if (cat.includes('Residuo') || cat.includes('Aseo') || cat.includes('Basura')) cat = 'Gestión de Residuos y Aseo';
            else if (cat.includes('Acueducto') || cat.includes('Alcantarillad')) cat = 'Red de Acueducto y Alcantarillado';
            else if (cat.includes('Parque') || cat.includes('Espacio')) cat = 'Parques y Espacio Público';

            let loc = (r.location || '')
                .replace(/Hist[\ufffd?]?rico/g, 'Histórico')
                .replace(/Bah[\ufffd?]?a/g, 'Bahía')
                .replace(/Guzm[\ufffd?]?n/g, 'Guzmán');

            let desc = (r.description || '')
                .replace(/v[\ufffd?]?a/g, 'vía')
                .replace(/tr[\ufffd?]?nsito/g, 'tránsito')
                .replace(/bah[\ufffd?]?a/g, 'bahía')
                .replace(/cr[\ufffd?]?tico/g, 'crítico')
                .replace(/acumulaci[\ufffd?]?n/g, 'acumulación')
                .replace(/tur[\ufffd?]?stico/g, 'turístico')
                .replace(/p[\ufffd?]?blico/g, 'público')
                .replace(/reparaci[\ufffd?]?n/g, 'reparación')
                .replace(/atenci[\ufffd?]?n/g, 'atención')
                .replace(/reposici[\ufffd?]?n/g, 'reposición');

            let notes = (r.admin_notes || '')
                .replace(/reposici[\ufffd?]?n/g, 'reposición')
                .replace(/p[\ufffd?]?blico/g, 'público')
                .replace(/inspecci[\ufffd?]?n/g, 'inspección')
                .replace(/intervenci[\ufffd?]?n/g, 'intervención')
                .replace(/soluci[\ufffd?]?n/g, 'solución');

            let citName = (r.citizen_name || '')
                .replace(/Mar[\ufffd?]?a/g, 'María')
                .replace(/G[\ufffd?]?mez/g, 'Gómez')
                .replace(/Andr[\ufffd?]?s/g, 'Andrés')
                .replace(/Mart[\ufffd?]?nez/g, 'Martínez')
                .replace(/P[\ufffd?]?rez/g, 'Pérez')
                .replace(/Rodr[\ufffd?]?guez/g, 'Rodríguez')
                .replace(/Hern[\ufffd?]?ndez/g, 'Hernández');

            if (cat !== r.category || loc !== r.location || desc !== r.description || notes !== r.admin_notes || citName !== r.citizen_name) {
                await db.run(
                    'UPDATE reports SET category = ?, location = ?, description = ?, admin_notes = ?, citizen_name = ? WHERE id = ?',
                    [cat, loc, desc, notes || null, citName, r.id]
                );
            }
        }
    } catch (e) {
        console.warn('Advertencia en repairDatabaseText:', e.message);
    }
}

// Variable para almacenar la instancia de la conexión
let dbInstance = null;

// Función para obtener la conexión ya inicializada
async function getDb() {
    if (!dbInstance) {
        dbInstance = await initDatabase();
    }
    return dbInstance;
}

module.exports = {
    getDb
};
