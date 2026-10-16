/**
 * CU17 - Lógica pura del buscador de servicios.
 *
 * Se separa del componente para poder probarla sin renderizar React. No conoce
 * nada de la vista: sólo recibe la lista de servicios y el texto de búsqueda.
 */

// Normaliza para comparar sin distinguir mayúsculas ni tildes.
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// La API entrega la relación `cliente`; el documento puede venir como `ci`
// (columna) o como `documento_identidad` (accesor serializado).
export function documentoDe(servicio) {
  const cliente = servicio?.cliente;
  return cliente?.ci ?? cliente?.documento_identidad ?? cliente?.documentoIdentidad ?? '';
}

export function etiquetaServicio(servicio) {
  if (!servicio) return '';
  return `${servicio.codigo_servicio ?? '—'} — ${servicio.cliente_nombre || 'Sin cliente'}`;
}

// Texto "buscable" de un servicio: código, nombre del cliente, documento y
// código de cliente (por si el usuario lo escribe).
function textoBuscable(servicio) {
  return normalizar(
    [
      servicio?.codigo_servicio,
      servicio?.cliente_nombre,
      servicio?.cliente?.nombres,
      servicio?.cliente?.apellidos,
      servicio?.cliente?.nombreCompleto,
      servicio?.cliente?.nombre_completo,
      servicio?.cliente?.codigo_cliente,
      documentoDe(servicio),
    ]
      .filter(Boolean)
      .join(' '),
  );
}

// Cada término escrito debe aparecer en el servicio (búsqueda tipo AND).
// Una consulta vacía devuelve todos los servicios.
export function filtrarServicios(servicios, consulta) {
  const terminos = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (terminos.length === 0) return servicios;
  return servicios.filter((s) => {
    const base = textoBuscable(s);
    return terminos.every((t) => base.includes(t));
  });
}
