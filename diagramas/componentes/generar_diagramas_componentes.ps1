[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$packages = @(
    [pscustomobject]@{
        File  = 'p1_seguridad_administracion'
        Title = 'P1: Seguridad y Administración'
        Scope = 'CU01 - CU03'
        Flows = @(
            [pscustomobject]@{
                Code = 'CU01'; Name = 'Iniciar y cerrar sesión'
                Views = @('LoginView.jsx', 'SesionView.jsx')
                Controllers = @('AuthController.php')
                Tables = @('Usuario', 'Rol', 'user_sessions', 'personal_access_tokens', 'Bitacora')
            }
            [pscustomobject]@{
                Code = 'CU01'; Name = 'Recuperar contraseña'
                Views = @('RecuperarPasswordView.jsx')
                Controllers = @('RecuperarPasswordController.php')
                Tables = @('Usuario', 'password_reset_tokens', 'Bitacora')
            }
            [pscustomobject]@{
                Code = 'CU01'; Name = 'Cambiar contraseña'
                Views = @('CambiarPasswordView.jsx')
                Controllers = @('AuthController.php')
                Tables = @('Usuario', 'password_verification_codes', 'Bitacora')
            }
            [pscustomobject]@{
                Code = 'CU02'; Name = 'Consultar bitácora de auditoría'
                Views = @('AuditoriaView.jsx')
                Controllers = @('AuditoriaController.php')
                Tables = @('Bitacora', 'Usuario')
            }
            [pscustomobject]@{
                Code = 'CU03'; Name = 'Gestionar usuarios internos'
                Views = @('UsuariosView.jsx')
                Controllers = @('UsuarioController.php')
                Tables = @('Usuario', 'Rol', 'Bitacora')
            }
            [pscustomobject]@{
                Code = 'CU03'; Name = 'Gestionar roles y permisos'
                Views = @('RolesPermisosPanel.jsx')
                Controllers = @('RolController.php')
                Tables = @('Rol', 'Permiso', 'RolPermiso', 'Bitacora')
            }
        )
    }
    [pscustomobject]@{
        File  = 'p2_gestion_clientes_zonas'
        Title = 'P2: Gestión de Clientes y Zonas'
        Scope = 'CU04 - CU07'
        Flows = @(
            [pscustomobject]@{
                Code = 'CU04'; Name = 'Gestionar zonas de cobertura'
                Views = @('ZonasCoberturaView.jsx', 'MapaArea.jsx')
                Controllers = @('ZonaCoberturaController.php')
                Tables = @('Zona', 'Bitacora')
            }
            [pscustomobject]@{
                Code = 'CU05'; Name = 'Registrar nuevo cliente'
                Views = @('ClienteRegistroView.jsx')
                Controllers = @('ClienteRegistroController.php', 'ZonaCoberturaController.php')
                Tables = @('Cliente', 'Zona', 'Bitacora')
            }
            [pscustomobject]@{
                Code = 'CU06'; Name = 'Consultar y buscar clientes'
                Views = @('ClienteConsultaView.jsx')
                Controllers = @('ClienteConsultaController.php')
                Tables = @('Cliente', 'Zona')
            }
            [pscustomobject]@{
                Code = 'CU07'; Name = 'Actualizar y dar de baja lógica al cliente'
                Views = @('ClienteMantenimientoView.jsx')
                Controllers = @('ClienteMantenimientoController.php')
                Tables = @('Cliente', 'Zona', 'Bitacora')
            }
        )
    }
    [pscustomobject]@{
        File  = 'p3_servicios_planes'
        Title = 'P3: Servicios y Planes'
        Scope = 'CU08 y CU13 - CU17'
        Flows = @(
            [pscustomobject]@{
                Code = 'CU08'; Name = 'Registrar y activar servicio de Internet'
                Views = @('ServicioInternetView.jsx')
                Controllers = @('ServicioInternetController.php')
                Tables = @('ServicioInternet', 'Cliente', 'Zona', 'EstadoServicio', 'PlanInternet', 'AsignacionPlan', 'Bitacora')
            }
            [pscustomobject]@{
                Code = 'CU13'; Name = 'Consultar servicios para corte'
                Views = @('ServiciosCorteView.jsx')
                Controllers = @('ServiciosCorteController.php')
                Tables = @('ServicioInternet', 'Cliente', 'Zona', 'Mensualidad', 'AsignacionPlan', 'PlanInternet')
            }
            [pscustomobject]@{
                Code = 'CU14'; Name = 'Registrar corte realizado'
                Views = @('CorteRegistroView.jsx')
                Controllers = @('CorteRegistroController.php')
                Tables = @('AccionServicio', 'ServicioInternet', 'EstadoServicio', 'Usuario', 'Bitacora')
            }
            [pscustomobject]@{
                Code = 'CU15'; Name = 'Gestionar reactivaciones'
                Views = @('ReactivacionesView.jsx', 'ReactivacionModal.jsx')
                Controllers = @('ReactivacionesController.php')
                Tables = @('AccionServicio', 'ServicioInternet', 'EstadoServicio', 'Pago', 'Usuario', 'Bitacora')
            }
            [pscustomobject]@{
                Code = 'CU16'; Name = 'Gestionar catálogo de planes'
                Views = @('PlanCatalogoView.jsx', 'PlanesInternetView.jsx')
                Controllers = @('PlanInternetController.php')
                Tables = @('PlanInternet', 'Bitacora')
            }
            [pscustomobject]@{
                Code = 'CU17'; Name = 'Asignar o cambiar plan del servicio'
                Views = @('AsignarPlanView.jsx', 'ServicioBuscador.jsx')
                Controllers = @('AsignacionPlanController.php')
                Tables = @('AsignacionPlan', 'ServicioInternet', 'PlanInternet', 'Usuario', 'Bitacora')
            }
        )
    }
    [pscustomobject]@{
        File  = 'p4_facturacion_cobranza'
        Title = 'P4: Facturación y Cobranza'
        Scope = 'CU09 - CU12'
        Flows = @(
            [pscustomobject]@{
                Code = 'CU09'; Name = 'Generar mensualidades'
                Views = @('MensualidadGeneracionView.jsx')
                Controllers = @('MensualidadGeneracionController.php', 'MensualidadGeneracionService.php')
                Tables = @('Mensualidad', 'ServicioInternet', 'AsignacionPlan', 'PlanInternet', 'Cliente', 'Bitacora')
            }
            [pscustomobject]@{
                Code = 'CU10'; Name = 'Gestionar pago de mensualidad'
                Views = @('PagoMensualidadView.jsx', 'PortalClienteModal.jsx')
                Controllers = @('PagoMensualidadController.php')
                Tables = @('Mensualidad', 'Pago', 'Cliente', 'ServicioInternet', 'Bitacora')
            }
            [pscustomobject]@{
                Code = 'CU11'; Name = 'Consultar historial de pagos'
                Views = @('HistorialPagosView.jsx')
                Controllers = @('HistorialPagosController.php')
                Tables = @('Pago', 'DetallePago', 'Mensualidad', 'Cliente', 'ServicioInternet', 'AsignacionPlan', 'PlanInternet', 'MetodoPago')
            }
            [pscustomobject]@{
                Code = 'CU12'; Name = 'Visualizar alertas de vencimiento'
                Views = @('AlertasVencimientoView.jsx')
                Controllers = @('AlertasVencimientoController.php')
                Tables = @('Mensualidad', 'Cliente', 'ServicioInternet')
            }
        )
    }
    [pscustomobject]@{
        File  = 'p5_equipos_inventario'
        Title = 'P5: Equipos, Proveedores e Inventario'
        Scope = 'CU18 - CU20'
        Flows = @(
            [pscustomobject]@{
                Code = 'CU18'; Name = 'Gestionar catálogo y unidades de equipos'
                Views = @('EquiposView.jsx')
                Controllers = @('CatalogoEquiposController.php')
                Tables = @('ProductoEquipo', 'Inventario', 'Equipo', 'Bitacora')
            }
            [pscustomobject]@{
                Code = 'CU19'; Name = 'Asignar equipo en comodato'
                Views = @('AsignarEquipoComodatoView.jsx')
                Controllers = @('AsignacionEquipoComodatoController.php')
                Tables = @('ServicioInternet', 'Equipo', 'ProductoEquipo', 'Inventario', 'AsignacionEquipo', 'Bitacora')
            }
            [pscustomobject]@{
                Code = 'CU20'; Name = 'Reemplazar o retirar equipo'
                Views = @('EquipoReemplazoRetiroView.jsx')
                Controllers = @('EquipoReemplazoRetiroController.php')
                Tables = @('ServicioInternet', 'AsignacionEquipo', 'Equipo', 'ProductoEquipo', 'Bitacora')
            }
        )
    }
    [pscustomobject]@{
        File  = 'p6_instalaciones_tecnicas'
        Title = 'P6: Instalaciones Técnicas'
        Scope = 'CU21 - CU23'
        Flows = @(
            [pscustomobject]@{
                Code = 'CU21'; Name = 'Registrar solicitud de instalación'
                Views = @('SolicitudInstalacionView.jsx', 'RegistrarSolicitudModal.jsx', 'DetalleSolicitudModal.jsx', 'CancelarSolicitudModal.jsx', 'PortalSolicitudModal.jsx')
                Controllers = @('SolicitudInstalacionController.php')
                Tables = @('SolicitudInstalacion', 'Cliente', 'Zona', 'Bitacora')
            }
            [pscustomobject]@{
                Code = 'CU22'; Name = 'Programar instalación y asignar técnico'
                Views = @('InstalacionesView.jsx', 'ProgramarInstalacionModal.jsx')
                Controllers = @('InstalacionesController.php')
                Tables = @('SolicitudInstalacion', 'Tecnico', 'Instalacion', 'Bitacora')
            }
            [pscustomobject]@{
                Code = 'CU23'; Name = 'Registrar instalación realizada'
                Views = @('InstalacionesView.jsx')
                Controllers = @('InstalacionRegistroController.php')
                Tables = @('Instalacion', 'SolicitudInstalacion', 'Tecnico', 'ServicioInternet', 'Cliente', 'Bitacora')
            }
        )
    }
)

$outputDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path

$canvasWidth = 1900
$outerMargin = 32
$frameX = 32
$frameY = 50
$frameWidth = $canvasWidth - ($outerMargin * 2)
$headerHeight = 118
$footerHeight = 64

$viewX = 110
$viewWidth = 450
$controllerX = 720
$controllerWidth = 500
$tableX = 1430
$tableWidth = 340

$tableHeight = 58
$tableGap = 10
$contentTopPadding = 50
$contentBottomPadding = 18

function Get-ComponentHeight {
    param([object[]]$Items)
    return [Math]::Max(82, 48 + (26 * $Items.Count))
}

function Get-RowHeight {
    param([pscustomobject]$Flow)

    $viewHeight = Get-ComponentHeight -Items $Flow.Views
    $controllerHeight = Get-ComponentHeight -Items $Flow.Controllers
    $tablesHeight = ($Flow.Tables.Count * $tableHeight) + ([Math]::Max(0, $Flow.Tables.Count - 1) * $tableGap)
    $contentHeight = [Math]::Max($viewHeight, [Math]::Max($controllerHeight, $tablesHeight))
    return $contentTopPadding + $contentHeight + $contentBottomPadding
}

function New-Font {
    param(
        [float]$Size,
        [System.Drawing.FontStyle]$Style = [System.Drawing.FontStyle]::Regular
    )
    return [System.Drawing.Font]::new('Segoe UI', $Size, $Style, [System.Drawing.GraphicsUnit]::Pixel)
}

function New-Brush {
    param([string]$Color)
    return [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($Color))
}

function New-Pen {
    param(
        [string]$Color,
        [float]$Width = 1
    )
    return [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml($Color), $Width)
}

function Draw-CenteredText {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [System.Drawing.Font]$Font,
        [System.Drawing.Brush]$Brush,
        [System.Drawing.RectangleF]$Rectangle
    )

    $format = [System.Drawing.StringFormat]::new()
    try {
        $format.Alignment = [System.Drawing.StringAlignment]::Center
        $format.LineAlignment = [System.Drawing.StringAlignment]::Center
        $format.Trimming = [System.Drawing.StringTrimming]::EllipsisCharacter
        $format.FormatFlags = [System.Drawing.StringFormatFlags]::NoWrap
        $Graphics.DrawString($Text, $Font, $Brush, $Rectangle, $format)
    }
    finally {
        $format.Dispose()
    }
}

