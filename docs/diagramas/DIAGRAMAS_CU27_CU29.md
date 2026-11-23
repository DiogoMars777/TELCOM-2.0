# Especificación y Modelado UML: CU27 y CU29 (TELCOM)

Documento técnico de análisis y diseño con **Diagramas de Comunicación**, **Análisis de Clases (Boundary-Control-Entity)** y **Diagramas de Secuencia** para los Casos de Uso **CU27** y **CU29**, modelados bajo la metodología y estándares de Enterprise Architect (EA) conforme al esquema de base de datos y código fuente del sistema **TELCOM**.

Archivos generados en `docs/diagramas/`:
- **CU27:**
  - **Imágenes PNG:** [CU27_Diagrama_Comunicacion.png](CU27_Diagrama_Comunicacion.png) | [CU27_Analisis_Clases.png](CU27_Analisis_Clases.png) | [CU27_Diagrama_Secuencia.png](CU27_Diagrama_Secuencia.png)
  - **Vectores / HTML:** [CU27_Diagrama_Comunicacion.html](CU27_Diagrama_Comunicacion.html) | [CU27_Analisis_Clases.html](CU27_Analisis_Clases.html) | [CU27_Diagrama_Secuencia.html](CU27_Diagrama_Secuencia.html)
- **CU29:**
  - **Imágenes PNG:** [CU29_Diagrama_Comunicacion.png](CU29_Diagrama_Comunicacion.png) | [CU29_Analisis_Clases.png](CU29_Analisis_Clases.png) | [CU29_Diagrama_Secuencia.png](CU29_Diagrama_Secuencia.png)
  - **Vectores / HTML:** [CU29_Diagrama_Comunicacion.html](CU29_Diagrama_Comunicacion.html) | [CU29_Analisis_Clases.html](CU29_Analisis_Clases.html) | [CU29_Diagrama_Secuencia.html](CU29_Diagrama_Secuencia.html)

---

# PARTE 1: CU27 &mdash; GENERAR Y EXPORTAR REPORTES TRADICIONALES

## 1.1 Diagrama de Comunicación &mdash; CU27

![Diagrama de Comunicación CU27](CU27_Diagrama_Comunicacion.png)

En este diagrama se observan las instancias participantes y la secuencia de mensajes numerados por flujo, reflejando estrictamente los métodos existentes en el código:

### Flujos y Mensajes:
1. **Flujo 1: Consultar catálogo de reportes y parámetros de filtrado**
   - `1: consultarCatalogoReportes() ->` (Administrador &rarr; `UI_ReporteTradicional`)
   - `1.1: catalogo() ->` (`UI_ReporteTradicional` &rarr; `ReporteTradicionalController`)
   - `1.2: catalogo() ->` (`ReporteTradicionalController` &rarr; `ReporteTradicional`)
   - `1.3: cargarParametrosFiltros() ->` (Administrador &rarr; `UI_ReporteTradicional`)
   - `1.4: parametros() ->` (`UI_ReporteTradicional` &rarr; `ReporteTradicionalController`)
   - `1.5: query()->select()->get() ->` (`ReporteTradicionalController` &rarr; `Zona`)
2. **Flujo 2: Generar consulta consolidada y auditoría**
   - `2: generarReporte(tipo, filtros) ->` (Administrador &rarr; `UI_ReporteTradicional`)
   - `2.1: generar(Request) ->` (`UI_ReporteTradicional` &rarr; `ReporteTradicionalController`)
   - `2.2: generar(tipo, filtros) ->` (`ReporteTradicionalController` &rarr; `ReporteTradicional`)
   - `2.3.1: table('Cliente')->leftJoin()->get() ->` (`ReporteTradicional` &rarr; `Cliente`)
   - `2.3.2: table('Pago')->join()->whereBetween()->get() ->` (`ReporteTradicional` &rarr; `Pago`)
   - `2.3.3: table('Mensualidad')->whereIn()->get() ->` (`ReporteTradicional` &rarr; `Mensualidad`)
   - `2.4: log('CU27', 'GENERAR_REPORTE', detalle) ->` (`ReporteTradicionalController` &rarr; `Bitacora`)
