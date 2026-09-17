import type { Evento } from "../types";
import { unsplash, fmtDate, fmtPrice } from "../utils/format";
import { Badge } from "./Badge";
import { Btn } from "./Btn";

export function EventCard({ ev, onView }: { ev: Evento; onView: () => void }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
      <div className="relative h-44 bg-violet-100 overflow-hidden">
        <img src={unsplash(ev.imagen, 600, 350)} alt={ev.nombre} className="w-full h-full object-cover" />
        <div className="absolute top-3 right-3"><Badge status={ev.estado} /></div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-800 text-sm mb-1 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>{ev.nombre}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{ev.descripcion}</p>
        <div className="space-y-1 mb-4">
          <p className="text-xs text-gray-500 flex items-center gap-1">🎭 {ev.teatro}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1">📍 {ev.ciudad}</p>
          <p className="text-xs text-gray-500 flex items-center gap-1">📅 {fmtDate(ev.fecha)} · {ev.horaInicio}</p>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <span className="font-bold text-violet-700 text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>{fmtPrice(ev.precio)}</span>
          <Btn size="sm" onClick={onView}>Ver detalles</Btn>
        </div>
      </div>
    </div>
  );
}

