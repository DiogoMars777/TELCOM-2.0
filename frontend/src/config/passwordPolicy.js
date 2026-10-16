/**
 * Política de contraseñas de TELCOM.
 *
 * Debe coincidir EXACTAMENTE con la validación del backend
 * (`UsuarioController::store`): longitud mínima, una mayúscula, una
 * minúscula, un número y un carácter especial entre ! @ # $ % & *.
 *
 * Se usa tanto para pintar los requisitos en el formulario como para impedir
 * el envío; el backend vuelve a validar para que la regla no pueda omitirse.
 */

export const PASSWORD_MIN_LENGTH = 8;

// Caracteres especiales admitidos (los mismos que valida el backend).
export const PASSWORD_SPECIAL_CHARS = '!@#$%&*';

const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_NUMBER = /[0-9]/;
// Dentro de una clase de caracteres estos símbolos son literales.
const HAS_SPECIAL = /[!@#$%&*]/;

export const PASSWORD_REQUIREMENTS = [
  {
    id: 'length',
    label: `Al menos ${PASSWORD_MIN_LENGTH} caracteres`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'uppercase',
    label: 'Al menos una letra mayúscula (A-Z)',
    test: (value) => HAS_UPPERCASE.test(value),
  },
  {
    id: 'lowercase',
    label: 'Al menos una letra minúscula (a-z)',
    test: (value) => HAS_LOWERCASE.test(value),
  },
  {
    id: 'number',
    label: 'Al menos un número (0-9)',
    test: (value) => HAS_NUMBER.test(value),
  },
  {
    id: 'special',
    label: `Al menos un carácter especial (${PASSWORD_SPECIAL_CHARS.split('').join(' ')})`,
    test: (value) => HAS_SPECIAL.test(value),
  },
];

/**
 * Evalúa cada requisito contra la contraseña indicada.
 * Devuelve una copia con `met` para poder pintarlos en la interfaz.
 */
export function evaluatePassword(value) {
  const password = typeof value === 'string' ? value : '';

  return PASSWORD_REQUIREMENTS.map(({ id, label, test }) => ({
    id,
    label,
    met: test(password),
  }));
}

/** `true` solo si la contraseña cumple TODOS los requisitos. */
export function isPasswordValid(value) {
  return evaluatePassword(value).every((requirement) => requirement.met);
}
