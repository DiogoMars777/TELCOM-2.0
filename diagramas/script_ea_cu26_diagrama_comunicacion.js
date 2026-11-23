!INC Local Scripts.EAConstants-JScript

/**
 * ============================================================================
 * SCRIPT PARA ENTERPRISE ARCHITECT: Diagrama de Comunicación BCE - CU26
 * "sd CU26 Visualizar Dashboard administrativo y financiero"
 * ============================================================================
 *
 * Basado en la arquitectura BCE (Boundary-Control-Entity) y el código real de:
 * - App\Http\Controllers\Paquetes\P7_DashboardReportesInteligenciaVoz\CU26_VisualizarDashboardAdminFinanciero\DashboardAdminFinancieroController
 * - App\Services\Paquetes\P7_DashboardReportesInteligenciaVoz\CU26_VisualizarDashboardAdminFinanciero\DashboardMetricasService
 * - Frontend React: DashboardAdminFinancieroView / useDashboardAdminFinancieroController
 * - Tablas canónicas: Pago, Mensualidad, Cliente, ServicioInternet, PlanInternet, Zona, Bitacora
 *
 * INSTRUCCIONES DE USO EN ENTERPRISE ARCHITECT:
 * 1. Abre Enterprise Architect con tu proyecto (.qea / .feap / .eap).
 * 2. Presiona [Alt + F11] para abrir la ventana de Scripting (o menú Tools > Scripting).
 * 3. Crea un nuevo Script de tipo "JScript" (o abre uno existente).
 * 4. Pega todo el contenido de este script y presiona Guardar.
 * 5. En el "Project Browser", haz clic sobre el Paquete donde deseas que se cree el diagrama.
 * 6. Presiona [F5] o clic derecho en el script > "Run Script".
 * 7. El diagrama se creará, organizará y abrirá automáticamente en pantalla.
 * ============================================================================
 */

function Main()
{
    var currentPackage as EA.Package;
    currentPackage = Repository.GetTreeSelectedPackage();

    if (currentPackage == null)
    {
        Session.Prompt("Por favor, selecciona un Paquete en el Project Browser antes de ejecutar.", promptOK);
        return;
    }

    Session.Output("=================================================================");
    Session.Output("Iniciando creación del Diagrama de Comunicación para CU26...");
    Session.Output("Paquete destino: " + currentPackage.Name);

    // 1. Crear / obtener Actor
    var actor = getOrCreateElement(currentPackage, "Administrador / Secretaría", "Actor");

    // 2. Crear elementos BCE (Boundary, Control, Entity)
    var boundary = getOrCreateElement(currentPackage, "UI_DashboardAdminFinanciero", "Boundary");
    var control  = getOrCreateElement(currentPackage, "DashboardAdminFinancieroController", "Control");

    var entityPago        = getOrCreateElement(currentPackage, "Pago", "Entity");
    var entityMensualidad = getOrCreateElement(currentPackage, "Mensualidad", "Entity");
    var entityCliente     = getOrCreateElement(currentPackage, "Cliente", "Entity");
    var entityServicio    = getOrCreateElement(currentPackage, "ServicioInternet", "Entity");
    var entityPlan        = getOrCreateElement(currentPackage, "PlanInternet", "Entity");
    var entityZona        = getOrCreateElement(currentPackage, "Zona", "Entity");
    var entityBitacora    = getOrCreateElement(currentPackage, "Bitacora", "Entity");

    // 3. Crear el Diagrama de Comunicación
    var diagram as EA.Diagram;
    diagram = currentPackage.Diagrams.AddNew("CU26_Comunicacion_DashboardAdminFinanciero", "Communication");
    diagram.Notes = "Diagrama de Comunicación BCE para CU26 Visualizar Dashboard administrativo y financiero.\nImplementación verificada en backend Laravel y frontend React.";
    diagram.Update();

    // 4. Posicionar los elementos respetando la distribución visual:
    //    Actor a la izquierda, Boundary al lado, Control en el centro,
    //    Pago y Mensualidad arriba, Cliente a la derecha,
    //    ServicioInternet, PlanInternet y Zona abajo, Bitacora en la esquina inferior.
    addDiagramObject(diagram, actor,              50,  -260,  150, -350);
    addDiagramObject(diagram, boundary,          240,  -260,  340, -340);
    addDiagramObject(diagram, control,           480,  -260,  580, -340);

    addDiagramObject(diagram, entityPago,        360,   -80,  460, -160);
    addDiagramObject(diagram, entityMensualidad, 600,   -80,  700, -160);

    addDiagramObject(diagram, entityCliente,     780,  -260,  880, -340);

    addDiagramObject(diagram, entityServicio,    360,  -440,  460, -520);
    addDiagramObject(diagram, entityPlan,        500,  -440,  600, -520);
    addDiagramObject(diagram, entityZona,        640,  -440,  740, -520);

    addDiagramObject(diagram, entityBitacora,    480,  -580,  580, -660);

    // 5. Conectar elementos con Asociaciones de Comunicación y registrar Mensajes
    // A) Actor -> Boundary
    var connActorUI = addConnector(actor, boundary, "CommunicationPath");
    addMessageToConnector(connActorUI, "1: consultarDashboard(periodo)", 1);
    addMessageToConnector(connActorUI, "2: filtrarFinanciero(periodo)", 2);
    addMessageToConnector(connActorUI, "3: consultarAlertasMorosidad()", 3);

    // B) Boundary -> Control
    var connUIControl = addConnector(boundary, control, "CommunicationPath");
    addMessageToConnector(connUIControl, "1.1: index(Request)", 1);
    addMessageToConnector(connUIControl, "2.1: financiero(Request)", 2);
    addMessageToConnector(connUIControl, "3.1: alertas()", 3);

    // C) Control -> Pago
    var connControlPago = addConnector(control, entityPago, "CommunicationPath");
    addMessageToConnector(connControlPago, "1.3: sum('montoTotal'), count(*)", 1);
    addMessageToConnector(connControlPago, "2.2: leftJoin('MetodoPago')->groupBy()", 2);

    // D) Control -> Mensualidad
    var connControlMensualidad = addConnector(control, entityMensualidad, "CommunicationPath");
    addMessageToConnector(connControlMensualidad, "1.4: where('estado','PENDIENTE')->sum('monto')", 1);
    addMessageToConnector(connControlMensualidad, "2.3: selectRaw('sum(monto)')->groupBy('periodo')", 2);
    addMessageToConnector(connControlMensualidad, "3.2: join('Cliente')->where('estado','PENDIENTE')->orderByDesc('mora')", 3);

    // E) Control -> Cliente
    var connControlCliente = addConnector(control, entityCliente, "CommunicationPath");
    addMessageToConnector(connControlCliente, "1.5: where('estadoCliente','ACTIVO')->count()", 1);
    addMessageToConnector(connControlCliente, "3.3: findOrFail(idCliente) [contacto/deuda]", 2);

    // F) Control -> ServicioInternet
    var connControlServicio = addConnector(control, entityServicio, "CommunicationPath");
    addMessageToConnector(connControlServicio, "1.6: leftJoin('EstadoServicio')->groupBy('estado')", 1);

    // G) Control -> PlanInternet
    var connControlPlan = addConnector(control, entityPlan, "CommunicationPath");
    addMessageToConnector(connControlPlan, "1.7: withCount(['asignaciones' => whereNull('fechaFin')])", 1);

    // H) Control -> Zona
    var connControlZona = addConnector(control, entityZona, "CommunicationPath");
    addMessageToConnector(connControlZona, "1.8: select('capacidadNodos')->withCount('servicios')", 1);

    // I) Control -> Bitacora
    var connControlBitacora = addConnector(control, entityBitacora, "CommunicationPath");
    addMessageToConnector(connControlBitacora, "1.9: log('CU26', 'CONSULTA_DASHBOARD', 'user_id', ip)", 1);

    diagram.Update();
    diagram.DiagramObjects.Refresh();
    currentPackage.Diagrams.Refresh();
    currentPackage.Elements.Refresh();

    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    Session.Output("¡Diagrama de Comunicación CU26 creado exitosamente en Enterprise Architect!");
    Session.Output("=================================================================");
}

