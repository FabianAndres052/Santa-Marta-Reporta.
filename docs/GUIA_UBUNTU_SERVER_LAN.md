# Guía Técnica: Despliegue en Ubuntu Server en Red LAN Local
## Proyecto: Santa Marta Reporta

Esta guía técnica explica paso a paso cómo montar, configurar y ejecutar el proyecto **Santa Marta Reporta** en un servidor con **Ubuntu Server** dentro de una **Red de Área Local (LAN)**, permitiendo que cualquier computador, tablet o celular conectado al mismo Wi-Fi o red cableada pueda acceder a la plataforma.

---

## 1. Requisitos Previos

- Máquina física o máquina virtual con **Ubuntu Server 20.04 LTS, 22.04 LTS o 24.04 LTS**.
- Conexión a la red local (Ethernet o Wi-Fi) en el mismo segmento de red que los dispositivos clientes.
- Usuario con permisos de superusuario (`sudo`).

---

## 2. Paso a Paso de Instalación y Montaje

### Paso 1: Actualizar el Sistema
Abra la terminal de Ubuntu Server y ejecute:
```bash
sudo apt update && sudo apt upgrade -y
```

### Paso 2: Instalar Git, Curl y Herramientas Esenciales
```bash
sudo apt install -y git curl build-essential
```

### Paso 3: Instalar Node.js (Versión LTS recomendada: v20.x o v22.x)
Descargue e instale el repositorio oficial de NodeSource:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Compruebe las versiones instaladas:
```bash
node -v   # Debe responder v20.x.x
npm -v    # Debe responder v10.x.x
```

---

## 3. Descarga y Preparación del Proyecto

### Paso 4: Clonar el Repositorio de GitHub
Ubíquese en el directorio de aplicaciones (por ejemplo, en su carpeta personal o en `/var/www/`):
```bash
cd ~
git clone https://github.com/FabianAndres052/Santa-Marta-Reporta..git
cd Santa-Marta-Reporta.
```

### Paso 5: Instalar Dependencias de Node.js
```bash
npm install
```

### Paso 6: Configurar Permisos para Almacenamiento Físico y SQLite
Asegúrese de que el servidor tenga permisos para crear la base de datos `database.sqlite` y la carpeta `uploads/`:
```bash
mkdir -p uploads
chmod 775 uploads
```

---

## 4. Configuración de Red LAN y Firewall (UFW)

### Paso 7: Averiguar la Dirección IP Local de Ubuntu Server
Para que los demás dispositivos de la red LAN puedan ingresar, necesita la dirección IP del servidor en la red:
```bash
hostname -I
```
*O también:*
```bash
ip -4 addr show | grep inet
```
> **Ejemplo de resultado:** `192.168.1.45` o `192.168.0.12`. Esta es la **IP_UBUNTU**.

### Paso 8: Habilitar el Puerto 3000 en el Firewall de Ubuntu
Si tiene activado `ufw`, permita las conexiones entrantes en el puerto 3000:
```bash
sudo ufw allow 3000/tcp
sudo ufw reload
sudo ufw status
```

---

## 5. Ejecución del Servidor

### Opción A: Ejecución Directa en Primer Plano (Para pruebas)
```bash
npm start
```
Verá en consola:
```text
Base de datos SQLite inicializada correctamente.
Servidor de Santa Marta Reporta iniciado en http://localhost:3000
También puedes intentar acceder desde http://127.0.0.1:3000
```
*(Para detenerlo presione `Ctrl + C`).*

---

### Opción B: Ejecución en Segundo Plano con Systemd (Recomendado para Producción)

Para que el servidor se mantenga activo aunque cierre la sesión SSH y se inicie automáticamente si se reinicia la máquina:

1. Cree un archivo de servicio en systemd:
```bash
sudo nano /etc/systemd/system/santamarta.service
```

2. Pegue la siguiente configuración (ajuste `tu_usuario` con el nombre de usuario de su Ubuntu):
```ini
[Unit]
Description=Servidor Santa Marta Reporta
After=network.target

[Service]
Type=simple
User=tu_usuario
WorkingDirectory=/home/tu_usuario/Santa-Marta-Reporta.
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

3. Guarde el archivo (`Ctrl + O`, luego `Enter`, luego `Ctrl + X` en nano).

4. Habilite e inicie el servicio:
```bash
sudo systemctl daemon-reload
sudo systemctl enable santamarta
sudo systemctl start santamarta
```

5. Verifique el estado:
```bash
sudo systemctl status santamarta
```

---

## 6. Acceso desde Dispositivos en la Red LAN

Desde cualquier dispositivo (computador, laptop o teléfono móvil) conectado a la misma red Wi-Fi o cableada:

1. **Portal Ciudadano (Reportar incidencias):**
   ```text
   http://<IP_UBUNTU>:3000/
   Ejemplo: http://192.168.1.45:3000/
   ```

2. **Portal Administrador (Gestionar estados):**
   ```text
   http://<IP_UBUNTU>:3000/admin.html
   Ejemplo: http://192.168.1.45:3000/admin.html
   ```

---

## 7. Solución de Problemas Frecuentes en LAN

| Problema | Causa Probable | Solución |
|---|---|---|
| **No carga desde otro computador/celular** | Firewall bloqueando el puerto 3000 | Ejecute `sudo ufw allow 3000/tcp`. |
| **Los dispositivos no están en la misma red** | El celular está usando datos móviles o una red Wi-Fi de invitados | Conecte ambos dispositivos a la misma red Wi-Fi/LAN principal. |
| **Error al subir imágenes en Ubuntu** | Permisos insuficientes en la carpeta `uploads/` | Ejecute `chmod -R 775 uploads/` dentro de la carpeta del proyecto. |
| **El puerto 3000 ya está ocupado** | Otro proceso está usando el puerto | Identifique el proceso con `sudo lsof -i :3000` o ejecute en otro puerto con `PORT=4000 npm start`. |