function Draw-ComponentIcon {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$X,
        [float]$Y,
        [System.Drawing.Pen]$Pen
    )

    $Graphics.DrawRectangle($Pen, $X, $Y, 24, 18)
    $Graphics.DrawRectangle($Pen, $X - 7, $Y + 3, 10, 5)
    $Graphics.DrawRectangle($Pen, $X - 7, $Y + 11, 10, 5)
}

function Draw-ComponentCard {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [object[]]$Items,
        [string]$Stereotype,
        [System.Drawing.Font]$StereoFont,
        [System.Drawing.Font]$LabelFont,
        [System.Drawing.Brush]$TextBrush,
        [System.Drawing.Brush]$MutedBrush,
        [System.Drawing.Brush]$FillBrush,
        [System.Drawing.Brush]$ShadowBrush,
        [System.Drawing.Pen]$BorderPen
    )

    $height = Get-ComponentHeight -Items $Items
    $Graphics.FillRectangle($ShadowBrush, $X + 4, $Y + 4, $Width, $height)
    $Graphics.FillRectangle($FillBrush, $X, $Y, $Width, $height)
    $Graphics.DrawRectangle($BorderPen, $X, $Y, $Width, $height)
    Draw-ComponentIcon -Graphics $Graphics -X ($X + $Width - 34) -Y ($Y + 12) -Pen $BorderPen

    $stereoRect = [System.Drawing.RectangleF]::new($X + 16, $Y + 9, $Width - 62, 22)
    Draw-CenteredText -Graphics $Graphics -Text ('<<' + $Stereotype + '>>') -Font $StereoFont -Brush $MutedBrush -Rectangle $stereoRect

    $lineY = $Y + 40
    foreach ($item in $Items) {
        $lineRect = [System.Drawing.RectangleF]::new($X + 18, $lineY, $Width - 64, 23)
        Draw-CenteredText -Graphics $Graphics -Text ([string]$item) -Font $LabelFont -Brush $TextBrush -Rectangle $lineRect
        $lineY += 26
    }

    return $height
}

