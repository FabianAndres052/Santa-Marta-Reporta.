# Documento de Sustentación: Santa Marta Reporta

Este documento sirve como guía para la presentación académica del proyecto "Santa Marta Reporta".

## 1. Planteamiento del Problema
En diferentes sectores de Santa Marta se presentan situaciones recurrentes que afectan la calidad de vida urbana, tales como acumulación de basuras, vías deterioradas, problemas de alumbrado, fugas de agua y deterioro de espacios públicos. Actualmente, los ciudadanos enfrentan dificultades para comunicar estas problemáticas de manera organizada a las entidades correspondientes y hacer seguimiento a su estado. 

## 2. Descripción de la Solución
"Santa Marta Reporta" es una plataforma web (Cliente-Servidor) diseñada para centralizar los reportes ciudadanos. Permite a cualquier persona registrar un problema, categorizarlo, ubicarlo y adjuntar evidencia fotográfica. Simultáneamente, ofrece una vista de administración para revisar dichos reportes y actualizar su estado, facilitando así la gestión y el seguimiento transparente.

## 3. Requerimientos

### Funcionales
- El sistema debe permitir a un ciudadano crear un reporte con categoría, descripción, ubicación y fotografía.
- El sistema debe listar públicamente los reportes registrados.
- El sistema debe permitir a un administrador visualizar todos los detalles de los reportes.
- El sistema debe permitir a un administrador cambiar el estado de un reporte (Pendiente, En proceso, Resuelto).
- El sistema debe guardar las fotografías físicamente en el servidor.

### No Funcionales
- La interfaz debe ser intuitiva y responsiva (adaptable a dispositivos móviles y escritorio).
- El sistema debe implementar una arquitectura MVC multicapa.
- El almacenamiento de datos debe persistir de manera local mediante SQLite.
- La aplicación debe ejecutarse en un entorno local (Node.js) de forma sencilla.

## 4. Arquitectura MVC Multicapa

El proyecto está diseñado bajo una arquitectura limpia separando claramente responsabilidades:

1. **Capa de Presentación (Frontend / Cliente):** Archivos estáticos (`HTML`, `CSS`, `JS`). No contiene reglas de negocio. Se comunica con el backend mediante peticiones HTTP asíncronas (`fetch`).
2. **Capa de Enrutamiento (Routes):** Recibe las peticiones HTTP (GET, POST, PUT) y las delega al controlador correspondiente.
3. **Capa de Controladores (Controllers):** Extrae la información de la petición del cliente (ej. `req.body`, `req.file`) y coordina las respuestas. Incluye el middleware `multer` para procesar la subida física de archivos.
4. **Capa de Servicios (Services):** Contiene la lógica de negocio. Valida la información antes de enviarla a la base de datos.
5. **Capa de Repositorio (Repositories):** Es la única capa autorizada para interactuar directamente con la base de datos.
6. **Base de Datos (SQLite):** Sistema de gestión de bases de datos relacional ligero, ideal para despliegue local rápido.

## 5. Comunicación Cliente-Servidor y Flujo de un Reporte

1. **Cliente:** El usuario llena el formulario HTML y hace clic en Enviar. El script `app.js` captura los datos, construye un objeto `FormData` (para enviar la imagen y los textos) y realiza un `POST` a `/api/reports`.
2. **Servidor (Express):** El Router recibe el POST. El Middleware `multer` guarda el archivo en la carpeta `uploads/`. Luego, el `reportController` toma los textos y la ruta de la imagen y los pasa al `reportService`.
3. **Persistencia:** El servicio ordena al `reportRepository` ejecutar un `INSERT INTO reports` en SQLite.
4. **Respuesta:** Tras el guardado exitoso, la API responde con un JSON y código HTTP 201 (Created).
5. **Actualización UI:** El Frontend recibe el JSON y actualiza la lista de reportes en la pantalla mediante manipulación del DOM (Vanilla JS).

## 6. Endpoints de la API REST

- `POST /api/reports`: Crea un nuevo reporte.
- `GET /api/reports`: Lista todos los reportes.
- `GET /api/reports/:id`: Detalle de un reporte.
- `PUT /api/reports/:id/status`: Actualiza el estado de un reporte.

## 7. Guion de Demostración para la Sustentación

1. **Preparación:** Mostrar la estructura de carpetas en el editor de código (VS Code) para evidenciar la separación MVC (`controllers`, `services`, `repositories`, `routes`).
2. **Ejecución:** Abrir la terminal y ejecutar `npm start`. Mostrar el mensaje "Base de datos SQLite inicializada correctamente", demostrando que no se requiere un servidor de base de datos externo.
3. **Portal Ciudadano:** Abrir `http://localhost:3000`. Mostrar el diseño responsivo (inspeccionar elemento en modo móvil).
4. **Creación de Reporte:** Llenar el formulario con datos reales, seleccionar una imagen y hacer clic en enviar.
5. **Verificación en BD / Servidor:** Mostrar cómo el reporte aparece instantáneamente en la lista. Abrir la carpeta `uploads/` en VS Code para mostrar que la foto se subió físicamente.
6. **Portal Administrador:** Abrir una nueva pestaña en `http://localhost:3000/admin.html`. Mostrar que el nuevo reporte aparece allí con estado "Pendiente".
7. **Cambio de Estado:** Cambiar el estado a "En proceso" o "Resuelto".
8. **Comprobación:** Volver a la pestaña del ciudadano y recargar, demostrando que el estado ha sido actualizado desde la base de datos (Persistencia).
