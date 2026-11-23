const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname);
const pumlComunicacion = path.join(rootDir, 'comunicacion', 'diagramas_comunicacion_todos_cu.puml');
const pumlSecuencia = path.join(rootDir, 'secuencia', 'diagramas_secuencia_todos_cu.puml');
const pumlAnalisis = path.join(rootDir, 'analisis_clases', 'diagramas_analisis_clases_todos_cu.puml');

// =========================================================================
// 1. PLANTUML COMUNICACIÓN CU24, CU27 - CU31
// =========================================================================
const pumlCU24Com = `
@startuml cu24_gestionar_proveedores
skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam interfaceBackgroundColor transparent
skinparam interfaceBorderColor transparent
skinparam actorBackgroundColor #FEFECE
skinparam actorBorderColor #A80036
skinparam boundaryBackgroundColor #CCEEFF
skinparam boundaryBorderColor #0088CC
skinparam controlBackgroundColor #CCEEFF
skinparam controlBorderColor #0088CC
skinparam entityBackgroundColor #CCEEFF
skinparam entityBorderColor #0088CC

frame "sd CU24 Gestionar proveedores" {
    () " " as spacer
    actor "Administrador / Almacén" as AdminActor
    boundary UI_Proveedor
    control ProveedorController
    entity Proveedor
    entity Bitacora
    entity Compra

    spacer -[hidden]down- AdminActor

    AdminActor -right- UI_Proveedor : <font color=#000000>1: consultarProveedores(buscar, estado) →</font>\\n<font color=#800000>2: registrarProveedor(datos) →</font>\\n<font color=#008000>3: actualizarProveedor(id, datos) →</font>\\n<font color=#000080>4: cambiarEstadoProveedor(id, estado) →</font>

    UI_Proveedor -right- ProveedorController : <font color=#000000>1.1: index(Request) →</font>\\n<font color=#800000>2.1: store(Request) →</font>\\n<font color=#008000>3.1: update(Request, id) →</font>\\n<font color=#000080>4.1: activar(id) / desactivar(id) →</font>

    ProveedorController -right- Proveedor : <font color=#000000>1.2: query()->whereLike()->get() →</font>\\n<font color=#800000>2.2: create([...datos, estado: true]) →</font>\\n<font color=#008000>3.2: findOrFail(id)->update(datos) →</font>\\n<font color=#000080>4.2: findOrFail(id)->update(['estado' => bool]) →</font>

    ProveedorController -down- Bitacora : <font color=#800000>2.3: log('CU24', 'CREAR_PROVEEDOR') →</font>\\n<font color=#008000>3.3: log('CU24', 'ACTUALIZAR_PROVEEDOR') →</font>\\n<font color=#000080>4.4: log('CU24', 'ESTADO_PROVEEDOR') →</font>

    Proveedor -up- Compra : <font color=#000080>4.3: compras()->exists() [integridad referencial] →</font>
}
@enduml
`;

