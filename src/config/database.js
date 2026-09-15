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

        // Crear la tabla reports si no existe
        await db.exec(`
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                description TEXT NOT NULL,
                category TEXT NOT NULL,
                location TEXT NOT NULL,
                image_url TEXT,
                status TEXT DEFAULT 'Pendiente',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Base de datos SQLite inicializada correctamente.');
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
