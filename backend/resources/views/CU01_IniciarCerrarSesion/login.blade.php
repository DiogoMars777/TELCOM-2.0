<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CU01: Iniciar y Cerrar Sesión - TELCOM</title>
    <style>
        body { font-family: sans-serif; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); width: 100%; max-width: 400px; }
        h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #38bdf8; }
        p { color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem; }
        .field { margin-bottom: 1rem; }
        label { display: block; font-size: 0.85rem; margin-bottom: 0.35rem; color: #cbd5e1; }
        input { width: 100%; padding: 0.65rem; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: white; box-sizing: border-box; }
        button { width: 100%; padding: 0.75rem; background: #0284c7; border: none; border-radius: 6px; color: white; font-weight: bold; cursor: pointer; }
        button:hover { background: #0369a1; }
    </style>
</head>
<body>
    <div class="card">
        <h1>TELCOM - Acceso</h1>
        <p>CU01: Iniciar y cerrar sesión</p>
        <form method="POST" action="/api/cu01/login">
            @csrf
            <div class="field">
                <label for="email">Correo Corporativo</label>
                <input type="email" id="email" name="email" required placeholder="admin@telcom.com">
            </div>
            <div class="field">
                <label for="password">Contraseña</label>
                <input type="password" id="password" name="password" required placeholder="••••••••">
            </div>
            <button type="submit">Iniciar Sesión</button>
        </form>
    </div>
</body>
</html>
