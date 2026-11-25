import { apiClient, authToken } from '../../../../services/apiClient.js';
import { isDemoMode } from '../../../../config/appConfig.js';

const rawBaseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api';
const cleanBaseUrl = String(rawBaseUrl).trim().replace(/\/+$/, '');
const BASE_URL = cleanBaseUrl.endsWith('/api') ? cleanBaseUrl : `${cleanBaseUrl}/api`;

export const mockBackups = [
  {
    id: 1,
    nombre_archivo: 'backup_telcom_2026-11-15_120000.sql',
    tamano_bytes: 4851200,
    tamano_legible: '4.63 MB',
    fecha_hora: '2026-11-15 12:00:00',
    descripcion: 'Copia periódica de base de datos antes de mantenimiento de nodos.',
    tipo: 'MANUAL',
    estado: 'COMPLETADO',
    usuario: { id: 1, name: 'Admin Telecom', email: 'admin@telcom.com' },
    existe_archivo: true,
  },
  {
    id: 2,
    nombre_archivo: 'backup_telcom_2026-11-19_083000.sql',
    tamano_bytes: 5120000,
    tamano_legible: '4.88 MB',
    fecha_hora: '2026-11-19 08:30:00',
    descripcion: 'Respaldo previo al cierre mensual de cobranzas y facturación.',
    tipo: 'MANUAL',
    estado: 'COMPLETADO',
    usuario: { id: 1, name: 'Admin Telecom', email: 'admin@telcom.com' },
    existe_archivo: true,
  },
];

