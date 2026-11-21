import test from 'node:test';
import assert from 'node:assert/strict';

import { canAccessCu } from '../src/config/access.js';
import {
  solicitudInstalacionService,
  mockSolicitudesCu21,
  initialSolicitudInterna,
  initialSolicitudPublica,
} from '../src/models/Paquetes/P6_InstalacionesTecnicas/CU21_RegistrarSolicitudInstalacion/solicitudInstalacionModel.js';

test('CU21: Administrador tiene acceso a Registrar Solicitud de Instalación', () => {
  const admin = {
    rol: { slug: 'admin' },
    permisos: ['instalaciones.view', 'instalaciones.schedule'],
  };
  assert.equal(canAccessCu(admin, 'CU21'), true);
});

test('CU21: Secretaría tiene acceso a Registrar Solicitud de Instalación', () => {
  const secretaria = {
    rol: { slug: 'secretaria' },
    permisos: ['instalaciones.view', 'instalaciones.schedule'],
  };
  assert.equal(canAccessCu(secretaria, 'CU21'), true);
});

test('CU21: Técnico no tiene acceso al registro de solicitudes de instalación', () => {
  const tecnico = {
    rol: { slug: 'tecnico' },
    permisos: ['instalaciones.view', 'instalaciones.execute'],
  };
  assert.equal(canAccessCu(tecnico, 'CU21'), false);
});

test('CU21: Mock de solicitudes contiene datos de demostración coherentes', async () => {
  assert.ok(mockSolicitudesCu21.length >= 2);
  const primera = mockSolicitudesCu21[0];
  assert.equal(primera.numero_orden, 'ORD-2026-00001');
  assert.equal(primera.estado_solicitud, 'PENDIENTE');
  assert.ok(primera.cliente);
  assert.equal(primera.cliente.nombreCompleto, 'Juan Carlos Perez');
});

test('CU21: initialSolicitudInterna define los campos obligatorios del CU', () => {
  assert.equal(Object.prototype.hasOwnProperty.call(initialSolicitudInterna, 'cliente_id'), true);
  assert.equal(Object.prototype.hasOwnProperty.call(initialSolicitudInterna, 'direccion'), true);
  assert.equal(Object.prototype.hasOwnProperty.call(initialSolicitudInterna, 'latitud'), true);
  assert.equal(Object.prototype.hasOwnProperty.call(initialSolicitudInterna, 'longitud'), true);
});

test('CU21: initialSolicitudPublica define los datos requeridos para clientes en la web', () => {
  assert.equal(Object.prototype.hasOwnProperty.call(initialSolicitudPublica, 'nombres'), true);
  assert.equal(Object.prototype.hasOwnProperty.call(initialSolicitudPublica, 'ci'), true);
  assert.equal(Object.prototype.hasOwnProperty.call(initialSolicitudPublica, 'telefono'), true);
  assert.equal(Object.prototype.hasOwnProperty.call(initialSolicitudPublica, 'zona_id'), true);
  assert.equal(Object.prototype.hasOwnProperty.call(initialSolicitudPublica, 'direccion'), true);
});

