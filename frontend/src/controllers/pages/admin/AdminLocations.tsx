import { useEffect, useState } from "react";
import { PageHeader } from "../../../views/layouts/PageHeader";
import { Btn } from "../../../views/components/Btn";
import { Input } from "../../../views/components/Input";
import { Select } from "../../../views/components/Select";
import { Modal } from "../../../views/components/Modal";
import { ConfirmarModal } from "../../../views/components/ConfirmarModal";
import { PRIMARY, PRIMARY_L } from "../../../utils/theme";
import { mensajeDeError } from "../../../models/api/cliente";
import { listarCiudades } from "../../../models/api/auth";
import {
  listarPaises,
  listarDepartamentos,
  crearPais,
  modificarPais,
  eliminarPais,
  crearDepartamento,
  modificarDepartamento,
  eliminarDepartamento,
  crearCiudad,
  modificarCiudad,
  eliminarCiudad,
  type Pais,
  type Departamento,
  type Ciudad,
} from "../../../models/api/ubicacion";

type Pestana = "paises" | "departamentos" | "ciudades";

const PESTANAS: {
  k: Pestana;
  titulo: string;
  singular: string;
  articulo: string;
  columnas: string[];
}[] = [
  {
    k: "paises",
    titulo: "Países",
    singular: "país",
    articulo: "el",
    columnas: ["País", "Departamentos"],
  },
  {
    k: "departamentos",
    titulo: "Departamentos",
    singular: "departamento",
    articulo: "el",
    columnas: ["Departamento", "País", "Ciudades"],
  },
  {
    k: "ciudades",
    titulo: "Ciudades",
    singular: "ciudad",
    articulo: "la",
    columnas: ["Ciudad", "Departamento", "País"],
  },
];
const POR_PAGINA = 15;
const sinTildes = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

// Lo que se está editando: el registro (si existe) con sus padres
interface Existente {
  id: number;
  nombre: string;
  paisId?: number;
  departamentoId?: number;
}

// ─── VENTANA: CREAR O EDITAR ──────────────────────────────────────────────────
function FormularioUbicacion({
  pestana,
  existente,
  paises,
  departamentos,
  onClose,
  onGuardado,
}: {
  pestana: Pestana;
  existente: Existente | null;
  paises: Pais[];
  departamentos: Departamento[];
  onClose: () => void;
  onGuardado: (mensaje: string) => Promise<void>;
}) {
  const info = PESTANAS.find((p) => p.k === pestana)!;
  const [nombre, setNombre] = useState(existente?.nombre ?? "");
  const [paisId, setPaisId] = useState<number | null>(
    existente?.paisId ?? (paises.length === 1 ? paises[0].id : null),
  );
  const [departamentoId, setDepartamentoId] = useState<number | null>(
    existente?.departamentoId ?? null,
  );
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const departamentosDelPais = departamentos.filter((d) => d.paisId === paisId);

  async function guardar() {
    const n = nombre.trim();
    if (n === "" || n.length > 80) {
      setError("El nombre es obligatorio (máximo 80 caracteres)");
      return;
    }
    if (pestana === "departamentos" && paisId === null) {
      setError("Selecciona el país");
      return;
    }
    if (pestana === "ciudades" && departamentoId === null) {
      setError("Selecciona el departamento");
      return;
    }
    setError("");
    setEnviando(true);
    try {
      if (pestana === "paises") {
        if (existente) await modificarPais(existente.id, n);
        else await crearPais(n);
      } else if (pestana === "departamentos") {
        if (existente) await modificarDepartamento(existente.id, n, paisId!);
        else await crearDepartamento(n, paisId!);
      } else {
        if (existente) await modificarCiudad(existente.id, n, departamentoId!);
        else await crearCiudad(n, departamentoId!);
      }
      await onGuardado(
        existente
          ? "Los cambios se guardaron."
          : `Se creó ${info.articulo} ${info.singular}.`,
      );
      onClose();
    } catch (e) {
      // Por ejemplo: «Ya existe un departamento con ese nombre en ese país»
      setError(mensajeDeError(e));
      setEnviando(false);
    }
  }

  return (
    <Modal
      titulo={
        existente
          ? `Editar ${info.singular}`
          : info.singular === "ciudad"
            ? "Nueva ciudad"
            : `Nuevo ${info.singular}`
      }
      onClose={onClose}
    >
      <div className="space-y-4">
        <Input
          label="Nombre"
          value={nombre}
          onChange={(v) => {
            setNombre(v);
            setError("");
          }}
          required
        />
        {pestana !== "paises" && (
          <Select
            label="País"
            value={
              paises.find((p) => p.id === paisId)?.nombre ??
              "Selecciona un país"
            }
            onChange={(v) => {
              setPaisId(paises.find((p) => p.nombre === v)?.id ?? null);
              setDepartamentoId(null);
              setError("");
            }}
            options={["Selecciona un país", ...paises.map((p) => p.nombre)]}
          />
        )}
        {pestana === "ciudades" && (
          <Select
            label="Departamento"
            value={
              departamentosDelPais.find((d) => d.id === departamentoId)
                ?.nombre ?? "Selecciona un departamento"
            }
            onChange={(v) => {
              setDepartamentoId(
                departamentosDelPais.find((d) => d.nombre === v)?.id ?? null,
              );
              setError("");
            }}
            options={[
              "Selecciona un departamento",
              ...departamentosDelPais.map((d) => d.nombre),
            ]}
          />
        )}
      </div>
      {error && (
        <p role="alert" className="text-red-500 text-sm mt-3">
          {error}
        </p>
      )}
      <div className="flex gap-3 mt-5">
        <Btn disabled={enviando} onClick={guardar}>
          {enviando ? "Guardando…" : existente ? "Guardar cambios" : "Crear"}
        </Btn>
        <Btn variant="ghost" disabled={enviando} onClick={onClose}>
          Cancelar
        </Btn>
      </div>
    </Modal>
  );
}

