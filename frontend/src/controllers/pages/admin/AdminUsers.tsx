import { useEffect, useState } from "react";
import { PageHeader } from "../../../views/layouts/PageHeader";
import { Btn } from "../../../views/components/Btn";
import { Input } from "../../../views/components/Input";
import { Select } from "../../../views/components/Select";
import { SelectorCiudad } from "../../../views/components/SelectorCiudad";
import { ListaTelefonos } from "../../../views/components/ListaTelefonos";
import { ConfirmarModal } from "../../../views/components/ConfirmarModal";
import { mensajeDeError } from "../../../models/api/cliente";
import {
  listarCiudades,
  type Ciudad,
  type RolApi,
} from "../../../models/api/auth";
import {
  listarPersonas,
  crearPersona,
  modificarPersona,
  eliminarPersona,
  type Persona,
  type ExtrasDeRol,
} from "../../../models/api/personas";

const ROLES: {
  valor: RolApi;
  etiqueta: string;
  plural: string;
  color: string;
}[] = [
  {
    valor: "cliente",
    etiqueta: "Cliente",
    plural: "Clientes",
    color: "bg-violet-100 text-violet-700",
  },
  {
    valor: "agente",
    etiqueta: "Agente",
    plural: "Agentes",
    color: "bg-blue-100 text-blue-700",
  },
  {
    valor: "administrador",
    etiqueta: "Administrador",
    plural: "Administradores",
    color: "bg-rose-100 text-rose-700",
  },
];
const etiquetaDe = (rol: RolApi) => ROLES.find((r) => r.valor === rol)!;
const sinTildes = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const MAX_TELEFONOS = 5;

