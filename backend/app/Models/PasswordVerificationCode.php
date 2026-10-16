<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PasswordVerificationCode extends Model
{
    protected $table = 'password_verification_codes';

    protected $fillable = [
        'email',
        'code_hash',
        'expires_at',
        'attempts',
        'used_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
        'attempts' => 'integer',
    ];
}