const pumlCU27to31Com = `
@startuml cu27_generar_exportar_reportes_tradicionales
skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam interfaceBackgroundColor transparent
skinparam interfaceBorderColor transparent
skinparam roundCorner 10
skinparam Shadowing false
skinparam ArrowThickness 1.2
skinparam boundaryBackgroundColor #CCEEFF
skinparam boundaryBorderColor #0088CC
skinparam controlBackgroundColor #CCEEFF
skinparam controlBorderColor #0088CC
skinparam entityBackgroundColor #CCEEFF
skinparam entityBorderColor #0088CC

frame "sd CU27 Generar y exportar reportes tradicionales" {
    () " " as spacer
    actor "Administrador / Gerencia" as AdminActor
    boundary UI_ReporteTradicional
    control ReporteTradicionalController
    entity ReporteTradicional
    entity Zona
    entity Cliente
    entity Pago
    entity Mensualidad
    entity Bitacora

    spacer -[hidden]down- AdminActor

    AdminActor -right- UI_ReporteTradicional : <font color=#000000>1: consultarCatalogoReportes() →</font>\\n<font color=#800000>2: generarReporte(tipo, filtros) →</font>\\n<font color=#008000>3: exportarExcel(tipo, filtros) →</font>\\n<font color=#000080>4: exportarPdf(tipo, filtros) →</font>

    UI_ReporteTradicional -right- ReporteTradicionalController : <font color=#000000>1.1: catalogo(), parametros() →</font>\\n<font color=#800000>2.1: generar(Request) →</font>\\n<font color=#008000>3.1: exportarExcel(Request) →</font>\\n<font color=#000080>4.1: exportarPdf(Request) →</font>

    ReporteTradicionalController -right- ReporteTradicional : <font color=#000000>1.2: catalogo() →</font>\\n<font color=#800000>2.2: generar(tipo, filtros) →</font>\\n<font color=#008000>3.2: generar(tipo, filtros) →</font>\\n<font color=#000080>4.2: generar(tipo, filtros) →</font>

    ReporteTradicionalController -up- Zona : <font color=#000000>1.5: query()->select(['idZona', 'nombreZona'])->get() →</font>

    ReporteTradicional -up- Cliente : <font color=#800000>2.3.1: table('Cliente')->leftJoin('Zona')->get() →</font>

    ReporteTradicional -down- Pago : <font color=#800000>2.3.2: table('Pago')->join('MetodoPago')->whereBetween()->get() →</font>

    ReporteTradicional -down- Mensualidad : <font color=#800000>2.3.3: table('Mensualidad')->whereIn('estado', ['PENDIENTE','VENCIDA'])->get() →</font>

    ReporteTradicionalController -down- Bitacora : <font color=#800000>2.4: log('CU27', 'GENERAR_REPORTE') →</font>\\n<font color=#008000>3.3: log('CU27', 'EXPORTAR_EXCEL') →</font>\\n<font color=#000080>4.3: log('CU27', 'EXPORTAR_PDF') →</font>
}
@enduml

@startuml cu28_generar_restaurar_copias_seguridad
skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam interfaceBackgroundColor transparent
skinparam interfaceBorderColor transparent
skinparam actorBackgroundColor #FEFECE
skinparam actorBorderColor #A80036
skinparam boundaryBackgroundColor #CCEEFF
skinparam boundaryBorderColor #0088CC
skinparam controlBackgroundColor #CCEEFF
skinparam controlBorderColor #0088CC
skinparam entityBackgroundColor #CCEEFF
skinparam entityBorderColor #0088CC

frame "sd CU28 Generar y restaurar copias de seguridad" {
    () " " as spacer
    actor "Administrador del Sistema" as AdminActor
    boundary UI_CopiasSeguridad
    control CopiasSeguridadController
    entity CopiaSeguridad
    entity Usuario
    entity Bitacora

    spacer -[hidden]down- AdminActor

    AdminActor -right- UI_CopiasSeguridad : <font color=#000000>1: consultarBackups() →</font>\\n<font color=#800000>2: crearBackup(tipo, desc) →</font>\\n<font color=#008000>3: restaurarBaseDatos(id) →</font>\\n<font color=#000080>4: descargarArchivo(id) →</font>

    UI_CopiasSeguridad -right- CopiasSeguridadController : <font color=#000000>1.1: index() →</font>\\n<font color=#800000>2.1: store(Request) →</font>\\n<font color=#008000>3.1: restore(id) →</font>\\n<font color=#000080>4.1: download(id) →</font>

    CopiasSeguridadController -right- CopiaSeguridad : <font color=#000000>1.2: orderByDesc('idCopiaSeguridad')->get() →</font>\\n<font color=#800000>2.3: Process(pg_dump) -> create([nombre, ruta, tamano]) →</font>\\n<font color=#008000>3.2: findOrFail(id) -> Process(psql restore) →</font>\\n<font color=#000080>4.2: findOrFail(id) -> Storage::download() →</font>

    CopiasSeguridadController -up- Usuario : <font color=#000000>1.3: with('usuario:idUsuario,nombreCompleto') →</font>\\n<font color=#800000>2.2: auth()->user()->idUsuario →</font>

    CopiasSeguridadController -down- Bitacora : <font color=#800000>2.4: log('CU28', 'GENERAR_BACKUP') →</font>\\n<font color=#008000>3.3: log('CU28', 'RESTAURAR_BACKUP') →</font>\\n<font color=#000080>4.3: log('CU28', 'DESCARGAR_BACKUP') →</font>
}
@enduml

@startuml cu29_capturar_transcribir_comandos_voz
skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam interfaceBackgroundColor transparent
skinparam interfaceBorderColor transparent
skinparam actorBackgroundColor #FEFECE
skinparam actorBorderColor #A80036
skinparam boundaryBackgroundColor #CCEEFF
skinparam boundaryBorderColor #0088CC
skinparam controlBackgroundColor #CCEEFF
skinparam controlBorderColor #0088CC
skinparam entityBackgroundColor #CCEEFF
skinparam entityBorderColor #0088CC

frame "sd CU29 Capturar y transcribir comandos de voz" {
    () " " as spacer
    actor "Usuario / Operador" as UserActor
    boundary UI_ComandoVoz
    control ComandoVozController
    entity ComandoVoz
    entity Zona
    entity Bitacora

    spacer -[hidden]down- UserActor

    UserActor -right- UI_ComandoVoz : <font color=#000000>1: cargarEjemplosComandos() →</font>\\n<font color=#800000>2: enviarAudioComando(blobAudio) →</font>\\n<font color=#008000>3: consultarHistorialVoz() →</font>

    UI_ComandoVoz -right- ComandoVozController : <font color=#000000>1.1: ejemplos() →</font>\\n<font color=#800000>2.1: transcribir(Request) →</font>\\n<font color=#008000>3.1: historial(Request) →</font>

    ComandoVozController -right- ComandoVoz : <font color=#800000>2.3: create([audioRuta, textoDictado, intencion, confianza]) →</font>\\n<font color=#008000>3.2: with('usuario')->orderByDesc('idComando')->paginate() →</font>

    ComandoVozController -up- Zona : <font color=#800000>2.2: Zona::pluck('nombreZona') [contexto geográfico] →</font>

    ComandoVozController -down- Bitacora : <font color=#800000>2.4: log('CU29', 'TRANSCRIBIR_VOZ') →</font>
}
@enduml

@startuml cu30_procesar_intencion_voz_ia
skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam interfaceBackgroundColor transparent
skinparam interfaceBorderColor transparent
skinparam actorBackgroundColor #FEFECE
skinparam actorBorderColor #A80036
skinparam boundaryBackgroundColor #CCEEFF
skinparam boundaryBorderColor #0088CC
skinparam controlBackgroundColor #CCEEFF
skinparam controlBorderColor #0088CC
skinparam entityBackgroundColor #CCEEFF
skinparam entityBorderColor #0088CC

frame "sd CU30 Procesar intención de voz con IA (NLP)" {
    () " " as spacer
    actor "Operador / Asistente" as OperadorActor
    boundary UI_IntencionVoz
    control IntencionVozController
    control NlpIntencionService
    entity IntencionVozIA
    entity "Cliente / Zona / Pago" as DominioEnVivo
    entity Bitacora

    spacer -[hidden]down- OperadorActor

    OperadorActor -right- UI_IntencionVoz : <font color=#000000>1: enviarComandoVozTexto(dictado) →</font>\\n<font color=#800000>2: consultarHistorialNLP(filtros) →</font>\\n<font color=#008000>3: obtenerCatalogoIntenciones() →</font>

    UI_IntencionVoz -right- IntencionVozController : <font color=#000000>1.1: procesar(Request) →</font>\\n<font color=#800000>2.1: historial(Request) →</font>\\n<font color=#008000>3.1: intenciones(), ejemplos() →</font>

    IntencionVozController -right- NlpIntencionService : <font color=#000000>1.2: procesar($textoDictado): array →</font>

    NlpIntencionService -up- DominioEnVivo : <font color=#000000>1.3: extraerEntidades() -> consultarDatosEnVivo() →</font>

    NlpIntencionService -right- IntencionVozIA : <font color=#000000>1.4: create([intencion, confianza, entidades, datosEnVivo]) →</font>\\n<font color=#800000>2.2: with('usuario')->orderByDesc()->paginate() →</font>

    IntencionVozController -down- Bitacora : <font color=#000000>1.5: log('CU30', 'PROCESAR_INTENCION_NLP') →</font>
}
@enduml

@startuml cu31_generar_reporte_inteligente_voz
skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam interfaceBackgroundColor transparent
skinparam interfaceBorderColor transparent
skinparam actorBackgroundColor #FEFECE
skinparam actorBorderColor #A80036
skinparam boundaryBackgroundColor #CCEEFF
skinparam boundaryBorderColor #0088CC
skinparam controlBackgroundColor #CCEEFF
skinparam controlBorderColor #0088CC
skinparam entityBackgroundColor #CCEEFF
skinparam entityBorderColor #0088CC

frame "sd CU31 Generar reporte inteligente vía comando de voz" {
    () " " as spacer
    actor "Administrador / Gerencia" as AdminActor
    boundary UI_ReporteInteligente
    control ReporteInteligenteController
    control GeminiIntencionService
    control CatalogoReportesService
    entity "Cliente / Pago / Mensualidad" as EntidadesDominio
    entity Bitacora

    spacer -[hidden]down- AdminActor

    AdminActor -right- UI_ReporteInteligente : <font color=#000000>1: dictarComandoReporte(comando/intencion) →</font>\\n<font color=#800000>2: visualizarReporteGenerado(datos) →</font>

    UI_ReporteInteligente -right- ReporteInteligenteController : <font color=#000000>1.1: generar(Request) →</font>

    ReporteInteligenteController -up- GeminiIntencionService : <font color=#000000>1.2: interpretar($comando) [Gemini AI / LLM] →</font>

    ReporteInteligenteController -right- CatalogoReportesService : <font color=#000000>1.3: generar($intencionEstructurada): array →</font>

    CatalogoReportesService -right- EntidadesDominio : <font color=#000000>1.4: DB::table(entidades)->select()->where()->get() →</font>

    ReporteInteligenteController -down- Bitacora : <font color=#000000>1.5: log('CU31', 'GENERAR_REPORTE_INTELIGENTE') →</font>
}
@enduml
`;

