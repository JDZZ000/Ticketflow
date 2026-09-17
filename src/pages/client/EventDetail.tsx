import type { Screen } from "../../types";
import { PRIMARY, PRIMARY_L } from "../../utils/theme";
import { fmtPrice, fmtDate, unsplash } from "../../utils/format";
import { EVENTOS } from "../../data/mockData";
import { Btn } from "../../components/Btn";
import { Badge } from "../../components/Badge";

// ─── EVENT DETAIL ─────────────────────────────────────────────────────────────
export function EventDetail({ onNav }: { onNav: (s: Screen) => void }) {
  const ev = EVENTOS[0];
  return (
    <>
      <button onClick={() => onNav("client-events")} className="flex items-center gap-2 text-gray-500 hover:text-violet-600 text-sm font-medium mb-6 cursor-pointer transition">
        ← Volver a eventos
      </button>
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
        <div className="relative h-72 bg-violet-100">
          <img src={unsplash(ev.imagen, 1200, 500)} alt={ev.nombre} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }} />
          <div className="absolute bottom-6 left-8">
            <Badge status={ev.estado} />
            <h1 className="text-3xl font-extrabold text-white mt-2" style={{ fontFamily: "Outfit, sans-serif" }}>{ev.nombre}</h1>
          </div>
        </div>
        <div className="p-8 grid grid-cols-3 gap-8">
          <div className="col-span-2">
            <h2 className="text-lg font-bold text-gray-800 mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Descripción</h2>
            <p className="text-gray-600 leading-relaxed mb-6">{ev.descripcion}</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["🎭 Teatro", ev.teatro],
                ["📍 Ciudad", ev.ciudad + ", " + ev.pais],
                ["📅 Fecha", fmtDate(ev.fecha)],
                ["🕐 Hora inicio", ev.horaInicio],
                ["🕑 Hora fin estimada", ev.horaFin],
                ["👥 Capacidad total", ev.capacidad.toLocaleString("es-CO") + " personas"],
              ].map(([l, v]) => (
                <div key={l as string} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">{l}</p>
                  <p className="text-sm font-semibold text-gray-800">{v}</p>
                </div>
              ))}
            </div>
            {ev.observaciones && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800"><span className="font-semibold">Observaciones:</span> {ev.observaciones}</p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-6 text-center">
              <p className="text-sm text-violet-600 font-medium mb-1">Precio base por entrada</p>
              <p className="text-4xl font-extrabold text-violet-700 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>
                {fmtPrice(ev.precio)}
              </p>
              <Btn full size="lg" onClick={() => onNav("client-reserve")}>Reservar entradas</Btn>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
              <p className="font-semibold text-gray-700">Estado del evento</p>
              <Badge status={ev.estado} />
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-sm space-y-3">
              <p className="font-semibold text-gray-700">Organizador</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_L} 100%)` }}>
                  TF
                </div>
                <div className="min-w-0">
                  <p className="text-gray-800 font-medium text-sm truncate">TicketFlow Producciones</p>
                  <p className="text-gray-400 text-xs">Organizador verificado</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-sm space-y-1.5">
              <p className="font-semibold text-gray-700 mb-1">Política de cancelación</p>
              <p className="text-gray-500 text-xs leading-relaxed">Cancelación gratuita hasta 48 horas antes del evento. Después de ese plazo no hay reembolso.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-sm">
              <p className="font-semibold text-gray-700 mb-2">¿Necesitas ayuda?</p>
              <button className="text-violet-600 font-medium text-xs hover:underline">Contactar soporte →</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

