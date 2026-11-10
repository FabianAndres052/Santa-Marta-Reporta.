const http = require('http');

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(body);
                } catch (e) {
                    parsed = body;
                }
                resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
            });
        });
        req.on('error', reject);
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function runTestSuite() {
    console.log('--- INICIANDO BATERÍA DE PRUEBAS DE INTEGRACIÓN ---');
    let passed = 0;
    let failed = 0;

    function assert(name, condition, details = '') {
        if (condition) {
            console.log(`  [PASS] ${name}`);
            passed++;
        } else {
            console.error(`  [FAIL] ${name} -> ${details}`);
            failed++;
        }
    }

    try {
        // 1. Portal Ciudadano y Guardia de Autenticación
        const resHome = await makeRequest({ host: 'localhost', port: 3000, path: '/', method: 'GET' });
        assert('Carga de Portal Ciudadano (HTTP 200)', resHome.statusCode === 200);
        assert('Guardia de autenticación y Drawer de perfil presente en index.html', 
            typeof resHome.body === 'string' &&
            resHome.body.includes('/login') &&
            resHome.body.includes('citizenProfileModal')
        );

        // 1b. Portal de Acceso / Login Previo Ciudadano
        const resLoginPage = await makeRequest({ host: 'localhost', port: 3000, path: '/login', method: 'GET' });
        assert('Carga de Pantalla de Login Ciudadano (HTTP 200)', resLoginPage.statusCode === 200);
        assert('Formularios de Login y Registro presentes en login.html',
            typeof resLoginPage.body === 'string' &&
            resLoginPage.body.includes('formCitizenLogin') &&
            resLoginPage.body.includes('formCitizenRegister') &&
            resLoginPage.body.includes('loginEmail') &&
            resLoginPage.body.includes('regFirstName')
        );

        // 2. Portal Administrativo
        const resAdmin = await makeRequest({ host: 'localhost', port: 3000, path: '/admin', method: 'GET' });
        assert('Carga de Portal Admin (HTTP 200)', resAdmin.statusCode === 200);
        assert('Credenciales retiradas de admin.html (sin prellenado)',
            typeof resAdmin.body === 'string' &&
            !resAdmin.body.includes('value="admin"') &&
            !resAdmin.body.includes('value="santamarta2026"') &&
            !resAdmin.body.includes('login-credentials-hint')
        );
        assert('Sin nombres personales (Fabian Rizo) en admin.html',
            typeof resAdmin.body === 'string' &&
            !resAdmin.body.toLowerCase().includes('fabian') &&
            !resAdmin.body.toLowerCase().includes('rizo')
        );

        // 3. Validación: Reporte sin datos de ciudadano debe fallar
        const invalidPayload = JSON.stringify({
            title: 'Hueco sin ciudadano',
            category: 'Malla Vial y Pavimentación',
            description: 'Prueba de validación sin datos de ciudadano',
            location: 'El Rodadero',
            latitude: 11.215,
            longitude: -74.225
        });

        const resInvalid = await makeRequest({
            host: 'localhost',
            port: 3000,
            path: '/api/reports',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(invalidPayload)
            }
        }, invalidPayload);

        assert('Rechazo con HTTP 400 cuando falta registro de ciudadano', resInvalid.statusCode === 400);

        // 4. Validación: Reporte con correo inválido debe fallar
        const invalidEmailPayload = JSON.stringify({
            first_name: 'Carlos',
            last_name: 'Mendoza',
            citizen_email: 'correo-invalido-sin-arroba',
            citizen_phone: '3001234567',
            title: 'Luminaria dañada',
            category: 'Alumbrado Público',
            description: 'Lámpara parpadeando',
            location: 'Bavaria',
            latitude: 11.235,
            longitude: -74.205
        });

        const resInvalidEmail = await makeRequest({
            host: 'localhost',
            port: 3000,
            path: '/api/reports',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(invalidEmailPayload)
            }
        }, invalidEmailPayload);

        assert('Rechazo con HTTP 400 cuando el correo es inválido', resInvalidEmail.statusCode === 400);

        // 5. Creación exitosa de incidencia con datos completos de ciudadano
        const validPayload = JSON.stringify({
            first_name: 'Carlos',
            last_name: 'Mendoza',
            citizen_email: 'carlos.mendoza@gmail.com',
            citizen_phone: '3009876543',
            title: 'Hueco profundo en vía principal',
            category: 'Malla Vial y Pavimentación',
            description: 'Bache vehicular que afecta el tránsito frente al parque',
            location: 'Carrera 1ra con Calle 22, Centro',
            latitude: 11.242,
            longitude: -74.211
        });

        const resValid = await makeRequest({
            host: 'localhost',
            port: 3000,
            path: '/api/reports',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(validPayload)
            }
        }, validPayload);

        assert('Creación exitosa de reporte con HTTP 201', resValid.statusCode === 201);
        const createdReport = resValid.body;
        assert('Reporte almacena nombre de ciudadano', createdReport && createdReport.citizen_name === 'Carlos Mendoza', `Valor: ${createdReport?.citizen_name}`);
        assert('Reporte almacena correo de ciudadano', createdReport && createdReport.citizen_email === 'carlos.mendoza@gmail.com', `Valor: ${createdReport?.citizen_email}`);
        assert('Reporte almacena teléfono de ciudadano', createdReport && createdReport.citizen_phone === '3009876543', `Valor: ${createdReport?.citizen_phone}`);
        assert('Reporte genera radicado oficial único', createdReport && typeof createdReport.radicado === 'string' && createdReport.radicado.startsWith('SMR-2026-'), `Radicado: ${createdReport?.radicado}`);

        const reportId = createdReport.id;

        // 6. Apoyar reporte ("Me afecta")
        const resVote = await makeRequest({
            host: 'localhost',
            port: 3000,
            path: `/api/reports/${reportId}/vote`,
            method: 'POST'
        });
        assert('Apoyo ciudadano ("Me afecta") exitoso (HTTP 200)', resVote.statusCode === 200);
        assert('Conteo de votos incrementado', resVote.body && resVote.body.votes === 1);

        // 7. Login de Administrador
        const loginPayload = JSON.stringify({ username: 'admin', password: 'santamarta2026' });
        const resLogin = await makeRequest({
            host: 'localhost',
            port: 3000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(loginPayload)
            }
        }, loginPayload);

        assert('Autenticación de Administrador (HTTP 200)', resLogin.statusCode === 200 && resLogin.body.success === true);
        const adminToken = resLogin.body.token;

        // 8. Actualizar estado operativo
        const statusPayload = JSON.stringify({ status: 'En proceso' });
        const resStatus = await makeRequest({
            host: 'localhost',
            port: 3000,
            path: `/api/reports/${reportId}/status`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(statusPayload),
                'x-admin-token': adminToken
            }
        }, statusPayload);

        assert('Actualización de Estado Operativo a "En proceso" (HTTP 200)', resStatus.statusCode === 200);
        assert('Estado verificado', resStatus.body && resStatus.body.status === 'En proceso');

        // 9. Asignar nota oficial de cuadrilla
        const notesPayload = JSON.stringify({ notes: 'Cuadrilla 04 asignada con volqueta y asfalto en frío. Inicio: 08:00 AM.' });
        const resNotes = await makeRequest({
            host: 'localhost',
            port: 3000,
            path: `/api/reports/${reportId}/notes`,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(notesPayload),
                'x-admin-token': adminToken
            }
        }, notesPayload);

        assert('Asignación de Nota de Cuadrilla (HTTP 200)', resNotes.statusCode === 200);

        // 10. Estadísticas del sistema
        const resStats = await makeRequest({ host: 'localhost', port: 3000, path: '/api/reports/stats', method: 'GET' });
        assert('Consulta de Estadísticas (HTTP 200)', resStats.statusCode === 200);
        assert('Métricas contienen total y estados válidos', resStats.body && resStats.body.total > 0 && typeof resStats.body.inProcess === 'number');

        // 11. Listar reportes y comprobar presencia de campos ciudadanos
        const resList = await makeRequest({ host: 'localhost', port: 3000, path: `/api/reports/${reportId}`, method: 'GET' });
        assert('Consulta detallada de incidencia individual (HTTP 200)', resList.statusCode === 200);
        assert('Datos de ciudadano consistentes en lectura', 
            resList.body &&
            resList.body.citizen_name === 'Carlos Mendoza' &&
            resList.body.citizen_email === 'carlos.mendoza@gmail.com' &&
            resList.body.citizen_phone === '3009876543'
        );

        // 12. Registro y Login de Ciudadano (Portal Ciudadano)
        const uniqueCitEmail = `test.ciudadano.${Date.now()}@gmail.com`;
        const citRegPayload = JSON.stringify({
            first_name: 'Ana',
            last_name: 'Paredes',
            email: uniqueCitEmail,
            phone: '3157778899',
            password: 'claveSegura2026'
        });

        const resCitReg = await makeRequest({
            host: 'localhost',
            port: 3000,
            path: '/api/auth/citizen/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(citRegPayload)
            }
        }, citRegPayload);

        assert('Registro exitoso de nuevo ciudadano (HTTP 201)', resCitReg.statusCode === 201 && resCitReg.body.success === true);

        const citLoginPayload = JSON.stringify({
            email: uniqueCitEmail,
            password: 'claveSegura2026'
        });

        const resCitLogin = await makeRequest({
            host: 'localhost',
            port: 3000,
            path: '/api/auth/citizen/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(citLoginPayload)
            }
        }, citLoginPayload);

        assert('Inicio de sesión de ciudadano exitoso (HTTP 200)', resCitLogin.statusCode === 200 && resCitLogin.body.citizen.first_name === 'Ana');

        // 13. Consultar reportes del ciudadano
        const resCitReports = await makeRequest({
            host: 'localhost',
            port: 3000,
            path: `/api/reports/citizen/${encodeURIComponent('carlos.mendoza@gmail.com')}`,
            method: 'GET'
        });
        assert('Consulta de "Mis Reportes" por correo de ciudadano (HTTP 200)', resCitReports.statusCode === 200 && Array.isArray(resCitReports.body));

    } catch (e) {
        console.error('Error durante la ejecución del test suite:', e);
        failed++;
    }

    console.log('===================================================');
    console.log(`TOTAL PRUEBAS: ${passed + failed} | APROBADAS: ${passed} | FALLIDAS: ${failed}`);
    console.log('===================================================');

    if (failed > 0) process.exit(1);
    else process.exit(0);
}

runTestSuite();

