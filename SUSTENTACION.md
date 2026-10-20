# Documento de Sustentación Académica: Santa Marta Reporta
### Guía Integral para la Presentación Oral del Proyecto de Software (Segundo Seguimiento)

---

## 1. Planteamiento del Problema
En la ciudad de Santa Marta, las incidencias urbanas recurrentes (acumulación de basuras en avenidas y playas, deterioro de la malla vial, luminarias apagadas y averías de alcantarillado) carecen de un canal tecnológico transparente, georreferenciado y accesible para los ciudadanos. Este proyecto ofrece una solución moderna, basada en arquitectura Cliente-Servidor y patrón MVC, que centraliza y transparenta la radicación, geolocalización y resolución de reportes.

---

## 2. Puntos Clave de Innovación y Robustez del Proyecto
Para este seguimiento, la plataforma se fortaleció con funcionalidades avanzadas:
1. **Geolocalización en Mapa Interactivo de Santa Marta (Leaflet.js):**
   - El ciudadano puede fijar el punto exacto haciendo clic en el mapa, arrastrando el marcador o utilizando el botón **GPS** de su dispositivo.
   - Pestaña de visualización cartográfica general con marcadores y popups interactivos.
2. **Apoyo Comunitario ("Me afecta este reporte"):**
   - Sistema de votación colectiva que incrementa el contador de votos (`votes`) para priorizar problemáticas con mayor afectación social.
3. **Panel de Métricas y KPIs en Tiempo Real:**
   - Contadores automáticos: Total de reportes, Pendientes, En proceso, Resueltos y Total de apoyos comunitarios.
4. **Respuesta Oficial de la Administración:**
   - El administrador no solo cambia estados, sino que registra notas oficiales de atención y cuadrillas de servicio técnico (ej. *"Cuadrilla de Essmar enviada"*), visibles para la comunidad.
5. **Auditoría y Exportación a CSV (Excel):**
   - Descarga instantánea de la base de datos de incidencias en formato CSV para reportes e informes oficiales.
6. **Búsqueda y Filtros Reactivos:**
   - Filtrado en vivo por texto (barrio o palabra clave), categoría (Vías, Basuras, Alumbrado, etc.) y estado.

---

## 3. Arquitectura del Software (MVC Multicapa)
- **Frontend (Capa de Presentación):** HTML5 semántico, CSS nativo con paleta caribeña y tokens modernos, y Vanilla JavaScript asíncrono (`fetch`), integrado con Leaflet.js para mapas.
- **Rutas (Routes):** Enrutamiento Express (`reportRoutes.js`) que delega las operaciones HTTP REST.
- **Controladores (Controllers):** `reportController.js` valida parámetros, coordina la carga física de imágenes con `Multer` y responde con códigos HTTP estándar (200, 201, 400, 404, 500).
- **Servicios (Services):** `reportService.js` aplica las reglas de negocio, validaciones de coordenadas y estados permitidos.
- **Repositorios (Repositories):** `reportRepository.js` encapsula las consultas SQL parametrizadas a la base de datos, previniendo inyecciones SQL.
- **Base de Datos (Persistencia):** SQLite3 con migración de columnas automática y almacenamiento físico en `uploads/`.

---

## 4. Endpoints de la API REST

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/reports/stats` | Retorna métricas cuantitativas para el panel de control |
| `POST` | `/api/reports` | Crea un reporte con foto opcional, coordenadas y datos |
| `GET` | `/api/reports` | Lista reportes (admite `?category=...&status=...&search=...`) |
| `GET` | `/api/reports/:id` | Consulta detallada de una incidencia |
| `PUT` | `/api/reports/:id/status` | Actualiza estado (`Pendiente`, `En proceso`, `Resuelto`) |
| `POST` | `/api/reports/:id/vote` | Incrementa el apoyo ciudadano de un reporte |
| `PUT` | `/api/reports/:id/notes` | Registra respuesta oficial administrativa |
| `DELETE` | `/api/reports/:id` | Elimina un reporte del sistema |

---

## 5. Guion Práctico para la Demostración en Vivo (Paso a Paso)

1. **Apertura y Arquitectura (1 minuto):**
   - Abrir el proyecto en el editor de código. Mostrar la estructura de carpetas `src/controllers`, `src/services`, `src/repositories`, `src/routes`, `public/` y `docs/`.
   - Explicar brevemente cómo se cumple la separación de responsabilidades MVC.

2. **Puesta en Marcha (30 segundos):**
   - Abrir la terminal y ejecutar `npm start`.
   - Señalar en la consola que la base de datos SQLite se inicializa automáticamente y el servidor queda escuchando en `0.0.0.0:3000`.

3. **Portal Ciudadano (2 minutos):**
   - Abrir en el navegador: `http://localhost:3000`.
   - **Explicar las tarjetas de métricas:** Mostrar cómo los KPIs reflejan la situación actual.
   - **Demostrar el mapa y GPS:** En el formulario, hacer clic en el mapa de Santa Marta para mover el marcador a un punto reconocido (ej. El Rodadero o Pescaíto). Presionar el botón `🎯 Mi GPS`.
   - **Radicar un reporte:**
     - Categoría: *Malla Vial y Vías*.
     - Ubicación: *Calle 22 con Cra 3ra, Centro Histórico*.
     - Descripción: *Hueco de gran profundidad en la calzada vehicular*.
     - Adjuntar una imagen de prueba mediante el dropzone.
     - Presionar **Enviar Reporte Ciudadano**.
   - Mostrar la notificación Toast y verificar cómo el reporte aparece de inmediato al inicio del muro y actualiza las métricas.
   - **Alternar a la vista de mapa:** Hacer clic en la pestaña `🗺️ Mapa de Santa Marta` y hacer clic en el marcador recién creado para mostrar el popup con la foto y descripción.
   - **Demostrar apoyo comunitario:** Hacer clic en `❤️ Me afecta` y observar cómo sube el contador de votos al instante.

4. **Portal Administrador (1.5 minutos):**
   - Ingresar a `http://localhost:3000/admin.html`.
   - Mostrar la tabla de gestión con el reporte recién creado, sus coordenadas y sus votos.
   - **Verificar la foto:** Hacer clic en `👁️ Ver Foto` para evidenciar que el archivo está almacenado físicamente en el servidor.
   - **Emitir respuesta oficial:** Hacer clic en `📝 Responder`, ingresar: *"Cuadrilla de infraestructura vial asignada para bacheo"* y guardar.
   - **Actualizar estado:** Cambiar el selector de `Pendiente` a `En proceso`.

5. **Comprobación y Cierre (1 minuto):**
   - Regresar a la pestaña del ciudadano y recargar (`F5`).
   - Mostrar cómo la tarjeta ahora tiene la insignia azul de **En proceso** y exhibe la **Respuesta Oficial de la Administración**.
   - Regresar a Administración y hacer clic en `📥 Exportar a CSV (Excel)` para mostrar el archivo descargado con toda la auditoría.
   - Concluir destacando la escalabilidad del sistema y su total independencia técnica para operar en cualquier entorno de red local LAN.
