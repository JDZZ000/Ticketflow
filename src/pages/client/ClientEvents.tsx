import { useState } from "react";
import type { Screen } from "../../types";
import { EVENTOS } from "../../data/mockData";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { EventCard } from "../../components/EventCard";
import { PageHeader } from "../../layouts/PageHeader";

// ─── CLIENT EVENTS ────────────────────────────────────────────────────────────
export function ClientEvents({ onNav }: { onNav: (s: Screen) => void }) {
  const [ciudad, setCiudad] = useState("Todas");
  const [estado, setEstado] = useState("Todos");
  const [buscar, setBuscar] = useState("");

  const ciudades = ["Todas", ...Array.from(new Set(EVENTOS.map(e => e.ciudad)))];
  const estados = ["Todos", "En Boletería", "Programado", "En Vivo", "Finalizado", "Cancelado"];

  const filtered = EVENTOS.filter(ev => {
    const okCiudad = ciudad === "Todas" || ev.ciudad === ciudad;
    const okEstado = estado === "Todos" || ev.estado === estado;
    const okBuscar = ev.nombre.toLowerCase().includes(buscar.toLowerCase()) || ev.teatro.toLowerCase().includes(buscar.toLowerCase());
    return okCiudad && okEstado && okBuscar;
  });

  return (
    <>
      <PageHeader title="Eventos disponibles" subtitle="Explora todos los eventos y espectáculos" />
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <Input label="Buscar evento o teatro" value={buscar} onChange={setBuscar} placeholder="Buscar..." />
          </div>
          <Select label="Ciudad" value={ciudad} onChange={setCiudad} options={ciudades} />
          <Select label="Estado" value={estado} onChange={setEstado} options={estados} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-5">
        {filtered.map(ev => (
          <EventCard key={ev.id} ev={ev} onView={() => onNav("client-event-detail")} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-4 py-16 text-center text-gray-400">
            <p className="text-4xl mb-3">🎭</p>
            <p className="font-medium">No se encontraron eventos con los filtros seleccionados</p>
          </div>
        )}
      </div>
    </>
  );
}

