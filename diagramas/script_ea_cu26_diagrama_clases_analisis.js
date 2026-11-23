!INC Local Scripts.EAConstants-JScript

/*
 * =================================================================================================
 * Sparx Enterprise Architect - JScript
 * Diagrama de Clases de Análisis (VOPC / BCE / Robustez): CU26 - Visualizar Dashboard administrativo y financiero
 * Contexto: Proyecto "TELCOM ISP Cloud 2.0" (Laravel 11 + PostgreSQL)
 *
 * Componentes del diagrama:
 *  - Actor: Administrador / Secretaría (Personal directivo y operativo con permisos reportes.view)
 *  - Boundary: UI_DashboardAdminFinanciero (DashboardAdminFinancieroView.jsx, tarjetas KPI, filtros)
 *  - Control: DashboardAdminFinancieroControlador (Controlador API Laravel + DashboardMetricasService)
 *  - Entity: Pago (Tabla DB: Pago - recaudación diaria, tickets y métodos de cobranza)
 *  - Entity: Mensualidad (Tabla DB: Mensualidad - facturación del ciclo, mora acumulada y serie semestral)
 *  - Entity: Cliente (Tabla DB: Cliente - abonados activos y clientes con cartera vencida)
 *  - Entity: ServicioInternet (Tabla DB: ServicioInternet - monitoreo de servicios activos, en corte y suspendidos)
 *  - Entity: Bitacora (Tabla DB: Bitacora - trazabilidad y auditoría de consulta gerencial CU02)
 * =================================================================================================
 */

var PACKAGE_NAME = "CU26 - Clases de analisis";
var DIAGRAM_NAME = "CU26 Visualizar Dashboard administrativo y financiero";

// Fallback seguro para promptOK si el include de EA no lo inicializa en tiempo de carga
var PROMPT_OK = (typeof promptOK !== "undefined") ? promptOK : 0;

function guardar(objeto, descripcion) {
    if (!objeto.Update()) {
        throw new Error("No se pudo guardar " + descripcion + ". " + objeto.GetLastError());
    }
}

function buscarPaquete(padre, nombre) {
    padre.Packages.Refresh();
    for (var i = 0; i < padre.Packages.Count; i++) {
        var paquete = padre.Packages.GetAt(i);
        if (paquete.Name == nombre) return paquete;
    }
    return null;
}

function crearClase(paquete, nombre, notas, estereotipo) {
    var elemento = paquete.Elements.AddNew(nombre, "Class");
    elemento.Stereotype = estereotipo || "";
    elemento.Notes = notas || "";
    guardar(elemento, "la clase " + nombre);
    paquete.Elements.Refresh();
    return elemento;
}

function crearActor(paquete, nombre, notas) {
    var actor = paquete.Elements.AddNew(nombre, "Actor");
    actor.Notes = notas || "";
    guardar(actor, "el actor " + nombre);
    paquete.Elements.Refresh();
    return actor;
}

function agregarAtributo(clase, nombre, tipo, visibilidad) {
    var attr = clase.Attributes.AddNew(nombre, tipo || "string");
    attr.Visibility = visibilidad || "Private"; // Muestra '-'
    guardar(attr, "el atributo " + nombre + " de " + clase.Name);
    clase.Attributes.Refresh();
    return attr;
}

function agregarMetodo(clase, nombre, tipoRetorno, visibilidad) {
    var meth = clase.Methods.AddNew(nombre, tipoRetorno || "void");
    meth.Visibility = visibilidad || "Public"; // Muestra '+'
    meth.ReturnType = tipoRetorno || "void";
    guardar(meth, "el metodo " + nombre + " de " + clase.Name);
    clase.Methods.Refresh();
    return meth;
}

function colocar(diagrama, elemento, izquierda, derecha, arriba, abajo) {
    var posicion = "l=" + izquierda + ";r=" + derecha + ";t=" + arriba + ";b=" + abajo + ";";
    var figura = diagrama.DiagramObjects.AddNew(posicion, "");
    figura.ElementID = elemento.ElementID;
    guardar(figura, "la figura " + elemento.Name);
    diagrama.DiagramObjects.Refresh();
    return figura;
}

