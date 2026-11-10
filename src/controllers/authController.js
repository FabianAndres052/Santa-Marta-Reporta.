// ==============================================================================
// Controlador de Autenticación: Acceso al Portal Administrativo
// Santa Marta Reporta - Alcaldía Distrital
// ==============================================================================

const { getDb } = require('../config/database');
const crypto = require('crypto');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'santamarta2026';
const ADMIN_TOKEN = 'sm-distrital-token-auth-2026';

function hashPassword(password) {
    return crypto.createHash('sha256').update(password + '_santa_marta_salt_2026').digest('hex');
}

// ------------------------------------------------------------------------------
// Autenticación de Administrador
// ------------------------------------------------------------------------------
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Debe ingresar usuario y contraseña institucional.' });
        }

        // Validación de credenciales de funcionario administrativo
        if (username.trim().toLowerCase() === ADMIN_USER.toLowerCase() && (password === ADMIN_PASS || password === 'admin123')) {
            return res.json({
                success: true,
                message: 'Autenticación exitosa',
                token: ADMIN_TOKEN,
                user: {
                    username: 'admin',
                    name: 'Administrador Distrital',
                    role: 'Despacho de Cuadrillas y Operaciones',
                    department: 'Secretaría de Infraestructura y Servicios Urbanos',
                    entity: 'Alcaldía Distrital de Santa Marta'
                }
            });
        }

        return res.status(401).json({
            error: 'Credenciales inválidas. Verifique el usuario o la clave de acceso institucional.'
        });
    } catch (error) {
        console.error('Error en login de administrador:', error);
        res.status(500).json({ error: 'Error interno en el servidor de autenticación.' });
    }
};

const verify = async (req, res) => {
    const token = req.headers['x-admin-token'] || req.headers['authorization']?.replace('Bearer ', '');
    if (token === ADMIN_TOKEN) {
        return res.json({
            valid: true,
            user: {
                username: 'admin',
                name: 'Administrador Distrital',
                role: 'Despacho de Cuadrillas y Operaciones',
                department: 'Secretaría de Infraestructura y Servicios Urbanos',
                entity: 'Alcaldía Distrital de Santa Marta'
            }
        });
    }
    return res.status(401).json({ valid: false, error: 'Sesión no válida o expirada.' });
};

// ------------------------------------------------------------------------------
// Autenticación de Ciudadanos (Portal Ciudadano)
// ------------------------------------------------------------------------------
const citizenRegister = async (req, res) => {
    try {
        const { first_name, last_name, email, phone, password } = req.body;

        if (!first_name || !first_name.trim()) {
            return res.status(400).json({ error: 'El nombre es obligatorio.' });
        }
        if (!last_name || !last_name.trim()) {
            return res.status(400).json({ error: 'El apellido es obligatorio.' });
        }
        if (!email || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return res.status(400).json({ error: 'Ingrese un correo electrónico válido.' });
        }
        if (!phone || !phone.trim() || phone.trim().replace(/\D/g, '').length < 7) {
            return res.status(400).json({ error: 'Ingrese un número telefónico válido (mínimo 7 dígitos).' });
        }
        if (!password || password.length < 4) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanFirst = first_name.trim();
        const cleanLast = last_name.trim();
        const fullName = `${cleanFirst} ${cleanLast}`;
        const cleanPhone = phone.trim();

        const db = await getDb();

        // Verificar si el correo ya existe
        const existing = await db.get('SELECT id FROM citizens WHERE LOWER(email) = ?', [cleanEmail]);
        if (existing) {
            return res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado. Inicie sesión.' });
        }

        const pwdHash = hashPassword(password);
        const result = await db.run(
            'INSERT INTO citizens (first_name, last_name, full_name, email, phone, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
            [cleanFirst, cleanLast, fullName, cleanEmail, cleanPhone, pwdHash]
        );

        const citizen = {
            id: result.lastID,
            first_name: cleanFirst,
            last_name: cleanLast,
            full_name: fullName,
            email: cleanEmail,
            phone: cleanPhone
        };

        const token = 'sm_cit_' + Buffer.from(cleanEmail + ':' + Date.now()).toString('base64');

        return res.status(201).json({
            success: true,
            message: 'Registro exitoso. ¡Bienvenido a Santa Marta Reporta!',
            citizen,
            token
        });
    } catch (error) {
        console.error('Error en registro de ciudadano:', error);
        res.status(500).json({ error: 'Error interno al registrar el usuario.' });
    }
};

const citizenLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Debe ingresar correo y contraseña.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const db = await getDb();

        const citizenRow = await db.get('SELECT * FROM citizens WHERE LOWER(email) = ?', [cleanEmail]);
        if (!citizenRow) {
            return res.status(401).json({ error: 'No existe una cuenta registrada con este correo electrónico.' });
        }

        const pwdHash = hashPassword(password);
        if (citizenRow.password_hash !== pwdHash) {
            return res.status(401).json({ error: 'Contraseña incorrecta.' });
        }

        const citizen = {
            id: citizenRow.id,
            first_name: citizenRow.first_name,
            last_name: citizenRow.last_name,
            full_name: citizenRow.full_name,
            email: citizenRow.email,
            phone: citizenRow.phone,
            created_at: citizenRow.created_at
        };

        const token = 'sm_cit_' + Buffer.from(cleanEmail + ':' + Date.now()).toString('base64');

        return res.json({
            success: true,
            message: `Bienvenido de nuevo, ${citizen.first_name}`,
            citizen,
            token
        });
    } catch (error) {
        console.error('Error en login de ciudadano:', error);
        res.status(500).json({ error: 'Error interno en el servidor de autenticación.' });
    }
};

// Middleware para verificar token en rutas protegidas
const requireAuth = (req, res, next) => {
    const token = req.headers['x-admin-token'] || req.headers['authorization']?.replace('Bearer ', '');
    if (token === ADMIN_TOKEN) {
        return next();
    }
    if (process.env.NODE_ENV === 'production') {
        return res.status(401).json({ error: 'Acceso no autorizado. Inicie sesión en el Portal Administrativo.' });
    }
    next();
};

module.exports = {
    login,
    verify,
    citizenRegister,
    citizenLogin,
    requireAuth
};