function Draw-TableCard {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$X,
        [float]$Y,
        [float]$Width,
        [string]$Name,
        [System.Drawing.Font]$StereoFont,
        [System.Drawing.Font]$LabelFont,
        [System.Drawing.Brush]$TextBrush,
        [System.Drawing.Brush]$MutedBrush,
        [System.Drawing.Brush]$FillBrush,
        [System.Drawing.Brush]$ShadowBrush,
        [System.Drawing.Pen]$BorderPen
    )

    $Graphics.FillRectangle($ShadowBrush, $X + 3, $Y + 3, $Width, $tableHeight)
    $Graphics.FillRectangle($FillBrush, $X, $Y, $Width, $tableHeight)
    $Graphics.DrawRectangle($BorderPen, $X, $Y, $Width, $tableHeight)
    Draw-ComponentIcon -Graphics $Graphics -X ($X + $Width - 32) -Y ($Y + 8) -Pen $BorderPen

    $stereoRect = [System.Drawing.RectangleF]::new($X + 12, $Y + 5, $Width - 58, 20)
    Draw-CenteredText -Graphics $Graphics -Text '<<tabla>>' -Font $StereoFont -Brush $MutedBrush -Rectangle $stereoRect
    $labelRect = [System.Drawing.RectangleF]::new($X + 12, $Y + 27, $Width - 58, 24)
    Draw-CenteredText -Graphics $Graphics -Text $Name -Font $LabelFont -Brush $TextBrush -Rectangle $labelRect
}

