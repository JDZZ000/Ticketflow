import { useEffect, useState } from "react";
import { unsplash } from "../../../utils/format";
import type { Screen, Role, Evento, EventStatus } from "../../../models/types";
import { PRIMARY } from "../../../utils/theme";
import { Btn } from "../../../views/components/Btn";
import { Input } from "../../../views/components/Input";
import { Select } from "../../../views/components/Select";
import { SelectorCiudad } from "../../../views/components/SelectorCiudad";
import { PageHeader } from "../../../views/layouts/PageHeader";
import { listarCiudades, type Ciudad } from "../../../models/api/auth";
import { mensajeDeError } from "../../../models/api/cliente";
import type { DatosEvento } from "../../../models/api/eventos";

// La imagen viaja dentro de la petición (base64), y el servidor acepta hasta 10 MB
const MAX_IMAGEN = 3 * 1024 * 1024;

// Fecha y hora LOCALES (toISOString() daría la fecha de mañana pasadas las 7 p. m. en Colombia)
const dos = (n: number) => String(n).padStart(2, "0");
const fechaLocal = (d = new Date()) =>
  `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
const horaLocal = (d = new Date()) =>
  `${dos(d.getHours())}:${dos(d.getMinutes())}`;

// ─── AGENT REGISTER EVENT ─────────────────────────────────────────────────────
export function AgentRegisterEvent({
  onNav,
  eventoId,
  eventos,
  registrarEvento,
  actualizarEvento,
}: {
  onNav: (s: Screen, r?: Role, eventId?: number | null) => void;
  eventoId: number | null;
  eventos: Evento[];
  registrarEvento: (datos: DatosEvento) => Promise<void>;
  actualizarEvento: (id: number, datos: DatosEvento) => Promise<void>;
}) {
  const eventoExistente = eventos.find((e) => e.id === eventoId) ?? null;
  const [form, setForm] = useState({
    nombre: eventoExistente?.nombre ?? "",
    descripcion: eventoExistente?.descripcion ?? "",
    teatro: eventoExistente?.teatro ?? "",
    fechaInicio: eventoExistente?.fecha ?? "",
    horaInicio: eventoExistente?.horaInicio ?? "",
    fechaFin: eventoExistente?.fechaFin ?? "",
    horaFin: eventoExistente?.horaFin ?? "",
    capacidad: eventoExistente ? String(eventoExistente.capacidad) : "",
    precio: eventoExistente ? String(eventoExistente.precio) : "",
    observaciones: eventoExistente?.observaciones ?? "",
    estado: eventoExistente?.estado ?? "Programado",
    imagen: eventoExistente?.imagen ?? "",
  });
  const [ciudadId, setCiudadId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Las ciudades salen de la base de datos
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [cargandoCiudades, setCargandoCiudades] = useState(true);
  const [errorCiudades, setErrorCiudades] = useState("");
  function cargarCiudades() {
    setCargandoCiudades(true);
    setErrorCiudades("");
    listarCiudades()
      .then(setCiudades)
      .catch((e: unknown) => setErrorCiudades(mensajeDeError(e)))
      .finally(() => setCargandoCiudades(false));
  }
  useEffect(() => {
    cargarCiudades();
  }, []);

  // Al editar, se busca en la lista la ciudad que ya tiene el evento
  useEffect(() => {
    if (!eventoExistente || ciudadId !== null || ciudades.length === 0) return;
    const c = ciudades.find(
      (x) =>
        x.ciudad === eventoExistente.ciudad &&
        x.departamento === eventoExistente.departamento &&
        x.pais === eventoExistente.pais,
    );
    if (c) setCiudadId(c.id);
  }, [ciudades]);

  const hoy = fechaLocal();
  const ahora = horaLocal();
  const minHora =
    !eventoExistente && form.fechaInicio === hoy ? ahora : undefined;
  const f = (k: keyof typeof form) => (v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  function handleImagen(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_IMAGEN) {
      setError("La imagen pesa más de 3 MB. Elige una más liviana.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () =>
      setForm((p) => ({ ...p, imagen: reader.result as string }));
    reader.readAsDataURL(file);
  }
  function handleHoraInicio(v: string) {
    if (!eventoExistente && form.fechaInicio === hoy && v < ahora) {
      setForm((p) => ({ ...p, horaInicio: ahora }));
    } else {
      setForm((p) => ({ ...p, horaInicio: v }));
    }
  }

  async function guardar() {
    const nombre = form.nombre.trim();
    const teatro = form.teatro.trim();
    if (
      nombre === "" ||
      teatro === "" ||
      ciudadId === null ||
      form.fechaInicio === "" ||
      form.horaInicio === "" ||
      form.horaFin === "" ||
      form.capacidad.trim() === "" ||
      form.precio.trim() === "" ||
      form.imagen === ""
    ) {
      setError("Por favor, completa los campos obligatorios (marcados con *)");
      return;
    }
    if (nombre.length > 150 || teatro.length > 120) {
      setError("El nombre admite máximo 150 caracteres y el teatro, 120");
      return;
    }
    const capacidad = Number(form.capacidad);
    const precio = Number(form.precio);
    if (!Number.isInteger(capacidad) || capacidad <= 0) {
      setError("La capacidad debe ser un número entero mayor que 0");
      return;
    }
    if (!Number.isFinite(precio) || precio < 0) {
      setError("El precio no puede ser negativo");
      return;
    }
    // Si no se indica fecha de finalización, el evento termina el mismo día
    const fechaFin = form.fechaFin || form.fechaInicio;
    if (
      `${fechaFin} ${form.horaFin}` <= `${form.fechaInicio} ${form.horaInicio}`
    ) {
      setError(
        "La fecha y hora de finalización deben ser posteriores a las de inicio",
      );
      return;
    }
    if (
      !eventoExistente &&
      `${form.fechaInicio} ${form.horaInicio}` <=
        `${fechaLocal()} ${horaLocal()}`
    ) {
      setError("El evento debe empezar en una fecha y hora futuras");
      return;
    }

    const datos: DatosEvento = {
      nombre,
      descripcion: form.descripcion.trim(),
      teatro,
      ciudadId,
      fecha: form.fechaInicio,
      fechaFin,
      horaInicio: form.horaInicio,
      horaFin: form.horaFin,
      capacidad,
      precio,
      estado: form.estado as EventStatus,
      imagen: form.imagen,
      observaciones: form.observaciones.trim(),
    };
    setError("");
    setEnviando(true);
    try {
      if (eventoExistente) await actualizarEvento(eventoExistente.id, datos);
      else await registrarEvento(datos);
      onNav("agent-my-events");
    } catch (e) {
      // Por ejemplo: «La capacidad no puede ser menor que las entradas ya reservadas»
      setError(mensajeDeError(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <PageHeader
        title={eventoExistente ? "Editar evento" : "Registrar nuevo evento"}
        subtitle="Completa toda la información del espectáculo"
      />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-3xl">
        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span
              className="w-6 h-6 rounded-full text-xs text-white flex items-center justify-center"
              style={{ background: PRIMARY }}
            >
              1
            </span>
            Información general
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-gray-700">
                Código del evento
              </p>
              {eventoExistente ? (
                <p className="text-sm font-mono font-semibold text-gray-800 py-2.5">
                  {eventoExistente.codigo}
                </p>
              ) : (
                <p className="text-xs text-gray-500 py-2.5">
                  Se asigna automáticamente al guardar (EVT-###).
                </p>
              )}
            </div>
            <Select
              label="Estado"
              value={form.estado}
              onChange={f("estado")}
              options={[
                "Programado",
                "En Boletería",
                "En Vivo",
                "Finalizado",
                "Cancelado",
              ]}
            />
            <div className="sm:col-span-2">
              <Input
                label="Nombre del evento"
                value={form.nombre}
                onChange={f("nombre")}
                placeholder="Nombre completo del espectáculo"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="evento-descripcion"
                  className="text-sm font-medium text-gray-700"
                >
                  Descripción
                </label>
                <textarea
                  id="evento-descripcion"
                  rows={3}
                  value={form.descripcion}
                  onChange={(e) => f("descripcion")(e.target.value)}
                  placeholder="Descripción del evento..."
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="evento-imagen"
                  className="text-sm font-medium text-gray-700"
                >
                  Imagen del evento
                  <span className="text-red-500"> *</span>
                </label>
                <input
                  id="evento-imagen"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImagen(e.target.files?.[0])}
                  className="text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-100 file:text-violet-700 file:text-sm file:font-medium cursor-pointer"
                />
                <p className="text-xs text-gray-400">Máximo 3 MB.</p>
                {form.imagen && (
                  <img
                    src={unsplash(form.imagen, 300, 160)}
                    alt="Vista previa"
                    className="mt-3 rounded-xl w-full max-w-xs h-32 object-cover border border-gray-200"
                  />
                )}
              </div>
            </div>
          </div>
        </section>
        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span
              className="w-6 h-6 rounded-full text-xs text-white flex items-center justify-center"
              style={{ background: PRIMARY }}
            >
              2
            </span>
            Ubicación
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Teatro / Venue"
              value={form.teatro}
              onChange={f("teatro")}
              placeholder="Teatro Nacional"
              required
            />
            <div>
              <SelectorCiudad
                ciudades={ciudades}
                ciudadId={ciudadId}
                onChange={setCiudadId}
              />
              {cargandoCiudades && (
                <p className="text-xs text-gray-400 mt-1">Cargando ciudades…</p>
              )}
              {errorCiudades && (
                <p className="text-xs text-red-500 mt-1">
                  {errorCiudades}{" "}
                  <button
                    className="underline font-semibold cursor-pointer"
                    onClick={cargarCiudades}
                  >
                    Reintentar
                  </button>
                </p>
              )}
            </div>
          </div>
        </section>
        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span
              className="w-6 h-6 rounded-full text-xs text-white flex items-center justify-center"
              style={{ background: PRIMARY }}
            >
              3
            </span>
            Fecha y hora
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fecha de inicio"
              type="date"
              value={form.fechaInicio}
              onChange={f("fechaInicio")}
              required
              min={eventoExistente ? undefined : hoy}
            />
            <Input
              label="Hora de inicio"
              type="time"
              value={form.horaInicio}
              onChange={handleHoraInicio}
              required
              min={minHora}
            />
            <Input
              label="Fecha de finalización (si la dejas vacía, termina el mismo día)"
              type="date"
              value={form.fechaFin}
              onChange={f("fechaFin")}
              min={form.fechaInicio || hoy}
            />
            <Input
              label="Hora estimada de finalización"
              type="time"
              value={form.horaFin}
              onChange={f("horaFin")}
              required
            />
          </div>
        </section>
        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span
              className="w-6 h-6 rounded-full text-xs text-white flex items-center justify-center"
              style={{ background: PRIMARY }}
            >
              4
            </span>
            Capacidad y precios
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Capacidad total"
              value={form.capacidad}
              onChange={f("capacidad")}
              placeholder="1200"
              required
            />
            <Input
              label="Precio base (COP)"
              value={form.precio}
              onChange={f("precio")}
              placeholder="85000"
              required
            />
            <div className="sm:col-span-2">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="evento-observaciones"
                  className="text-sm font-medium text-gray-700"
                >
                  Observaciones
                </label>
                <textarea
                  id="evento-observaciones"
                  rows={2}
                  value={form.observaciones}
                  onChange={(e) => f("observaciones")(e.target.value)}
                  placeholder="Restricciones de edad, notas importantes..."
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
                />
              </div>
            </div>
          </div>
        </section>
        {error && (
          <p role="alert" className="text-red-500 text-sm mb-4">
            {error}
          </p>
        )}
        <div className="flex gap-4">
          <Btn
            size="lg"
            disabled={enviando || cargandoCiudades}
            onClick={guardar}
          >
            {enviando
              ? "Guardando…"
              : eventoExistente
                ? "Guardar cambios"
                : "Guardar evento"}
          </Btn>
          <Btn
            size="lg"
            variant="outline"
            disabled={enviando}
            onClick={() => onNav("agent-my-events")}
          >
            Cancelar
          </Btn>
        </div>
      </div>
    </>
  );
}