export const copiasSeguridadModel = {
  /**
   * Obtener lista de copias de seguridad existentes.
   */
  async listar() {
    if (isDemoMode()) {
      return [...mockBackups];
    }
    const res = await apiClient.get('/cu28/backups');
    return res?.data?.backups ?? [];
  },

  /**
   * Solicitar la generación de una nueva copia de seguridad en el servidor.
   */
  async generar(descripcion = '') {
    if (isDemoMode()) {
      const nuevo = {
        id: Date.now(),
        nombre_archivo: `backup_telcom_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.sql`,
        tamano_bytes: 5200000,
        tamano_legible: '4.95 MB',
        fecha_hora: new Date().toISOString().slice(0, 19).replace('T', ' '),
        descripcion: descripcion || 'Copia de seguridad manual.',
        tipo: 'MANUAL',
        estado: 'COMPLETADO',
        usuario: { id: 1, name: 'Admin Telecom', email: 'admin@telcom.com' },
        existe_archivo: true,
      };
      mockBackups.unshift(nuevo);
      return nuevo;
    }

    const res = await apiClient.post('/cu28/backups', { descripcion });
    return res?.data?.backup;
  },

  /**
   * Descargar el archivo .sql físico de una copia de seguridad.
   */
  async descargar(id, nombreArchivo) {
    if (isDemoMode()) {
      const dummyContent = `-- TELCOM 2.0 DEMO BACKUP SQL\n-- Archivo: ${nombreArchivo}\nSELECT 1;`;
      const blob = new Blob([dummyContent], { type: 'application/sql' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo || `backup_${id}.sql`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return true;
    }

    const token = authToken.get();
    const headers = { Accept: 'application/sql, application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/cu28/backups/${id}/download`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      let msg = 'Error al descargar la copia de seguridad';
      try {
        const json = await response.json();
        if (json?.message) msg = json.message;
      } catch {
        // no json
      }
      const err = new Error(msg);
      err.status = response.status;
      throw err;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo || `backup_${id}.sql`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return true;
  },

  /**
   * Restaurar la base de datos a partir de una copia existente en el servidor.
   */
  async restaurar(id) {
    if (isDemoMode()) {
      const idx = mockBackups.findIndex((b) => b.id === id);
      if (idx !== -1) {
        mockBackups[idx].estado = 'RESTAURADO';
      }
      return true;
    }

    const res = await apiClient.post(`/cu28/backups/${id}/restore`);
    return res?.data?.backup;
  },

  /**
   * Subir un archivo .sql externo y restaurar la base de datos con él.
   */
  async restaurarDesdeArchivo(file, descripcion = '') {
    if (isDemoMode()) {
      const nuevo = {
        id: Date.now(),
        nombre_archivo: `subido_${file.name}`,
        tamano_bytes: file.size,
        tamano_legible: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        fecha_hora: new Date().toISOString().slice(0, 19).replace('T', ' '),
        descripcion: descripcion || `Restauración desde archivo subido: ${file.name}`,
        tipo: 'SUBIDA',
        estado: 'RESTAURADO',
        usuario: { id: 1, name: 'Admin Telecom', email: 'admin@telcom.com' },
        existe_archivo: true,
      };
      mockBackups.unshift(nuevo);
      return nuevo;
    }

    const token = authToken.get();
    const formData = new FormData();
    formData.append('archivo', file);
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }

    const headers = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
      response = await fetch(`${BASE_URL}/cu28/backups/restore-upload`, {
        method: 'POST',
        headers,
        body: formData,
      });
    } catch {
      const err = new Error('No se pudo conectar con el servidor.');
      err.status = 0;
      throw err;
    }

    let body = null;
    try {
      body = await response.json();
    } catch {
      // not json
    }

    if (!response.ok || body?.success === false) {
      const err = new Error(body?.message || `HTTP ${response.status}`);
      err.status = response.status;
      err.errors = body?.errors;
      throw err;
    }

    return body?.data?.backup;
  },

  /**
   * Eliminar una copia de seguridad física y su registro.
   */
  async eliminar(id) {
    if (isDemoMode()) {
      const idx = mockBackups.findIndex((b) => b.id === id);
      if (idx !== -1) mockBackups.splice(idx, 1);
      return true;
    }

    const res = await apiClient.delete(`/cu28/backups/${id}`);
    return res?.data;
  },

  /**
   * Obtener parámetros de respaldo automático / programado (CU28).
   */
  async obtenerConfiguracion() {
    if (isDemoMode()) {
      return {
        activo: true,
        frecuencia: 'DIARIO',
        hora_ejecucion: '02:00',
        dias_semana: '["1","2","3","4","5","6","0"]',
        dias_semana_array: ['1', '2', '3', '4', '5', '6', '0'],
        dia_mes: 1,
        retencion_copias: 7,
        ultimo_backup_at: '2026-11-24 02:00:00',
        proximo_backup_at: '2026-11-25 02:00:00',
        ultimo_estado: 'EXITOSO',
        ultimo_mensaje: 'Copia automática generada exitosamente (4.88 MB).',
      };
    }

    const res = await apiClient.get('/cu28/configuracion');
    return res?.data?.configuracion;
  },

  /**
   * Actualizar configuración de copias de seguridad automáticas (CU28).
   */
  async guardarConfiguracion(config) {
    if (isDemoMode()) {
      return { ...config, ultimo_estado: 'EXITOSO' };
    }

    const res = await apiClient.put('/cu28/configuracion', config);
    return res?.data?.configuracion;
  },

  /**
   * Disparar ejecución inmediata del respaldo programado (CU28).
   */
  async ejecutarProgramadoAhora() {
    if (isDemoMode()) {
      const nuevo = {
        id: Date.now(),
        nombre_archivo: `backup_auto_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.sql`,
        tamano_bytes: 5120000,
        tamano_legible: '4.88 MB',
        fecha_hora: new Date().toISOString().slice(0, 19).replace('T', ' '),
        descripcion: 'Respaldo automático forzado manualmente (DIARIO)',
        tipo: 'AUTOMATICA',
        estado: 'COMPLETADO',
        usuario: { id: 1, name: 'Admin Telecom', email: 'admin@telcom.com' },
        existe_archivo: true,
      };
      mockBackups.unshift(nuevo);
      return { backup: nuevo };
    }

    const res = await apiClient.post('/cu28/configuracion/ejecutar-ahora');
    return res?.data;
  },
};
