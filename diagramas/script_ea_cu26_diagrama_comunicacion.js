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
 * Instrucciones:
 * 1. Abrir Enterprise Architect (Alt + F11 para abrir ventana Scripting).
 * 2. Crear o abrir un JScript y pegar este código.
 * 3. Seleccionar el paquete donde deseas crear el diagrama en el Project Browser.
 * 4. Ejecutar el script (F5 o clic derecho > Run Script).
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

    Session.Output("Iniciando creación del Diagrama de Comunicación para CU26...");

    // 1. Crear / obtener Actor
    var actor = getOrCreateElement(currentPackage, "Administrador / Secretaría", "Actor");

    // 2. Crear elementos BCE (Boundary, Control, Entity)
    var boundary = getOrCreateElement(currentPackage, "UI_DashboardAdminFinanciero", "Boundary");
    var control  = getOrCreateElement(currentPackage, "DashboardAdminFinancieroController", "Control");

    var entityPago       = getOrCreateElement(currentPackage, "Pago", "Entity");
    var entityMensualidad= getOrCreateElement(currentPackage, "Mensualidad", "Entity");
    var entityCliente    = getOrCreateElement(currentPackage, "Cliente", "Entity");
    var entityServicio   = getOrCreateElement(currentPackage, "ServicioInternet", "Entity");
    var entityPlan       = getOrCreateElement(currentPackage, "PlanInternet", "Entity");
    var entityZona       = getOrCreateElement(currentPackage, "Zona", "Entity");
    var entityBitacora   = getOrCreateElement(currentPackage, "Bitacora", "Entity");

    // 3. Crear el Diagrama de Comunicación
    var diagram as EA.Diagram;
    diagram = currentPackage.Diagrams.AddNew("CU26_Comunicacion_DashboardAdminFinanciero", "Communication");
    diagram.Notes = "Diagrama de Comunicación BCE para CU26 Visualizar Dashboard administrativo y financiero.";
    diagram.Update();

    // 4. Posicionar los elementos respetando la distribución estándar:
    //    Actor a la izquierda, Boundary al lado, Control en el centro,
    //    Pago y Mensualidad arriba, Cliente a la derecha,
    //    ServicioInternet, PlanInternet y Zona abajo, Bitacora a la izquierda inferior.
    addDiagramObject(diagram, actor,             60,  -220, 140, -310);
    addDiagramObject(diagram, boundary,         240,  -220, 320, -300);
    addDiagramObject(diagram, control,          460,  -220, 540, -300);

    addDiagramObject(diagram, entityPago,       360,   -60, 440, -140);
    addDiagramObject(diagram, entityMensualidad,560,   -60, 640, -140);

    addDiagramObject(diagram, entityCliente,    720,  -220, 800, -300);

    addDiagramObject(diagram, entityServicio,   360,  -380, 440, -460);
    addDiagramObject(diagram, entityPlan,       500,  -380, 580, -460);
    addDiagramObject(diagram, entityZona,       640,  -380, 720, -460);

    addDiagramObject(diagram, entityBitacora,   460,  -500, 540, -580);

    // 5. Conectar elementos (Asociaciones de Comunicación)
    addConnector(actor, boundary, "CommunicationPath");
    addConnector(boundary, control, "CommunicationPath");
    addConnector(control, entityPago, "CommunicationPath");
    addConnector(control, entityMensualidad, "CommunicationPath");
    addConnector(control, entityCliente, "CommunicationPath");
    addConnector(control, entityServicio, "CommunicationPath");
    addConnector(control, entityPlan, "CommunicationPath");
    addConnector(control, entityZona, "CommunicationPath");
    addConnector(control, entityBitacora, "CommunicationPath");

    diagram.Update();
    diagram.DiagramObjects.Refresh();
    currentPackage.Diagrams.Refresh();
    currentPackage.Elements.Refresh();

    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    Session.Output("¡Diagrama de Comunicación CU26 creado exitosamente en Enterprise Architect!");
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
