!INC Local Scripts.EAConstants-JScript

/**
 * ============================================================================
 * SCRIPT PARA ENTERPRISE ARCHITECT: Diagrama de Comunicación BCE - CU21
 * "sd CU21 Registrar solicitud de instalación"
 * ============================================================================
 *
 * Basado en la arquitectura BCE (Boundary-Control-Entity) y el código real de:
 * - App\Http\Controllers\Paquetes\InstalacionesTecnicas\CU21_RegistrarSolicitudInstalacion\SolicitudInstalacionController
 * - Frontend React: SolicitudInstalacionView / useSolicitudInstalacionController
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

    Session.Output("Iniciando creación del Diagrama de Comunicación para CU21...");

    // 1. Crear / obtener Actor
    var actor = getOrCreateElement(currentPackage, "Administrador / Secretaría", "Actor");

    // 2. Crear elementos BCE (Boundary, Control, Entity)
    var boundary = getOrCreateElement(currentPackage, "UI_SolicitudInstalacion", "Boundary");
    var control  = getOrCreateElement(currentPackage, "SolicitudInstalacionController", "Control");

    var entityCliente   = getOrCreateElement(currentPackage, "Cliente", "Entity");
    var entitySolicitud = getOrCreateElement(currentPackage, "SolicitudInstalacion", "Entity");
    var entityZona      = getOrCreateElement(currentPackage, "Zona", "Entity");

    // 3. Crear el Diagrama de Comunicación
    var diagram as EA.Diagram;
    diagram = currentPackage.Diagrams.AddNew("CU21_Comunicacion_RegistrarSolicitud", "Communication");
    diagram.Notes = "Diagrama de Comunicación BCE para CU21 (código fuente verificado).";
    diagram.Update();

    // 4. Posicionar los elementos respetando la cruz de la imagen de referencia:
    //    Actor a la izquierda, Boundary al lado, Control al centro,
    //    Cliente arriba, SolicitudInstalacion a la derecha, Zona abajo.
    addDiagramObject(diagram, actor,             60,  -200, 140, -290);
    addDiagramObject(diagram, boundary,         240,  -200, 320, -280);
    addDiagramObject(diagram, control,          460,  -200, 540, -280);
    addDiagramObject(diagram, entityCliente,    460,   -60, 540, -140);
    addDiagramObject(diagram, entitySolicitud,  700,  -200, 780, -280);
    addDiagramObject(diagram, entityZona,       460,  -340, 540, -420);

    // 5. Conectar elementos (Asociaciones de Comunicación)
    addConnector(actor, boundary, "CommunicationPath");
    addConnector(boundary, control, "CommunicationPath");
    addConnector(control, entityCliente, "CommunicationPath");
    addConnector(control, entitySolicitud, "CommunicationPath");
    addConnector(control, entityZona, "CommunicationPath");

    diagram.Update();
    diagram.DiagramObjects.Refresh();
    currentPackage.Diagrams.Refresh();
    currentPackage.Elements.Refresh();

    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    Session.Output("¡Diagrama de Comunicación CU21 creado exitosamente en Enterprise Architect!");
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
