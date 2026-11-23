!INC Local Scripts.EAConstants-JScript

/*
 * =================================================================================================
 * Sparx Enterprise Architect - JScript (Version Compacta en 4 Ejes)
 * CU26: Visualizar Dashboard administrativo y financiero
 * Sistema: TELCOM ISP Cloud 2.0
 * =================================================================================================
 */

var PACKAGE_NAME = "CU26 - SD 4 Ejes";
var DIAGRAM_NAME = "sd CU26 Visualizar Dashboard (Compacto)";
var PROMPT_OK = (typeof promptOK !== "undefined") ? promptOK : 0;

var NEGRO = 0, AZUL = 16711680, ROJO = 255, BLANCO = 16777215;

function guardar(obj) {
    if (!obj.Update()) throw new Error(obj.GetLastError());
}

function crearElemento(pkg, nom, tipo, st) {
    var el = pkg.Elements.AddNew(nom, tipo);
    el.Stereotype = st || "";
    guardar(el); pkg.Elements.Refresh();
    return el;
}

function colocar(diag, el, l, r, t, b) {
    var f = diag.DiagramObjects.AddNew("l=" + l + ";r=" + r + ";t=" + t + ";b=" + b + ";", "");
    f.ElementID = el.ElementID;
    guardar(f); diag.DiagramObjects.Refresh();
    return f;
}

function unir(o, d) {
    var c = o.Connectors.AddNew("", "Association");
    c.SupplierID = d.ElementID;
    c.Direction = "Unspecified";
    guardar(c); o.Connectors.Refresh();
}

function msgH(pkg, diag, txt, col, l, r, t, b) {
    var e = pkg.Elements.AddNew("", "Text");
    e.Notes = txt + "   \u2501\u2501\u25B6";
    guardar(e); pkg.Elements.Refresh();
    var f = colocar(diag, e, l, r, t, b);
    f.FontColor = col; f.FontSize = "8"; guardar(f);
}

function msgV(pkg, diag, txt, col, l, r, t, b, arr) {
    var e = pkg.Elements.AddNew("", "Text");
    e.Notes = txt + "   " + (arr ? "\u2502\u25B2" : "\u2502\u25BC");
    guardar(e); pkg.Elements.Refresh();
    var f = colocar(diag, e, l, r, t, b);
    f.FontColor = col; f.FontSize = "8"; guardar(f);
}