3. **Flujo 3: Exportar reporte a Excel (CSV con BOM)**
   - `3: exportarAExcel() ->` (Administrador &rarr; `UI_ReporteTradicional`)
   - `3.1: exportarExcel(Request) ->` (`UI_ReporteTradicional` &rarr; `ReporteTradicionalController`)
   - `3.2: generar(tipo, filtros) ->` (`ReporteTradicionalController` &rarr; `ReporteTradicional`)
   - `3.3: log('CU27', 'EXPORTAR_EXCEL', detalle) ->` (`ReporteTradicionalController` &rarr; `Bitacora`)
4. **Flujo 4: Exportar reporte a PDF oficial**
   - `4: exportarAPdf() ->` (Administrador &rarr; `UI_ReporteTradicional`)
   - `4.1: exportarPdf(Request) ->` (`UI_ReporteTradicional` &rarr; `ReporteTradicionalController`)
   - `4.2: generar(tipo, filtros) ->` (`ReporteTradicionalController` &rarr; `ReporteTradicional`)
   - `4.3: log('CU27', 'EXPORTAR_PDF', detalle) ->` (`ReporteTradicionalController` &rarr; `Bitacora`)

```mermaid
flowchart LR
    Admin["Administrador\n(Actor)"]
    UI["UI_ReporteTradicional\n(Boundary)"]
    Ctrl["ReporteTradicionalController\n(Control)"]
    Dom["ReporteTradicional\n(Dominio)"]
    Bit["Bitacora\n(Entity)"]
    Zon["Zona\n(Entity)"]
    Cli["Cliente\n(Entity)"]
    Pag["Pago\n(Entity)"]
    Men["Mensualidad\n(Entity)"]

    Admin -- "1: consultarCatalogo()\n2: generarReporte()\n3: exportarAExcel()\n4: exportarAPdf()" --> UI
    UI -- "1.1: catalogo()\n1.4: parametros()\n2.1: generar(Request)\n3.1: exportarExcel(Request)\n4.1: exportarPdf(Request)" --> Ctrl
    Ctrl -- "1.2: catalogo()\n2.2: generar(tipo, filtros)\n3.2: generar(tipo, filtros)\n4.2: generar(tipo, filtros)" --> Dom
    Ctrl -- "1.5: select()->get()" --> Zon
    Ctrl -- "2.4, 3.3, 4.3: log(modulo, accion, ...)" --> Bit
    Dom -- "2.3.1: leftJoin()->get()" --> Cli
    Dom -- "2.3.2: whereBetween()->get()" --> Pag
    Dom -- "2.3.3: whereIn()->get()" --> Men
```

---

## 1.2 Diagrama de Análisis de Clases &mdash; CU27

![Análisis de Clases CU27](CU27_Analisis_Clases.png)

Estructura de clases con estereotipos BCE (Boundary, Control, Entity), tipos de datos según el modelo de datos de TELCOM y métodos extraídos del código:

```mermaid
classDiagram
    direction LR

    class UI_ReporteTradicional {
        +consultarCatalogo(): void
        +seleccionarTipoReporte(tipo): void
        +cambiarFiltro(key, value): void
        +limpiarFiltros(): void
        +handleGenerarReporte(): void
        +handleExportarExcel(): void
        +handleExportarPdf(): void
        +previsualizarImpresion(): void
        +dispararImpresion(): void
    }

    class ReporteTradicionalController {
        +catalogo(): JsonResponse
        +parametros(): JsonResponse
        +generar(Request): JsonResponse
        +exportarExcel(Request): StreamedResponse
        +exportarPdf(Request): JsonResponse
    }

    class ReporteTradicional {
        +TIPO_CLIENTES_ZONA: string
        +TIPO_INGRESOS_PAGOS: string
        +TIPO_MOROSIDAD_CORTES: string
        +TIPO_EQUIPOS_INSTAL: string
        +catalogo(): array
        +generar(tipo, filtros): array
        -generarClientesZona(filtros): array
        -generarIngresosPagos(filtros): array
        -generarMorosidadCortes(filtros): array
        -generarEquiposInstalaciones(filtros): array
    }

    class Cliente {
        -idCliente: int
        -codigoCliente: string
        -ci: string
        -nombreCompleto: string
        -telefonoPrincipal: string
        -email: string
        -estadoCliente: string
        -idZona: int
        +leftJoin(): void
        +where(): void
        +select(): void
    }

    class Zona {
        -idZona: int
        -nombreZona: string
        -codigo: string
        -descripcion: string
        -estado: string
        +select(): void
        +get(): void
    }

    class Pago {
        -idPago: int
        -fechaHora: timestamp
        -montoTotal: decimal
        -numeroComprobante: string
        -observacion: string
        -idMetodoPago: int
        -idUsuario: int
        +join(): void
        +whereBetween(): void
        +sum(): void
    }

    class MetodoPago {
        -idMetodoPago: int
        -nombreMetodo: string
        -descripcion: string
        -estado: string
        +select(): void
        +get(): void
    }

    class Mensualidad {
        -idMensualidad: int
        -periodo: string
        -fechaVencimiento: date
        -monto: decimal
        -estado: string
        -idServicio: int
        +whereIn(): void
        +get(): void
    }

    class Equipo {
        -idEquipo: int
        -numeroSerie: string
        -mac: string
        -ipAsignada: string
        -propiedad: string
        -estadoEquipo: string
        -idProducto: int
        +join(): void
        +get(): void
    }

    class Bitacora {
        -idBitacora: int
        -fechaHora: timestamp
        -accion: string
        -modulo: string
        -descripcion: string
        -ipUsuario: string
        -idUsuario: int
        +create(): void
        +log(): void
    }

    UI_ReporteTradicional --> ReporteTradicionalController : invoca
    ReporteTradicionalController --> ReporteTradicional : genera
    ReporteTradicionalController --> Bitacora : registra auditoria (1 a 0..*)
    ReporteTradicional --> Cliente : consulta (1 a 0..*)
    Cliente --> Zona : pertenece a (0..* a 1)
    ReporteTradicional --> Pago : consolida (1 a 0..*)
    Pago --> MetodoPago : utiliza (0..* a 1)
    ReporteTradicional --> Mensualidad : evalua mora (1 a 0..*)
    ReporteTradicional --> Equipo : audita comodatos (1 a 0..*)
```

---

## 1.3 Diagrama Secuencial &mdash; CU27

![Diagrama Secuencial CU27](CU27_Diagrama_Secuencia.png)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrador
    participant UI as UI_ReporteTradicional
    participant Ctrl as ReporteTradicionalController
    participant Dom as ReporteTradicional
    participant DB as Cliente / Pago / Zona
    participant Bit as Bitacora

    %% Flujo 1
    rect rgb(240, 248, 255)
    Note over Admin, Bit: alt Flujo 1: Consultar catálogo y parámetros de filtrado
    Admin->>UI: 1: consultarCatalogoReportes()
    UI->>Ctrl: 1.1: catalogo()
    Ctrl->>Dom: 1.2: catalogo(): array
    Dom-->>Ctrl: ($catalogoDisponibles)
    UI->>Ctrl: 1.3: parametros()
    Ctrl->>DB: 1.4: Zona::select()->get(), MetodoPago::select()->get()
    DB-->>Ctrl: ($zonas, $metodos, $estados)
    Ctrl-->>UI: success({catalogo, parametros})
    UI-->>Admin: mostrarCatalogoYFormularioFiltros()
    end

    %% Flujo 2
    rect rgb(255, 245, 245)
    Note over Admin, Bit: alt Flujo 2: Generar y visualizar reporte consolidado
    Admin->>UI: 2: generarReporte(tipo, filtros)
    UI->>Ctrl: 2.1: generar(Request $request)
    Ctrl->>Ctrl: validate(filtros)
    Ctrl->>Dom: 2.2: generar($tipo, $filtros): array
    Dom->>DB: 2.3: table('Cliente')->leftJoin()->where()->get() / Pago::whereBetween()
    DB-->>Dom: ($registrosFiltrados)
    Dom-->>Ctrl: return {titulo, registros, kpis, subtipo}
    Ctrl->>Bit: 2.4: AuditLogger::log('CU27', 'GENERAR_REPORTE', ...)
    Ctrl-->>UI: success($reporte, 'Reporte generado exitosamente.')
    UI-->>Admin: renderizarTablaResultadosYTarjetasKPI()
    end

    %% Flujo 3
    rect rgb(245, 255, 245)
    Note over Admin, Bit: alt Flujo 3: Exportar reporte a formato Excel (CSV)
    Admin->>UI: 3: exportarAExcel()
    UI->>Ctrl: 3.1: exportarExcel(Request $request)
    Ctrl->>Dom: 3.2: generar($tipo, $filtros)
    Dom-->>Ctrl: ($datosReporte)
    Ctrl->>Bit: 3.3: AuditLogger::log('CU27', 'EXPORTAR_EXCEL', ...)
    Ctrl-->>UI: response()->streamDownload(callback, "TELCOM_Reporte_*.csv")
    UI-->>Admin: descargarArchivoBinarioCSV()
    end

    %% Flujo 4
    rect rgb(250, 245, 255)
    Note over Admin, Bit: alt Flujo 4: Exportar reporte a PDF e impresión oficial
    Admin->>UI: 4: exportarAPdf()
    UI->>Ctrl: 4.1: exportarPdf(Request $request)
    Ctrl->>Dom: 4.2: generar($tipo, $filtros)
    Dom-->>Ctrl: ($datosReporte)
    Ctrl->>Bit: 4.3: AuditLogger::log('CU27', 'EXPORTAR_PDF', ...)
    Ctrl-->>UI: success({reporte, titulo, empresa, nit, direccion})
    UI-->>Admin: abrirVistaPreviaImprimible() / window.print()
    end