function Draw-ArrowHead {
    param(
        [System.Drawing.Graphics]$Graphics,
        [float]$X,
        [float]$Y,
        [System.Drawing.Brush]$Brush
    )

    $points = [System.Drawing.PointF[]]@(
        [System.Drawing.PointF]::new($X, $Y),
        [System.Drawing.PointF]::new($X - 12, $Y - 6),
        [System.Drawing.PointF]::new($X - 12, $Y + 6)
    )
    $Graphics.FillPolygon($Brush, $points)
}

function Write-PlantUmlSource {
    param(
        [pscustomobject]$Package,
        [string]$Path
    )

    $lines = [System.Collections.Generic.List[string]]::new()
    $lines.Add('@startuml')
    $lines.Add("title $($Package.Title) - Diagrama de componentes")
    $lines.Add('left to right direction')
    $lines.Add('skinparam backgroundColor white')
    $lines.Add('skinparam defaultFontName Segoe UI')
    $lines.Add('skinparam componentStyle uml2')
    $lines.Add('skinparam component {')
    $lines.Add('  BackgroundColor #FFFFFF')
    $lines.Add('  BorderColor #334155')
    $lines.Add('  FontColor #0F172A')
    $lines.Add('}')
    $lines.Add('skinparam database {')
    $lines.Add('  BackgroundColor #EFF6FF')
    $lines.Add('  BorderColor #2563EB')
    $lines.Add('  FontColor #0F172A')
    $lines.Add('}')
    $lines.Add('skinparam package {')
    $lines.Add('  BackgroundColor #F8FAFC')
    $lines.Add('  BorderColor #64748B')
    $lines.Add('}')
    $lines.Add('')
    $lines.Add("package `"$($Package.Title)`" {")

    $flowIndex = 0
    foreach ($flow in $Package.Flows) {
        $flowIndex++
        $groupAlias = "G$flowIndex"
        $viewAlias = "V$flowIndex"
        $controllerAlias = "C$flowIndex"
        $viewLabel = '<<vista>>\n' + ($flow.Views -join '\n')
        $controllerLabel = '<<controlador>>\n' + ($flow.Controllers -join '\n')

        $lines.Add("  package `"$($flow.Code) - $($flow.Name)`" as $groupAlias {")
        $lines.Add("    component `"$viewLabel`" as $viewAlias")
        $lines.Add("    component `"$controllerLabel`" as $controllerAlias")
        $lines.Add("    $viewAlias --> $controllerAlias : API REST")

        $tableIndex = 0
        foreach ($table in $flow.Tables) {
            $tableIndex++
            $tableAlias = "T${flowIndex}_$tableIndex"
            $lines.Add("    database `"<<tabla>>\n$table`" as $tableAlias")
            $lines.Add("    $controllerAlias ..> $tableAlias")
        }
        $lines.Add('  }')
        $lines.Add('')
    }

    $lines.Add('}')
    $lines.Add('@enduml')
    [System.IO.File]::WriteAllLines($Path, $lines, [System.Text.UTF8Encoding]::new($false))
}

$fontPackage = New-Font -Size 26 -Style ([System.Drawing.FontStyle]::Bold)
$fontScope = New-Font -Size 16 -Style ([System.Drawing.FontStyle]::Regular)
$fontColumn = New-Font -Size 16 -Style ([System.Drawing.FontStyle]::Bold)
$fontRow = New-Font -Size 19 -Style ([System.Drawing.FontStyle]::Bold)
$fontStereo = New-Font -Size 14 -Style ([System.Drawing.FontStyle]::Italic)
$fontLabel = New-Font -Size 17 -Style ([System.Drawing.FontStyle]::Regular)
$fontTableStereo = New-Font -Size 12 -Style ([System.Drawing.FontStyle]::Italic)
$fontTableLabel = New-Font -Size 16 -Style ([System.Drawing.FontStyle]::Regular)
$fontFooter = New-Font -Size 14 -Style ([System.Drawing.FontStyle]::Regular)

$textBrush = New-Brush -Color '#0F172A'
$mutedBrush = New-Brush -Color '#475569'
$whiteBrush = New-Brush -Color '#FFFFFF'
$accentBrush = New-Brush -Color '#1D4ED8'
$accentSoftBrush = New-Brush -Color '#DBEAFE'
$viewFillBrush = New-Brush -Color '#FFFFFF'
$controllerFillBrush = New-Brush -Color '#F8FAFC'
$tableFillBrush = New-Brush -Color '#EFF6FF'
$shadowBrush = New-Brush -Color '#DCE3EC'
$rowAlternateBrush = New-Brush -Color '#F8FAFC'
$rowWhiteBrush = New-Brush -Color '#FFFFFF'
$apiBrush = New-Brush -Color '#2563EB'
$dbBrush = New-Brush -Color '#64748B'

$borderPen = New-Pen -Color '#334155' -Width 1.6
$framePen = New-Pen -Color '#334155' -Width 2.1
$separatorPen = New-Pen -Color '#CBD5E1' -Width 1
$apiPen = New-Pen -Color '#2563EB' -Width 2.3
$dbPen = New-Pen -Color '#64748B' -Width 1.8
$dbPen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash

try {
    foreach ($package in $packages) {
        $rowHeights = @($package.Flows | ForEach-Object { Get-RowHeight -Flow $_ })
        $canvasHeight = $frameY + $headerHeight + (($rowHeights | Measure-Object -Sum).Sum) + $footerHeight + 30
        $bitmap = [System.Drawing.Bitmap]::new($canvasWidth, [int]$canvasHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $bitmap.SetResolution(144, 144)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

        try {
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
            $graphics.Clear([System.Drawing.Color]::White)

            $frameHeight = $canvasHeight - $frameY - 24
            $graphics.DrawRectangle($framePen, $frameX, $frameY, $frameWidth, $frameHeight)

            $tabWidth = [Math]::Min(760, 80 + ($package.Title.Length * 15))
            $graphics.FillRectangle($accentBrush, $frameX, 18, $tabWidth, 60)
            $graphics.DrawRectangle($framePen, $frameX, 18, $tabWidth, 60)
            $packageRect = [System.Drawing.RectangleF]::new($frameX + 18, 22, $tabWidth - 36, 38)
            Draw-CenteredText -Graphics $graphics -Text $package.Title -Font $fontPackage -Brush $whiteBrush -Rectangle $packageRect
            $scopeRect = [System.Drawing.RectangleF]::new($frameX + 18, 55, $tabWidth - 36, 19)
            Draw-CenteredText -Graphics $graphics -Text $package.Scope -Font $fontScope -Brush $whiteBrush -Rectangle $scopeRect

            $headerTop = $frameY + 38
            $graphics.FillRectangle($accentSoftBrush, $frameX + 1, $headerTop, $frameWidth - 2, 54)
            Draw-CenteredText -Graphics $graphics -Text 'VISTAS (React)' -Font $fontColumn -Brush $textBrush -Rectangle ([System.Drawing.RectangleF]::new($viewX, $headerTop, $viewWidth, 54))
            Draw-CenteredText -Graphics $graphics -Text 'CONTROLADORES (Laravel)' -Font $fontColumn -Brush $textBrush -Rectangle ([System.Drawing.RectangleF]::new($controllerX, $headerTop, $controllerWidth, 54))
            Draw-CenteredText -Graphics $graphics -Text 'TABLAS RELACIONADAS' -Font $fontColumn -Brush $textBrush -Rectangle ([System.Drawing.RectangleF]::new($tableX, $headerTop, $tableWidth, 54))

            $rowY = $frameY + $headerHeight
            for ($i = 0; $i -lt $package.Flows.Count; $i++) {
                $flow = $package.Flows[$i]
                $rowHeight = $rowHeights[$i]
                $rowBrush = if (($i % 2) -eq 0) { $rowWhiteBrush } else { $rowAlternateBrush }
                $graphics.FillRectangle($rowBrush, $frameX + 1, $rowY, $frameWidth - 2, $rowHeight)
                $graphics.DrawLine($separatorPen, $frameX + 1, $rowY, $frameX + $frameWidth - 1, $rowY)

                $codePillWidth = 76
                $graphics.FillRectangle($accentBrush, $frameX + 20, $rowY + 11, $codePillWidth, 28)
                Draw-CenteredText -Graphics $graphics -Text $flow.Code -Font $fontColumn -Brush $whiteBrush -Rectangle ([System.Drawing.RectangleF]::new($frameX + 20, $rowY + 11, $codePillWidth, 28))
                $rowTitleRect = [System.Drawing.RectangleF]::new($frameX + 110, $rowY + 8, 1190, 34)
                $graphics.DrawString($flow.Name, $fontRow, $textBrush, $rowTitleRect)

                $cardY = $rowY + $contentTopPadding
                $viewHeight = Get-ComponentHeight -Items $flow.Views
                $controllerHeight = Get-ComponentHeight -Items $flow.Controllers
                $tablesHeight = ($flow.Tables.Count * $tableHeight) + ([Math]::Max(0, $flow.Tables.Count - 1) * $tableGap)
                $contentHeight = [Math]::Max($viewHeight, [Math]::Max($controllerHeight, $tablesHeight))

                $viewY = $cardY + (($contentHeight - $viewHeight) / 2)
                $controllerY = $cardY + (($contentHeight - $controllerHeight) / 2)
                $tablesY = $cardY + (($contentHeight - $tablesHeight) / 2)

                [void](Draw-ComponentCard -Graphics $graphics -X $viewX -Y $viewY -Width $viewWidth -Items $flow.Views -Stereotype 'vista' -StereoFont $fontStereo -LabelFont $fontLabel -TextBrush $textBrush -MutedBrush $mutedBrush -FillBrush $viewFillBrush -ShadowBrush $shadowBrush -BorderPen $borderPen)
                [void](Draw-ComponentCard -Graphics $graphics -X $controllerX -Y $controllerY -Width $controllerWidth -Items $flow.Controllers -Stereotype 'controlador' -StereoFont $fontStereo -LabelFont $fontLabel -TextBrush $textBrush -MutedBrush $mutedBrush -FillBrush $controllerFillBrush -ShadowBrush $shadowBrush -BorderPen $borderPen)

                $viewCenterY = $viewY + ($viewHeight / 2)
                $controllerCenterY = $controllerY + ($controllerHeight / 2)
                $interfaceX = $viewX + $viewWidth + (($controllerX - ($viewX + $viewWidth)) / 2)
                $graphics.DrawLine($apiPen, $viewX + $viewWidth, $viewCenterY, $interfaceX - 10, $viewCenterY)
                $graphics.DrawLine($apiPen, $interfaceX + 10, $viewCenterY, $controllerX, $controllerCenterY)
                $graphics.FillEllipse($whiteBrush, $interfaceX - 9, $viewCenterY - 9, 18, 18)
                $graphics.DrawEllipse($apiPen, $interfaceX - 9, $viewCenterY - 9, 18, 18)
                $apiLabelRect = [System.Drawing.RectangleF]::new($interfaceX - 58, $viewCenterY - 31, 116, 18)
                Draw-CenteredText -Graphics $graphics -Text 'API REST' -Font $fontTableStereo -Brush $apiBrush -Rectangle $apiLabelRect

                $tableY = $tablesY
                foreach ($table in $flow.Tables) {
                    $tableCenterY = $tableY + ($tableHeight / 2)
                    $graphics.DrawLine($dbPen, $controllerX + $controllerWidth, $controllerCenterY, $tableX - 14, $tableCenterY)
                    Draw-ArrowHead -Graphics $graphics -X $tableX -Y $tableCenterY -Brush $dbBrush
                    Draw-TableCard -Graphics $graphics -X $tableX -Y $tableY -Width $tableWidth -Name $table -StereoFont $fontTableStereo -LabelFont $fontTableLabel -TextBrush $textBrush -MutedBrush $mutedBrush -FillBrush $tableFillBrush -ShadowBrush $shadowBrush -BorderPen $borderPen
                    $tableY += $tableHeight + $tableGap
                }

                $rowY += $rowHeight
            }

            $graphics.DrawLine($separatorPen, $frameX + 1, $rowY, $frameX + $frameWidth - 1, $rowY)
            $footerRect = [System.Drawing.RectangleF]::new($frameX + 26, $rowY + 8, $frameWidth - 52, 40)
            Draw-CenteredText -Graphics $graphics -Text 'Lectura: vista -> API REST -> controlador; controlador --> tablas. Las tablas compartidas pueden pertenecer a otro paquete.' -Font $fontFooter -Brush $mutedBrush -Rectangle $footerRect

            $pngPath = Join-Path $outputDirectory ($package.File + '.png')
            $bitmap.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
            Write-Host "Generado: $pngPath"

            $pumlPath = Join-Path $outputDirectory ($package.File + '.puml')
            Write-PlantUmlSource -Package $package -Path $pumlPath
            Write-Host "Generado: $pumlPath"
        }
        finally {
            $graphics.Dispose()
            $bitmap.Dispose()
        }
    }
}
finally {
    @(
        $fontPackage, $fontScope, $fontColumn, $fontRow, $fontStereo, $fontLabel,
        $fontTableStereo, $fontTableLabel, $fontFooter,
        $textBrush, $mutedBrush, $whiteBrush, $accentBrush, $accentSoftBrush,
        $viewFillBrush, $controllerFillBrush, $tableFillBrush, $shadowBrush,
        $rowAlternateBrush, $rowWhiteBrush, $apiBrush, $dbBrush,
        $borderPen, $framePen, $separatorPen, $apiPen, $dbPen
    ) | ForEach-Object { if ($null -ne $_) { $_.Dispose() } }
}

