import { useState, useEffect } from 'react';
import { usuarioService } from '../../../../models/Paquetes/SeguridadAdministracion/CU03_UsuariosRolesPermisos/usuarioModel';
import { describeApiError } from '../../../../services/apiClient';
import { isPasswordValid } from '../../../../config/passwordPolicy.js';

// El rol se envía por `rol_id` (identificador real del backend); el nombre
// visible se toma del catálogo de roles. Sin valores inventados.
const emptyNewUser = { name: '', email: '', password: '', rol_id: '' };

export function useUsuarioController() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);         // Error de carga del listado
  const [formError, setFormError] = useState(null);  // Error al crear un usuario
  const [actionError, setActionError] = useState(null); // Error al activar/desactivar o cambiar rol
  const [actingId, setActingId] = useState(null);       // Usuario con una acción en curso
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState(emptyNewUser);

  const loadUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const { usuarios: data, roles: rolesData } = await usuarioService.fetchUsuariosYRoles();
      setUsuarios(data);
      setRoles(rolesData);
      // Preselecciona el rol operativo por defecto (Secretaría) usando el
      // catálogo real. No crea ni renombra roles.
      setNewUser((prev) => {
        if (prev.rol_id) return prev;
        const porDefecto = rolesData.find((r) => r.slug === 'secretaria') ?? rolesData[0];
        return porDefecto ? { ...prev, rol_id: String(porDefecto.id) } : prev;
      });
    } catch (e) {
      setUsuarios([]);
      setRoles([]);
      setError(describeApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();

    // Bloqueo del lado del cliente: el backend vuelve a validar por seguridad.
    if (!isPasswordValid(newUser.password)) {
      setFormError('La contraseña no cumple los requisitos de seguridad.');
      return;
    }
    if (!newUser.rol_id) {
      setFormError('Debes seleccionar un rol para el usuario.');
      return;
    }

    setLoading(true);
    setFormError(null);
    try {
      await usuarioService.createUsuario({
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        rol_id: Number(newUser.rol_id),
      });
      // Solo se cierra el modal y se recarga cuando el backend confirmó.
      setShowModal(false);
      setNewUser(emptyNewUser);
      await loadUsuarios();
    } catch (err) {
      setFormError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Activar / desactivar un usuario (PUT /cu03/usuarios/{id}).
  const toggleActivo = async (usuario) => {
    setActionError(null);
    setLoading(true);
    setActingId(usuario.id);
    try {
      await usuarioService.actualizarUsuario(usuario.id, { activo: !usuario.activo });
      await loadUsuarios();
    } catch (err) {
      setActionError(describeApiError(err));
    } finally {
      setLoading(false);
      setActingId(null);
    }
  };

  // Cambiar el rol de un usuario (PUT /cu03/usuarios/{id}/rol).
  const cambiarRol = async (usuario, rolId) => {
    if (!rolId || Number(rolId) === Number(usuario.rol_id ?? usuario.rol?.id)) return;
    setActionError(null);
    setLoading(true);
    setActingId(usuario.id);
    try {
      await usuarioService.cambiarRol(usuario.id, Number(rolId));
      await loadUsuarios();
    } catch (err) {
      setActionError(describeApiError(err));
    } finally {
      setLoading(false);
      setActingId(null);
    }
  };

  return {
    usuarios,
    roles,
    loading,
    error,
    formError,
    actionError,
    actingId,
    showModal,
    setShowModal,
    newUser,
    setNewUser,
    handleCreate,
    toggleActivo,
    cambiarRol,
    reload: loadUsuarios,
  };
}
