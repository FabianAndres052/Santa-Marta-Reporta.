# Documento de Sustentación Académica: Santa Marta Reporta
### Guía Integral para la Presentación del Proyecto de Software
**Sistema:** Santa Marta Reporta — Sistema Distrital de Incidencias Urbanas  

---

## 1. Planteamiento del Problema
En la ciudad de Santa Marta, las incidencias urbanas recurrentes (acumulación de basuras en avenidas y playas, deterioro de la malla vial, luminarias apagadas y averías de alcantarillado) carecen de un canal tecnológico transparente, georreferenciado y accesible para los ciudadanos. Este proyecto ofrece una solución moderna, basada en arquitectura Cliente-Servidor y patrón MVC, que centraliza y transparenta la radicación, geolocalización y resolución de reportes.

---

## 2. Puntos Clave de Innovación y Robustez del Proyecto
Para este seguimiento, la plataforma se fortaleció con funcionalidades avanzadas atendiendo los requerimientos del jurado:

1. **Segregación Total de Portales (Ciudadano vs. Administrativo):**
   - **Portal Ciudadano (`/` o `/ciudadano`):** Enfocado 100% en la comunidad (radicar, ubicar en mapa, votar apoyo social y consultar línea de vida del radicado).
   - **Portal Administrativo (`/admin`):** Con barrera de autenticación institucional de funcionarios (`admin` / `santamarta2026`), perfil de usuario activo y protección de operaciones en backend.

2. **Generación de Reportes Oficiales en XLS y PDF:**
   - **Exportación XLS (Excel .xlsx):** Generación automática de libro de cálculo con hoja de detalle (con anchos de columna autoajustados) y hoja de resumen estadístico de KPIs por categoría.
   - **Exportación PDF Oficial (Membrete Alcaldía de Santa Marta):** Informe consolidado en formato apaisado con métricas de gestión, tabla de incidencias formateada por colores de estado y pie de página de auditoría distrital.
   - **Ficha Técnica Individual PDF:** Comprobante de radicación descargable tanto por el ciudadano como por el funcionario con código único `SMR-2026-XXXX`.

3. **Trazabilidad Visual (Línea de Vida - Cero Lectura Densa):**
   - Stepper interactivo de 3 fases (1. Radicado ➔ 2. Cuadrilla en camino ➔ 3. Solucionado) que comunica el ciclo de vida del reporte en un segundo sin exigir lectura de párrafos.

4. **Botón de Carga Rápida ("🚀 Caso Demo"):**
   - Para agilizar la demostración oral, un solo clic rellena y geolocaliza un caso real en el Centro Histórico de Santa Marta, permitiendo una sustentación fluida y profesional.

5. **Geolocalización en Mapa Interactivo de Santa Marta (Leaflet.js):**
   - Fijación de puntos por clic, arrastre o GPS con geocodificación inversa de barrios.

6. **Apoyo Comunitario ("Me afecta este reporte"):**
   - Sistema de votación colectiva que incrementa el contador de votos (`votes`) para priorizar problemáticas con mayor afectación social.

7. **Panel de Métricas y KPIs en Tiempo Real:**
   - Contadores automáticos: Total de reportes, Pendientes, En proceso, Resueltos y Total de apoyos comunitarios.

8. **Respuesta Oficial de la Administración:**
   - Registro de notas de cuadrilla de servicio técnico (ej. *"Cuadrilla de Essmar enviada"*), visibles en tiempo real para la comunidad.

---

## 3. Arquitectura del Software (MVC Multicapa)
- **Frontend (Capa de Presentación):** HTML5 semántico, CSS nativo con paleta caribeña y tokens modernos, y Vanilla JavaScript asíncrono (`fetch`), integrado con Leaflet.js, SheetJS (XLSX) y jsPDF con AutoTable.
- **Rutas (Routes):** Enrutamiento Express (`reportRoutes.js`, `authRoutes.js`) que delega las operaciones HTTP REST y valida sesiones administrativas.
- **Controladores (Controllers):** `reportController.js` y `authController.js` validan parámetros, autentican credenciales, coordinan la carga física de imágenes con `Multer` y responden con códigos HTTP estándar (200, 201, 400, 401, 404, 500).
- **Servicios (Services):** `reportService.js` aplica las reglas de negocio, validaciones de coordenadas y estados permitidos.
- **Repositorios (Repositories):** `reportRepository.js` encapsula las consultas SQL parametrizadas a la base de datos, previniendo inyecciones SQL.
- **Base de Datos (Persistencia):** SQLite3 con migración de columnas automática y almacenamiento físico en `uploads/`.

---

## 4. Endpoints de la API REST

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/login` | Público | Autentica funcionario distrital y emite token |
| `GET` | `/api/auth/verify` | Admin | Valida la sesión activa del funcionario |
| `GET` | `/api/reports/stats` | Público | Métricas cuantitativas para los paneles de control |
| `POST` | `/api/reports` | Ciudadano | Radica un reporte con foto opcional, coordenadas y datos |
| `GET` | `/api/reports` | Público | Lista reportes (admite `?category=...&status=...&search=...`) |
| `GET` | `/api/reports/:id` | Público | Consulta detallada de una incidencia |
| `POST` | `/api/reports/:id/vote` | Ciudadano | Incrementa el apoyo comunitario de un reporte |
| `PUT` | `/api/reports/:id/status` | Protegido Admin | Actualiza estado (`Pendiente`, `En proceso`, `Resuelto`) |
| `PUT` | `/api/reports/:id/notes` | Protegido Admin | Registra respuesta oficial administrativa / cuadrilla |
| `DELETE` | `/api/reports/:id` | Protegido Admin | Elimina un reporte del sistema |

---

## 5. Guion Práctico para la Demostración en Vivo (Paso a Paso - 2 Minutos)

1. **Puesta en Marcha (15 segundos):**
   - Ejecutar `npm start`.
   - Señalar en la consola que la base de datos SQLite se inicializa automáticamente y los portales quedan disponibles:
     - Portal Ciudadano: `http://localhost:3000`
     - Portal Administrativo: `http://localhost:3000/admin`

2. **Demostración Portal Ciudadano (45 segundos):**
   - Abrir `http://localhost:3000`.
   - Presionar el botón **"🚀 Caso Demo"** en el formulario (se autorrellenan coordenadas y dirección en el Centro Histórico de Santa Marta).
   - Presionar **"Radicar Reporte Ciudadano"**.
   - Mostrar el modal de confirmación con la **Línea de Vida Visual** y hacer clic en **"Descargar Comprobante (PDF)"** para enseñar el recibo formal con folio oficial.

3. **Demostración Portal Administrativo y Segregación (45 segundos):**
   - Ingresar a `http://localhost:3000/admin`.
   - Mostrar la pantalla de **Acceso Restringido** (Login Institucional).
   - Iniciar sesión: Usuario `admin` / Clave `santamarta2026`.
   - En el panel:
     - Cambiar el estado a **"En proceso"**.
     - Clic en **"Cuadrilla"** e ingresar: *"Cuadrilla de Essmar y Malla Vial despachada"*.
     - Clic en **"Exportar XLS (Excel)"** y abrir el archivo Excel generado.
     - Clic en **"Exportar PDF (Oficial)"** y abrir el documento con membrete distrital.

4. **Comprobación y Cierre (15 segundos):**
   - Volver a la pestaña ciudadana, recargar y mostrar cómo el reporte pasó a fase "En proceso" con la respuesta oficial visible para toda la comunidad.
   - Destacar la portabilidad y capacidad del sistema para operar en **Ubuntu Server LAN**.
