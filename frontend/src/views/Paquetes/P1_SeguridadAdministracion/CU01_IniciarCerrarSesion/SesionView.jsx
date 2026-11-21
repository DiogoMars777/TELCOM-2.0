import React from 'react';
import { Mail, Shield, UserCheck } from 'lucide-react';

/**
 * CU01 - Panel de sesión dentro del área administrativa.
 * La pantalla de inicio de sesión es pública; aquí se muestra el usuario
 * autenticado. El cierre de sesión se realiza desde el botón junto al perfil.
 */
export default function SesionView({ user }) {
  const name = user?.name || user?.nombre_usuario || 'Usuario';
  const email = user?.email || '—';

  return (
    <div className="view-panel">
      <div className="view-header">
        <div>
          <h2>Mi Sesión</h2>
          <p className="subtitle">Usuario autenticado en el sistema</p>
        </div>
      </div>

      <div className="form-card" style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="user-avatar" style={{ width: 52, height: 52, fontSize: '1.25rem' }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{email}</div>
          </div>
        </div>

        <div className="tech-info" style={{ gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserCheck size={16} color="#38bdf8" /> Sesión activa
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Mail size={16} color="#38bdf8" /> {email}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Shield size={16} color="#38bdf8" /> Rol asignado: {user?.rol?.nombre || user?.rol_id || 'Sin rol'}
          </div>
        </div>
      </div>
    </div>
  );
}
