import { useState, useEffect, useCallback } from 'react';
import { instalacionesService } from '../../../../models/Paquetes/InstalacionesTecnicas/CU23_RegistrarInstalacion/instalacionesModel.js';

export function useInstalacionesController() {
  const [instalaciones, setInstalaciones] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [showModalProgramar, setShowModalProgramar] = useState(false);
  const [showModalFinalizar, setShowModalFinalizar] = useState(false);
  const [instalacionSeleccionada, setInstalacionSeleccionada] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [listaInst, listaTec] = await Promise.all([
        instalacionesService.listar({ estado: filtroEstado }),
        instalacionesService.listarTecnicos(),
      ]);
      setInstalaciones(listaInst);
      setTecnicos(listaTec);
    } catch (err) {
      setError(err.message || 'Error al cargar las órdenes de instalación.');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleProgramar = async (formData) => {
    try {
      setLoading(true);
      await instalacionesService.agendarInstalacion(formData);
      setShowModalProgramar(false);
      await cargarDatos();
      return true;
    } catch (err) {
      setError(err.message || 'Error al programar la orden de instalación.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleAsignarTecnico = async (idInstalacion, tecnicoId) => {
    try {
      setLoading(true);
      await instalacionesService.asignarTecnico(idInstalacion, tecnicoId);
      await cargarDatos();
      return true;
    } catch (err) {
      setError(err.message || 'Error al asignar el técnico.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizar = async (idInstalacion, datos) => {
    try {
      setLoading(true);
      await instalacionesService.finalizarInstalacion(idInstalacion, datos);
      setShowModalFinalizar(false);
      setInstalacionSeleccionada(null);
      await cargarDatos();
      return true;
    } catch (err) {
      setError(err.message || 'Error al finalizar la instalación.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    instalaciones,
    tecnicos,
    loading,
    error,
    filtroEstado,
    setFiltroEstado,
    showModalProgramar,
    setShowModalProgramar,
    showModalFinalizar,
    setShowModalFinalizar,
    instalacionSeleccionada,
    setInstalacionSeleccionada,
    handleProgramar,
    handleAsignarTecnico,
    handleFinalizar,
    recargar: cargarDatos,
  };
}

