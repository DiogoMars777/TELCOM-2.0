<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RecuperarPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $codigo,
        public string $resetUrl,
        public int $expiraMinutos = 60
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Código de recuperación de contraseña - TELCOM',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.recuperar_password',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
