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
                status TEXT DEFAULT 'Pendiente',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Migración dinámica segura: agregar columnas si la tabla ya existía de versiones previas
        const tableInfo = await db.all("PRAGMA table_info(reports)");
        const existingColumns = tableInfo.map(col => col.name);

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

        console.log('Base de datos SQLite inicializada y radicados actualizados con éxito.');
        return db;
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        throw error;
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