```

---

# PARTE 2: CU29 &mdash; CAPTURAR Y TRANSCRIBIR COMANDOS DE VOZ

## 2.1 Diagrama de Comunicación &mdash; CU29

![Diagrama de Comunicación CU29](CU29_Diagrama_Comunicacion.png)

### Flujos y Mensajes:
1. **Flujo 1: Captura de voz, Speech-to-Text y procesamiento NLP**
   - `1: activarMicrofonoYDictar() ->` (Administrador &rarr; `UI_ComandoVoz`)
   - `1.1: WebSpeechRecognition.start() ->` (`UI_ComandoVoz` &rarr; Web Speech API)
   - `1.2: transcribir(Request) ->` (`UI_ComandoVoz` &rarr; `ComandoVozController`)
   - `1.3: interpretar(texto): array ->` (`ComandoVozController` &rarr; `ComandoVoz`)
   - `1.4: table('Zona')->where()->first() ->` (`ComandoVoz` &rarr; `Zona`)
   - `1.5: create([idUsuario, textoDictado, intencion, parametros, ...]) ->` (`ComandoVozController` &rarr; `ComandoVoz`)
   - `1.6: log('CU29', 'TRANSCRIBIR_VOZ', detalle) ->` (`ComandoVozController` &rarr; `Bitacora`)
2. **Flujo 2: Confirmar o ajustar texto transcrito y ejecutar reporte**
   - `2: confirmarComando(id, textoAjustado) ->` (Administrador &rarr; `UI_ComandoVoz`)
   - `2.1: confirmar(Request) ->` (`UI_ComandoVoz` &rarr; `ComandoVozController`)
   - `2.2: find($idComando) ->` (`ComandoVozController` &rarr; `ComandoVoz`)
   - `2.3: update(['estado' => 'CONFIRMADO', 'textoDictado' => ...]) ->` (`ComandoVozController` &rarr; `ComandoVoz`)
   - `2.4: log('CU29', 'CONFIRMAR_COMANDO', detalle) ->` (`ComandoVozController` &rarr; `Bitacora`)
   - `2.5: onIrAReporteTradicional(reporteSugerido, parametros) ->` (`UI_ComandoVoz` &rarr; `UI_ReporteTradicional`)
3. **Flujo 3: Consultar historial de comandos de voz**
   - `3: listarHistorialComandos() ->` (Administrador &rarr; `UI_ComandoVoz`)
   - `3.1: historial() ->` (`UI_ComandoVoz` &rarr; `ComandoVozController`)
   - `3.2: with('usuario')->orderByDesc()->take(15)->get() ->` (`ComandoVozController` &rarr; `ComandoVoz`)
4. **Flujo 4: Consultar catálogo de comandos sugeridos / ejemplos**
   - `4: seleccionarComandoEjemplo() ->` (Administrador &rarr; `UI_ComandoVoz`)
   - `4.1: ejemplos() ->` (`UI_ComandoVoz` &rarr; `ComandoVozController`)

```mermaid
flowchart LR
    Admin["Administrador\n(Actor)"]
    UI["UI_ComandoVoz\n(Boundary)"]
    Ctrl["ComandoVozController\n(Control)"]
    NLP["ComandoVoz (NLP)\n(Entity / Dominio)"]
    Zon["Zona\n(Entity)"]
    Bit["Bitacora\n(Entity)"]
    Usr["Usuario\n(Entity)"]
    UIRep["UI_ReporteTradicional\n(Boundary Receptor)"]

    Admin -- "1: activarMicrofonoYDictar()\n2: confirmarComando()\n3: listarHistorial()" --> UI
    UI -- "1.2: transcribir(Request)\n2.1: confirmar(Request)\n3.1: historial()\n4.1: ejemplos()" --> Ctrl
    Ctrl -- "1.3: interpretar(texto)\n1.5: create()\n2.2: find()\n2.3: update()\n3.2: with('usuario')->get()" --> NLP
    NLP -- "1.4: where('codigo', ...)->first()" --> Zon
    Ctrl -- "1.6, 2.4: log(modulo, accion, ...)" --> Bit
    Ctrl -- "3.2: usuario()" --> Usr
    UI -. "2.5: onIrAReporteTradicional(tipo, params)" .-> UIRep
