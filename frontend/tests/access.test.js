/**
 * Pruebas reales del control de acceso del menú (frontend/src/config/access.js).
 *
 * Verifican que el menú se filtra por los PERMISOS REALES que devuelve el
 * backend para cada rol, y que manipular el estado de React no concede acceso.
 * NO sustituyen a las pruebas del backend (que es quien autoriza de verdad).
 *
 * Ejecutar:  npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CU_PERMISSIONS,
  CU_ORDER,
  hasPermission,
  canAccessCu,
  filterCuIds,
  firstAllowedCu,
} from '../src/config/access.js';

// --- Matriz de permisos real (idéntica al DatabaseSeeder) ---
const PERMISOS_ADMIN = [
  'auth.login', 'auditoria.view', 'usuarios.manage', 'zonas.manage',
  'clientes.create', 'clientes.view', 'clientes.update',
  'servicios.view', 'servicios.manage',
  'mensualidades.view', 'mensualidades.generate',
  'pagos.register', 'pagos.history', 'alertas.view',
  'cortes.list', 'cortes.register', 'reactivaciones.manage',
  'planes.view', 'planes.assign', 'planes.manage',
  'equipos.view', 'equipos.manage', 'equipos.assign',
  'instalaciones.view', 'instalaciones.schedule', 'instalaciones.execute',
  'proveedores.manage', 'compras.manage', 'reportes.view',
];

const PERMISOS_SECRETARIA = [
  'auth.login', 'clientes.create', 'clientes.view', 'clientes.update',
  'servicios.view', 'servicios.manage',
  'mensualidades.view', 'mensualidades.generate',
  'pagos.register', 'pagos.history', 'alertas.view',
  'cortes.list', 'cortes.register', 'reactivaciones.manage',
  'planes.view', 'planes.assign',
  'equipos.view', 'equipos.assign',
  'instalaciones.view', 'instalaciones.schedule',
];

const PERMISOS_TECNICO = [
  'auth.login', 'clientes.view', 'servicios.view',
  'equipos.view', 'equipos.manage', 'equipos.assign',
  'instalaciones.view', 'instalaciones.execute',
];

const admin = { rol: { slug: 'admin' }, permisos: PERMISOS_ADMIN };
const secretaria = { rol: { slug: 'secretaria' }, permisos: PERMISOS_SECRETARIA };
const tecnico = { rol: { slug: 'tecnico' }, permisos: PERMISOS_TECNICO };
const sinPermisos = { rol: null, permisos: [] };
const todosLosCu = Object.keys(CU_PERMISSIONS);

test('Administrador ve todos los módulos del sistema', () => {
  assert.deepEqual(filterCuIds(admin, todosLosCu), todosLosCu);
});

test('Secretaría ve sus módulos operativos', () => {
  const visibles = filterCuIds(secretaria, todosLosCu);
  assert.ok(visibles.includes('CU05'));
  assert.ok(visibles.includes('CU06'));
  assert.ok(visibles.includes('CU08'));
  assert.ok(visibles.includes('CU09'));
  assert.ok(visibles.includes('CU10'));
  assert.ok(visibles.includes('CU11'));
  assert.ok(visibles.includes('CU12'));
  assert.ok(visibles.includes('CU13'));
  assert.ok(visibles.includes('CU14'));
  assert.ok(visibles.includes('CU15'));
  // CU17 (asignar/cambiar plan) sí; CU16 (gestión del catálogo) es solo admin.
  assert.equal(canAccessCu(secretaria, 'CU17'), true);
  assert.equal(canAccessCu(secretaria, 'CU16'), false);
});

test('Secretaría NO ve administración de usuarios, auditoría ni zonas', () => {
  assert.equal(canAccessCu(secretaria, 'CU03'), false);
  assert.equal(canAccessCu(secretaria, 'CU02'), false);
  assert.equal(canAccessCu(secretaria, 'CU04'), false);
});

test('Técnico ve sus módulos técnicos y NO ve pagos ni usuarios', () => {
  assert.equal(canAccessCu(tecnico, 'CU06'), true); // consultar clientes
  assert.equal(canAccessCu(tecnico, 'CU08'), true); // consultar servicios
  assert.equal(canAccessCu(tecnico, 'CU10'), false); // registrar pago
  assert.equal(canAccessCu(tecnico, 'CU11'), false); // historial de pagos
  assert.equal(canAccessCu(tecnico, 'CU03'), false); // usuarios/roles/permisos
  assert.equal(canAccessCu(tecnico, 'CU02'), false); // auditoría
  assert.equal(canAccessCu(tecnico, 'CU09'), false); // mensualidades
});

test('Un usuario sin permisos no accede a ningún módulo administrativo', () => {
  for (const cu of todosLosCu) {
    if (cu === 'CU01') {
      assert.equal(canAccessCu(sinPermisos, cu), true, 'CU01 es libre');
    } else {
      assert.equal(canAccessCu(sinPermisos, cu), false, `${cu} no debe permitirse`);
    }
  }
});

test('Manipular el estado de React no concede acceso (guardas por permiso)', () => {
  // Simula que un usuario sin rol fuerza CU03 en el estado del navegador.
  const intruso = { permisos: ['clientes.view'] };
  assert.equal(canAccessCu(intruso, 'CU03'), false);
  assert.equal(canAccessCu(intruso, 'CU10'), false);
  assert.equal(canAccessCu(intruso, 'CU04'), false);
});

test('Módulo desconocido nunca es accesible', () => {
  assert.equal(canAccessCu(admin, 'CU99'), false);
});

test('Administrador, Secretaría y Soporte Técnico pueden cambiar su contraseña', () => {
  assert.equal(canAccessCu(admin, 'CU01_PASSWORD'), true);
  assert.equal(canAccessCu(secretaria, 'CU01_PASSWORD'), true);
  assert.equal(canAccessCu(tecnico, 'CU01_PASSWORD'), true);
  // La opción exige estar dentro del sistema (rol con auth.login).
  assert.equal(canAccessCu(sinPermisos, 'CU01_PASSWORD'), false);
});

test('hasPermission exige el permiso exacto', () => {
  assert.equal(hasPermission(secretaria, 'pagos.register'), true);
  assert.equal(hasPermission(secretaria, 'usuarios.manage'), false);
  assert.equal(hasPermission(secretaria, null), true); // sin permiso requerido
  assert.equal(hasPermission(null, 'clientes.view'), false);
});

test('El módulo inicial es el primero permitido del orden preferido', () => {
  assert.equal(firstAllowedCu(admin), 'CU06');
  assert.equal(firstAllowedCu(secretaria), 'CU06');
  assert.equal(canAccessCu(tecnico, firstAllowedCu(tecnico)), true);
  assert.equal(firstAllowedCu(sinPermisos), 'CU01');
  assert.ok(CU_ORDER.includes(firstAllowedCu(admin)));
});