function crearAsociacion(origen, destino, multiplicidadOrigen, multiplicidadDestino, nombreAsociacion) {
    var conn = origen.Connectors.AddNew(nombreAsociacion || "", "Association");
    conn.SupplierID = destino.ElementID;
    conn.Direction = "Unspecified";
    if (multiplicidadOrigen && multiplicidadOrigen !== "") {
        conn.ClientEnd.Cardinality = multiplicidadOrigen;
    }
    if (multiplicidadDestino && multiplicidadDestino !== "") {
        conn.SupplierEnd.Cardinality = multiplicidadDestino;
    }
    guardar(conn, "la asociacion entre " + origen.Name + " y " + destino.Name);
    origen.Connectors.Refresh();
    return conn;
}

function main() {
    Repository.EnsureOutputVisible("Script");

    var padre = Repository.GetTreeSelectedPackage();
    if (!padre || padre.PackageID == 0) {
        Session.Prompt("Seleccione primero un paquete padre en el Project Browser.", PROMPT_OK);
        return;
    }

    var existente = buscarPaquete(padre, PACKAGE_NAME);
    if (existente != null) {
        for (var i = padre.Packages.Count - 1; i >= 0; i--) {
            if (padre.Packages.GetAt(i).PackageID == existente.PackageID) {
                padre.Packages.Delete(i);
                break;
            }
        }
        padre.Packages.Refresh();
    }

    try {
        var paquete = padre.Packages.AddNew(PACKAGE_NAME, "");
        paquete.Notes = "Diagrama de clases de analisis del Caso de Uso 26 (Visualizar Dashboard administrativo y financiero) en TELCOM ISP Cloud 2.0.";
        guardar(paquete, "el paquete CU26");
        padre.Packages.Refresh();

        // Diagrama de tipo "Logical" (UML Class Diagram en Enterprise Architect)
        var diagrama = paquete.Diagrams.AddNew(DIAGRAM_NAME, "Logical");
        guardar(diagrama, "el diagrama de clases CU26");
        paquete.Diagrams.Refresh();

        // =====================================================================
        // 1. ACTOR
        // =====================================================================
        var actor = crearActor(
            paquete,
            "Administrador / Secretaría",
            "Personal con rol gerencial o administrativo facultado para supervisar finanzas, recaudacion y operaciones de red (Permiso: reportes.view)."
        );

        // =====================================================================
        // 2. BOUNDARY (Interfaz de Usuario)
        // =====================================================================
        var ui = crearClase(
            paquete,
            "UI_DashboardAdminFinanciero",
            "Interfaz web del CU26 (DashboardAdminFinancieroView.jsx, tarjetas de resumen KPI, graficos semestrales y tabla de morosidad critica)."
        );
        agregarMetodo(ui, "cambiarPeriodo", "void", "Public");
        agregarMetodo(ui, "cambiarPestana", "void", "Public");
        agregarMetodo(ui, "exportarReporte", "void", "Public");
        agregarMetodo(ui, "recargarMetricas", "void", "Public");

        // =====================================================================
        // 3. CONTROL (Controlador Laravel)
        // =====================================================================
        var controlador = crearClase(
            paquete,
            "DashboardAdminFinancieroControlador",
            "Controlador Laravel y servicio DashboardMetricasService que consolida KPIs financieros, operativos, morosidad y auditoria."
        );
        agregarMetodo(controlador, "alertas", "JsonResponse", "Public");
        agregarMetodo(controlador, "financiero", "JsonResponse", "Public");
        agregarMetodo(controlador, "index", "JsonResponse", "Public");
        agregarMetodo(controlador, "operativo", "JsonResponse", "Public");

        // =====================================================================
        // 4. ENTITY: Pago (Tabla: Pago - Arriba de DashboardAdminFinancieroControlador)
        // =====================================================================
        var pago = crearClase(
            paquete,
            "Pago",
            "Registro de cobranzas efectivas realizadas por ventanilla, QR bancario o transferencias (Tabla: Pago)."
        );
        agregarAtributo(pago, "fechaHora", "timestamp", "Private");
        agregarAtributo(pago, "idMensualidad", "int", "Private");
        agregarAtributo(pago, "idMetodoPago", "int", "Private");
        agregarAtributo(pago, "idPago", "int", "Private");
        agregarAtributo(pago, "montoTotal", "decimal", "Private");
        agregarAtributo(pago, "numeroComprobante", "string", "Private");

        agregarMetodo(pago, "count", "int", "Public");
        agregarMetodo(pago, "sum", "decimal", "Public");
        agregarMetodo(pago, "whereDate", "Builder", "Public");

        // =====================================================================
        // 5. ENTITY: Mensualidad (Tabla: Mensualidad - Arriba Derecha)
        // =====================================================================
        var mensualidad = crearClase(
            paquete,
            "Mensualidad",
            "Ciclos de facturacion mensual, cartera en mora acumulada y determinacion de vencimientos (Tabla: Mensualidad)."
        );
        agregarAtributo(mensualidad, "estado", "string", "Private");
        agregarAtributo(mensualidad, "fechaEmision", "date", "Private");
        agregarAtributo(mensualidad, "fechaVencimiento", "date", "Private");
        agregarAtributo(mensualidad, "idCliente", "int", "Private");
        agregarAtributo(mensualidad, "idMensualidad", "int", "Private");
        agregarAtributo(mensualidad, "idServicio", "int", "Private");
        agregarAtributo(mensualidad, "monto", "decimal", "Private");
        agregarAtributo(mensualidad, "periodo", "string", "Private");

        agregarMetodo(mensualidad, "count", "int", "Public");
        agregarMetodo(mensualidad, "orderByDesc", "Builder", "Public");
        agregarMetodo(mensualidad, "sum", "decimal", "Public");
        agregarMetodo(mensualidad, "where", "Builder", "Public");

        // =====================================================================
        // 6. ENTITY: Cliente (Tabla: Cliente - Centro-Derecha)
        // =====================================================================
        var cliente = crearClase(
            paquete,
            "Cliente",
            "Registro de titulares abonados, validacion de estado activo y datos de contacto para cobranza critica (Tabla: Cliente)."
        );
        agregarAtributo(cliente, "codigoCliente", "string", "Private");
        agregarAtributo(cliente, "direccion", "string", "Private");
        agregarAtributo(cliente, "estadoCliente", "string", "Private");
        agregarAtributo(cliente, "fechaRegistro", "date", "Private");
        agregarAtributo(cliente, "idCliente", "int", "Private");
        agregarAtributo(cliente, "idZona", "int", "Private");
        agregarAtributo(cliente, "nombreCompleto", "string", "Private");
        agregarAtributo(cliente, "telefonoPrincipal", "string", "Private");

        agregarMetodo(cliente, "count", "int", "Public");
        agregarMetodo(cliente, "find", "Cliente", "Public");
        agregarMetodo(cliente, "where", "Builder", "Public");

        // =====================================================================
        // 7. ENTITY: ServicioInternet (Tabla: ServicioInternet - Abajo Derecha)
        // =====================================================================
        var servicioInternet = crearClase(
            paquete,
            "ServicioInternet",
            "Servicios residenciales y corporativos, evaluacion de estado (activo/corte/suspendido) y nodo asignado (Tabla: ServicioInternet)."
        );
        agregarAtributo(servicioInternet, "codigoServicio", "string", "Private");
        agregarAtributo(servicioInternet, "fechaActivacion", "date", "Private");
        agregarAtributo(servicioInternet, "idCliente", "int", "Private");
        agregarAtributo(servicioInternet, "idEstadoServicio", "int", "Private");
        agregarAtributo(servicioInternet, "idPlan", "int", "Private");
        agregarAtributo(servicioInternet, "idServicio", "int", "Private");
        agregarAtributo(servicioInternet, "ipAsignada", "string", "Private");

        agregarMetodo(servicioInternet, "count", "int", "Public");
        agregarMetodo(servicioInternet, "groupBy", "Builder", "Public");
        agregarMetodo(servicioInternet, "where", "Builder", "Public");

        // =====================================================================
        // 8. ENTITY: Bitacora (Tabla: Bitacora - Abajo de Controlador)
        // =====================================================================
        var bitacora = crearClase(
            paquete,
            "Bitacora",
            "Trazabilidad inmutable de accesos y consultas a la informacion financiera confidencial (Tabla: Bitacora / AuditLogger)."
        );
        agregarAtributo(bitacora, "accion", "string", "Private");
        agregarAtributo(bitacora, "casoUso", "string", "Private");
        agregarAtributo(bitacora, "detalles", "text", "Private");
        agregarAtributo(bitacora, "fechaHora", "timestamp", "Private");
        agregarAtributo(bitacora, "idBitacora", "int", "Private");
        agregarAtributo(bitacora, "idUsuario", "int", "Private");
        agregarAtributo(bitacora, "ip", "string", "Private");

        agregarMetodo(bitacora, "create", "Bitacora", "Public");
        agregarMetodo(bitacora, "where", "Builder", "Public");

        // =====================================================================
        // ASOCIACIONES Y MULTIPLICIDADES EXACTAS
        // =====================================================================
        // Actor -> UI
        crearAsociacion(actor, ui, "", "", "");

        // UI -> Controlador
        crearAsociacion(ui, controlador, "", "", "");

        // Controlador -> Pago (1 a 0..*, label: 'calcula recaudacion')
        crearAsociacion(controlador, pago, "1", "0..*", "calcula recaudacion");

        // Controlador -> Mensualidad (1 a 0..*, label: 'monitorea mora')
        crearAsociacion(controlador, mensualidad, "1", "0..*", "monitorea mora");

        // Controlador -> Cliente (1 a 0..*, label: 'consolida abonados')
        crearAsociacion(controlador, cliente, "1", "0..*", "consolida abonados");

        // Controlador -> ServicioInternet (1 a 0..*, label: 'evalua estado red')
        crearAsociacion(controlador, servicioInternet, "1", "0..*", "evalua estado red");

        // Controlador -> Bitacora (1 a 0..*, label: 'registra auditoria')
        crearAsociacion(controlador, bitacora, "1", "0..*", "registra auditoria");

        // Relaciones entre Entidades del Dominio
        // Cliente -> ServicioInternet (1 a 1..*, label: 'posee')
        crearAsociacion(cliente, servicioInternet, "1", "1..*", "posee");

        // ServicioInternet -> Mensualidad (1 a 0..*, label: 'genera')
        crearAsociacion(servicioInternet, mensualidad, "1", "0..*", "genera");

        // Mensualidad -> Pago (1 a 0..1, label: 'cancela con')
        crearAsociacion(mensualidad, pago, "1", "0..1", "cancela con");

        // =====================================================================
        // POSICIONAMIENTO EN EL DIAGRAMA (Coordenadas armonicas)
        // =====================================================================
        // Pago (Arriba del controlador)
        colocar(diagrama, pago,             420,  640,   40,  230);

        // Mensualidad (Arriba a la derecha)
        colocar(diagrama, mensualidad,      740,  980,   40,  260);

        // Actor (Extremo izquierdo)
        colocar(diagrama, actor,             30,  120,  320,  460);

        // UI_DashboardAdminFinanciero (Entre Actor y Controlador)
        colocar(diagrama, ui,               160,  360,  310,  470);

        // DashboardAdminFinancieroControlador (Centro)
        colocar(diagrama, controlador,     420,  680,  310,  470);

        // Cliente (Centro-Derecha)
        colocar(diagrama, cliente,          740,  980,  320,  560);

        // Bitacora (Abajo del controlador)
        colocar(diagrama, bitacora,         420,  650,  580,  790);

        // ServicioInternet (Abajo a la derecha)
        colocar(diagrama, servicioInternet, 740,  980,  620,  850);

        diagrama.DiagramObjects.Refresh();
        diagrama.DiagramLinks.Refresh();
        guardar(diagrama, "el diagrama terminado");

        Repository.RefreshModelView(paquete.PackageID);
        Repository.OpenDiagram(diagrama.DiagramID);
        Repository.ReloadDiagram(diagrama.DiagramID);

        Session.Prompt("El Diagrama de Clases de Analisis del CU26 fue creado exitosamente.", PROMPT_OK);
    } catch (error) {
        Session.Prompt("No se pudo crear el diagrama: " + error.message, PROMPT_OK);
    }
}

main();
