// ==============================================================================
// Rutas de Autenticación para el Portal de Administración
// ==============================================================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.get('/verify', authController.verify);

// Rutas de Ciudadanos (Portal Ciudadano)
router.post('/citizen/register', authController.citizenRegister);
router.post('/citizen/login', authController.citizenLogin);

module.exports = router;

