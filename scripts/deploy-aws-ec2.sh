#!/usr/bin/env bash
# ==============================================================================
# Script de Despliegue Automatizado para AWS EC2 (Ubuntu 22.04 / 24.04 LTS)
# Proyecto: Santa Marta Reporta
# ==============================================================================

set -euo pipefail

echo "=========================================================="
echo "🚀 INICIANDO DESPLIEGUE EN AWS EC2 - SANTA MARTA REPORTA"
echo "=========================================================="

APP_DIR="/var/www/santa-marta-reporta"
LOG_DIR="/var/log/santa-marta-reporta"

# 1. Actualización de paquetes del sistema
echo "📦 1. Actualizando paquetes del sistema..."
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl wget git build-essential ufw nginx sqlite3

# 2. Instalación de Node.js 20 LTS (si no está instalado)
if ! command -v node &> /dev/null; then
    echo "📦 2. Instalando Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js ya se encuentra instalado: $(node -v)"
fi

# 3. Instalación global de PM2
echo "📦 3. Instalando PM2 Process Manager..."
sudo npm install -g pm2

# 4. Preparar directorios de aplicación y logs
echo "📁 4. Configurando estructura de directorios..."
sudo mkdir -p "$APP_DIR"
sudo mkdir -p "$APP_DIR/uploads"
sudo mkdir -p "$LOG_DIR"
sudo chown -R $USER:$USER "$APP_DIR"
sudo chown -R $USER:$USER "$LOG_DIR"

# 5. Si el script se ejecuta dentro del repositorio local, copiar archivos
if [ -f "./server.js" ]; then
    echo "📂 5. Copiando código fuente local a $APP_DIR..."
    rsync -av --exclude 'node_modules' --exclude '.git' --exclude '*.log' ./ "$APP_DIR/"
fi

# 6. Instalar dependencias de producción
echo "⚙️ 6. Instalando dependencias de Node.js en $APP_DIR..."
cd "$APP_DIR"
npm install --production

# Asegurar permisos en uploads y base de datos
chmod 775 "$APP_DIR/uploads"
touch "$APP_DIR/database.sqlite"
chmod 664 "$APP_DIR/database.sqlite"

# 7. Configuración de Nginx
echo "🌐 7. Configurando Nginx Reverse Proxy..."
if [ -f "$APP_DIR/nginx/santa-marta-reporta.conf" ]; then
    sudo cp "$APP_DIR/nginx/santa-marta-reporta.conf" /etc/nginx/sites-available/santa-marta-reporta
    sudo ln -sf /etc/nginx/sites-available/santa-marta-reporta /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t
    sudo systemctl reload nginx
    echo "✅ Nginx configurado y recargado con éxito."
fi

# 8. Configurar Firewall UFW
echo "🛡️ 8. Configurando reglas de firewall (UFW)..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable || true

# 9. Iniciar / Recargar la aplicación con PM2
echo "🚀 9. Iniciando aplicación con PM2..."
cd "$APP_DIR"
if pm2 describe santa-marta-reporta > /dev/null 2>&1; then
    pm2 reload ecosystem.config.js --update-env
else
    pm2 start ecosystem.config.js
fi

pm2 save
# Configurar PM2 para inicio automático en boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER || true

# 10. Verificación de salud
echo "🩺 10. Verificando estado del servicio..."
sleep 2
if curl -s http://127.0.0.1:3000/api/reports/stats | grep -q "total"; then
    echo "=========================================================="
    echo "✅ ¡DESPLIEGUE EN AWS COMPLETADO CON ÉXITO!"
    echo "=========================================================="
    echo "🌐 Portal Ciudadano:       http://$(curl -s http://checkip.amazonaws.com || echo 'TU-IP-AWS')/"
    echo "🛡️  Portal Administración:  http://$(curl -s http://checkip.amazonaws.com || echo 'TU-IP-AWS')/admin"
    echo "📊 Estado PM2:             pm2 status"
    echo "📝 Logs en vivo:           pm2 logs santa-marta-reporta"
    echo "=========================================================="
else
    echo "⚠️ La aplicación inició pero el endpoint de salud no respondió como se esperaba. Revisa los logs con: pm2 logs"
fi

