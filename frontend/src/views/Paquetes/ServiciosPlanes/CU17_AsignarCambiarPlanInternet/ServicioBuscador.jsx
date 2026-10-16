import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Check } from 'lucide-react';
import {
  documentoDe,
  etiquetaServicio,
  filtrarServicios,
} from './servicioBuscadorUtils.js';

/**
 * CU17 - Selector de servicio con búsqueda (combobox accesible).
 *
 * Sustituye al <select> plano, que se vuelve difícil de usar cuando hay muchos
 * servicios. Permite escribir para filtrar por:
 *   - código del servicio (ej. SRV-88201)
 *   - nombre completo del cliente
 *   - documento / CI del cliente (cuando la API lo entrega)
 *
 * Conserva el identificador real del servicio (`id`) al seleccionar, por lo que
 * el cambio de plan vigente y el historial siguen funcionando igual.
 *
 * Se implementa sin librerías nuevas: funciona con mouse, teclado (flechas,
 * Inicio/Fin, Enter, Escape, Tab) y pantalla táctil. Sigue el patrón ARIA 1.2 de
 * combobox sobre un <input> de texto.
 */

export default function ServicioBuscador({
  inputId,
  label,
  servicios = [],
  loading = false,
  value = '',
  onChange,
}) {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const raizRef = useRef(null);

  const seleccionado = useMemo(
    () => servicios.find((s) => String(s.id) === String(value)) ?? null,
    [servicios, value],
  );

  const filtrados = useMemo(() => filtrarServicios(servicios, texto), [servicios, texto]);

  const indiceActivo = filtrados.length === 0 ? -1 : Math.min(activo, filtrados.length - 1);

  // Restaura la etiqueta del servicio elegido al cerrar el desplegable.
  const restaurarTexto = () => {
    setAbierto(false);
    setTexto(seleccionado ? etiquetaServicio(seleccionado) : '');
  };

  // Cierra al pulsar fuera, tanto con mouse como con el dedo (táctil).
  useEffect(() => {
    if (!abierto) return undefined;
    const alPulsarFuera = (event) => {
      if (raizRef.current && !raizRef.current.contains(event.target)) {
        setAbierto(false);
        setTexto(seleccionado ? etiquetaServicio(seleccionado) : '');
      }
    };
    document.addEventListener('mousedown', alPulsarFuera);
    document.addEventListener('touchstart', alPulsarFuera, { passive: true });
    return () => {
      document.removeEventListener('mousedown', alPulsarFuera);
      document.removeEventListener('touchstart', alPulsarFuera);
    };
  }, [abierto, seleccionado]);

  const abrir = () => {
    setAbierto(true);
    setActivo(0);
    // Si el campo muestra el servicio ya elegido, se limpia para mostrar la
    // lista completa y permitir escribir otra búsqueda.
    setTexto((prev) => (prev && prev === etiquetaServicio(seleccionado) ? '' : prev));
  };

  const seleccionar = (servicio, index) => {
    setActivo(index);
    setTexto(etiquetaServicio(servicio));
    setAbierto(false);
    onChange?.(String(servicio.id));
  };

  const alCambiarTexto = (event) => {
    setTexto(event.target.value);
    setActivo(0);
    if (!abierto) setAbierto(true);
  };

  const alTeclear = (event) => {
    const { key } = event;

    if (key === 'ArrowDown') {
      event.preventDefault();
      if (!abierto) {
        setAbierto(true);
        return;
      }
      setActivo((i) => {
        const base = i < 0 ? -1 : Math.min(i, filtrados.length - 1);
        return Math.min(base + 1, filtrados.length - 1);
      });
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      setActivo((i) => {
        const base = i < 0 ? filtrados.length : Math.min(i, filtrados.length - 1);
        return Math.max(base - 1, 0);
      });
    } else if (key === 'Home') {
      if (abierto) {
        event.preventDefault();
        setActivo(0);
      }
    } else if (key === 'End') {
      if (abierto) {
        event.preventDefault();
        setActivo(filtrados.length - 1);
      }
    } else if (key === 'Enter') {
      if (abierto && indiceActivo >= 0 && filtrados[indiceActivo]) {
        event.preventDefault();
        seleccionar(filtrados[indiceActivo], indiceActivo);
      }
    } else if (key === 'Escape') {
      if (abierto) {
        event.preventDefault();
        restaurarTexto();
      }
    } else if (key === 'Tab') {
      if (abierto) restaurarTexto();
    }
  };

  const opcionActivaId =
    abierto && indiceActivo >= 0 && filtrados[indiceActivo]
      ? `${inputId}-opcion-${filtrados[indiceActivo].id}`
      : undefined;

  return (
    <>
      <label htmlFor={inputId}>{label}</label>
      <div className="cu17-combobox" ref={raizRef}>
        <div className="cu17-combobox-control">
          <Search size={15} className="cu17-combobox-icon" aria-hidden="true" />
          <input
            id={inputId}
            type="text"
            className="cu17-combobox-input"
            role="combobox"
            autoComplete="off"
            spellCheck="false"
            aria-expanded={abierto}
            aria-controls={`${inputId}-lista`}
            aria-autocomplete="list"
            aria-activedescendant={opcionActivaId}
            placeholder="Buscar por código de servicio o cliente…"
            value={texto}
            onChange={alCambiarTexto}
            onFocus={abrir}
            onClick={() => {
              if (!abierto) abrir();
            }}
            onKeyDown={alTeclear}
          />
        </div>

        {abierto && (
          <ul
            id={`${inputId}-lista`}
            className="cu17-combobox-list"
            role="listbox"
            aria-label="Servicios"
          >
            {loading && (
              <li className="cu17-combobox-status" role="presentation">
                Cargando servicios…
              </li>
            )}

            {!loading && filtrados.length === 0 && (
              <li className="cu17-combobox-status" role="presentation">
                No se encontraron servicios
              </li>
            )}

            {!loading &&
              filtrados.map((s, index) => {
                const doc = documentoDe(s);
                const esActivo = index === indiceActivo;
                const esSeleccionado = String(s.id) === String(value);
                return (
                  <li
                    key={s.id}
                    id={`${inputId}-opcion-${s.id}`}
                    role="option"
                    aria-selected={esSeleccionado}
                    className={`cu17-combobox-option${esActivo ? ' is-active' : ''}`}
                    // Evita que el input pierda el foco al pulsar con el mouse.
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActivo(index)}
                    onClick={() => seleccionar(s, index)}
                  >
                    <span className="cu17-combobox-code">{s.codigo_servicio || '—'}</span>
                    <span className="cu17-combobox-name">{s.cliente_nombre || 'Sin cliente'}</span>
                    {doc && <span className="cu17-combobox-doc">Doc. {doc}</span>}
                    {esSeleccionado && (
                      <Check size={14} className="cu17-combobox-check" aria-hidden="true" />
                    )}
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </>
  );
}
