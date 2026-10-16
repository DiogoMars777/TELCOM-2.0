import { useState, useEffect } from 'react';
import { corteRegistroService } from '../../../../models/Paquetes/ServiciosPlanes/CU14_RegistrarCorteRealizado/corteRegistroModel';
import { serviciosCorteService } from '../../../../models/Paquetes/ServiciosPlanes/CU13_ListadoServiciosCorte/servicioCorteModel';
import { describeApiError } from '../../../../services/apiClient';

export function useCorteRegistroController(initialServicio = null) {
  const [servicios, setServicios] = useState([]);
  const [selectedServicio, setSelectedServicio] = useState(initialServicio);
  const [servicesError, setServicesError] = useState(null);
  const [tipoCorte, setTipoCorte] = useState('LOGICO');
  const [motivo, setMotivo] = useState('Mora prolongada mayor a 15 días');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [corteSuccess, setCorteSuccess] = useState(null);

  useEffect(() => {
    if (initialServicio) {
      setSelectedServicio(initialServicio);
    }
  }, [initialServicio]);

  // El listado de servicios proviene del backend (CU13), no de datos inventados.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await serviciosCorteService.fetchServiciosCorte();
        if (!active) return;
        setServicios(data);
        setSelectedServicio(prev => {
          if (prev) {
            const found = data.find(s => s.id === prev.id);
            return found ? { ...prev, ...found } : prev;
          }
          return data[0] ?? null;
        });
      } catch (e) {
        if (!active) return;
        setServicios([]);
        setServicesError(describeApiError(e));
      }
    })();
    return () => { active = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedServicio) {
      setError('Seleccione un servicio para cortar.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        servicio_id: selectedServicio.id,
        tipo_corte: tipoCorte,
        motivo,
        observaciones,
      };
      const res = await corteRegistroService.registrarCorte(payload);
      const corte = res?.data?.corte;
      if (!corte) {
        throw new Error('El servidor no confirmó el registro del corte.');
      }
      // La orden se construye con los datos REALES devueltos por el backend.
      setCorteSuccess({
        codigo_orden: corte.codigo_orden_corte,
        servicio: selectedServicio.codigo_servicio,
        tipo: corte.tipo_corte ?? tipoCorte,
        fecha: new Date().toLocaleString(),
      });
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return {
    servicios,
    servicesError,
    selectedServicio,
    setSelectedServicio,
    tipoCorte,
    setTipoCorte,
    motivo,
    setMotivo,
    observaciones,
    setObservaciones,
    loading,
    error,
    corteSuccess,
    setCorteSuccess,
    handleSubmit,
  };
}
