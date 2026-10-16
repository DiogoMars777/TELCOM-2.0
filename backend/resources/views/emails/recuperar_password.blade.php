<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperación de Contraseña - TELCOM</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            -webkit-text-size-adjust: 100%;
        }
        .container {
            max-width: 580px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
            border: 1px solid #e2e8f0;
        }
        .header {
            background: linear-gradient(135deg, #0b1e36 0%, #004b99 100%);
            padding: 32px 28px;
            text-align: center;
            color: #ffffff;
        }
        .header-title {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 0.5px;
        }
        .header-subtitle {
            margin: 6px 0 0;
            font-size: 13px;
            color: #93c5fd;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .content {
            padding: 36px 32px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 0;
            margin-bottom: 12px;
        }
        .text {
            font-size: 15px;
            line-height: 1.6;
            color: #475569;
            margin: 0 0 20px;
        }
        .code-box {
            background: #f8fafc;
            border: 2px dashed #93c5fd;
            border-radius: 12px;
            padding: 22px;
            text-align: center;
            margin: 28px 0;
        }
        .code-label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            margin-bottom: 8px;
        }
        .code-number {
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 34px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #0056b3;
            margin: 0;
        }
        .btn-wrapper {
            text-align: center;
            margin: 28px 0;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #0066cc 0%, #004b99 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 0.3px;
            box-shadow: 0 4px 12px rgba(0, 102, 204, 0.25);
        }
        .info-pill {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 12px 16px;
            border-radius: 0 8px 8px 0;
            font-size: 13px;
            line-height: 1.5;
            color: #1e40af;
            margin: 24px 0 16px;
        }
        .footer {
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 20px 32px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="header-title">TELCOM</h1>
            <p class="header-subtitle">Sistema de Telecomunicaciones</p>
        </div>

        <div class="content">
            <h2 class="greeting">Hola, {{ $user->name }}</h2>
            <p class="text">
                Hemos recibido una solicitud para restablecer la contraseña de acceso a tu cuenta (<strong>{{ $user->email }}</strong>).
            </p>
            <p class="text">
                Puedes completar la verificación ingresando el siguiente código de 6 dígitos en la pantalla de recuperación:
            </p>

            <div class="code-box">
                <div class="code-label">Código de verificación</div>
                <div class="code-number">{{ $codigo }}</div>
            </div>

            <div class="btn-wrapper">
                <a href="{{ $resetUrl }}" class="btn" target="_blank" rel="noopener noreferrer">
                    Restablecer Contraseña Directamente
                </a>
            </div>

            <div class="info-pill">
                ⏳ <strong>Validez:</strong> Este código y enlace expirarán en <strong>{{ $expiraMinutos }} minutos</strong> por motivos de seguridad.
            </div>

            <p class="text" style="font-size: 13px; color: #64748b; margin-top: 24px;">
                Si tú no solicitaste este cambio, no te preocupes: puedes ignorar este correo de forma segura. Tu contraseña actual no se modificará sin este código.
            </p>
        </div>

        <div class="footer">
            © {{ date('Y') }} TELCOM. Todos los derechos reservados.<br>
            Este es un correo automático del sistema, por favor no respondas a este mensaje.
        </div>
    </div>
</body>
</html>
