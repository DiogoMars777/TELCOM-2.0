@component('mail::message')
# Código de verificación - TELCOM

Tu código para restablecer la contraseña es:

@component('mail::panel')
**{{ $code }}**
@endcomponent

Este código caduca en 10 minutos y solo puede usarse una vez.

Si tú no solicitaste este cambio, puedes ignorar este correo.

Gracias,<br>
{{ config('app.name') }}
@endcomponent