// =========================================================================
// 2. PLANTUML ANÁLISIS DE CLASES CU24, CU27 - CU31
// =========================================================================
const pumlCU24Ana = `
@startuml cu24_analisis_gestionar_proveedores
allowmixing

skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam classFontSize 12
skinparam classAttributeIconSize 0
hide circle

skinparam class {
    BackgroundColor #FFF2E6
    BorderColor #8A4B38
    RoundCorner 6
    HeaderBackgroundColor #FFF2E6
    ArrowColor black
}

skinparam actor {
    BackgroundColor #FEFECE
    BorderColor #A80036
}

frame "sd Diagrama de análisis de clases - CU24 Gestionar proveedores" {
    actor "Administrador / Almacén" as AdminActor

    class UI_Proveedor <<boundary>> {
        + listarProveedores(): void
        + filtrarPorTexto(buscar: string): void
        + filtrarPorEstado(activo: bool): void
        + abrirFormularioCrear(): void
        + submitRegistrar(datos: array): void
        + submitActualizar(id: int, datos: array): void
        + confirmarCambioEstado(id: int): void
    }

    class ProveedorController <<control>> {
        + index(request: Request): JsonResponse
        + show(proveedor: int): JsonResponse
        + store(request: Request): JsonResponse
        + update(request: Request, proveedor: int): JsonResponse
        + activar(proveedor: int): JsonResponse
        + desactivar(proveedor: int): JsonResponse
        - validarProveedor(request: Request): array
        - auditar(prov: Proveedor, accion: string): void
    }

    class Proveedor <<entity>> {
        - idProveedor: int
        - razonSocial: string
        - nit: string
        - telefono: string
        - correo: string
        - direccion: string
        - estado: boolean
        - created_at: timestamp
        - updated_at: timestamp
        --
        + compras(): HasMany
        + scopeActivos(query: Builder): Builder
        + scopeWhereLike(query: Builder, col: string, val: string): Builder
    }

    class Compra <<entity>> {
        - idCompra: int
        - nroComprobante: string
        - fechaCompra: date
        - montoTotal: decimal
        - idProveedor: int
        --
        + proveedor(): BelongsTo
        + detalles(): HasMany
    }

    class Bitacora <<entity>> {
        - idBitacora: int
        - casoUso: string = 'CU24'
        - accion: string
        - detalles: text
        - ip: string
        - idUsuario: int
        - fechaHora: timestamp
        --
        + create(datos: array): Bitacora
    }

    AdminActor -right- UI_Proveedor
    UI_Proveedor -right- ProveedorController : invoca >
    ProveedorController "1" -right- "0..*" Proveedor : gestiona >
    ProveedorController "1" -down- "0..*" Bitacora : registra auditoría >
    Proveedor "1" -right- "0..*" Compra : suministra >
}
@enduml
`;

