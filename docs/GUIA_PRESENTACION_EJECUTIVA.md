# Guía Ejecutiva de Presentación Dinámica
## Santa Marta Reporta — Sistema Distrital de Incidencias Urbanas

> **Estrategia:** Exposición visual, fluida y basada en demostración en vivo de 2 minutos.

---

### 💡 3 Reglas de Oro durante la Presentación:
1. **Contacto visual continuo:** Mira a los evaluadores el 80% del tiempo. Presenta de manera natural y conversacional.
2. **Formulario completo y ágil:** Haz clic en el mapa para geolocalizar, escribe un detalle breve y radica en tiempo real.
3. **Muestra en lugar de leer:** Señala las tarjetas de métricas (KPIs), el mapa interactivo y descarga los reportes **XLS y PDF** en vivo.

---

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TARJETA 1 (30 Segundos)                        │
│                 EL PROBLEMA Y NUESTRA PROPUESTA                        │
├────────────────────────────────────────────────────────────────────────┤
│ • Santa Marta afronta fallas en malla vial, basuras y alumbrado.       │
│ • Hoy las quejas se pierden en redes sociales sin número de radicado.  │
│ • Santa Marta Reporta conecta al ciudadano con el despacho distrital   │
│   mediante geolocalización satelital y radicado oficial.               │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TARJETA 2 (30 Segundos)                        │
│                      ARQUITECTURA Y SEGREGACIÓN                        │
├────────────────────────────────────────────────────────────────────────┤
│ • Dos portales 100% segregados:                                        │
│   - Portal Ciudadano (/) para radicación abierta y apoyo comunitario.  │
│   - Portal Administrativo (/admin) con login de funcionarios y tokens. │
│ • Patrón MVC multicapa estricto: Rutas, Controladores, Servicios,      │
│   Repositorios SQL y SQLite3 con migraciones automáticas.              │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TARJETA 3 (60 Segundos)                        │
│                         DEMOSTRACIÓN EN VIVO                           │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Portal Ciudadano: Presionar "🚀 Caso Demo" -> Clic en Radicar.      │
│ 2. Mostrar la Línea de Vida Visual (1. Radicado -> 2. Cuadrilla ->     │
│    3. Resuelto) y descargar el Comprobante PDF de Radicación.          │
│ 3. Ir a /admin: Iniciar sesión (admin / santamarta2026).               │
│ 4. Asignar cuadrilla ("Nota Oficial"), actualizar estado a En proceso. │
│ 5. Clic en "Exportar XLS (Excel)" y "Exportar PDF (Oficial)".          │
└────────────────────────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TARJETA 4 (20 Segundos)                        │
│                           CIERRE E IMPACTO                             │
├────────────────────────────────────────────────────────────────────────┤
│ • Proyecto listo para operar en servidor Ubuntu Server en red LAN.     │
│ • Cumple con auditoría institucional, exportación enriquecida y        │
│   segregación total de perfiles de usuario.                            │
└────────────────────────────────────────────────────────────────────────┘
```

---

### ⏱️ Cronómetro de la Sustentación (Tiempo Total: 2:20 min)

| Minuto | Acción del Expositor / Ponente | Lo que debe mostrar en pantalla |
|---|---|---|
| **0:00 - 0:30** | Saludo y problema central | Abrir navegador en `http://localhost:3000` (Portal Ciudadano) |
| **0:30 - 1:00** | Radicar reporte y línea de vida | Diligenciar datos de ciudadano -> Radicar -> Abrir modal con la línea de vida y PDF |
| **1:00 - 1:40** | Portal Admin y despacho | Entrar a `/admin` -> Login con funcionario institucional -> Asignar cuadrilla |
| **1:40 - 2:05** | Demostración de XLS y PDF | Clic en **Exportar XLS** y **Exportar PDF** y abrir los archivos generados |
| **2:05 - 2:20** | Cierre de arquitectura | Destacar el desacoplamiento MVC, base de datos SQLite y servidor listo para Nginx y AWS |

