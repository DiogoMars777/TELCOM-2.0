/**
 * Pruebas de la política de contraseñas del frontend.
 *
 * Debe coincidir con la validación del backend
 * (`UsuarioController::store`). Se comprueban los casos pedidos:
 * sin mayúscula, sin número, sin símbolo y una contraseña válida.
 *
 * Ejecutar:  npm test
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const { evaluatePassword, isPasswordValid, PASSWORD_REQUIREMENTS, PASSWORD_MIN_LENGTH } =
  await import('../src/config/passwordPolicy.js');

test('rechaza una contraseña sin mayúscula', () => {
  assert.equal(isPasswordValid('clavesegura123!'), false);
});

test('rechaza una contraseña sin minúscula', () => {
  assert.equal(isPasswordValid('CLAVESEGURA123!'), false);
});

test('rechaza una contraseña sin número', () => {
  assert.equal(isPasswordValid('ClaveSegura!'), false);
});

test('rechaza una contraseña sin símbolo', () => {
  assert.equal(isPasswordValid('ClaveSegura123'), false);
});

test('rechaza una contraseña demasiado corta', () => {
  assert.equal(isPasswordValid('Ab1!xy'), false);
});

test('acepta una contraseña que cumple todos los requisitos', () => {
  assert.equal(isPasswordValid('ClaveSegura123!'), true);
});

test('expone un requisito por regla para pintarlos en vivo en el formulario', () => {
  const checks = evaluatePassword('clave'); // 5 caracteres, solo minúsculas
  const porId = Object.fromEntries(checks.map((c) => [c.id, c.met]));

  assert.equal(checks.length, PASSWORD_REQUIREMENTS.length);
  assert.equal(checks.length, 5);
  assert.equal(porId.length, false);
  assert.equal(porId.uppercase, false);
  assert.equal(porId.lowercase, true);
  assert.equal(porId.number, false);
  assert.equal(porId.special, false);
});

test('la longitud mínima reflejada es la del proyecto (8)', () => {
  assert.equal(PASSWORD_MIN_LENGTH, 8);
});