const pumlCU27to31Ana = `
@startuml cu27_analisis_generar_exportar_reportes_tradicionales
allowmixing
skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam classFontSize 12
skinparam classAttributeIconSize 0
hide circle

skinparam class {
    BackgroundColor #FFF2E6
    BorderColor #8A4B38
    RoundCorner 6
    HeaderBackgroundColor #FFF2E6
    ArrowColor black
}

frame "sd Diagrama de análisis de clases - CU27 Generar y exportar reportes tradicionales" {
    actor "Administrador / Gerencia" as AdminActor

    class UI_ReporteTradicional <<boundary>> {
        + consultarCatalogo(): void
        + seleccionarTipoReporte(): void
        + cambiarFiltro(): void
        + handleGenerarReporte(): void
        + handleExportarExcel(): void
        + handleExportarPdf(): void
    }

    class ReporteTradicionalController <<control>> {
        + catalogo(): JsonResponse
        + parametros(): JsonResponse
        + generar(request: Request): JsonResponse
        + exportarExcel(request: Request): StreamedResponse
        + exportarPdf(request: Request): JsonResponse
    }

    class ReporteTradicional <<entity>> {
        + TIPO_CLIENTES_ZONA: string
        + TIPO_INGRESOS_PAGOS: string
        + TIPO_MOROSIDAD_CORTES: string
        + TIPO_EQUIPOS_INSTAL: string
        --
        + catalogo(): array
        + generar(tipo: string, filtros: array): array
    }

    class Cliente <<entity>> {
        - idCliente: int
        - codigoCliente: string
        - nombreCompleto: string
        - estadoCliente: string
        - idZona: int
    }

    class Pago <<entity>> {
        - idPago: int
        - fechaHora: timestamp
        - montoTotal: decimal
        - idMetodoPago: int
    }

    class Mensualidad <<entity>> {
        - idMensualidad: int
        - periodo: string
        - monto: decimal
        - estado: string
    }

    class Bitacora <<entity>> {
        - idBitacora: int
        - casoUso: string = 'CU27'
        - accion: string
        - detalles: text
    }

    AdminActor -right- UI_ReporteTradicional
    UI_ReporteTradicional -right- ReporteTradicionalController
    ReporteTradicionalController "1" -right- "1" ReporteTradicional : invoca >
    ReporteTradicionalController "1" -down- "0..*" Bitacora : registra auditoría >
    ReporteTradicional "1" -right- "0..*" Cliente : consolida >
    ReporteTradicional "1" -right- "0..*" Pago : consolida >
    ReporteTradicional "1" -down- "0..*" Mensualidad : evalúa mora >
}
@enduml

@startuml cu28_analisis_generar_restaurar_copias_seguridad
allowmixing
skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam classFontSize 12
skinparam classAttributeIconSize 0
hide circle

skinparam class {
    BackgroundColor #FFF2E6
    BorderColor #8A4B38
    RoundCorner 6
    HeaderBackgroundColor #FFF2E6
    ArrowColor black
}

frame "sd Diagrama de análisis de clases - CU28 Generar y restaurar copias de seguridad" {
    actor "Administrador del Sistema" as AdminActor

    class UI_CopiasSeguridad <<boundary>> {
        + listarCopiasSeguridad(): void
        + submitGenerarBackup(tipo: string, desc: string): void
        + descargarCopia(id: int): void
        + ejecutarRestauracion(id: int): void
        + eliminarCopia(id: int): void
    }

    class CopiasSeguridadController <<control>> {
        + index(): JsonResponse
        + store(request: Request): JsonResponse
        + download(id: int): BinaryFileResponse
        + restore(id: int): JsonResponse
        + destroy(id: int): JsonResponse
        - resolverBinario(binario: string): ?string
    }

    class CopiaSeguridad <<entity>> {
        - idCopiaSeguridad: int
        - nombreArchivo: string
        - ruta: string
        - tamanoBytes: bigint
        - tamanoLegible: string
        - idUsuario: int
        - descripcion: string
        - tipo: string
        - estado: string
        --
        + usuario(): BelongsTo
        + existeFisicamente(): bool
    }

    class Usuario <<entity>> {
        - idUsuario: int
        - nombreCompleto: string
        - email: string
    }

    class Bitacora <<entity>> {
        - idBitacora: int
        - casoUso: string = 'CU28'
        - accion: string
        - detalles: text
    }

    AdminActor -right- UI_CopiasSeguridad
    UI_CopiasSeguridad -right- CopiasSeguridadController
    CopiasSeguridadController "1" -right- "0..*" CopiaSeguridad : administra >
    CopiasSeguridadController "1" -up- "1" Usuario : autentica >
    CopiasSeguridadController "1" -down- "0..*" Bitacora : registra auditoría >
}
@enduml

@startuml cu29_analisis_capturar_transcribir_comandos_voz
allowmixing
skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam classFontSize 12
skinparam classAttributeIconSize 0
hide circle

skinparam class {
    BackgroundColor #FFF2E6
    BorderColor #8A4B38
    RoundCorner 6
    HeaderBackgroundColor #FFF2E6
    ArrowColor black
}

frame "sd Diagrama de análisis de clases - CU29 Capturar y transcribir comandos de voz" {
    actor "Usuario / Operador" as UserActor

    class UI_ComandoVoz <<boundary>> {
        + iniciarGrabacionMicrofono(): void
        + detenerGrabacionYEnviar(): void
        + reproducirAudioGrabado(): void
        + listarHistorial(pagina: int): void
        + mostrarResultadoTranscripcion(): void
    }

    class ComandoVozController <<control>> {
        + transcribir(request: Request): JsonResponse
        + historial(request: Request): JsonResponse
        + ejemplos(): JsonResponse
        - clasificarIntencion(txt: string): array
    }

    class ComandoVoz <<entity>> {
        - idComando: int
        - idUsuario: int
        - audioRuta: string
        - textoDictado: text
        - intencionDetectada: string
        - reporteSugerido: string
        - parametros: json
        - confianza: decimal
        - procesadoExitoso: bool
        --
        + usuario(): BelongsTo
    }

    class Zona <<entity>> {
        - idZona: int
        - nombreZona: string
    }

    class Bitacora <<entity>> {
        - idBitacora: int
        - casoUso: string = 'CU29'
        - accion: string = 'TRANSCRIBIR_VOZ'
        - detalles: text
    }

    UserActor -right- UI_ComandoVoz
    UI_ComandoVoz -right- ComandoVozController
    ComandoVozController "1" -right- "0..*" ComandoVoz : persiste >
    ComandoVozController "1" -up- "0..*" Zona : consulta contexto >
    ComandoVozController "1" -down- "0..*" Bitacora : registra auditoría >
}
@enduml

@startuml cu30_analisis_procesar_intencion_voz_ia
allowmixing
skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam classFontSize 12
skinparam classAttributeIconSize 0
hide circle

skinparam class {
    BackgroundColor #FFF2E6
    BorderColor #8A4B38
    RoundCorner 6
    HeaderBackgroundColor #FFF2E6
    ArrowColor black
}

frame "sd Diagrama de análisis de clases - CU30 Procesar intención de voz con IA (NLP)" {
    actor "Operador / Asistente" as OperadorActor

    class UI_IntencionVoz <<boundary>> {
        + escucharVozDictada(): void
        + enviarTextoComando(txt: string): void
        + listarHistorialNLP(): void
        + renderizarRespuestaAsistente(): void
        + mostrarWidgetsDatosEnVivo(): void
        + navegarAccionSugerida(url: string): void
    }

    class IntencionVozController <<control>> {
        + procesar(request: Request): JsonResponse
        + historial(request: Request): JsonResponse
        + intenciones(): JsonResponse
        + ejemplos(): JsonResponse
    }

    class NlpIntencionService <<control>> {
        + procesar(texto: string): array
        - clasificarIntencion(txt: string): array
        - extraerEntidades(txt: string): array
        - generarRespuesta(intencion: string, ent: array): string
        - obtenerDatosEnVivo(intencion: string, ent: array): array
    }

    class IntencionVozIA <<entity>> {
        - idIntencion: int
        - idUsuario: int
        - textoEntrada: text
        - intencionCanonica: string
        - categoria: string
        - confianza: decimal
        - motor: string
        - entidadesExtraidas: json
        - accionSugerida: json
        - datosEnVivo: json
        --
        + usuario(): BelongsTo
    }

    class Bitacora <<entity>> {
        - idBitacora: int
        - casoUso: string = 'CU30'
        - accion: string = 'PROCESAR_INTENCION_NLP'
        - detalles: text
    }

    OperadorActor -right- UI_IntencionVoz
    UI_IntencionVoz -right- IntencionVozController
    IntencionVozController "1" -right- "1" NlpIntencionService : delega a >
    NlpIntencionService "1" -right- "0..*" IntencionVozIA : persiste >
    IntencionVozController "1" -down- "0..*" Bitacora : registra auditoría >
}
@enduml

@startuml cu31_analisis_generar_reporte_inteligente_voz
allowmixing
skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam classFontSize 12
skinparam classAttributeIconSize 0
hide circle

skinparam class {
    BackgroundColor #FFF2E6
    BorderColor #8A4B38
    RoundCorner 6
    HeaderBackgroundColor #FFF2E6
    ArrowColor black
}

frame "sd Diagrama de análisis de clases - CU31 Generar reporte inteligente vía comando de voz" {
    actor "Administrador / Gerencia" as AdminActor

    class UI_ReporteInteligente <<boundary>> {
        + dictarComandoReporte(): void
        + enviarComandoTexto(texto: string): void
        + previsualizarInterpretacion(): void
        + renderizarTablaReporteIA(): void
        + renderizarResumenKPIs(): void
    }

    class ReporteInteligenteController <<control>> {
        + generar(request: Request, gemini: GeminiIntencionService, catalogo: CatalogoReportesService): JsonResponse
    }

    class GeminiIntencionService <<control>> {
        + interpretar(comando: string): array
    }

    class CatalogoReportesService <<control>> {
        + generar(intencion: array): array
    }

    class Cliente <<entity>> {
        - idCliente: int
        - codigoCliente: string
        - idZona: int
    }

    class Mensualidad <<entity>> {
        - idMensualidad: int
        - monto: decimal
        - estado: string
    }

    class Bitacora <<entity>> {
        - idBitacora: int
        - casoUso: string = 'CU31'
        - accion: string = 'GENERAR_REPORTE_INTELIGENTE'
    }

    AdminActor -right- UI_ReporteInteligente
    UI_ReporteInteligente -right- ReporteInteligenteController
    ReporteInteligenteController "1" -up- "1" GeminiIntencionService : interpreta con >
    ReporteInteligenteController "1" -right- "1" CatalogoReportesService : consulta catálogo >
    CatalogoReportesService "1" -right- "0..*" Cliente : lee >
    CatalogoReportesService "1" -down- "0..*" Mensualidad : lee >
    ReporteInteligenteController "1" -down- "0..*" Bitacora : registra auditoría >
}
@enduml
`;