function main() {
    Repository.EnsureOutputVisible("Script");
    var padre = Repository.GetTreeSelectedPackage();
    if (!padre || padre.PackageID == 0) {
        Session.Prompt("Seleccione primero un paquete padre en el Project Browser.", PROMPT_OK);
        return;
    }

    try {
        var pkg = padre.Packages.AddNew(PACKAGE_NAME, "");
        guardar(pkg); padre.Packages.Refresh();

        var diag = pkg.Diagrams.AddNew(DIAGRAM_NAME, "Communication");
        guardar(diag); pkg.Diagrams.Refresh();

        // Marco y Titulo
        var marco = crearElemento(pkg, "", "Boundary", "");
        var mf = colocar(diag, marco, 10, 1220, 10, 840);
        mf.BackgroundColor = BLANCO; mf.BorderColor = NEGRO; guardar(mf);

        var tit = pkg.Elements.AddNew("", "Text");
        tit.Notes = "sd CU26 Visualizar Dashboard Administrativo y Financiero (4 Ejes)";
        guardar(tit);
        var tf = colocar(diag, tit, 25, 800, 25, 55);
        tf.FontSize = "11"; tf.FontBold = true; guardar(tf);

        // 1. Elementos BCE (Ortogonal 4 Ejes)
        var actor  = crearElemento(pkg, "Administrador / Secretaría", "Actor");
        var ui     = crearElemento(pkg, "UI_DashboardAdminFinanciero", "Object", "boundary");
        var ctrl   = crearElemento(pkg, "DashboardAdminFinancieroControlador", "Object", "control");
        var pago   = crearElemento(pkg, "Pago", "Object", "entity");
        var mens   = crearElemento(pkg, "Mensualidad", "Object", "entity");
        var cli    = crearElemento(pkg, "Cliente", "Object", "entity");
        var srv    = crearElemento(pkg, "ServicioInternet", "Object", "entity");

        // 2. Colocar elementos
        colocar(diag, actor,  50,  170, 380, 540); // Oeste: Actor
        colocar(diag, ui,    330,  450, 410, 510); // Oeste: UI
        colocar(diag, ctrl,  670,  790, 410, 510); // Centro: Controlador
        colocar(diag, pago,  670,  790, 130, 230); // Norte: Pago
        colocar(diag, mens, 1010, 1130, 410, 510); // Este: Mensualidad
        colocar(diag, cli,   670,  790, 690, 790); // Sur: Cliente
        colocar(diag, srv,  1010, 1130, 690, 790); // Sur-Este: ServicioInternet

        // 3. Enlaces ortogonales
        unir(actor, ui);
        unir(ui, ctrl);
        unir(ctrl, pago);
        unir(ctrl, mens);
        unir(ctrl, cli);
        unir(cli, srv);

        // 4. Mensajes numerados (2 lineas)
        // Eje Oeste (Actor -> UI -> Ctrl)
        msgH(pkg, diag, "1: consultarDashboard()\n(periodo, filtros)", NEGRO, 180, 320, 330, 365);
        msgH(pkg, diag, "2: filtrarFinanciero()\n(periodo, canales)", AZUL, 180, 320, 375, 410);
        msgH(pkg, diag, "3: consultarAlertasMora()\n(morosidad critica)", ROJO, 180, 320, 420, 455);

        msgH(pkg, diag, "1.1: index(request)\n[consolidado general]", NEGRO, 460, 660, 330, 365);
        msgH(pkg, diag, "2.1: financiero(request)\n[canales QR/Efectivo]", AZUL, 460, 660, 375, 410);
        msgH(pkg, diag, "3.1: alertas(request)\n[cuentas en mora]", ROJO, 460, 660, 420, 455);

        // Eje Norte (Ctrl -> Pago)
        msgV(pkg, diag, "1.2: sum('montoTotal')\n[recaudacion periodo/hoy]", NEGRO, 430, 660, 260, 295, true);
        msgV(pkg, diag, "2.2: groupBy('MetodoPago')\n[canales de cobro]", AZUL, 430, 660, 305, 340, true);

        // Eje Este (Ctrl -> Mensualidad)
        msgH(pkg, diag, "1.3: where('estado','PENDIENTE')\n[cartera mora acumulada]", NEGRO, 800, 1000, 385, 420);
        msgH(pkg, diag, "3.2: orderByDesc('total_deuda')\n[top alertas morosidad]", ROJO, 800, 1000, 430, 465);

        // Eje Sur (Ctrl -> Cliente)
        msgV(pkg, diag, "1.4: count('estadoCliente=ACTIVO')\n[conteo clientes en red]", NEGRO, 430, 660, 560, 595, false);
        msgV(pkg, diag, "3.3: findOrFail(idCliente)\n[datos contacto para cobro]", ROJO, 430, 660, 605, 640, false);

        // Eje Sur-Este (Cliente -> ServicioInternet)
        msgH(pkg, diag, "1.5: groupBy('nombreEstado')\n[servicios activos vs corte]", NEGRO, 800, 1000, 715, 750);

        diag.Update();
        Repository.OpenDiagram(diag.DiagramID);
        Repository.ReloadDiagram(diag.DiagramID);
        Session.Prompt("Diagrama CU26 compacto creado exitosamente.", PROMPT_OK);
    } catch (e) {
        Session.Prompt("Error: " + (e.message || e), PROMPT_OK);
    }
}

main();
