!INC Local Scripts.EAConstants-JScript

/*
 * =================================================================================================
 * Sparx Enterprise Architect - JScript
 * CU26: Visualizar Dashboard administrativo y financiero - Diagrama de Comunicacion en 4 EJES (Ortogonal)
 * Version compacta: elementos agrupados limpiamente, sin exceso de espacio y textos en 2 LINEAS.
 * Sistema: TELCOM ISP Cloud 2.0
 *
 * Estructura del Caso de Uso: CU26 - Visualizar Dashboard administrativo y financiero
 *   - Actor:       Administrador / Secretaría (monitoreo gerencial, operativo y financiero)
 *   - Boundary:    UI_DashboardAdminFinanciero (DashboardAdminFinancieroView.jsx, KPI Cards, Filtros)
 *   - Controlador: DashboardAdminFinancieroControlador (Centro / Hub - DashboardMetricasService)
 *   - Entidades involucradas (Distribucion Ortogonal en 4 EJES - CERO DIAGONALES):
 *       * Eje Oeste (Izquierda):        Actor y UI
 *       * Eje Central (Centro / Hub):   DashboardAdminFinancieroControlador
 *       * Eje Norte (Arriba):           Pago (recaudacion periodo/hoy)
 *       * Eje Norte-Este (Der de Pago): Mensualidad (cartera vencida en mora y serie semestral)
 *       * Eje Este (Derecha):           Cliente (abonados activos y deudores criticos con telefono)
 *       * Eje Sur (Abajo):              ServicioInternet (servicios activos y cortes)
 *       * Eje Sur-Este (Der Servicio):  PlanInternet (distribucion de planes y abonados vigentes)
 *       * Eje Sur-Oeste (Izq Servicio): Zona (saturacion de nodos y cobertura geografica)
 *
 * Metodos exactos del CU26 en el controlador (DashboardAdminFinancieroControlador):
 *   1. index(request)       -> Consolidado general ejecutivo y KPIs en tiempo real
 *   2. financiero(request)  -> Metricas financieras, canales QR/Efectivo y evolucion 6 meses
 *   3. operativo(request)   -> Metricas de red, cuadrillas, stock comodato y zonas
 *   4. alertas(request)     -> Alertas predictivas de morosidad critica y mora acumulada
 * =================================================================================================
 */

var PACKAGE_NAME = "CU26 - SD 4 Ejes";
var DIAGRAM_NAME = "sd CU26 Visualizar Dashboard (Compacto 4 Ejes)";

// Fallback seguro para promptOK si el include de EA no lo inicializa en tiempo de carga
var PROMPT_OK = (typeof promptOK !== "undefined") ? promptOK : 0;

// Paleta COLORREF para Enterprise Architect (0x00BBGGRR)
var NEGRO     = 0;          // Flujo 1: Consolidado General / KPIs
var AZUL      = 16711680;   // Flujo 2: Metricas Financieras y Canales
var VERDE     = 32768;      // Flujo 3: Metricas Operativas y Red
var ROJO      = 255;        // Flujo 4: Alertas de Morosidad Critica
var NARANJA   = 33023;      // Flujo 5: Auditoria y Trazabilidad
var BLANCO    = 16777215;

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

function crearElemento(paquete, nombre, tipo, estereotipo, notas) {
    var elemento = paquete.Elements.AddNew(nombre, tipo);
    elemento.Stereotype = estereotipo || "";
    elemento.Notes = notas || "";
    guardar(elemento, "el elemento " + nombre);
    paquete.Elements.Refresh();
    return elemento;
}

function colocar(diagrama, elemento, izquierda, derecha, arriba, abajo) {
    var posicion =
        "l=" + izquierda + ";r=" + derecha + ";t=" + arriba + ";b=" + abajo + ";";
    var figura = diagrama.DiagramObjects.AddNew(posicion, "");
    figura.ElementID = elemento.ElementID;
    guardar(figura, "la figura " + elemento.Name);
    diagrama.DiagramObjects.Refresh();
    return figura;
}

function crearTexto(paquete, diagrama, texto, color, izquierda, derecha, arriba, abajo, negrita) {
    var elemento = paquete.Elements.AddNew("", "Text");
    elemento.Notes = texto;
    guardar(elemento, "el texto " + texto);
    paquete.Elements.Refresh();

    var figura = colocar(diagrama, elemento, izquierda, derecha, arriba, abajo);
    figura.FontColor = color;
    figura.FontName = "Arial";
    figura.FontSize = negrita ? "11" : "8";
    figura.FontBold = (negrita === true);
    guardar(figura, "el formato del texto");
    return figura;
}

