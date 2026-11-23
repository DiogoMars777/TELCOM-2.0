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
// 2. PLANTUML ANÁLISIS DE CLASES CICLO 4 (CU24 A CU31)
// =========================================================================
const pumlCiclo4Ana = `
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

    class UI_Proveedor {
        + listarProveedores(): void
        + registrarProveedor(): void
        + actualizarProveedor(): void
        + cambiarEstado(): void
        + mostrarDetalle(): void
    }

    class ProveedorController {
        + index(): void
        + show(): void
        + store(): void
        + update(): void
        + activar(): void
        + desactivar(): void
    }

    class Proveedor {
        - idProveedor: int
        - razonSocial: string
        - nit: string
        - telefono: string
        - correo: string
        - direccion: string
        - estado: boolean
        --
        + create(): void
        + update(): void
    }

    class Usuario {
        - idUsuario: int
        - nombreCompleto: string
        - nombreUsuario: string
        --
        + find(): void
    }

    class Compra {
        - idCompra: int
        - nroComprobante: string
        - fechaCompra: date
        - montoTotal: decimal
        - idProveedor: int
        --
        + find(): void
        + where(): void
    }

    class DetalleCompra {
        - idDetalleCompra: int
        - cantidad: int
        - precioUnitario: decimal
        - subtotal: decimal
        - idCompra: int
        - idProducto: int
        --
        + create(): void
    }

    AdminActor -right- UI_Proveedor
    UI_Proveedor -right- ProveedorController
    ProveedorController -right- Proveedor

    Proveedor "0..*" -up- "1" Usuario
    Proveedor "1" -right- "0..*" Compra
    Compra "1" -right- "1..*" DetalleCompra
}
@enduml

@startuml cu25_analisis_registrar_compra_equipo
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

frame "sd Diagrama de análisis de clases - CU25 Registrar compra de equipos y actualización de stock" {
    actor "Administrador / Almacén" as AdminActor

    class UI_CompraRegistro {
        + listarCompras(): void
        + abrirModalRegistro(): void
        + agregarItemDetalle(): void
        + registrarCompraEquipo(): void
        + verDetalleCompra(): void
    }

    class CompraEquipoRegistroController {
        + index(): void
        + show(): void
        + proveedores(): void
        + productos(): void
        + estados(): void
        + store(): void
    }

    class Compra {
        - idCompra: int
        - nroComprobante: string
        - fechaCompra: date
        - montoTotal: decimal
        - idProveedor: int
        - idEstadoCompra: int
        --
        + create(): void
        + update(): void
    }

    class Proveedor {
        - idProveedor: int
        - razonSocial: string
        - nit: string
        --
        + find(): void
    }

    class EstadoCompra {
        - idEstadoCompra: int
        - nombreEstado: string
        --
        + find(): void
    }

    class DetalleCompra {
        - idDetalleCompra: int
        - cantidad: int
        - precioUnitario: decimal
        - subtotal: decimal
        - idCompra: int
        - idInventario: int
        --
        + create(): void
    }

    class Inventario {
        - idInventario: int
        - stockActual: int
        - idProducto: int
        --
        + increment(): void
    }

    class ProductoEquipo {
        - idProducto: int
        - nombreProducto: string
        - tipoEquipo: string
        --
        + find(): void
    }

    AdminActor -right- UI_CompraRegistro
    UI_CompraRegistro -right- CompraEquipoRegistroController
    CompraEquipoRegistroController -right- Compra

    Compra "0..*" -up- "1" Proveedor
    Compra "0..*" -down- "1" EstadoCompra
    Compra "1" -right- "1..*" DetalleCompra
    DetalleCompra "0..*" -right- "1" Inventario
    Inventario "1" -down- "1" ProductoEquipo
}
@enduml

@startuml cu26_analisis_dashboard_admin_financiero
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

frame "sd Diagrama de análisis de clases - CU26 Visualizar Dashboard administrativo y financiero" {
    actor "Administrador / Secretaría" as AdminActor

    class UI_DashboardAdminFinanciero {
        + consultarDashboard(): void
        + filtrarFinanciero(): void
        + consultarAlertas(): void
        + renderizarKPIs(): void
        + exportarResumen(): void
    }

    class DashboardAdminFinancieroController {
        + index(): void
        + financiero(): void
        + alertas(): void
        + operativo(): void
    }

    class ServicioInternet {
        - idServicio: int
        - codigoServicio: string
        - idCliente: int
        - idPlan: int
        - estadoServicio: string
        --
        + where(): void
        + count(): void
    }

    class Cliente {
        - idCliente: int
        - codigoCliente: string
        - nombreCompleto: string
        - idZona: int
        --
        + find(): void
    }

    class Zona {
        - idZona: int
        - nombreZona: string
        --
        + select(): void
    }

    class PlanInternet {
        - idPlan: int
        - nombrePlan: string
        - precioMensual: decimal
        --
        + find(): void
    }

    class Mensualidad {
        - idMensualidad: int
        - periodo: string
        - monto: decimal
        - estado: string
        - idServicio: int
        --
        + where(): void
        + sum(): void
    }

    class Pago {
        - idPago: int
        - montoTotal: decimal
        - fechaHora: timestamp
        - idMetodoPago: int
        --
        + sum(): void
    }

    class MetodoPago {
        - idMetodoPago: int
        - nombreMetodo: string
        --
        + find(): void
    }

    AdminActor -right- UI_DashboardAdminFinanciero
    UI_DashboardAdminFinanciero -right- DashboardAdminFinancieroController
    DashboardAdminFinancieroController -right- ServicioInternet

    ServicioInternet "0..*" -up- "1" Cliente
    Cliente "0..*" -right- "1" Zona
    ServicioInternet "0..*" -down- "1" PlanInternet
    ServicioInternet "1" -right- "0..*" Mensualidad
    Mensualidad "1" -right- "0..1" Pago
    Pago "0..*" -down- "1" MetodoPago
}
@enduml

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

skinparam actor {
    BackgroundColor #FEFECE
    BorderColor #A80036
}

frame "sd Diagrama de análisis de clases - CU27 Generar y exportar reportes tradicionales" {
    actor "Administrador / Gerencia" as AdminActor

    class UI_ReporteTradicional {
        + consultarCatalogo(): void
        + seleccionarTipoReporte(): void
        + handleGenerarReporte(): void
        + handleExportarExcel(): void
        + handleExportarPdf(): void
    }

    class ReporteTradicionalController {
        + catalogo(): void
        + parametros(): void
        + generar(): void
        + exportarExcel(): void
        + exportarPdf(): void
    }

    class ReporteTradicional {
        + TIPO_CLIENTES_ZONA: string
        + TIPO_INGRESOS_PAGOS: string
        + TIPO_MOROSIDAD_CORTES: string
        + TIPO_EQUIPOS_INSTAL: string
        --
        + catalogo(): void
        + generar(): void
    }

    class Cliente {
        - idCliente: int
        - codigoCliente: string
        - nombreCompleto: string
        - estadoCliente: string
        - idZona: int
        --
        + find(): void
    }

    class Zona {
        - idZona: int
        - nombreZona: string
        - codigo: string
        --
        + select(): void
    }

    class Mensualidad {
        - idMensualidad: int
        - periodo: string
        - monto: decimal
        - estado: string
        --
        + whereIn(): void
    }

    class Pago {
        - idPago: int
        - fechaHora: timestamp
        - montoTotal: decimal
        - idMetodoPago: int
        --
        + whereBetween(): void
    }

    class MetodoPago {
        - idMetodoPago: int
        - nombreMetodo: string
        - descripcion: string
        --
        + find(): void
    }

    AdminActor -right- UI_ReporteTradicional
    UI_ReporteTradicional -right- ReporteTradicionalController
    ReporteTradicionalController -right- ReporteTradicional

    ReporteTradicional "1" -up- "0..*" Cliente
    Cliente "0..*" -right- "1" Zona
    ReporteTradicional "1" -down- "0..*" Mensualidad
    ReporteTradicional "1" -right- "0..*" Pago
    Pago "0..*" -down- "1" MetodoPago
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

skinparam actor {
    BackgroundColor #FEFECE
    BorderColor #A80036
}

frame "sd Diagrama de análisis de clases - CU28 Generar y restaurar copias de seguridad" {
    actor "Administrador del Sistema" as AdminActor

    class UI_CopiasSeguridad {
        + listarCopiasSeguridad(): void
        + submitGenerarBackup(): void
        + descargarCopia(): void
        + ejecutarRestauracion(): void
        + eliminarCopia(): void
    }

    class CopiasSeguridadController {
        + index(): void
        + store(): void
        + download(): void
        + restore(): void
        + destroy(): void
        - resolverBinario(): void
    }

    class CopiaSeguridad {
        - idCopiaSeguridad: int
        - nombreArchivo: string
        - ruta: string
        - tamanoBytes: bigint
        - idUsuario: int
        - descripcion: string
        - tipo: string
        - estado: string
        --
        + create(): void
        + findOrFail(): void
    }

    class Usuario {
        - idUsuario: int
        - nombreCompleto: string
        - idRol: int
        --
        + find(): void
    }

    class Rol {
        - idRol: int
        - nombreRol: string
        - descripcion: string
        --
        + find(): void
    }

    class ConfiguracionBackup {
        - idConfiguracion: int
        - frecuencia: string
        - retencionDias: int
        - rutaDestino: string
        --
        + first(): void
    }

    class RestauracionBackup {
        - idRestauracion: int
        - idCopiaSeguridad: int
        - fechaRestauracion: timestamp
        - estado: string
        - logSalida: text
        --
        + create(): void
        + find(): void
    }

    AdminActor -right- UI_CopiasSeguridad
    UI_CopiasSeguridad -right- CopiasSeguridadController
    CopiasSeguridadController -right- CopiaSeguridad

    CopiaSeguridad "0..*" -up- "1" Usuario
    Usuario "0..*" -right- "1" Rol
    CopiaSeguridad "0..*" -down- "1" ConfiguracionBackup
    CopiaSeguridad "1" -right- "0..*" RestauracionBackup
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

skinparam actor {
    BackgroundColor #FEFECE
    BorderColor #A80036
}

frame "sd Diagrama de análisis de clases - CU29 Capturar y transcribir comandos de voz" {
    actor "Usuario / Operador" as UserActor

    class UI_ComandoVoz {
        + iniciarGrabacion(): void
        + detenerGrabacionYEnviar(): void
        + reproducirAudioGrabado(): void
        + listarHistorial(): void
        + mostrarTranscripcion(): void
    }

    class ComandoVozController {
        + transcribir(): void
        + historial(): void
        + ejemplos(): void
        - clasificarIntencion(): void
        - extraerParametros(): void
        - almacenarAudio(): void
    }

    class ComandoVoz {
        - idComandoVoz: int
        - idUsuario: int
        - textoDictado: text
        - intencion: string
        - parametros: json
        - confianza: float
        - estado: string
        - duracionSegundos: float
        --
        + create(): void
        + interpretar(): void
    }

    class Usuario {
        - idUsuario: int
        - nombreCompleto: string
        - nombreUsuario: string
        --
        + find(): void
    }

    class Zona {
        - idZona: int
        - nombreZona: string
        - codigo: string
        --
        + pluck(): void
    }

    class ReporteTradicional {
        + TIPO_CLIENTES_ZONA: str
        + TIPO_INGRESOS_PAGOS: str
        + TIPO_MOROSIDAD_CORTES: str
        + TIPO_EQUIPOS_INSTAL: str
        --
        + catalogo(): void
        + generar(): void
    }

    class Cliente {
        - idCliente: int
        - codigoCliente: string
        - nombreCompleto: string
        - estadoCliente: string
        --
        + find(): void
        + where(): void
    }

    UserActor -right- UI_ComandoVoz
    UI_ComandoVoz -right- ComandoVozController
    ComandoVozController -right- ComandoVoz

    ComandoVoz "0..*" -up- "1" Usuario
    ComandoVoz "0..*" -down- "0..1" Zona
    ComandoVoz "0..*" -right- "0..1" ReporteTradicional
    ReporteTradicional "1" -right- "0..*" Cliente
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

skinparam actor {
    BackgroundColor #FEFECE
    BorderColor #A80036
}

frame "sd Diagrama de análisis de clases - CU30 Procesar intención de voz con IA (NLP)" {
    actor "Operador / Asistente" as OperadorActor

    class UI_IntencionVoz {
        + escucharVoz(): void
        + enviarTextoComando(): void
        + listarHistorialNLP(): void
        + renderizarRespuesta(): void
        + mostrarDatosEnVivo(): void
    }

    class IntencionVozController {
        + procesar(): void
        + historial(): void
        + intenciones(): void
        + ejemplos(): void
        - clasificarSemantica(): void
        - auditarIntencion(): void
    }

    class IntencionVozIA {
        - idIntencion: int
        - idUsuario: int
        - textoEntrada: text
        - intencionCanonica: string
        - categoria: string
        - confianza: float
        - entidadesExtraidas: json
        - datosEnVivo: json
        --
        + create(): void
        + findOrFail(): void
    }

    class Usuario {
        - idUsuario: int
        - nombreCompleto: string
        - nombreUsuario: string
        --
        + find(): void
    }

    class ComandoVoz {
        - idComandoVoz: int
        - textoDictado: text
        - intencion: string
        - estado: string
        --
        + find(): void
    }

    class Mensualidad {
        - idMensualidad: int
        - periodo: string
        - monto: decimal
        - estado: string
        --
        + where(): void
        + sum(): void
    }

    class Cliente {
        - idCliente: int
        - codigoCliente: string
        - nombreCompleto: string
        - idZona: int
        --
        + find(): void
        + count(): void
    }

    class Zona {
        - idZona: int
        - nombreZona: string
        --
        + pluck(): void
    }

    OperadorActor -right- UI_IntencionVoz
    UI_IntencionVoz -right- IntencionVozController
    IntencionVozController -right- IntencionVozIA

    IntencionVozIA "0..*" -up- "1" Usuario
    IntencionVozIA "0..*" -down- "0..1" ComandoVoz
    IntencionVozIA "1" -right- "0..*" Mensualidad
    Mensualidad "0..*" -right- "1" Cliente
    Cliente "0..*" -down- "1" Zona
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

skinparam actor {
    BackgroundColor #FEFECE
    BorderColor #A80036
}

frame "sd Diagrama de análisis de clases - CU31 Generar reporte inteligente vía comando de voz" {
    actor "Administrador / Gerencia" as AdminActor

    class UI_ReporteInteligente {
        + dictarComandoReporte(): void
        + enviarComandoTexto(): void
        + previsualizarInterpretacion(): void
        + renderizarTablaReporteIA(): void
        + exportarReporte(): void
    }

    class ReporteInteligenteController {
        + generar(): void
        - validarEntrada(): void
        - auditarReporte(): void
        - resolverIntencion(): void
        - ejecutarConsulta(): void
    }

    class ReporteInteligente {
        - idReporte: int
        - tipoReporte: string
        - comandoOrigen: text
        - filtrosAplicados: json
        - filasDevueltas: int
        - idUsuario: int
        - fechaGeneracion: timestamp
        --
        + generar(): void
        + estructurarKPIs(): void
    }

    class Usuario {
        - idUsuario: int
        - nombreCompleto: string
        - email: string
        --
        + find(): void
    }

    class IntencionVozIA {
        - idIntencion: int
        - intencionCanonica: string
        - motor: string
        - entidadesExtraidas: json
        --
        + find(): void
    }

    class Cliente {
        - idCliente: int
        - codigoCliente: string
        - idZona: int
        - estadoCliente: string
        --
        + find(): void
        + get(): void
    }

    class Mensualidad {
        - idMensualidad: int
        - periodo: string
        - monto: decimal
        - estado: string
        --
        + where(): void
    }

    class Pago {
        - idPago: int
        - fechaHora: timestamp
        - montoTotal: decimal
        - idMetodoPago: int
        --
        + find(): void
    }

    AdminActor -right- UI_ReporteInteligente
    UI_ReporteInteligente -right- ReporteInteligenteController
    ReporteInteligenteController -right- ReporteInteligente

    ReporteInteligente "0..*" -up- "1" Usuario
    ReporteInteligente "0..*" -down- "1" IntencionVozIA
    ReporteInteligente "1" -right- "0..*" Cliente
    Cliente "1" -right- "0..*" Mensualidad
    Mensualidad "1" -down- "0..1" Pago
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

// 3. Actualizar Analisis de Clases (CU24 - CU31)
let anaContent = fs.readFileSync(pumlAnalisis, 'utf8');
const cu24Index = anaContent.indexOf('@startuml cu24_analisis_gestionar_proveedores');
if (cu24Index !== -1) {
  anaContent = anaContent.slice(0, cu24Index) + pumlCiclo4Ana.trim() + '\n';
} else {
  anaContent = anaContent.trim() + '\n\n' + pumlCiclo4Ana.trim() + '\n';
}
fs.writeFileSync(pumlAnalisis, anaContent, 'utf8');
console.log('diagramas_analisis_clases_todos_cu.puml actualizado exitosamente.');

