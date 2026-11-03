!INC Local Scripts.EAConstants-JScript

/**
 * ============================================================================
 * SCRIPT PARA ENTERPRISE ARCHITECT: Diagrama de Caso de Uso - CU21
 * "CU21: Registrar solicitud de instalación"
 * ============================================================================
 *
 * Instrucciones de uso en Enterprise Architect:
 * 1. Abrir Enterprise Architect con el proyecto (.eapx / .qea).
 * 2. Ir a: Menú Ribbon > Develop > Source Code > Scripting (o presionar Alt+F11).
 * 3. En la ventana de Scripting, crear un "New JScript" dentro de tu grupo de scripts.
 * 4. Pegar todo el contenido de este archivo y guardar (Ctrl+S).
 * 5. En el "Project Browser" (árbol del proyecto), SELECCIONAR el paquete donde
 *    deseas crear el diagrama (por ejemplo: "CU21: Registrar solicitud de instalación"
 *    o el paquete de "Instalaciones").
 * 6. Hacer clic derecho sobre el script y seleccionar "Run Script" (o presionar F5).
 * 7. El script creará automáticamente el diagrama, los actores (vinculados al paquete
 *    de Actors para mostrar "(from Actors)") y el óvalo del CU21 con sus asociaciones.
 * ============================================================================
 */

function Main()
{
    // Obtener el paquete seleccionado en el árbol de Enterprise Architect
    var currentPackage as EA.Package;
    currentPackage = Repository.GetTreeSelectedPackage();

    if (currentPackage == null)
    {
        Session.Prompt("Por favor, selecciona un Paquete en el Project Browser antes de ejecutar el script.", promptOK);
        return;
    }

    Session.Output("==================================================================");
    Session.Output("Iniciando creación automática del Diagrama de Caso de Uso para CU21...");

    // 1. Buscar el paquete de 'Actors' en el modelo para mostrar "(from Actors)"
    var actorsPackage as EA.Package;
    actorsPackage = findPackageByName(Repository.Models, "Actors");
    
    // Si no existe un paquete llamado 'Actors', buscar 'Actores' o crearlo
    if (actorsPackage == null) {
        actorsPackage = findPackageByName(Repository.Models, "Actores");
    }
    
    // Si sigue sin existir, utilizar el paquete actual
    if (actorsPackage == null) {
        actorsPackage = currentPackage;
        Session.Output("Nota: No se encontró un paquete externo 'Actors'; se usarán/crearán los actores localmente.");
    } else {
        Session.Output("Paquete de Actores localizado: " + actorsPackage.Name);
    }

    // 2. Obtener o crear los Actores del CU21
    // Actores oficiales para CU21: Administrador, Secretaría y Cliente
    var actAdmin = getOrCreateElement(actorsPackage, "Administrador", "Actor");
    var actSec   = getOrCreateElement(actorsPackage, "Secretaría", "Actor");
    var actCli   = getOrCreateElement(actorsPackage, "Cliente", "Actor");

    // (Opcional: Si tu docente solicitó incluir también a Técnico, puedes descomentar las siguientes líneas)
    // var actTec = getOrCreateElement(actorsPackage, "Técnico", "Actor");

    // 3. Crear el Caso de Uso principal CU21 en el paquete seleccionado
    var cuName = "CU21: Registrar solicitud de instalación";
    var cu21 = getOrCreateElement(currentPackage, cuName, "UseCase");

    // 4. Crear las asociaciones (líneas sólidas) entre Actores y el Caso de Uso
    addAssociation(actAdmin, cu21);
    addAssociation(actSec, cu21);
    addAssociation(actCli, cu21);
    // if (actTec) { addAssociation(actTec, cu21); }

    // 5. Crear el Diagrama de Caso de Uso en el paquete actual
    var diagram as EA.Diagram;
    diagram = currentPackage.Diagrams.AddNew(cuName, "Use Case");
    diagram.Notes = "Diagrama de Caso de Uso generado automáticamente para CU21 (TELCOM 2.0).";
    diagram.Update();

    // 6. Posicionar los elementos visuales en el lienzo del diagrama
    // Coordenadas en Enterprise Architect:
    //   left: coordenada X inicial
    //   top: coordenada Y superior (negativo)
    //   right: coordenada X final
    //   bottom: coordenada Y inferior (más negativo que top)

    // Columna Izquierda: Actores alineados verticalmente
    addDiagramObject(diagram, actAdmin,  80,  -60, 160, -150);
    addDiagramObject(diagram, actSec,    80, -190, 160, -280);
    addDiagramObject(diagram, actCli,    80, -320, 160, -410);
    // Si usas Técnico en lugar de Cliente o como 4to actor:
    // addDiagramObject(diagram, actTec, 80, -450, 160, -540);

    // Columna Derecha: Óvalo del Caso de Uso centrado verticalmente
    addDiagramObject(diagram, cu21,     420, -180, 660, -290);

    // 7. Guardar cambios y abrir el diagrama en pantalla
    diagram.Update();
    diagram.DiagramObjects.Refresh();
    currentPackage.Diagrams.Refresh();
    currentPackage.Elements.Refresh();

    Repository.ReloadDiagram(diagram.DiagramID);
    Repository.OpenDiagram(diagram.DiagramID);

    Session.Output("¡ÉXITO! El diagrama '" + cuName + "' ha sido creado y abierto en Enterprise Architect.");
    Session.Output("==================================================================");
}

/**
 * Busca recursivamente un paquete por nombre en una colección de paquetes
 */
function findPackageByName(packagesCollection, targetName)
{
    if (packagesCollection == null) return null;

    for (var i = 0; i < packagesCollection.Count; i++)
    {
        var pkg as EA.Package;
        pkg = packagesCollection.GetAt(i);

        if (pkg.Name.toLowerCase() == targetName.toLowerCase())
        {
            return pkg;
        }

        var subPkg = findPackageByName(pkg.Packages, targetName);
        if (subPkg != null)
        {
            return subPkg;
        }
    }
    return null;
}

/**
 * Busca un elemento por nombre y tipo dentro de un paquete; si no existe, lo crea.
 */
function getOrCreateElement(pkg, elemName, elemType)
{
    for (var i = 0; i < pkg.Elements.Count; i++)
    {
        var el as EA.Element;
        el = pkg.Elements.GetAt(i);
        if (el.Name == elemName && el.Type == elemType)
        {
            return el;
        }
    }

    var newEl as EA.Element;
    newEl = pkg.Elements.AddNew(elemName, elemType);
    newEl.Update();
    pkg.Elements.Refresh();
    return newEl;
}

/**
 * Crea un conector de Asociación entre dos elementos si no existe previamente
 */
function addAssociation(sourceEl, targetEl)
{
    for (var i = 0; i < sourceEl.Connectors.Count; i++)
    {
        var existingConn as EA.Connector;
        existingConn = sourceEl.Connectors.GetAt(i);
        if (existingConn.SupplierID == targetEl.ElementID && existingConn.Type == "Association")
        {
            return existingConn;
        }
    }

    var conn as EA.Connector;
    conn = sourceEl.Connectors.AddNew("", "Association");
    conn.SupplierID = targetEl.ElementID;
    conn.Update();
    sourceEl.Connectors.Refresh();
    return conn;
}

/**
 * Agrega un elemento existente al diagrama con sus coordenadas espaciales
 */
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