// 1. Mensaje Horizontal (Flecha hacia la derecha: ━━▶) con soporte para 2 lineas
function crearMensajeHorizontal(paquete, diagrama, texto, color, izquierda, derecha, arriba, abajo) {
    var anchoFlecha = 38;
    var flechaSimbolo = "\u2501\u2501\u25B6"; // ━━▶

    crearTexto(
        paquete,
        diagrama,
        texto,
        color,
        izquierda,
        derecha - anchoFlecha - 5,
        arriba,
        abajo,
        false
    );

    crearTexto(
        paquete,
        diagrama,
        flechaSimbolo,
        color,
        derecha - anchoFlecha,
        derecha,
        arriba + 6, // Centrado visual vertical para 2 lineas
        abajo,
        false
    );
}

// 2. Mensaje Vertical hacia ARRIBA (Flecha: │▲) con soporte para 2 lineas
function crearMensajeArriba(paquete, diagrama, texto, color, izquierda, derecha, arriba, abajo) {
    var anchoFlecha = 28;
    var flechaSimbolo = "\u2502\u25B2"; // │▲

    crearTexto(
        paquete,
        diagrama,
        texto,
        color,
        izquierda,
        derecha - anchoFlecha - 5,
        arriba,
        abajo,
        false
    );

    crearTexto(
        paquete,
        diagrama,
        flechaSimbolo,
        color,
        derecha - anchoFlecha,
        derecha,
        arriba + 6,
        abajo,
        false
    );
}

// 3. Mensaje Vertical hacia ABAJO (Flecha: │▼) con soporte para 2 lineas
function crearMensajeAbajo(paquete, diagrama, texto, color, izquierda, derecha, arriba, abajo) {
    var anchoFlecha = 28;
    var flechaSimbolo = "\u2502\u25BC"; // │▼

    crearTexto(
        paquete,
        diagrama,
        texto,
        color,
        izquierda,
        derecha - anchoFlecha - 5,
        arriba,
        abajo,
        false
    );

    crearTexto(
        paquete,
        diagrama,
        flechaSimbolo,
        color,
        derecha - anchoFlecha,
        derecha,
        arriba + 6,
        abajo,
        false
    );
}

function unir(origen, destino) {
    var conector = origen.Connectors.AddNew("", "Association");
    conector.SupplierID = destino.ElementID;
    conector.Direction = "Unspecified";
    conector.Width = 1;
    guardar(conector, "la conexion entre " + origen.Name + " y " + destino.Name);
    origen.Connectors.Refresh();
}

