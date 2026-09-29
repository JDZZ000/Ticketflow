import { unsplash } from "../../../utils/format";
import { useState } from "react";
import type { Screen, Role, Evento, EventStatus } from "../../../models/types";
import { PRIMARY } from "../../../utils/theme";
import { Btn } from "../../../views/components/Btn";
import { Input } from "../../../views/components/Input";
import { Select } from "../../../views/components/Select";
import { PageHeader } from "../../../views/layouts/PageHeader";

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
  registrarEvento: (nuevo: Omit<Evento, "id">) => void;
  actualizarEvento: (id: number, cambios: Omit<Evento, "id">) => void;
}) {
  const eventoExistente = eventos.find((e) => e.id === eventoId) ?? null;

  const [form, setForm] = useState({
    codigo: eventoExistente?.codigo ?? "",
    nombre: eventoExistente?.nombre ?? "",
    descripcion: eventoExistente?.descripcion ?? "",
    teatro: eventoExistente?.teatro ?? "",
    pais: eventoExistente?.pais ?? "Colombia",
    ciudad: eventoExistente?.ciudad ?? "",
    fechaInicio: eventoExistente?.fecha ?? "",
    horaInicio: eventoExistente?.horaInicio ?? "",
    horaFin: eventoExistente?.horaFin ?? "",
    capacidad: eventoExistente ? String(eventoExistente.capacidad) : "",
    precio: eventoExistente ? String(eventoExistente.precio) : "",
    observaciones: eventoExistente?.observaciones ?? "",
    estado: eventoExistente?.estado ?? "Programado",
    imagen: eventoExistente?.imagen ?? "",
  });
  const [error, setError] = useState("");
  const f = (k: keyof typeof form) => (v: string) =>
    setForm((p) => ({ ...p, [k]: v }));
  function handleImagen(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setForm((p) => ({ ...p, imagen: reader.result as string }));
    reader.readAsDataURL(file);
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
            <Input
              label="Código del evento"
              value={form.codigo}
              onChange={f("codigo")}
              placeholder="EVT-007"
              required
            />
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
                <label className="text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
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
                <label className="text-sm font-medium text-gray-700">
                  Imagen del evento
                  <span className="text-red-500"> *</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImagen(e.target.files?.[0])}
                  className="text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-violet-100 file:text-violet-700 file:text-sm file:font-medium cursor-pointer"
                />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Teatro / Venue"
              value={form.teatro}
              onChange={f("teatro")}
              placeholder="Teatro Nacional"
              required
            />
            <Select
              label="País"
              value={form.pais}
              onChange={f("pais")}
              options={["Colombia", "México", "Argentina", "España"]}
            />
            <Input
              label="Ciudad"
              value={form.ciudad}
              onChange={f("ciudad")}
              placeholder="Bogotá"
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
            />
            <Input
              label="Hora de inicio"
              type="time"
              value={form.horaInicio}
              onChange={f("horaInicio")}
              required
            />
            <Input
              label="Hora estimada de finalización"
              type="time"
              value={form.horaFin}
              onChange={f("horaFin")}
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
                <label className="text-sm font-medium text-gray-700">
                  Observaciones
                </label>
                <textarea
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
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="flex gap-4">
          <Btn
            size="lg"
            onClick={() => {
              if (
                form.codigo === "" ||
                form.nombre === "" ||
                form.teatro === "" ||
                form.ciudad === "" ||
                form.fechaInicio === "" ||
                form.horaInicio === "" ||
                form.capacidad === "" ||
                form.precio === "" ||
                form.imagen === ""
              ) {
                setError(
                  "Por favor, completa los campos obligatorios (marcados con *)",
                );
                return;
              }
              setError("");
              const datos: Omit<Evento, "id"> = {
                codigo: form.codigo,
                nombre: form.nombre,
                descripcion: form.descripcion,
                teatro: form.teatro,
                ciudad: form.ciudad,
                pais: form.pais,
                fecha: form.fechaInicio,
                horaInicio: form.horaInicio,
                horaFin: form.horaFin,
                capacidad: parseInt(form.capacidad || "0"),
                precio: parseInt(form.precio || "0"),
                estado: form.estado as EventStatus,
                imagen: form.imagen || eventos[0]?.imagen || "",
                observaciones: form.observaciones,
              };
              if (eventoExistente) actualizarEvento(eventoExistente.id, datos);
              else registrarEvento(datos);
              onNav("agent-my-events");
            }}
          >
            {eventoExistente ? "Guardar cambios" : "Guardar evento"}
          </Btn>
          <Btn
            size="lg"
            variant="outline"
            onClick={() => onNav("agent-my-events")}
          >
            Cancelar
          </Btn>
        </div>
      </div>
    </>
  );
}