function getOrCreateElement(pkg, elemName, elemType)
{
    for (var i = 0; i < pkg.Elements.Count; i++) {
        var el as EA.Element;
        el = pkg.Elements.GetAt(i);
        if (el.Name == elemName) return el;
    }
    var newEl as EA.Element;
    newEl = pkg.Elements.AddNew(elemName, elemType);
    newEl.Update();
    pkg.Elements.Refresh();
    return newEl;
}

function addConnector(sourceEl, targetEl, connType)
{
    for (var i = 0; i < sourceEl.Connectors.Count; i++) {
        var c as EA.Connector;
        c = sourceEl.Connectors.GetAt(i);
        if (c.SupplierID == targetEl.ElementID) return c;
    }
    var conn as EA.Connector;
    conn = sourceEl.Connectors.AddNew("", connType);
    conn.SupplierID = targetEl.ElementID;
    conn.Update();
    sourceEl.Connectors.Refresh();
    return conn;
}

function addMessageToConnector(connector, messageName, seq)
{
    try {
        if (connector != null && connector.Messages != null) {
            var msg as EA.Message;
            msg = connector.Messages.AddNew(messageName, "Message");
            msg.SequenceNum = seq;
            msg.Update();
            connector.Messages.Refresh();
        }
    } catch (e) {
        // En caso de que la versión de EA gestione mensajes como TransitionEvent
        if (connector.Notes == "") {
            connector.Notes = messageName;
        } else {
            connector.Notes = connector.Notes + "\n" + messageName;
        }
        connector.Update();
    }
}

function addDiagramObject(diag, element, left, top, right, bottom)
{
    var diagObj as EA.DiagramObject;
    diagObj = diag.DiagramObjects.AddNew("", "");
    diagObj.ElementID = element.ElementID;
    diagObj.left = left;
    diagObj.top = top;
    diagObj.right = right;
    diagObj.bottom = bottom;
    diagObj.Update();
    return diagObj;
}

Main();
