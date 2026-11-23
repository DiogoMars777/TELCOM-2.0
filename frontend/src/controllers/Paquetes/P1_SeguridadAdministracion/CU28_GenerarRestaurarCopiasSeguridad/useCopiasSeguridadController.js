import { useState, useEffect, useCallback } from 'react';
import { copiasSeguridadModel } from '../../../../models/Paquetes/P1_SeguridadAdministracion/CU28_GenerarRestaurarCopiasSeguridad/copiasSeguridadModel';
import { describeApiError } from '../../../../services/apiClient';

export function useCopiasSeguridadController() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estados de modales
  const [showModalGenerar, setShowModalGenerar] = useState(false);
  const [showModalUpload, setShowModalUpload] = useState(false);
  const [backupParaRestaurar, setBackupParaRestaurar] = useState(null);
  const [backupParaEliminar, setBackupParaEliminar] = useState(null);

  const cargarBackups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await copiasSeguridadModel.listar();
      setBackups(data);
    } catch (err) {
      setBackups([]);
      setError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarBackups();
  }, [cargarBackups]);

  const limpiarMensajes = () => {
    setError(null);
    setSuccess(null);
  };

  /**
   * Generar nueva copia de seguridad
   */
  const handleGenerar = async (descripcion) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await copiasSeguridadModel.generar(descripcion);
      setSuccess('Copia de seguridad generada exitosamente.');
      setShowModalGenerar(false);
      await cargarBackups();
      return true;
    } catch (err) {
      setError(describeApiError(err));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Descargar archivo .sql
   */
  const handleDescargar = async (backup) => {
    setError(null);
    try {
      await copiasSeguridadModel.descargar(backup.id, backup.nombre_archivo);
    } catch (err) {
      setError(describeApiError(err));
    }
  };

  /**
   * Restaurar base de datos desde una copia existente
   */
  const handleRestaurar = async (id) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await copiasSeguridadModel.restaurar(id);
      setSuccess('Base de datos restaurada exitosamente.');
      setBackupParaRestaurar(null);
      await cargarBackups();
      return true;
    } catch (err) {
      setError(describeApiError(err));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Restaurar base de datos subiendo un archivo .sql
   */
  const handleRestaurarArchivo = async (file, descripcion) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await copiasSeguridadModel.restaurarDesdeArchivo(file, descripcion);
      setSuccess('Base de datos restaurada exitosamente desde el archivo subido.');
      setShowModalUpload(false);
      await cargarBackups();
      return true;
    } catch (err) {
      setError(describeApiError(err));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Eliminar una copia de seguridad
   */
  const handleEliminar = async (id) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await copiasSeguridadModel.eliminar(id);
      setSuccess('Copia de seguridad eliminada exitosamente.');
      setBackupParaEliminar(null);
      await cargarBackups();
      return true;
    } catch (err) {
      setError(describeApiError(err));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    backups,
    loading,
    submitting,
    error,
    success,
    showModalGenerar,
    setShowModalGenerar,
    showModalUpload,
    setShowModalUpload,
    backupParaRestaurar,
    setBackupParaRestaurar,
    backupParaEliminar,
    setBackupParaEliminar,
    cargarBackups,
    handleGenerar,
    handleDescargar,
    handleRestaurar,
    handleRestaurarArchivo,
    handleEliminar,
    limpiarMensajes,
  };
}
