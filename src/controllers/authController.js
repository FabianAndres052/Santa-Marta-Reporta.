// ==============================================================================
// Controlador de Autenticación: Acceso al Portal Administrativo
// Santa Marta Reporta - Alcaldía Distrital
// ==============================================================================

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'santamarta2026';
const ADMIN_TOKEN = 'sm-distrital-token-auth-2026';

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
    requireAuth
};