// =========================================================================
// 3. PLANTUML SECUENCIA CU24 A CU31
// =========================================================================
const pumlCU24to31Sec = `
@startuml cu24_secuencia_gestionar_proveedores
autonumber
skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam sequenceArrowThickness 1.2
skinparam roundcorner 6

actor "Administrador / Almacén" as AdminActor
boundary UI_Proveedor
control ProveedorController
entity Proveedor
entity Bitacora

== Flujo 1: Consultar catálogo de proveedores ==
AdminActor -> UI_Proveedor: 1: consultarProveedores(buscar, estado)
activate UI_Proveedor
UI_Proveedor -> ProveedorController: 1.1: index(Request $request)
activate ProveedorController
ProveedorController -> Proveedor: 1.2: query()->whereLike()->orderBy('razonSocial')->get()
activate Proveedor
Proveedor --> ProveedorController: $proveedores
deactivate Proveedor
ProveedorController --> UI_Proveedor: success({proveedores})
deactivate ProveedorController
UI_Proveedor --> AdminActor: renderizarTablaProveedores()
deactivate UI_Proveedor

== Flujo 2: Registrar nuevo proveedor ==
AdminActor -> UI_Proveedor: 2: registrarProveedor(datos)
activate UI_Proveedor
UI_Proveedor -> ProveedorController: 2.1: store(Request $request)
activate ProveedorController
ProveedorController -> ProveedorController: validarProveedor()
ProveedorController -> Proveedor: 2.2: create([...datos, 'estado' => true])
activate Proveedor
Proveedor --> ProveedorController: $proveedorCreado
deactivate Proveedor
ProveedorController -> Bitacora: 2.3: log('CU24', 'CREAR_PROVEEDOR', detalle)
activate Bitacora
Bitacora --> ProveedorController: ok
deactivate Bitacora
ProveedorController --> UI_Proveedor: success({proveedor}, 201)
deactivate ProveedorController
UI_Proveedor --> AdminActor: notificarRegistroExitoso()
deactivate UI_Proveedor

== Flujo 3: Actualizar y desactivar proveedor (Baja lógica) ==
AdminActor -> UI_Proveedor: 3: desactivarProveedor(id)
activate UI_Proveedor
UI_Proveedor -> ProveedorController: 3.1: desactivar(id)
activate ProveedorController
ProveedorController -> Proveedor: 3.2: findOrFail(id)->update(['estado' => false])
activate Proveedor
Proveedor --> ProveedorController: $proveedorActualizado
deactivate Proveedor
ProveedorController -> Bitacora: 3.3: log('CU24', 'DESACTIVAR_PROVEEDOR', detalle)
activate Bitacora
Bitacora --> ProveedorController: ok
deactivate Bitacora
ProveedorController --> UI_Proveedor: success({proveedor}, 'Proveedor desactivado')
deactivate ProveedorController
UI_Proveedor --> AdminActor: actualizarFilaEnTabla()
deactivate UI_Proveedor
@enduml

@startuml cu25_secuencia_registrar_compra_equipos_stock
autonumber
skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam sequenceArrowThickness 1.2
skinparam roundcorner 6

actor "Administrador / Almacén" as AdminActor
boundary UI_CompraRegistro
control CompraEquipoRegistroController
entity Compra
entity DetalleCompra
entity Inventario
entity Bitacora

== Flujo 1: Abrir formulario y cargar catálogos ==
AdminActor -> UI_CompraRegistro: 1: abrirFormularioCompra()
activate UI_CompraRegistro
UI_CompraRegistro -> CompraEquipoRegistroController: 1.1: proveedores(), productos()
activate CompraEquipoRegistroController
CompraEquipoRegistroController --> UI_CompraRegistro: success({proveedores, productos})
deactivate CompraEquipoRegistroController
UI_CompraRegistro --> AdminActor: renderizarFormularioCompra()
deactivate UI_CompraRegistro

== Flujo 2: Registrar compra e incrementar stock (Transacción DB) ==
AdminActor -> UI_CompraRegistro: 2: submitCompra(idProveedor, items)
activate UI_CompraRegistro
UI_CompraRegistro -> CompraEquipoRegistroController: 2.1: store(Request $request)
activate CompraEquipoRegistroController
CompraEquipoRegistroController -> CompraEquipoRegistroController: DB::beginTransaction()
CompraEquipoRegistroController -> Compra: 2.2: create([nroComprobante, fecha, idProveedor])
activate Compra
Compra --> CompraEquipoRegistroController: $compraId
deactivate Compra
CompraEquipoRegistroController -> DetalleCompra: 2.3: foreach items: DetalleCompra::create()
activate DetalleCompra
DetalleCompra --> CompraEquipoRegistroController: ok
deactivate DetalleCompra
CompraEquipoRegistroController -> Inventario: 2.4: increment('stockActual', cant)
activate Inventario
Inventario --> CompraEquipoRegistroController: nuevoStock
deactivate Inventario
CompraEquipoRegistroController -> Compra: 2.5: update(['montoTotal' => sumTotal])
activate Compra
Compra --> CompraEquipoRegistroController: ok
deactivate Compra
CompraEquipoRegistroController -> Bitacora: 2.6: log('CU25', 'REGISTRAR_COMPRA', detalle)
activate Bitacora
Bitacora --> CompraEquipoRegistroController: ok
deactivate Bitacora
CompraEquipoRegistroController -> CompraEquipoRegistroController: DB::commit()
CompraEquipoRegistroController --> UI_CompraRegistro: success({compra}, 'Compra registrada')
deactivate CompraEquipoRegistroController
UI_CompraRegistro --> AdminActor: mostrarComprobanteCompra()
deactivate UI_CompraRegistro
@enduml

@startuml cu26_secuencia_visualizar_dashboard_admin_financiero
autonumber
skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam sequenceArrowThickness 1.2
skinparam roundcorner 6

actor "Administrador / Secretaría" as AdminActor
boundary UI_DashboardAdminFinanciero
control DashboardAdminFinancieroController
control DashboardMetricasService
entity "Pago / Mensualidad" as Facturacion
entity Bitacora

== Flujo 1: Consultar Dashboard general y métricas operativas ==
AdminActor -> UI_DashboardAdminFinanciero: 1: consultarDashboard(periodo)
activate UI_DashboardAdminFinanciero
UI_DashboardAdminFinanciero -> DashboardAdminFinancieroController: 1.1: index(Request $request)
activate DashboardAdminFinancieroController
DashboardAdminFinancieroController -> DashboardMetricasService: 1.2: obtenerMetricasGenerales(periodo)
activate DashboardMetricasService
DashboardMetricasService -> Facturacion: 1.3: Pago::sum('montoTotal'), Mensualidad::where('estado','PENDIENTE')->sum()
activate Facturacion
Facturacion --> DashboardMetricasService: $kpisRecaudacion, $carteraVencida
deactivate Facturacion
DashboardMetricasService --> DashboardAdminFinancieroController: $metricasConsolidadas
deactivate DashboardMetricasService
DashboardAdminFinancieroController -> Bitacora: 1.4: log('CU26', 'CONSULTA_DASHBOARD', ip)
activate Bitacora
Bitacora --> DashboardAdminFinancieroController: ok
deactivate Bitacora
DashboardAdminFinancieroController --> UI_DashboardAdminFinanciero: success({metricas})
deactivate DashboardAdminFinancieroController
UI_DashboardAdminFinanciero --> AdminActor: renderizarTarjetasKPIyGraficos()
deactivate UI_DashboardAdminFinanciero

== Flujo 2: Consultar alertas tempranas de morosidad ==
AdminActor -> UI_DashboardAdminFinanciero: 2: consultarAlertasMorosidad()
activate UI_DashboardAdminFinanciero
UI_DashboardAdminFinanciero -> DashboardAdminFinancieroController: 2.1: alertas()
activate DashboardAdminFinancieroController
DashboardAdminFinancieroController -> Facturacion: 2.2: Mensualidad::where('estado','VENCIDA')->with('servicio.cliente')->get()
activate Facturacion
Facturacion --> DashboardAdminFinancieroController: $morososCriticos
deactivate Facturacion
DashboardAdminFinancieroController --> UI_DashboardAdminFinanciero: success({alertas: $morososCriticos})
deactivate DashboardAdminFinancieroController
UI_DashboardAdminFinanciero --> AdminActor: desplegarBandejaAlertasMora()
deactivate UI_DashboardAdminFinanciero
@enduml

@startuml cu27_secuencia_generar_exportar_reportes_tradicionales
autonumber
skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam sequenceArrowThickness 1.2
skinparam roundcorner 6

actor "Administrador / Gerencia" as AdminActor
boundary UI_ReporteTradicional
control ReporteTradicionalController
entity ReporteTradicional
entity "Cliente / Pago / Mensualidad" as Entidades
entity Bitacora

== Flujo 1: Consultar catálogo y parámetros ==
AdminActor -> UI_ReporteTradicional: 1: consultarCatalogoReportes()
activate UI_ReporteTradicional
UI_ReporteTradicional -> ReporteTradicionalController: 1.1: catalogo(), parametros()
activate ReporteTradicionalController
ReporteTradicionalController -> ReporteTradicional: 1.2: catalogo()
activate ReporteTradicional
ReporteTradicional --> ReporteTradicionalController: $catalogo
deactivate ReporteTradicional
ReporteTradicionalController --> UI_ReporteTradicional: success({catalogo, parametros})
deactivate ReporteTradicionalController
UI_ReporteTradicional --> AdminActor: renderizarFormularioFiltros()
deactivate UI_ReporteTradicional

== Flujo 2: Generar reporte analítico ==
AdminActor -> UI_ReporteTradicional: 2: generarReporte(tipo, filtros)
activate UI_ReporteTradicional
UI_ReporteTradicional -> ReporteTradicionalController: 2.1: generar(Request)
activate ReporteTradicionalController
ReporteTradicionalController -> ReporteTradicional: 2.2: generar($tipo, $filtros)
activate ReporteTradicional
ReporteTradicional -> Entidades: 2.3: DB::table(entidades)->where(filtros)->get()
activate Entidades
Entidades --> ReporteTradicional: $filas, $totales
deactivate Entidades
ReporteTradicional --> ReporteTradicionalController: $reporteConsolidado
deactivate ReporteTradicional
ReporteTradicionalController -> Bitacora: 2.4: log('CU27', 'GENERAR_REPORTE', detalle)
activate Bitacora
Bitacora --> ReporteTradicionalController: ok
deactivate Bitacora
ReporteTradicionalController --> UI_ReporteTradicional: success({reporte: $reporteConsolidado})
deactivate ReporteTradicionalController
UI_ReporteTradicional --> AdminActor: mostrarTablaReporteConKPIs()
deactivate UI_ReporteTradicional

== Flujo 3: Exportar reporte a Excel / PDF ==
AdminActor -> UI_ReporteTradicional: 3: exportarExcel(tipo, filtros)
activate UI_ReporteTradicional
UI_ReporteTradicional -> ReporteTradicionalController: 3.1: exportarExcel(Request)
activate ReporteTradicionalController
ReporteTradicionalController -> Bitacora: 3.2: log('CU27', 'EXPORTAR_EXCEL', detalle)
activate Bitacora
Bitacora --> ReporteTradicionalController: ok
deactivate Bitacora
ReporteTradicionalController --> UI_ReporteTradicional: streamDownload()
deactivate ReporteTradicionalController
UI_ReporteTradicional --> AdminActor: descargarArchivoBlob()
deactivate UI_ReporteTradicional
@enduml

@startuml cu28_secuencia_generar_restaurar_copias_seguridad
autonumber
skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam sequenceArrowThickness 1.2
skinparam roundcorner 6

actor "Administrador del Sistema" as AdminActor
boundary UI_CopiasSeguridad
control CopiasSeguridadController
entity CopiaSeguridad
entity Bitacora

== Flujo 1: Generar backup manual (pg_dump) ==
AdminActor -> UI_CopiasSeguridad: 1: solicitarGenerarBackup(tipo, descripcion)
activate UI_CopiasSeguridad
UI_CopiasSeguridad -> CopiasSeguridadController: 1.1: store(Request $request)
activate CopiasSeguridadController
CopiasSeguridadController -> CopiasSeguridadController: resolverBinario('pg_dump') & ejecutarProceso()
CopiasSeguridadController -> CopiaSeguridad: 1.2: create([nombreArchivo, ruta, tamanoBytes, 'EXITOSO'])
activate CopiaSeguridad
CopiaSeguridad --> CopiasSeguridadController: $copiaRegistrada
deactivate CopiaSeguridad
CopiasSeguridadController -> Bitacora: 1.3: log('CU28', 'GENERAR_BACKUP', detalle)
activate Bitacora
Bitacora --> CopiasSeguridadController: ok
deactivate Bitacora
CopiasSeguridadController --> UI_CopiasSeguridad: success({copia: $copiaRegistrada})
deactivate CopiasSeguridadController
UI_CopiasSeguridad --> AdminActor: notificarBackupExitoso()
deactivate UI_CopiasSeguridad

== Flujo 2: Restaurar base de datos (psql) ==
AdminActor -> UI_CopiasSeguridad: 2: confirmarYEjecutarRestauracion(idCopia)
activate UI_CopiasSeguridad
UI_CopiasSeguridad -> CopiasSeguridadController: 2.1: restore(id)
activate CopiasSeguridadController
CopiasSeguridadController -> CopiaSeguridad: 2.2: findOrFail($id)
activate CopiaSeguridad
CopiaSeguridad --> CopiasSeguridadController: $copiaSeguridad
deactivate CopiaSeguridad
CopiasSeguridadController -> CopiasSeguridadController: resolverBinario('psql') & ejecutarRestauracion($ruta)
CopiasSeguridadController -> Bitacora: 2.3: log('CU28', 'RESTAURAR_BACKUP', 'RESTAURACION_EXITOSA')
activate Bitacora
Bitacora --> CopiasSeguridadController: ok
deactivate Bitacora
CopiasSeguridadController --> UI_CopiasSeguridad: success(null, 'Base de datos restaurada')
deactivate CopiasSeguridadController
UI_CopiasSeguridad --> AdminActor: mostrarMensajeExitoYRefrescar()
deactivate UI_CopiasSeguridad
@enduml

@startuml cu29_secuencia_capturar_transcribir_comandos_voz
autonumber
skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam sequenceArrowThickness 1.2
skinparam roundcorner 6

actor "Usuario / Operador" as UserActor
boundary UI_ComandoVoz
control ComandoVozController
entity ComandoVoz
entity Bitacora

== Flujo 1: Enviar comando de audio y transcribir ==
UserActor -> UI_ComandoVoz: 1: enviarAudioComando(blobWav, textoDictado)
activate UI_ComandoVoz
UI_ComandoVoz -> ComandoVozController: 1.1: transcribir(Request $request)
activate ComandoVozController
ComandoVozController -> ComandoVozController: clasificarIntencion() & extraerParametros()
ComandoVozController -> ComandoVoz: 1.2: create([textoDictado, intencion, reporteSugerido, confianza])
activate ComandoVoz
ComandoVoz --> ComandoVozController: $comandoGuardado
deactivate ComandoVoz
ComandoVozController -> Bitacora: 1.3: log('CU29', 'TRANSCRIBIR_VOZ', textoDictado)
activate Bitacora
Bitacora --> ComandoVozController: ok
deactivate Bitacora
ComandoVozController --> UI_ComandoVoz: success({transcripcion, intencion, accion_sugerida})
deactivate ComandoVozController
UI_ComandoVoz --> UserActor: mostrarTextoInterpretadoYModalAccion()
deactivate UI_ComandoVoz
@enduml

@startuml cu30_secuencia_procesar_intencion_voz_ia
autonumber
skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam sequenceArrowThickness 1.2
skinparam roundcorner 6

actor "Operador / Asistente" as OperadorActor
boundary UI_IntencionVoz
control IntencionVozController
control NlpIntencionService
entity IntencionVozIA
entity Bitacora

== Flujo 1: Procesar texto dictado con NLP y obtener datos en vivo ==
OperadorActor -> UI_IntencionVoz: 1: enviarComandoTexto("Muéstrame morosos de Plan 3000")
activate UI_IntencionVoz
UI_IntencionVoz -> IntencionVozController: 1.1: procesar(Request $request)
activate IntencionVozController
IntencionVozController -> NlpIntencionService: 1.2: procesar($textoDictado): array
activate NlpIntencionService
NlpIntencionService -> NlpIntencionService: clasificarIntencion() & extraerEntidades()
NlpIntencionService -> NlpIntencionService: obtenerDatosEnVivo()
NlpIntencionService --> IntencionVozController: $resultadoNLP
deactivate NlpIntencionService
IntencionVozController -> IntencionVozIA: 1.3: create([textoEntrada, intencion, entidades, respuesta])
activate IntencionVozIA
IntencionVozIA --> IntencionVozController: $registroPersistido
deactivate IntencionVozIA
IntencionVozController -> Bitacora: 1.4: log('CU30', 'PROCESAR_INTENCION_NLP', detalle)
activate Bitacora
Bitacora --> IntencionVozController: ok
deactivate Bitacora
IntencionVozController --> UI_IntencionVoz: success($resultadoNLP)
deactivate IntencionVozController
UI_IntencionVoz --> OperadorActor: renderizarRespuestaVozYDatosEnVivo()
deactivate UI_IntencionVoz
@enduml

@startuml cu31_secuencia_generar_reporte_inteligente_voz
autonumber
skinparam backgroundColor white
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam sequenceArrowThickness 1.2
skinparam roundcorner 6

actor "Administrador / Gerencia" as AdminActor
boundary UI_ReporteInteligente
control ReporteInteligenteController
control GeminiIntencionService
control CatalogoReportesService
entity Bitacora

== Flujo 1: Interpretar con Gemini y consultar catálogo de reportes ==
AdminActor -> UI_ReporteInteligente: 1: dictarComandoReporte("Genera un reporte de morosos de Zona Norte")
activate UI_ReporteInteligente
UI_ReporteInteligente -> ReporteInteligenteController: 1.1: generar(Request $request)
activate ReporteInteligenteController
ReporteInteligenteController -> GeminiIntencionService: 1.2: interpretar($comando)
activate GeminiIntencionService
GeminiIntencionService --> ReporteInteligenteController: $intencionEstructurada: {tipo, filtros}
deactivate GeminiIntencionService
ReporteInteligenteController -> CatalogoReportesService: 1.3: generar($intencionEstructurada)
activate CatalogoReportesService
CatalogoReportesService --> ReporteInteligenteController: $reporteGenerado: {tipo, filas, columnas, resumen}
deactivate CatalogoReportesService
ReporteInteligenteController -> Bitacora: 1.4: log('CU31', 'GENERAR_REPORTE_INTELIGENTE', detalle)
activate Bitacora
Bitacora --> ReporteInteligenteController: ok
deactivate Bitacora
ReporteInteligenteController --> UI_ReporteInteligente: success({interpretacion, reporte})
deactivate ReporteInteligenteController
UI_ReporteInteligente --> AdminActor: visualizarReporteConMetricasYExportar()
deactivate UI_ReporteInteligente
@enduml
`;

