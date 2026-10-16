import React from 'react';
import { useClienteRegistroController } from '../../../../controllers/Paquetes/GestionClientesZonas/CU05_RegistrarCliente/useClienteRegistroController';
import { UserPlus, CheckCircle2, AlertCircle, Save } from 'lucide-react';
// Estilos acotados a esta pantalla (incluye ocultar la barra vertical sin
// desactivar el desplazamiento). Ver ClienteRegistroView.css.
import './ClienteRegistroView.css';

export default function ClienteRegistroView({ onClienteCreated }) {
  const {
    cliente,
    loading,
    successMsg,
    errorMsg,
    zonas,
    loadingZonas,
    zonasError,
    reloadZonas,
    handleChange,
    handleSubmit,
  } = useClienteRegistroController(onClienteCreated);

  // Estado del catálogo de zonas: distingue carga, error y lista vacía para no
  // mostrar una lista vacía como si la carga hubiera tenido éxito.
  const zonasVacias = !loadingZonas && !zonasError && zonas.length === 0;
  const textoOpcionZona = loadingZonas
    ? 'Cargando zonas…'
    : zonasError
      ? 'No se pudieron cargar las zonas'
      : zonasVacias
        ? 'No hay zonas disponibles'
        : 'Seleccione una zona';

  return (
    <div className="view-panel cu05-view">
      <div className="view-header">
        <div>
          <h2>Registrar Nuevo Cliente</h2>
          <p className="subtitle">Formulario de afiliación e ingreso de abonado al sistema de telecomunicaciones</p>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger">
          <AlertCircle size={18} /> {errorMsg}
        </div>
      )}

      {zonasError && (
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={18} />
          <span>No se pudieron cargar las zonas de cobertura: {zonasError}</span>
          <button type="button" className="btn btn-secondary btn-sm cu05-retry" onClick={reloadZonas}>
            Reintentar
          </button>
        </div>
      )}

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Tipo de Documento</label>
              <select name="tipo_documento" value={cliente.tipo_documento} onChange={handleChange}>
                <option value="CI">Cédula de Identidad (CI)</option>
                <option value="NIT">NIT (Empresarial)</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>

            <div className="form-group">
              <label>Nº de Documento</label>
              <input
                type="text"
                name="documento_identidad"
                required
                placeholder="Ej. 8492019"
                value={cliente.documento_identidad}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Nombres</label>
              <input
                type="text"
                name="nombres"
                required
                placeholder="Ej. Carlos Andrés"
                value={cliente.nombres}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Apellidos</label>
              <input
                type="text"
                name="apellidos"
                required
                placeholder="Ej. Mendoza Paredes"
                value={cliente.apellidos}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Teléfono / Celular</label>
              <input
                type="text"
                name="telefono"
                required
                placeholder="+591 76543210"
                value={cliente.telefono}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Correo Electrónico</label>
              <input
                type="email"
                name="email"
                required
                placeholder="carlos.mendoza@email.com"
                value={cliente.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Dirección de Domicilio</label>
              <input
                type="text"
                name="direccion"
                required
                placeholder="Av. Principal #742, Barrio Equipetrol"
                value={cliente.direccion}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="cu05-zona">Zona de Cobertura</label>
              <select
                id="cu05-zona"
                name="zona_id"
                value={cliente.zona_id}
                onChange={handleChange}
                required
                disabled={loadingZonas}
                aria-busy={loadingZonas}
              >
                <option value="">{textoOpcionZona}</option>
                {zonas.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nombre}{z.ciudad ? ` — ${z.ciudad}` : ''}
                  </option>
                ))}
              </select>

              {(loadingZonas || zonasVacias || (!zonasError && zonas.length > 0)) && (
                <p className="cu05-hint" role="status">
                  {loadingZonas
                    ? 'Cargando zonas de cobertura…'
                    : zonasVacias
                      ? 'Aún no hay zonas de cobertura registradas. Crea una en «Zonas de Cobertura» antes de dar de alta a un cliente.'
                      : (zonas.length === 1 ? '1 zona disponible.' : `${zonas.length} zonas disponibles.`)}
                </p>
              )}
            </div>
          </div>

          <div className="form-footer">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={18} /> {loading ? 'Registrando...' : 'Registrar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
