import { useEffect, useState } from "react";
import type { Ciudad } from "../../models/api/auth";
import { Select } from "./Select";

const SIN_PAIS = "Selecciona un país";
const SIN_DEPARTAMENTO = "Selecciona un departamento";
const SIN_CIUDAD = "Selecciona una ciudad";

// Tres listas encadenadas: país → departamento → ciudad.
// Todo sale de la lista de ciudades de la API; la persona termina eligiendo una ciudad (ciudadId).
export function SelectorCiudad({
  ciudades,
  ciudadId,
  onChange,
}: {
  ciudades: Ciudad[];
  ciudadId: number | null;
  onChange: (ciudadId: number | null) => void;
}) {
  const [paisId, setPaisId] = useState<number | null>(null);
  const [departamentoId, setDepartamentoId] = useState<number | null>(null);

  // Si ya hay una ciudad elegida (por ejemplo, al editar un evento), se llenan las dos listas de arriba
  const actual = ciudades.find((c) => c.id === ciudadId) ?? null;
  useEffect(() => {
    if (actual) {
      setPaisId(actual.paisId);
      setDepartamentoId(actual.departamentoId);
    }
  }, [actual?.id]);

  const unicos = (lista: { id: number; nombre: string }[]) =>
    [...new Map(lista.map((x) => [x.id, x])).values()].sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es"),
    );
  const paises = unicos(
    ciudades.map((c) => ({ id: c.paisId, nombre: c.pais })),
  );
  const departamentos = unicos(
    ciudades
      .filter((c) => c.paisId === paisId)
      .map((c) => ({ id: c.departamentoId, nombre: c.departamento })),
  );
  const ciudadesDelDepartamento = ciudades
    .filter((c) => c.departamentoId === departamentoId)
    .sort((a, b) => a.ciudad.localeCompare(b.ciudad, "es"));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Select
        label="País"
        value={paises.find((p) => p.id === paisId)?.nombre ?? SIN_PAIS}
        onChange={(v) => {
          setPaisId(paises.find((p) => p.nombre === v)?.id ?? null);
          setDepartamentoId(null);
          onChange(null);
        }}
        options={[SIN_PAIS, ...paises.map((p) => p.nombre)]}
      />
      <Select
        label="Departamento"
        value={
          departamentos.find((d) => d.id === departamentoId)?.nombre ??
          SIN_DEPARTAMENTO
        }
        onChange={(v) => {
          setDepartamentoId(
            departamentos.find((d) => d.nombre === v)?.id ?? null,
          );
          onChange(null);
        }}
        options={[SIN_DEPARTAMENTO, ...departamentos.map((d) => d.nombre)]}
      />
      <Select
        label="Ciudad"
        value={
          ciudadesDelDepartamento.find((c) => c.id === ciudadId)?.ciudad ??
          SIN_CIUDAD
        }
        onChange={(v) =>
          onChange(
            ciudadesDelDepartamento.find((c) => c.ciudad === v)?.id ?? null,
          )
        }
        options={[SIN_CIUDAD, ...ciudadesDelDepartamento.map((c) => c.ciudad)]}
      />
    </div>
  );
}
