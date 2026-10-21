# Santa Marta Reporta
### Proyecto de Software - Segundo Seguimiento Académico
**Plataforma Ciudadana para Reporte y Seguimiento de Incidencias Urbanas**

[![Node.js](https://img.shields.io/badge/Node.js-v20_LTS-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.2-lightgrey.svg)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-v3-blue.svg)](https://www.sqlite.org/)
[![Ubuntu](https://img.shields.io/badge/Deployment-Ubuntu_Server_LAN-orange.svg)](https://ubuntu.com/)

---

## 📌 Índice de Documentación del Proyecto

Toda la documentación técnica y académica requerida para el **2do Seguimiento** se encuentra organizada en la carpeta [`docs/`](./docs/):

1. 📄 **[Documento Académico Principal (Segundo Seguimiento)](./docs/DOCUMENTO_SEGUNDO_SEGUIMIENTO.md):**
   - Contexto de la ciudad de Santa Marta.
   - Planteamiento y formulación del problema.
   - Objetivos (General y específicos).
   - Requerimientos Funcionales (RF-01 a RF-06) y No Funcionales (RNF-01 a RNF-06).
   - Modelo de Datos: DDL SQL, Diccionario de Datos, Diagrama Entidad-Relación y Diagrama de Clases.
   - Diagramas UML: Diagrama de Casos de Uso, Diagrama de Actividades y Diagrama de Secuencia.
   - Arquitectura MVC Multicapa & Cliente-Servidor.

2. 🐧 **[Guía de Despliegue en Ubuntu Server (Red LAN Local)](./docs/GUIA_UBUNTU_SERVER_LAN.md):**
   - Instalación paso a paso de dependencias en Ubuntu Server.
   - Configuración de red LAN e IP local (`hostname -I`).
   - Reglas de firewall (`ufw allow 3000`).
   - Configuración como servicio persistente del sistema con **Systemd**.
   - Acceso desde celulares y PCs conectados a la misma red Wi-Fi o cableada.
   - Script de instalación automatizada: [`setup-ubuntu.sh`](./setup-ubuntu.sh).

3. 🎬 **[Manual de Usuario y Guión del Video Tutorial](./docs/MANUAL_Y_TUTORIAL_USUARIO.md):**
   - Manual paso a paso para el Ciudadano (Registro de reporte, adjuntar foto, consulta de estado).
   - Manual paso a paso para el Administrador (Gestión de tabla, verificación de evidencias y cambio de estados).
   - Libreto/Guión técnico por escenas con tiempos y voz en off para la grabación del video tutorial de entrega.

4. 📋 **[Requerimientos Técnicos y Dependencias](./requirements.txt):**
   - Especificación detallada de versiones de runtime, librerías y configuración de red.

---

## 🚀 Inicio Rápido en Entorno Local

### Requisitos Previos
- Tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior).
- Tener instalado Git.

### Instalación y Ejecución
1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/FabianAndres052/Santa-Marta-Reporta..git
   cd Santa-Marta-Reporta.
   ```
2. **Instalar dependencias:**
   ```bash
   npm install
   ```
3. **Iniciar el servidor:**
   ```bash
   npm start
   ```
   > Al iniciar por primera vez, el servidor inicializará automáticamente la base de datos relacional SQLite (`database.sqlite`) y el directorio físico para fotografías (`uploads/`).

4. **Acceder a los portales desde el navegador:**
   - **Portal Ciudadano (Reportar incidencias):** [http://localhost:3000](http://localhost:3000)
   - **Portal Administrador (Gestionar incidencias):** [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

---

## 🌐 Despliegue en Ubuntu Server (Red LAN)

Para correr el proyecto en un servidor Ubuntu conectado a una red de área local:
```bash
# 1. Dar permisos de ejecución al script
chmod +x setup-ubuntu.sh

# 2. Ejecutar el script automatizado
./setup-ubuntu.sh

# 3. Iniciar el servicio
npm start
```
Cualquier dispositivo en la misma red Wi-Fi podrá ingresar mediante:
- `http://<IP_DE_UBUNTU>:3000` (Portal Ciudadano)
- `http://<IP_DE_UBUNTU>:3000/admin.html` (Portal Administrador)

---

## 🏗️ Arquitectura MVC Multicapa

El proyecto sigue una separación rigurosa de responsabilidades:

```text
Santa-Marta-Reporta/
├── docs/                                  # Documentación académica y técnica (2do Seguimiento)
│   ├── DOCUMENTO_SEGUNDO_SEGUIMIENTO.md   # Documento formal con diagramas UML y modelo de datos
│   ├── GUIA_UBUNTU_SERVER_LAN.md          # Manual de instalación y montaje en Ubuntu Server LAN
│   └── MANUAL_Y_TUTORIAL_USUARIO.md       # Manual de uso y guión para el video tutorial
├── public/                                # Capa de Presentación (Frontend / Cliente)
│   ├── index.html                         # Vista del ciudadano (Formulario + Feed)
│   ├── admin.html                         # Vista de administración (Tabla interactiva)
│   ├── css/                               # Estilos visuales adaptables y responsivos
│   └── js/                                # Lógica del cliente y consumo de API (app.js, admin.js)
├── src/                                   # Capa Backend (Node.js & Express)
│   ├── config/database.js                 # Inicialización y conexión a SQLite
│   ├── controllers/reportController.js    # Manejo de peticiones y respuestas HTTP
│   ├── services/reportService.js          # Lógica y validaciones de negocio
│   ├── repositories/reportRepository.js   # Persistencia y consultas a la base de datos
│   └── routes/reportRoutes.js             # Definición de endpoints y middleware Multer
├── uploads/                               # Directorio de almacenamiento físico de fotos
├── database.sqlite                        # Archivo de base de datos relacional SQLite
├── requirements.txt                       # Ficha técnica de requerimientos y dependencias
├── setup-ubuntu.sh                        # Script automatizado de instalación en Ubuntu
├── server.js                              # Punto de entrada y servidor HTTP (0.0.0.0:3000)
└── package.json                           # Manifiesto de dependencias de Node.js
```

---

## 📡 Endpoints de la API REST

| Método | Endpoint | Descripción | Cuerpo / Parámetros |
|---|---|---|---|
| `POST` | `/api/reports` | Registra un nuevo reporte con imagen opcional | Multipart (`category`, `description`, `location`, `image`) |
| `GET` | `/api/reports` | Obtiene la lista completa de reportes ordenados cronológicamente | Ninguno |
| `GET` | `/api/reports/:id` | Retorna los detalles de un reporte específico | Parámetro `id` |
| `PUT` | `/api/reports/:id/status` | Actualiza el estado de atención de una incidencia | JSON `{ "status": "En proceso" }` |