```

---

## 2.2 Diagrama de Análisis de Clases &mdash; CU29

![Análisis de Clases CU29](CU29_Analisis_Clases.png)

```mermaid
classDiagram
    direction LR

    class UI_ComandoVoz {
        +iniciarDictado(): void
        +detenerDictado(): void
        +handleTextoChange(): void
        +handleConfirmarComando(): void
        +handleSeleccionarEjemplo(): void
        +listarHistorial(): void
        +alternarModoManual(): void
        +limpiar(): void
    }

    class ComandoVozController {
        +transcribir(Request): JsonResponse
        +historial(Request): JsonResponse
        +confirmar(Request): JsonResponse
        +ejemplos(): JsonResponse
    }

    class ComandoVoz {
        -idComandoVoz: int
        -idUsuario: int
        -textoDictado: string
        -intencion: string
        -parametros: array
        -confianza: float
        -estado: string
        -duracionSegundos: float
        -created_at: datetime
        -updated_at: datetime
        +create(data): ComandoVoz
        +find(id): ?ComandoVoz
        +update(data): bool
        +interpretar(texto): array
        -generarResumenInterpretacion(intencion, params, reporte): string
        +usuario(): BelongsTo
    }

    class Zona {
        -idZona: int
        -nombreZona: string
        -codigo: string
        -descripcion: string
        -estado: string
        +where(): void
        +first(): void
    }

    class Usuario {
        -idUsuario: int
        -nombreUsuario: string
        -nombreCompleto: string
        -correo: string
        -activo: boolean
        +find(): void
        +belongsTo(): void
    }

    class Bitacora {
        -idBitacora: int
        -fechaHora: timestamp
        -accion: string
        -modulo: string
        -descripcion: string
        -ipUsuario: string
        -idUsuario: int
        +create(): void
        +log(): void
    }

    class UI_ReporteTradicional {
        +seleccionarTipoReporte(): void
        +aplicarFiltros(filtros): void
        +handleGenerarReporte(): void
    }

    UI_ComandoVoz --> ComandoVozController : invoca
    ComandoVozController --> ComandoVoz : gestiona
    ComandoVoz --> Zona : resuelve entidad (0..* a 0..1)
    ComandoVoz --> Usuario : pertenece a (0..* a 1)
    ComandoVozController --> Bitacora : registra auditoria (1 a 0..*)
    UI_ComandoVoz ..> UI_ReporteTradicional : redirige con filtros precargados
