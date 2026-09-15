# Santa Marta Reporta

Plataforma ciudadana para el reporte y seguimiento de problemáticas urbanas en Santa Marta. Este proyecto académico implementa una arquitectura MVC multicapa con comunicación Cliente-Servidor.

## Requisitos Previos

- [Node.js](https://nodejs.org/) instalado en el sistema.

## Instrucciones de Instalación y Ejecución

1. **Clonar o descargar el proyecto** y abrir una terminal en la carpeta raíz (`santa-marta-reporta`).
2. **Instalar dependencias:**
   ```bash
   npm install
   ```
3. **Ejecutar el servidor:**
   ```bash
   npm start
   ```
   > Al iniciar por primera vez, el servidor creará automáticamente la base de datos SQLite (`database.sqlite`) y las carpetas necesarias (`uploads/`).

4. **Abrir la aplicación en el navegador:**
   - **Portal Ciudadano (Crear reportes):** [http://localhost:3000](http://localhost:3000)
   - **Portal Administrador (Gestionar reportes):** [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

## Probar la API (Endpoints)

Puedes interactuar directamente con la API REST utilizando herramientas como Postman o cURL en la URL base `http://localhost:3000/api/reports`.

- `POST /api/reports` : Crea un nuevo reporte (soporta Multipart Form-Data para subir imágenes en el campo `image`).
- `GET /api/reports` : Obtiene todos los reportes registrados.
- `GET /api/reports/:id` : Obtiene el detalle de un reporte específico.
- `PUT /api/reports/:id/status` : Actualiza el estado de un reporte (recibe JSON `{ "status": "Resuelto" }`).

## Estructura del Proyecto

- `public/`: Capa de presentación Frontend (HTML, CSS, JS).
- `src/`: Capa Backend en Node.js.
  - `controllers/`: Manejan las peticiones HTTP y extraen los datos.
  - `services/`: Contienen la lógica de negocio.
  - `repositories/`: Encargados de las consultas a la base de datos (SQLite).
  - `routes/`: Definen los endpoints de la API.
- `uploads/`: Directorio donde se guardan las fotografías de los reportes.
