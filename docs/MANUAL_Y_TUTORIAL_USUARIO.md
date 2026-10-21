# Manual de Usuario y Guión Técnico del Video Tutorial
## Proyecto: Santa Marta Reporta

---

# PARTE 1: Manual de Usuario

Este manual describe el funcionamiento y la interacción con los dos módulos de la plataforma **Santa Marta Reporta**: el **Portal Ciudadano** y el **Portal Administrador**.

---

## 1. Módulo del Ciudadano (Portal Público)

### 1.1 Objetivo del Módulo
Permitir a los habitantes y visitantes de Santa Marta registrar anomalías urbanas (basuras, huecos en vías, luminarias rotas, fugas de acueducto, etc.) y consultar el estado de atención de los reportes en tiempo real.

### 1.2 Acceso
- Desde el computador o celular, abrir el navegador web e ingresar a:
  ```text
  http://localhost:3000/
  ```
  *(O usando la IP del servidor Ubuntu en la red local: `http://192.168.X.X:3000/`)*

### 1.3 Registro de un Reporte (Paso a Paso)
1. **Seleccionar Categoría:** Despliegue la lista desplegable y seleccione el tipo de problema:
   - *Malla Vial y Vías*
   - *Alumbrado Público*
   - *Basuras y Limpieza*
   - *Acueducto y Alcantarillado*
   - *Espacio Público y Parques*
   - *Otros*
2. **Indicar Ubicación:** Escriba la dirección, barrio o punto de referencia en Santa Marta (Ejemplo: *Calle 22 con Carrera 5ta, Centro Histórico* o *Barrio El Rodadero, Cra 2da*).
3. **Describir el Problema:** Redacte los detalles de la situación (Ejemplo: *Fuga constante de agua potable en el andén desde hace dos días*).
4. **Adjuntar Evidencia Fotográfica (Opcional):** Haga clic en *Examinar...* o *Seleccionar archivo* para subir una fotografía en formato `.jpg`, `.png` o `.webp` (tamaño máximo: 5 MB).
5. **Enviar:** Presione el botón **Enviar Reporte**.
6. **Confirmación:** Aparecerá una notificación verde en pantalla: *"¡Reporte enviado con éxito!"* y el nuevo reporte se posicionará automáticamente al inicio del muro público con el distintivo **Pendiente**.

### 1.4 Consulta de Reportes y Estados
En la sección inferior **"Reportes Recientes"**:
- Cada tarjeta muestra la fotografía de evidencia, la categoría, la ubicación, la fecha y hora de creación, la descripción y una insignia de color con el estado actual:
  - 🟡 **Pendiente:** Registrado por el ciudadano, en espera de revisión.
  - 🔵 **En proceso:** Asignado a cuadrilla o entidad de atención.
  - 🟢 **Resuelto:** Problemática atendida y solucionada.

---

## 2. Módulo de Administración

### 2.1 Objetivo del Módulo
Permitir a los operadores o funcionarios distritales revisar todas las incidencias recibidas, inspeccionar las evidencias y modificar el estado del reporte.

### 2.2 Acceso
- Ingresar desde el navegador web a:
  ```text
  http://localhost:3000/admin.html
  ```
  *(O usando la IP del servidor en la red local: `http://192.168.X.X:3000/admin.html`)*

### 2.3 Gestión de Incidencias en la Tabla
La tabla muestra las siguientes columnas:
1. **ID:** Número identificador correlativo.
2. **Fecha:** Día y hora en que se radicó el reporte.
3. **Categoría:** Tipo de problemática.
4. **Ubicación:** Barrio o punto de referencia.
5. **Descripción:** Resumen del problema.
6. **Evidencia:** Enlace *"Ver Foto"* que abre la imagen original en alta resolución en una pestaña nueva.
7. **Acciones (Cambio de Estado):** Un menú desplegable interactivo con las opciones:
   - `Pendiente`
   - `En proceso`
   - `Resuelto`

Al seleccionar un nuevo estado en la lista desplegable:
- Se envía automáticamente una petición asíncrona (`PUT /api/reports/:id/status`) al backend.
- Se muestra la notificación verde: *"Estado actualizado correctamente"*.
- El cambio persiste inmediatamente en la base de datos SQLite y se refleja en el portal ciudadano.

---
---

# PARTE 2: Guión Técnico para la Grabación del Video Tutorial

> **Duración recomendada:** Entre 3 y 5 minutos.  
> **Requisitos técnicos para grabar:** Grabador de pantalla (OBS Studio, Xbox Game Bar `Win + G`, o Camtasia) con audio de micrófono claro.

---

### Estructura y Libreto Escena por Escena