function main() {
    Repository.EnsureOutputVisible("Script");

    var padre = Repository.GetTreeSelectedPackage();
    if (!padre || padre.PackageID == 0) {
        Session.Prompt("Seleccione primero un paquete padre en el Project Browser.", PROMPT_OK);
        return;
    }

    if (buscarPaquete(padre, PACKAGE_NAME) != null) {
        Session.Prompt(
            "Ya existe el paquete '" + PACKAGE_NAME + "'. Eliminelo antes de ejecutar otra vez.",
            PROMPT_OK
        );
        return;
    }

    try {
        var paquete = padre.Packages.AddNew(PACKAGE_NAME, "");
        paquete.Notes = "Diagrama de comunicacion ortogonal en 4 ejes del CU26 compacto y con textos en 2 lineas.";
        guardar(paquete, "el paquete CU26");
        padre.Packages.Refresh();

        var diagrama = paquete.Diagrams.AddNew(DIAGRAM_NAME, "Communication");
        guardar(diagrama, "el diagrama CU26");
        paquete.Diagrams.Refresh();

        // Marco visual contenedor compacto (1320 x 870)
        var marco = crearElemento(paquete, "", "Boundary", "", "Marco visual");
        var marcoFigura = colocar(diagrama, marco, 10, 1320, 10, 870);
        marcoFigura.BackgroundColor = BLANCO;
        marcoFigura.BorderColor = NEGRO;
        marcoFigura.BorderLineWidth = 1;
        guardar(marcoFigura, "el marco blanco");

        // Titulo del diagrama
        crearTexto(
            paquete,
            diagrama,
            "sd CU26 Visualizar Dashboard Administrativo y Financiero (Distribucion Compacta en 4 Ejes - Textos en 2 Lineas)",
            NEGRO,
            25,
            1100,
            25,
            60,
            true
        );

        // =====================================================================
        // ELEMENTOS ARQUITECTONICOS BCE Y MULTI-TABLA
        // =====================================================================
        var actor = crearElemento(
            paquete,
            "Administrador / Secretaría",
            "Actor",
            "",
            "Personal facultado para visualizar indicadores gerenciales, cobranzas, red y alertas."
        );
        var ui = crearElemento(
            paquete,
            "UI_DashboardAdminFinanciero",
            "Object",
            "boundary",
            "Interfaz web del CU26 (DashboardAdminFinancieroView.jsx, tarjetas KPI y graficos)."
        );
        var controlador = crearElemento(
            paquete,
            "DashboardAdminFinancieroControlador",
            "Object",
            "control",
            "Controlador Laravel del CU26 con metodos index, financiero, operativo y alertas."
        );

        // Entidades del dominio TELCOM
        var pago = crearElemento(
            paquete,
            "Pago",
            "Object",
            "entity",
            "Tabla 'Pago' / 'MetodoPago': recaudacion en tiempo real, pagos diarios y canales."
        );
        var mensualidad = crearElemento(
            paquete,
            "Mensualidad",
            "Object",
            "entity",
            "Tabla 'Mensualidad': facturacion del ciclo, cartera vencida en mora y serie historica."
        );
        var cliente = crearElemento(
            paquete,
            "Cliente",
            "Object",
            "entity",
            "Tabla 'Cliente': abonados activos registrados y clientes deudores criticos."
        );
        var servicioInternet = crearElemento(
            paquete,
            "ServicioInternet",
            "Object",
            "entity",
            "Tabla 'ServicioInternet' / 'EstadoServicio': servicios activos, cortados y suspendidos."
        );
        var planInternet = crearElemento(
            paquete,
            "PlanInternet",
            "Object",
            "entity",
            "Tabla 'PlanInternet' / 'AsignacionPlan': abonados vigentes y cuota por plan."
        );
        var zona = crearElemento(
            paquete,
            "Zona",
            "Object",
            "entity",
            "Tabla 'Zona': capacidad de nodos de red y porcentaje de saturacion de cobertura."
        );

        // =====================================================================
        // DISTRIBUCION TOPOLOGICA EN 4 EJES COMPACTA (ESPACIADO CONTROLADO)
        // =====================================================================
        // Eje Oeste (Izquierda horizontal)
        colocar(diagrama, actor,                 50,  170, 380, 540); // Figura actor (W=120, H=160)
        colocar(diagrama, ui,                   360,  480, 410, 510); // Boundary UI   (W=120, H=100)

        // Eje Central (Centro / Hub)
        colocar(diagrama, controlador,          710,  830, 410, 510); // Controlador central (W=120, H=100)

        // Eje Norte (Arriba vertical)
        colocar(diagrama, pago,                 710,  830, 130, 230); // Arriba del controlador (W=120, H=100)
        colocar(diagrama, mensualidad,         1090, 1210, 130, 230); // A la derecha de Pago (W=120, H=100)

        // Eje Este (Derecha horizontal)
        colocar(diagrama, cliente,             1090, 1210, 410, 510); // A la derecha del controlador (W=120, H=100)

        // Eje Sur (Abajo vertical)
        colocar(diagrama, servicioInternet,     710,  830, 690, 790); // Abajo del controlador (W=120, H=100)
        colocar(diagrama, planInternet,        1090, 1210, 690, 790); // A la derecha de ServicioInternet
        colocar(diagrama, zona,                 360,  480, 690, 790); // Abajo de UI (A la izquierda de Servicio)

        // =====================================================================
        // ENLACES ASOCIATIVOS (100% ORTOGONALES)
        // =====================================================================
        unir(actor, ui);                                // Horizontal Oeste
        unir(ui, controlador);                          // Horizontal Oeste
        unir(controlador, pago);                        // Vertical Arriba
        unir(pago, mensualidad);                        // Horizontal Derecha (Norte-Este)
        unir(controlador, cliente);                     // Horizontal Derecha (Este)
        unir(controlador, servicioInternet);            // Vertical Abajo
        unir(servicioInternet, planInternet);           // Horizontal Derecha (Sur-Este)
        unir(zona, servicioInternet);                   // Horizontal Izquierda (Sur-Oeste)

        // =====================================================================
        // 1. EJE OESTE: ACTOR -> UI (Horizontal - Flecha ━━▶ - Textos en 2 lineas)
        // =====================================================================
        crearMensajeHorizontal(paquete, diagrama, "1: consultarDashboard()\n(periodo, filtros)", NEGRO, 180, 350, 260, 294);
        crearMensajeHorizontal(paquete, diagrama, "2: filtrarFinanciero()\n(periodo, canales)", AZUL, 180, 350, 304, 338);
        crearMensajeHorizontal(paquete, diagrama, "3: consultarOperativo()\n(red, cuadrillas, zonas)", VERDE, 180, 350, 348, 382);
        crearMensajeHorizontal(paquete, diagrama, "4: consultarAlertasMora()\n(morosidad critica)", ROJO, 180, 350, 392, 426);

        // =====================================================================
        // 2. EJE OESTE: UI -> CONTROLADOR (Horizontal - Flecha ━━▶ - Textos en 2 lineas)
        // Metodos exactos de DashboardAdminFinancieroControlador
        // =====================================================================
        crearMensajeHorizontal(paquete, diagrama, "1.1: index(request)\n[obtenerResumenCompleto]", NEGRO, 490, 700, 260, 294);
        crearMensajeHorizontal(paquete, diagrama, "2.1: financiero(request)\n[metricasFinancieras]", AZUL, 490, 700, 304, 338);
        crearMensajeHorizontal(paquete, diagrama, "3.1: operativo(request)\n[metricasOperativas]", VERDE, 490, 700, 348, 382);
        crearMensajeHorizontal(paquete, diagrama, "4.1: alertas(request)\n[alertasMorosidad]", ROJO, 490, 700, 392, 426);

        // =====================================================================
        // 3. EJE NORTE: CONTROLADOR -> Pago (Vertical hacia ARRIBA - Flecha │▲)
        // =====================================================================
        crearMensajeArriba(paquete, diagrama, "1.2: sum('montoTotal')\n[recaudacion periodo/hoy]", NEGRO, 390, 700, 270, 304);
        crearMensajeArriba(paquete, diagrama, "2.2: groupBy('MetodoPago')\n[canales QR / Efectivo]", AZUL, 390, 700, 320, 354);

        // =====================================================================
        // 4. EJE NORTE-ESTE: Pago -> Mensualidad (Horizontal - Flecha ━━▶)
        // =====================================================================
        crearMensajeHorizontal(paquete, diagrama, "1.3: where('estado','PENDIENTE')\n[cartera en mora acumulada]", NEGRO, 840, 1080, 140, 174);
        crearMensajeHorizontal(paquete, diagrama, "2.3: selectRaw('sum(monto)')\n[serie semestral facturacion]", AZUL, 840, 1080, 184, 218);
        crearMensajeHorizontal(paquete, diagrama, "4.2: orderByDesc('total_deuda')\n[cuentas morosidad critica]", ROJO, 840, 1080, 228, 262);

        // =====================================================================
        // 5. EJE ESTE: CONTROLADOR -> Cliente (Horizontal - Flecha ━━▶)
        // =====================================================================
        crearMensajeHorizontal(paquete, diagrama, "1.4: where('estadoCliente','ACTIVO')\n[conteo abonados en red]", NEGRO, 840, 1080, 420, 454);
        crearMensajeHorizontal(paquete, diagrama, "4.3: findOrFail(idCliente)\n[datos contacto para cobranza]", ROJO, 840, 1080, 464, 498);

        // =====================================================================
        // 6. EJE SUR: CONTROLADOR -> ServicioInternet (Vertical hacia ABAJO - Flecha │▼)
        // =====================================================================
        crearMensajeAbajo(paquete, diagrama, "1.5: leftJoin('EstadoServicio')\n[servicios activos / corte]", NEGRO, 390, 700, 550, 584);
        crearMensajeAbajo(paquete, diagrama, "3.2: groupBy('nombreEstado')\n[monitoreo estado de red]", VERDE, 390, 700, 600, 634);

        // =====================================================================
        // 7. EJE SUR-ESTE: ServicioInternet -> PlanInternet (Horizontal - Flecha ━━▶)
        // =====================================================================
        crearMensajeHorizontal(paquete, diagrama, "1.6: whereNull('fechaFin')\n[distribucion por plan]", NEGRO, 840, 1080, 700, 734);
        crearMensajeHorizontal(paquete, diagrama, "3.3: calcularIngresoEstimado()\n[velocidad Mbps y cuota]", VERDE, 840, 1080, 744, 778);

        // =====================================================================
        // 8. EJE SUR-OESTE: Zona -> ServicioInternet (Horizontal - Flecha ━━▶)
        // =====================================================================
        crearMensajeHorizontal(paquete, diagrama, "1.7: withCount('servicios')\n[saturacion de nodos %]", NEGRO, 490, 700, 710, 744);

        // Abrir y seleccionar el diagrama generado
        diagrama.Update();
        Repository.OpenDiagram(diagrama.DiagramID);
        Repository.ReloadDiagram(diagrama.DiagramID);

        Session.Prompt("Diagrama CU26 compacto en 4 ejes creado correctamente.", PROMPT_OK);
    } catch (e) {
        Session.Prompt("Error al generar el diagrama CU26: " + (e.message || e), PROMPT_OK);
    }
}

main();
