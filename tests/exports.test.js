const fs = require('fs');
const path = require('path');

const xlsxPath = path.resolve(__dirname, '../public/js/vendor/xlsx.full.min.js');
if (!fs.existsSync(xlsxPath)) {
    console.error('ERROR: No se encuentra xlsx.full.min.js');
    process.exit(1);
}

const XLSX = require(xlsxPath);

console.log('--- TEST DE EXPORTACIÓN EXCEL (XLSX) ---');
const sampleReports = [
    {
        id: 1,
        radicado: 'SMR-2026-0001',
        created_at: '2026-11-10T14:30:00.000Z',
        category: 'Malla Vial y Pavimentación',
        location: 'Cra 1ra con Calle 22, Centro',
        latitude: 11.242,
        longitude: -74.211,
        description: 'Hueco profundo',
        status: 'En proceso',
        votes: 5,
        admin_notes: 'Cuadrilla 04 en camino',
        citizen_name: 'Carlos Mendoza',
        citizen_phone: '3009876543',
        citizen_email: 'carlos.mendoza@gmail.com'
    }
];

const dataRows = sampleReports.map(r => ({
    'No. Radicado': r.radicado,
    'ID': r.id,
    'Fecha Registro': r.created_at,
    'Ciudadano Solicitante': r.citizen_name,
    'Teléfono Contacto': r.citizen_phone,
    'Correo Electrónico': r.citizen_email,
    'Categoría': r.category,
    'Ubicación / Sector': r.location,
    'Latitud': r.latitude,
    'Longitud': r.longitude,
    'Descripción': r.description,
    'Estado Operativo': r.status,
    'Apoyos Ciudadanos': r.votes,
    'Respuesta Oficial de Cuadrilla': r.admin_notes
}));

const wb = XLSX.utils.book_new();
const wsData = XLSX.utils.json_to_sheet(dataRows);
XLSX.utils.book_append_sheet(wb, wsData, 'Incidencias_Urbanas');

const outBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
console.log(`  [PASS] Buffer de archivo Excel generado exitosamente: ${outBuffer.length} bytes`);

const parsedWb = XLSX.read(outBuffer, { type: 'buffer' });
const sheet = parsedWb.Sheets['Incidencias_Urbanas'];
const jsonData = XLSX.utils.sheet_to_json(sheet);
if (jsonData[0]['Ciudadano Solicitante'] === 'Carlos Mendoza' &&
    String(jsonData[0]['Teléfono Contacto']) === '3009876543' &&
    jsonData[0]['Correo Electrónico'] === 'carlos.mendoza@gmail.com') {
    console.log('  [PASS] Integridad de datos de ciudadano verificada en el Excel');
} else {
    console.error('  [FAIL] Discrepancia en datos del Excel:', jsonData[0]);
    process.exit(1);
}

console.log('===================================================');
console.log('PRUEBA DE EXPORTACIÓN COMPLETADA EXITOSAMENTE');
console.log('===================================================');