| Escena | Tiempo Estimado | Lo que se muestra en pantalla | Diálogo / Voz en Off (Texto a leer) |
|:---:|:---:|---|---|
| **Escena 1:**<br>Introducción y Contexto | 0:00 - 0:45 | • Portada del proyecto o diapositiva de presentación.<br>• Nombre del proyecto: **Santa Marta Reporta**.<br>• Nombres de los integrantes del equipo. | *"Cordial saludo a todos. Bienvenidos a la sustentación y tutorial de usuario de nuestra plataforma 'Santa Marta Reporta', correspondiente al segundo seguimiento del proyecto de software. Nuestro sistema tiene como objetivo ofrecer un canal ágil y transparente para que los samarios puedan reportar problemas de basuras, vías deterioradas o alumbrado, permitiendo a la administración clasificarlos y gestionarlos en tiempo real."* |
| **Escena 2:**<br>Arquitectura e Inicio del Servidor | 0:45 - 1:20 | • Terminal de comandos o VS Code.<br>• Ejecución del comando `npm start`.<br>• Mostrar la consola con la inicialización de SQLite y el puerto 3000. | *"Para poner en marcha la solución, ejecutamos en la consola el comando 'npm start'. Como podemos observar, el servidor Node.js con Express inicializa automáticamente la base de datos relacional SQLite y queda a la escucha en el puerto 3000, disponible tanto en local como a través de la red local LAN."* |
| **Escena 3:**<br>Portal Ciudadano y Envío de Reporte | 1:20 - 2:30 | • Navegador web en `http://localhost:3000/`.<br>• Mostrar el diseño responsivo.<br>• Diligenciar el formulario con una situación real (ej: 'Basuras y Limpieza', 'Cra 1ra con Calle 10 - Bahía', descripción y adjuntar una foto).<br>• Clic en **Enviar Reporte**. | *"Ingresamos al portal ciudadano. Aquí el usuario encuentra un formulario intuitivo. Seleccionamos la categoría 'Basuras y Limpieza', indicamos la ubicación en la Bahía de Santa Marta, describimos la acumulación de desechos y adjuntamos una fotografía de evidencia. Al hacer clic en 'Enviar Reporte', la imagen se guarda físicamente en el servidor, los datos se persisten en SQLite y el reporte aparece de inmediato en el muro con estado 'Pendiente'."* |
| **Escena 4:**<br>Portal Administrador y Cambio de Estado | 2:30 - 3:30 | • Abrir pestaña `http://localhost:3000/admin.html`.<br>• Localizar el reporte recién creado en la tabla.<br>• Clic en 'Ver Foto' para verificar la evidencia.<br>• Cambiar el estado de 'Pendiente' a 'En proceso' y luego a 'Resuelto'. | *"Ahora nos trasladamos al Portal de Administración. Aquí visualizamos la tabla con todas las incidencias registradas. Abrimos el enlace 'Ver Foto' para auditar la evidencia y, desde el selector de acciones, actualizamos el estado a 'En proceso'. El sistema procesa la solicitud mediante una petición HTTP asíncrona confirmando la actualización."* |
| **Escena 5:**<br>Verificación de Persistencia y Conexión LAN | 3:30 - 4:15 | • Regresar a la pestaña del ciudadano y recargar (`F5`).<br>• Mostrar el nuevo color e insignia 'En proceso' o 'Resuelto'.<br>• (Opcional) Mostrar el acceso desde un celular o segunda máquina usando la IP LAN: `http://192.168.X.X:3000`. | *"Al regresar a la vista ciudadana, observamos cómo el estado se ha actualizado en tiempo real a 'En proceso', garantizando total transparencia comunitaria. Asimismo, gracias a que el servidor escucha en la interfaz 0.0.0.0, este mismo procedimiento puede realizarse desde cualquier celular o computador conectado a la red Wi-Fi local."* |
| **Escena 6:**<br>Conclusiones y Cierre | 4:15 - 4:45 | • Pantalla final de agradecimiento con nombres de los integrantes y enlace al repositorio de GitHub. | *"En conclusión, 'Santa Marta Reporta' cumple satisfactoriamente con la arquitectura multicapa MVC, persistencia en base de datos relacional y comunicación Cliente-Servidor exigidas en este seguimiento. Muchas gracias por su atención."* |

---

## 3. Recomendaciones para la Grabación del Video
- **Resolución:** Grabe en 1080p (Full HD) a 30 o 60 fps para que el código y los textos de la interfaz se lean con nitidez.
- **Audio:** Realice una prueba previa de 10 segundos para verificar que el micrófono no tenga eco ni saturación.
- **Flujo:** Mantenga las dos pestañas del navegador abiertas (Ciudadano y Administrador) para alternar entre ellas con agilidad (`Ctrl + Tab`).
