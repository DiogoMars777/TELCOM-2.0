# Diagramas de componentes por paquete

Diagramas construidos a partir de la estructura vigente del frontend React, los
controladores Laravel, los modelos y las migraciones del proyecto al 2 de
noviembre de 2026.

Cada diagrama conserva la lectura del ejemplo proporcionado:

`<<vista>>` → API REST → `<<controlador>>` ⇢ `<<tabla>>`

| Paquete | Casos de uso incluidos | Imagen | Fuente editable |
| --- | --- | --- | --- |
| P1: Seguridad y Administración | CU01–CU03 | [PNG](./p1_seguridad_administracion.png) | [PlantUML](./p1_seguridad_administracion.puml) |
| P2: Gestión de Clientes y Zonas | CU04–CU07 | [PNG](./p2_gestion_clientes_zonas.png) | [PlantUML](./p2_gestion_clientes_zonas.puml) |
| P3: Servicios y Planes | CU08, CU13–CU17 | [PNG](./p3_servicios_planes.png) | [PlantUML](./p3_servicios_planes.puml) |
| P4: Facturación y Cobranza | CU09–CU12 | [PNG](./p4_facturacion_cobranza.png) | [PlantUML](./p4_facturacion_cobranza.puml) |
| P5: Equipos, Proveedores e Inventario | CU18–CU20 | [PNG](./p5_equipos_inventario.png) | [PlantUML](./p5_equipos_inventario.puml) |
| P6: Instalaciones Técnicas | CU21–CU23 | [PNG](./p6_instalaciones_tecnicas.png) | [PlantUML](./p6_instalaciones_tecnicas.puml) |

Las tablas compartidas se muestran en todos los casos de uso que las consultan
o modifican, aunque su definición principal pertenezca a otro paquete. La tabla
`Bitacora`, por ejemplo, aparece donde el controlador registra auditoría.

## Regenerar las imágenes

Después de ajustar nombres o relaciones en el arreglo de datos del generador,
ejecutar desde la raíz del proyecto:

```powershell
pwsh -NoProfile -File .\diagramas\componentes\generar_diagramas_componentes.ps1
```

El script vuelve a producir los seis archivos PNG y sus seis fuentes PlantUML.