// ─── ADMIN LOCATIONS ──────────────────────────────────────────────────────────
export function AdminLocations() {
  const [paises, setPaises] = useState<Pais[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [pestana, setPestana] = useState<Pestana>("ciudades");
  const [texto, setTexto] = useState("");
  const [pagina, setPagina] = useState(0);
  const [formulario, setFormulario] = useState<{
    existente: Existente | null;
  } | null>(null);
  const [porEliminar, setPorEliminar] = useState<{
    id: number;
    nombre: string;
  } | null>(null);

  // Pide las tres listas; con «silencioso» no muestra «Cargando…» (para refrescar tras un cambio)
  async function cargar(silencioso = false) {
    if (!silencioso) setCargando(true);
    setError("");
    try {
      const [p, d, c] = await Promise.all([
        listarPaises(),
        listarDepartamentos(),
        listarCiudades(),
      ]);
      setPaises(p);
      setDepartamentos(d);
      setCiudades(c);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }
  useEffect(() => {
    cargar();
  }, []);

  const info = PESTANAS.find((p) => p.k === pestana)!;

  // Las filas de la tabla de cada pestaña
  const filas: {
    id: number;
    nombre: string;
    celdas: string[];
    existente: Existente;
  }[] =
    pestana === "paises"
      ? paises.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          celdas: [
            p.nombre,
            String(departamentos.filter((d) => d.paisId === p.id).length),
          ],
          existente: { id: p.id, nombre: p.nombre },
        }))
      : pestana === "departamentos"
        ? departamentos.map((d) => ({
            id: d.id,
            nombre: d.nombre,
            celdas: [
              d.nombre,
              d.pais,
              String(ciudades.filter((c) => c.departamentoId === d.id).length),
            ],
            existente: { id: d.id, nombre: d.nombre, paisId: d.paisId },
          }))
        : ciudades.map((c) => ({
            id: c.id,
            nombre: c.ciudad,
            celdas: [c.ciudad, c.departamento, c.pais],
            existente: {
              id: c.id,
              nombre: c.ciudad,
              paisId: c.paisId,
              departamentoId: c.departamentoId,
            },
          }));

  const t = sinTildes(texto.trim());
  const visibles = filas
    .filter((f) => t === "" || f.celdas.some((c) => sinTildes(c).includes(t)))
    .sort((a, b) => a.celdas.join(" ").localeCompare(b.celdas.join(" "), "es"));
  const paginas = Math.max(1, Math.ceil(visibles.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, paginas - 1);
  const enPagina = visibles.slice(
    paginaActual * POR_PAGINA,
    (paginaActual + 1) * POR_PAGINA,
  );

  const mensajeEliminar =
    pestana === "paises"
      ? "Si el país tiene departamentos no se podrá eliminar."
      : pestana === "departamentos"
        ? "Si el departamento tiene ciudades no se podrá eliminar."
        : "Si la ciudad tiene personas o eventos no se podrá eliminar.";

  return (
    <>
      <PageHeader
        title="Ubicaciones"
        subtitle="Países, departamentos y ciudades del sistema"
        actions={
          <Btn
            onClick={() => {
              setAviso("");
              setFormulario({ existente: null });
            }}
          >
            ➕ Nuevo
          </Btn>
        }
      />
      {aviso && (
        <div
          role="status"
          className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl p-3 mb-4"
        >
          {aviso}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-4">
        {PESTANAS.map((p) => (
          <button
            key={p.k}
            onClick={() => {
              setPestana(p.k);
              setTexto("");
              setPagina(0);
              setAviso("");
            }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${pestana === p.k ? "text-white shadow-md" : "text-gray-600 bg-white border border-gray-200 hover:border-violet-300"}`}
            style={
              pestana === p.k
                ? {
                    background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_L})`,
                  }
                : {}
            }
          >
            {p.titulo} (
            {p.k === "paises"
              ? paises.length
              : p.k === "departamentos"
                ? departamentos.length
                : ciudades.length}
            )
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4">
        <Input
          label="Buscar"
          value={texto}
          onChange={(v) => {
            setTexto(v);
            setPagina(0);
          }}
          placeholder={`Buscar entre ${info.titulo.toLowerCase()}`}
        />
      </div>

      {cargando && (
        <p className="text-sm text-gray-400">Cargando ubicaciones…</p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-500 mb-4">
          {error}{" "}
          <button
            className="underline font-semibold cursor-pointer"
            onClick={() => cargar()}
          >
            Reintentar
          </button>
        </p>
      )}
      {!cargando && !error && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <p className="px-4 pt-4 text-xs text-gray-400">
            {visibles.length}{" "}
            {visibles.length === 1 ? "resultado" : "resultados"}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr style={{ background: "#F5F6FA" }}>
                  {[...info.columnas, "Acciones"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enPagina.length === 0 && (
                  <tr>
                    <td
                      colSpan={info.columnas.length + 1}
                      className="px-4 py-8 text-center text-sm text-gray-400"
                    >
                      No hay resultados.
                    </td>
                  </tr>
                )}
                {enPagina.map((f) => (
                  <tr
                    key={f.id}
                    className="border-t border-gray-50 hover:bg-violet-50/30 transition"
                  >
                    {f.celdas.map((c, i) => (
                      <td
                        key={i}
                        className={`px-4 py-3 text-sm ${i === 0 ? "font-medium text-gray-800" : "text-gray-600"}`}
                      >
                        {c}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setAviso("");
                            setFormulario({ existente: f.existente });
                          }}
                          className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition text-sm cursor-pointer"
                          title="Editar"
                          aria-label={`Editar ${f.nombre}`}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => {
                            setAviso("");
                            setPorEliminar({ id: f.id, nombre: f.nombre });
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition text-sm cursor-pointer"
                          title="Eliminar"
                          aria-label={`Eliminar ${f.nombre}`}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paginas > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-50 text-sm text-gray-500">
              <span>
                Página {paginaActual + 1} de {paginas}
              </span>
              <div className="flex gap-2">
                <Btn
                  size="sm"
                  variant="outline"
                  disabled={paginaActual === 0}
                  onClick={() => setPagina(paginaActual - 1)}
                >
                  ← Anterior
                </Btn>
                <Btn
                  size="sm"
                  variant="outline"
                  disabled={paginaActual >= paginas - 1}
                  onClick={() => setPagina(paginaActual + 1)}
                >
                  Siguiente →
                </Btn>
              </div>
            </div>
          )}
        </div>
      )}

      {formulario && (
        <FormularioUbicacion
          pestana={pestana}
          existente={formulario.existente}
          paises={paises}
          departamentos={departamentos}
          onClose={() => setFormulario(null)}
          onGuardado={async (mensaje) => {
            await cargar(true);
            setAviso(mensaje);
          }}
        />
      )}
      {porEliminar && (
        <ConfirmarModal
          titulo={`Eliminar ${info.singular}`}
          mensaje={`¿Eliminar «${porEliminar.nombre}»? ${mensajeEliminar}`}
          textoConfirmar={`Eliminar ${info.singular}`}
          onConfirmar={async () => {
            if (pestana === "paises") await eliminarPais(porEliminar.id);
            else if (pestana === "departamentos")
              await eliminarDepartamento(porEliminar.id);
            else await eliminarCiudad(porEliminar.id);
            await cargar(true);
            setAviso(`Se eliminó «${porEliminar.nombre}».`);
          }}
          onClose={() => setPorEliminar(null)}
        />
      )}
    </>
  );
}