// =========================================================================
// APLICAR ACTUALIZACIONES EN LOS TRES ARCHIVOS MAESTROS
// =========================================================================

// 1. Actualizar Comunicacion
let comContent = fs.readFileSync(pumlComunicacion, 'utf8');
if (!comContent.includes('@startuml cu24_gestionar_proveedores')) {
  // Insertar CU24 antes de CU25
  const cu25Index = comContent.indexOf('@startuml cu25_comunicacion_registrar_compra_equipo');
  if (cu25Index !== -1) {
    comContent = comContent.slice(0, cu25Index) + pumlCU24Com.trim() + '\n\n' + comContent.slice(cu25Index);
  } else {
    comContent += '\n' + pumlCU24Com.trim();
  }
}
if (!comContent.includes('@startuml cu27_generar_exportar_reportes_tradicionales')) {
  comContent = comContent.trim() + '\n' + pumlCU27to31Com.trim() + '\n';
}
fs.writeFileSync(pumlComunicacion, comContent, 'utf8');
console.log('diagramas_comunicacion_todos_cu.puml actualizado exitosamente.');

// 2. Actualizar Secuencia
let secContent = fs.readFileSync(pumlSecuencia, 'utf8');
if (!secContent.includes('@startuml cu24_secuencia_gestionar_proveedores')) {
  secContent = secContent.trim() + '\n' + pumlCU24to31Sec.trim() + '\n';
}
fs.writeFileSync(pumlSecuencia, secContent, 'utf8');
console.log('diagramas_secuencia_todos_cu.puml actualizado exitosamente.');

// 3. Actualizar Analisis de Clases
let anaContent = fs.readFileSync(pumlAnalisis, 'utf8');
if (!anaContent.includes('@startuml cu24_analisis_gestionar_proveedores')) {
  // Insertar CU24 antes de CU25
  const cu25Index = anaContent.indexOf('frame "sd Diagrama de an\\u00e1lisis de clases - CU25 Registrar compra de equipo');
  const cu25StartUml = anaContent.lastIndexOf('@startuml cu25', cu25Index !== -1 ? cu25Index : undefined);
  if (cu25StartUml !== -1) {
    anaContent = anaContent.slice(0, cu25StartUml) + pumlCU24Ana.trim() + '\n\n' + anaContent.slice(cu25StartUml);
  } else {
    anaContent += '\n' + pumlCU24Ana.trim();
  }
}
if (!anaContent.includes('@startuml cu27_analisis_generar_exportar_reportes_tradicionales')) {
  anaContent = anaContent.trim() + '\n' + pumlCU27to31Ana.trim() + '\n';
}
fs.writeFileSync(pumlAnalisis, anaContent, 'utf8');
console.log('diagramas_analisis_clases_todos_cu.puml actualizado exitosamente.');