// ─── FORMULARIO (crear o editar una persona) ──────────────────────────────────
function FormularioUsuario({
  persona,
  ciudades,
  onGuardado,
  onCancelar,
}: {
  persona: Persona | null; // null = usuario nuevo
  ciudades: Ciudad[];
  onGuardado: (p: Persona, mensaje: string) => void;
  onCancelar: () => void;
}) {
  const editando = persona !== null;
  const [rol, setRol] = useState<RolApi>(persona?.rol ?? "cliente");
  const [form, setForm] = useState({
    identificacion: persona?.identificacion ?? "",
    nombre: persona?.nombre ?? "",
    correo: persona?.correo ?? "",
    contrasena: "",
    direccion: persona?.direccion ?? "",
    puntos: String(persona?.puntos ?? 0),
    publicidad: persona?.publicidad === false ? "No" : "Sí",
    comision: String(persona?.comision ?? 0),
    experiencia: String(persona?.experiencia ?? 0),
    salario: persona?.salario !== undefined ? String(persona.salario) : "",
    horario: persona?.horario ?? "",
  });
  const [ciudadId, setCiudadId] = useState<number | null>(
    persona?.ciudadId ?? null,
  );
  const [telefonos, setTelefonos] = useState<string[]>(
    persona && persona.telefonos.length > 0 ? persona.telefonos : [""],
  );
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const f = (k: keyof typeof form) => (v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function guardar() {
    const id = form.identificacion.trim();
    const nombre = form.nombre.trim();
    const correo = form.correo.trim();
    const direccion = form.direccion.trim();
    const tels = telefonos.map((t) => t.trim()).filter((t) => t !== "");

    if (!editando && !/^[0-9A-Za-z.\-]{1,20}$/.test(id)) {
      setError(
        "La identificación es obligatoria (máximo 20 caracteres: letras, números, puntos y guiones)",
      );
      return;
    }
    if (nombre === "" || nombre.length > 120) {
      setError("El nombre es obligatorio (máximo 120 caracteres)");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(correo) || correo.length > 120) {
      setError("El correo no es válido");
      return;
    }
    if (!editando && form.contrasena.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (editando && form.contrasena !== "" && form.contrasena.length < 6) {
      setError("La contraseña nueva debe tener al menos 6 caracteres");
      return;
    }
    if (direccion.length > 160) {
      setError("La dirección admite máximo 160 caracteres");
      return;
    }
    if (ciudadId === null) {
      setError("Selecciona la ciudad");
      return;
    }
    if (tels.length > MAX_TELEFONOS || tels.some((t) => t.length > 25)) {
      setError("Cada teléfono admite máximo 25 caracteres");
      return;
    }

    // Lo propio del rol
    const extras: ExtrasDeRol = {};
    if (rol === "cliente") {
      const puntos = Number(form.puntos);
      if (
        form.puntos.trim() === "" ||
        !Number.isInteger(puntos) ||
        puntos < 0
      ) {
        setError("Los puntos deben ser un entero de 0 en adelante");
        return;
      }
      extras.puntos = puntos;
      extras.publicidad = form.publicidad === "Sí";
    } else if (rol === "agente") {
      const comision = Number(form.comision);
      const experiencia = Number(form.experiencia);
      if (
        form.comision.trim() === "" ||
        !Number.isFinite(comision) ||
        comision < 0 ||
        comision > 100
      ) {
        setError("La comisión debe estar entre 0 y 100");
        return;
      }
      if (
        form.experiencia.trim() === "" ||
        !Number.isInteger(experiencia) ||
        experiencia < 0
      ) {
        setError("La experiencia (años) debe ser un entero de 0 en adelante");
        return;
      }
      extras.comision = comision;
      extras.experiencia = experiencia;
    } else {
      const salario = Number(form.salario);
      if (
        form.salario.trim() === "" ||
        !Number.isFinite(salario) ||
        salario < 0
      ) {
        setError("El salario es obligatorio y no puede ser negativo");
        return;
      }
      if (form.horario.trim().length > 60) {
        setError("El horario admite máximo 60 caracteres");
        return;
      }
      extras.salario = salario;
      extras.horario = form.horario.trim();
    }

    setError("");
    setEnviando(true);
    try {
      if (editando) {
        const guardada = await modificarPersona(persona.identificacion, {
          nombreCompleto: nombre,
          correo,
          direccion,
          ciudadId,
          telefonos: tels,
          ...(form.contrasena !== "" ? { contrasena: form.contrasena } : {}),
          ...extras,
        });
        onGuardado(guardada, "Los cambios se guardaron.");
      } else {
        const creada = await crearPersona({
          identificacion: id,
          nombreCompleto: nombre,
          correo,
          contrasena: form.contrasena,
          direccion,
          ciudadId,
          telefonos: tels,
          rol,
          ...extras,
        });
        onGuardado(creada, "El usuario se creó correctamente.");
      }
    } catch (e) {
      // Por ejemplo: «Ya existe una persona con esa identificación o ese correo»
      setError(mensajeDeError(e));
      setEnviando(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-3xl">
      <h2
        className="text-lg font-bold text-gray-800 mb-6"
        style={{ fontFamily: "Outfit, sans-serif" }}
      >
        {editando ? `Editar a ${persona.nombre}` : "Nuevo usuario"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {editando ? (
          <>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-gray-700">
                N.° de identificación
              </p>
              <p className="text-sm font-mono font-semibold text-gray-800 py-2.5">
                {persona.identificacion}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-gray-700">Rol</p>
              <p className="text-sm font-semibold text-gray-800 py-2.5">
                {etiquetaDe(rol).etiqueta}
              </p>
            </div>
          </>
        ) : (
          <>
            <Input
              label="N.° de identificación"
              value={form.identificacion}
              onChange={f("identificacion")}
              placeholder="1234567890"
              required
            />
            <Select
              label="Rol"
              value={etiquetaDe(rol).etiqueta}
              onChange={(v) =>
                setRol(ROLES.find((r) => r.etiqueta === v)?.valor ?? "cliente")
              }
              options={ROLES.map((r) => r.etiqueta)}
            />
          </>
        )}
        <Input
          label="Nombre completo"
          value={form.nombre}
          onChange={f("nombre")}
          required
        />
        <Input
          label="Correo electrónico"
          type="email"
          value={form.correo}
          onChange={f("correo")}
          required
        />
        <Input
          label={
            editando
              ? "Contraseña nueva (déjala vacía para no cambiarla)"
              : "Contraseña"
          }
          type="password"
          value={form.contrasena}
          onChange={f("contrasena")}
          placeholder="Mínimo 6 caracteres"
          required={!editando}
        />
        <Input
          label="Dirección"
          value={form.direccion}
          onChange={f("direccion")}
        />
      </div>

      <div className="mb-6">
        <SelectorCiudad
          ciudades={ciudades}
          ciudadId={ciudadId}
          onChange={setCiudadId}
        />
      </div>
      <div className="mb-6">
        <ListaTelefonos
          valores={telefonos}
          onChange={setTelefonos}
          max={MAX_TELEFONOS}
        />
      </div>

      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
        Datos del {etiquetaDe(rol).etiqueta.toLowerCase()}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {rol === "cliente" && (
          <>
            <Input label="Puntos" value={form.puntos} onChange={f("puntos")} />
            <Select
              label="¿Desea ver publicidad?"
              value={form.publicidad}
              onChange={f("publicidad")}
              options={["Sí", "No"]}
            />
          </>
        )}
        {rol === "agente" && (
          <>
            <Input
              label="Comisión (%)"
              value={form.comision}
              onChange={f("comision")}
            />
            <Input
              label="Experiencia (años)"
              value={form.experiencia}
              onChange={f("experiencia")}
            />
          </>
        )}
        {rol === "administrador" && (
          <>
            <Input
              label="Salario"
              value={form.salario}
              onChange={f("salario")}
              placeholder="4500000"
              required
            />
            <Input
              label="Horario"
              value={form.horario}
              onChange={f("horario")}
              placeholder="Lunes a viernes, 8:00 a. m. a 5:00 p. m."
            />
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="text-red-500 text-sm mb-4">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <Btn size="lg" disabled={enviando} onClick={guardar}>
          {enviando
            ? "Guardando…"
            : editando
              ? "Guardar cambios"
              : "Crear usuario"}
        </Btn>
        <Btn
          size="lg"
          variant="outline"
          disabled={enviando}
          onClick={onCancelar}
        >
          Cancelar
        </Btn>
      </div>
    </div>
  );
}

// ─── ADMIN USERS ──────────────────────────────────────────────────────────────
type Vista =
  | { tipo: "lista" }
  | { tipo: "nuevo" }
  | { tipo: "editar"; persona: Persona };

export function AdminUsers({ miId }: { miId: string }) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [vista, setVista] = useState<Vista>({ tipo: "lista" });
  const [texto, setTexto] = useState("");
  const [filtroRol, setFiltroRol] = useState("Todos");
  const [porEliminar, setPorEliminar] = useState<Persona | null>(null);

  function cargar() {
    setCargando(true);
    setError("");
    Promise.all([listarPersonas(), listarCiudades()])
      .then(([p, c]) => {
        setPersonas(p);
        setCiudades(c);
      })
      .catch((e: unknown) => setError(mensajeDeError(e)))
      .finally(() => setCargando(false));
  }
  useEffect(() => {
    cargar();
  }, []);

  if (vista.tipo !== "lista") {
    return (
      <>
        <PageHeader
          title="Usuarios"
          subtitle="Clientes, agentes y administradores del sistema"
        />
        <FormularioUsuario
          persona={vista.tipo === "editar" ? vista.persona : null}
          ciudades={ciudades}
          onCancelar={() => setVista({ tipo: "lista" })}
          onGuardado={(guardada, mensaje) => {
            setPersonas((prev) =>
              prev.some((p) => p.identificacion === guardada.identificacion)
                ? prev.map((p) =>
                    p.identificacion === guardada.identificacion ? guardada : p,
                  )
                : [...prev, guardada],
            );
            setAviso(mensaje);
            setVista({ tipo: "lista" });
          }}
        />
      </>
    );
  }

  const rolElegido = ROLES.find((r) => r.plural === filtroRol)?.valor;
  const t = sinTildes(texto.trim());
  const visibles = personas
    .filter((p) => !rolElegido || p.rol === rolElegido)
    .filter(
      (p) =>
        t === "" ||
        sinTildes(p.nombre).includes(t) ||
        sinTildes(p.correo).includes(t) ||
        p.identificacion.toLowerCase().includes(t),
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Clientes, agentes y administradores del sistema"
        actions={
          <Btn
            onClick={() => {
              setAviso("");
              setVista({ tipo: "nuevo" });
            }}
          >
            ➕ Nuevo usuario
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Buscar"
            value={texto}
            onChange={setTexto}
            placeholder="Nombre, correo o identificación"
          />
        </div>
        <Select
          label="Rol"
          value={filtroRol}
          onChange={setFiltroRol}
          options={["Todos", ...ROLES.map((r) => r.plural)]}
        />
      </div>

      {cargando && <p className="text-sm text-gray-400">Cargando usuarios…</p>}
      {error && (
        <p role="alert" className="text-sm text-red-500 mb-4">
          {error}{" "}
          <button
            className="underline font-semibold cursor-pointer"
            onClick={cargar}
          >
            Reintentar
          </button>
        </p>
      )}
      {!cargando && !error && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <p className="px-4 pt-4 text-xs text-gray-400">
            {visibles.length} de {personas.length} usuarios
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr style={{ background: "#F5F6FA" }}>
                  {[
                    "Identificación",
                    "Nombre",
                    "Correo",
                    "Rol",
                    "Ciudad",
                    "Teléfonos",
                    "Acciones",
                  ].map((h) => (
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
                {visibles.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-gray-400"
                    >
                      No hay usuarios que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
                {visibles.map((p) => (
                  <tr
                    key={p.identificacion}
                    className="border-t border-gray-50 hover:bg-violet-50/30 transition"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {p.identificacion}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {p.nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.correo}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${etiquetaDe(p.rol).color}`}
                      >
                        {etiquetaDe(p.rol).etiqueta}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.ciudad}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {p.telefonos.join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setAviso("");
                            setVista({ tipo: "editar", persona: p });
                          }}
                          className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition text-sm cursor-pointer"
                          title="Editar"
                          aria-label={`Editar a ${p.nombre}`}
                        >
                          ✏️
                        </button>
                        {p.identificacion !== miId && (
                          <button
                            onClick={() => {
                              setAviso("");
                              setPorEliminar(p);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition text-sm cursor-pointer"
                            title="Eliminar"
                            aria-label={`Eliminar a ${p.nombre}`}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {porEliminar && (
        <ConfirmarModal
          titulo="Eliminar usuario"
          mensaje={`¿Eliminar a ${porEliminar.nombre} (${porEliminar.correo})? Si tiene reservas (cliente) o eventos (agente) no se podrá eliminar.`}
          textoConfirmar="Eliminar usuario"
          onConfirmar={async () => {
            await eliminarPersona(porEliminar.identificacion);
            setPersonas((prev) =>
              prev.filter(
                (p) => p.identificacion !== porEliminar.identificacion,
              ),
            );
            setAviso("El usuario se eliminó.");
          }}
          onClose={() => setPorEliminar(null)}
        />
      )}
    </>
  );
}
