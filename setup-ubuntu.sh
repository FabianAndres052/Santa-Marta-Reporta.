#!/bin/bash
# ==============================================================================
# Script de Instalación y Despliegue Automatizado para Ubuntu Server
# Proyecto: Santa Marta Reporta
# ==============================================================================

set -e

echo "=========================================================="
echo "    Iniciando despliegue de Santa Marta Reporta (LAN)     "
echo "=========================================================="

# 1. Actualización de paquetes
echo "[1/6] Actualizando lista de paquetes del sistema..."
sudo apt update -y

# 2. Instalación de dependencias básicas
echo "[2/6] Instalando dependencias básicas (curl, git, build-essential)..."
sudo apt install -y curl git build-essential

# 3. Instalación de Node.js v20 LTS
if ! command -v node &> /dev/null; then
    echo "[3/6] Instalando Node.js v20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "[3/6] Node.js ya se encuentra instalado ($(node -v))."
fi

# 4. Instalación de paquetes de Node
echo "[4/6] Instalando dependencias de Node.js..."
npm install

# 5. Preparación de carpetas de almacenamiento
echo "[5/6] Configurando permisos de almacenamiento (uploads)..."
mkdir -p uploads
chmod -R 775 uploads

# 6. Apertura de puerto en cortafuegos UFW
echo "[6/6] Configurando Firewall UFW para permitir el puerto 3000..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 3000/tcp || true
fi

# Obtener y mostrar la dirección IP local
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=========================================================="
echo "    ¡Instalación completada exitosamente!                "
echo "=========================================================="
echo "Para iniciar el servidor manualmente, ejecute:"
echo "    npm start"
echo ""
echo "Dirección para acceder desde cualquier dispositivo en la LAN:"
echo "    Portal Ciudadano:      http://${LOCAL_IP}:3000"
echo "    Portal Administrador:  http://${LOCAL_IP}:3000/admin.html"
echo "=========================================================="
