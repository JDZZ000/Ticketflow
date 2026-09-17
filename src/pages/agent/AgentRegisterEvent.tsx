import { useState } from "react";
import type { Screen } from "../../types";
import { PRIMARY } from "../../utils/theme";
import { Btn } from "../../components/Btn";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { PageHeader } from "../../layouts/PageHeader";

// ─── AGENT REGISTER EVENT ─────────────────────────────────────────────────────
export function AgentRegisterEvent({ onNav }: { onNav: (s: Screen) => void }) {
  const [form, setForm] = useState({
    codigo: "", nombre: "", descripcion: "", teatro: "", pais: "Colombia",
    departamento: "", ciudad: "", fechaInicio: "", horaInicio: "", fechaFin: "",
    horaFin: "", capacidad: "", precio: "", observaciones: "", estado: "Programado",
  });
  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  return (
    <>
      <PageHeader title="Registrar nuevo evento" subtitle="Completa toda la información del espectáculo" />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-3xl">
        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full text-xs text-white flex items-center justify-center" style={{ background: PRIMARY }}>1</span>
            Información general
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Código del evento" value={form.codigo} onChange={f("codigo")} placeholder="EVT-007" />
            <Select label="Estado" value={form.estado} onChange={f("estado")} options={["Programado", "En Boletería", "En Vivo", "Finalizado", "Cancelado"]} />
            <div className="col-span-2">
              <Input label="Nombre del evento" value={form.nombre} onChange={f("nombre")} placeholder="Nombre completo del espectáculo" />
            </div>
            <div className="col-span-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <textarea rows={3} value={form.descripcion} onChange={e => f("descripcion")(e.target.value)}
                  placeholder="Descripción del evento..." className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
              </div>
            </div>
          </div>
        </section>
        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full text-xs text-white flex items-center justify-center" style={{ background: PRIMARY }}>2</span>
            Ubicación
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Teatro / Venue" value={form.teatro} onChange={f("teatro")} placeholder="Teatro Nacional" />
            <Select label="País" value={form.pais} onChange={f("pais")} options={["Colombia", "México", "Argentina", "España"]} />
            <Input label="Departamento" value={form.departamento} onChange={f("departamento")} placeholder="Cundinamarca" />
            <Input label="Ciudad" value={form.ciudad} onChange={f("ciudad")} placeholder="Bogotá" />
          </div>
        </section>
        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full text-xs text-white flex items-center justify-center" style={{ background: PRIMARY }}>3</span>
            Fecha y hora
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Fecha de inicio" type="date" value={form.fechaInicio} onChange={f("fechaInicio")} />
            <Input label="Hora de inicio" type="time" value={form.horaInicio} onChange={f("horaInicio")} />
            <Input label="Fecha de finalización" type="date" value={form.fechaFin} onChange={f("fechaFin")} />
            <Input label="Hora estimada de finalización" type="time" value={form.horaFin} onChange={f("horaFin")} />
          </div>
        </section>
        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full text-xs text-white flex items-center justify-center" style={{ background: PRIMARY }}>4</span>
            Capacidad y precios
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Capacidad total" value={form.capacidad} onChange={f("capacidad")} placeholder="1200" />
            <Input label="Precio base (COP)" value={form.precio} onChange={f("precio")} placeholder="85000" />
            <div className="col-span-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Observaciones</label>
                <textarea rows={2} value={form.observaciones} onChange={e => f("observaciones")(e.target.value)}
                  placeholder="Restricciones de edad, notas importantes..." className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
              </div>
            </div>
          </div>
        </section>
        <div className="flex gap-4">
          <Btn size="lg" onClick={() => onNav("agent-my-events")}>Guardar evento</Btn>
          <Btn size="lg" variant="outline" onClick={() => onNav("agent-my-events")}>Cancelar</Btn>
        </div>
      </div>
    </>
  );
}

