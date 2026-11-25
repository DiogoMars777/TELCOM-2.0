import { useState, useEffect, useCallback } from 'react';
import { copiasSeguridadModel } from '../../../../models/Paquetes/P1_SeguridadAdministracion/CU28_GenerarRestaurarCopiasSeguridad/copiasSeguridadModel';
import { describeApiError } from '../../../../services/apiClient';

export function useCopiasSeguridadController() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estados de automatización programada (CU28)
  const [configuracion, setConfiguracion] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [guardandoConfig, setGuardandoConfig] = useState(false);
  const [ejecutandoProgramado, setEjecutandoProgramado] = useState(false);

  // Estados de modales
  const [showModalGenerar, setShowModalGenerar] = useState(false);
  const [showModalUpload, setShowModalUpload] = useState(false);
  const [backupParaRestaurar, setBackupParaRestaurar] = useState(null);
  const [backupParaEliminar, setBackupParaEliminar] = useState(null);

  const cargarConfiguracion = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const data = await copiasSeguridadModel.obtenerConfiguracion();
      setConfiguracion(data);
    } catch {
      // Ignorar fallo no crítico al cargar configuración inicial
    } finally {
      setLoadingConfig(false);
    }
  }, []);

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
    cargarConfiguracion();
  }, [cargarBackups, cargarConfiguracion]);

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

  /**
   * Guardar la configuración de automatización de copias
   */
  const handleGuardarConfiguracion = async (nuevaConfig) => {
    setGuardandoConfig(true);
    setError(null);
    setSuccess(null);
    try {
      const guardada = await copiasSeguridadModel.guardarConfiguracion(nuevaConfig);
      setConfiguracion(guardada);
      setSuccess('Programación de copias de seguridad actualizada exitosamente.');
      return true;
    } catch (err) {
      setError(describeApiError(err));
      return false;
    } finally {
      setGuardandoConfig(false);
    }
  };

  /**
   * Ejecutar la copia programada inmediatamente (prueba bajo demanda)
   */
  const handleEjecutarProgramado = async () => {
    setEjecutandoProgramado(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await copiasSeguridadModel.ejecutarProgramadoAhora();
      if (res?.configuracion) {
        setConfiguracion(res.configuracion);
      }
      setSuccess('Respaldo automático ejecutado exitosamente.');
      await cargarBackups();
      return true;
    } catch (err) {
      setError(describeApiError(err));
      return false;
    } finally {
      setEjecutandoProgramado(false);
    }
  };

  return {
    backups,
    loading,
    submitting,
    error,
    success,
    configuracion,
    loadingConfig,
    guardandoConfig,
    ejecutandoProgramado,
    showModalGenerar,
    setShowModalGenerar,
    showModalUpload,
    setShowModalUpload,
    backupParaRestaurar,
    setBackupParaRestaurar,
    backupParaEliminar,
    setBackupParaEliminar,
    cargarBackups,
    cargarConfiguracion,
    handleGuardarConfiguracion,
    handleEjecutarProgramado,
    handleGenerar,
    handleDescargar,
    handleRestaurar,
    handleRestaurarArchivo,
    handleEliminar,
    limpiarMensajes,
  };
}