```

---

## 2.3 Diagrama Secuencial &mdash; CU29

![Diagrama Secuencial CU29](CU29_Diagrama_Secuencia.png)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrador
    participant UI as UI_ComandoVoz
    participant Ctrl as ComandoVozController
    participant NLP as ComandoVoz (NLP)
    participant Zon as Zona
    participant Bit as Bitacora
    participant UIRep as UI_ReporteTradicional

    %% Flujo 1
    rect rgb(240, 248, 255)
    Note over Admin, UIRep: alt Flujo 1: Captura de voz, Speech-to-Text y procesamiento NLP
    Admin->>UI: 1: activarMicrofonoYDictar("Mostrar ingresos de la Zona Norte...")
    UI->>UI: webkitSpeechRecognition.start() -> onresult(textoTranscrito)
    UI->>Ctrl: 1.1: transcribir(Request {texto_dictado, duracion_segundos})
    Ctrl->>NLP: 1.2: interpretar($texto): array
    NLP->>Zon: 1.3: table('Zona')->where('codigo', 'ilike', '%SCZ-NORTE%')->first()
    Zon-->>NLP: ($zonaEncontrada: idZona 3)
    NLP-->>Ctrl: {intencion: 'REPORTE_INGRESOS', parametros: {zona_id: 3, ...}}
    Ctrl->>NLP: 1.4: create([idUsuario, textoDictado, intencion, parametros, ...])
    Ctrl->>Bit: 1.5: AuditLogger::log('CU29', 'TRANSCRIBIR_VOZ', ...)
    Ctrl-->>UI: success({idComando, textoDictado, intencion, parametros, resumen})
    UI-->>Admin: mostrarTranscripcionYInterpretacionVisual()
    end

    %% Flujo 2
    rect rgb(255, 245, 245)
    Note over Admin, UIRep: alt Flujo 2: Confirmar o ajustar texto transcrito y ejecutar reporte
    Admin->>UI: 2: confirmarComando(idComando, textoAjustado)
    UI->>Ctrl: 2.1: confirmar(Request {id_comando, texto_ajustado})
    Ctrl->>NLP: 2.2: find($id)->update(['estado'=>'CONFIRMADO', 'textoDictado'=>...])
    NLP-->>Ctrl: (comandoActualizado)
    Ctrl->>Bit: 2.3: AuditLogger::log('CU29', 'CONFIRMAR_COMANDO', ...)
    Ctrl-->>UI: success({textoConfirmado, interpretacion})
    UI->>UIRep: 2.4: onIrAReporteTradicional('ingresos_pagos', {zona_id: 3, fecha_desde: ...})
    UI-->>Admin: abrirModuloCU27ConResultadosPrecargados()
    end

    %% Flujo 3
    rect rgb(245, 255, 245)
    Note over Admin, UIRep: alt Flujo 3: Consultar historial de comandos dictados
    Admin->>UI: 3: listarHistorialComandos()
    UI->>Ctrl: 3.1: historial()
    Ctrl->>NLP: 3.2: with('usuario')->orderByDesc('created_at')->take(15)->get()
    NLP-->>Ctrl: ($coleccionComandos)
    Ctrl-->>UI: success($historialMapeado, 'Historial obtenido.')
    UI-->>Admin: mostrarListaHistorialConChipsDeEstado()
    end
```

---

## 3. Resumen de Entidades de Base de Datos Utilizadas
1. **`Cliente`**: Identificador, código cliente, CI, nombre completo, teléfono, correo, estado del cliente y zona asignada.
2. **`Zona`**: Identificador, nombre de zona geográfica, código técnico, descripción y estado operativo.
3. **`ServicioInternet`**: Servicios contratados vinculados al cliente y a su zona técnica.
4. **`Pago`** y **`DetallePago`**: Comprobantes de ingresos recaudados en ventanilla, montos totales, fecha/hora y cajero responsable.
5. **`MetodoPago`**: Formas de liquidación (Efectivo, QR, Transferencia Bancaria).
6. **`Mensualidad`**: Cuotas facturadas, períodos fiscales, fechas de corte y estado de mora (Vencida/Pendiente).
7. **`Equipo`** y **`AsignacionEquipo`**: Control de comodatos de ONUs, Routers y módems entregados a servicios.
8. **`ComandoVoz`**: Almacenamiento histórico de dictados por voz, intención semántica calculada, parámetros estructurados y porcentaje de confianza.
9. **`Bitacora`**: Auditoría general del sistema (registro de IP, usuario, módulo, acción transaccional y marca temporal).
