import { useState } from "react";
import type { Screen } from "../../../models/types";
import { PRIMARY } from "../../../utils/theme";
import { fmtPrice, fmtDate, unsplash } from "../../../utils/format";
import { EVENTOS } from "../../../models/data/mockData";
import { Btn } from "../../../views/components/Btn";
import { Select } from "../../../views/components/Select";
import { Badge } from "../../../views/components/Badge";

// ─── RESERVE ──────────────────────────────────────────────────────────────────
export function ReservePage({ onNav }: { onNav: (s: Screen) => void }) {
  const ev = EVENTOS[0];
  const [cantidad, setCantidad] = useState("2");
  const [obs, setObs] = useState("");
  const [done, setDone] = useState(false);
  const total = ev.precio * parseInt(cantidad || "0");

  if (done) return (
    <div className="flex flex-col items-center justify-center min-h-96 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-4xl mb-6">✅</div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>¡Reserva realizada!</h2>
      <p className="text-gray-500 mb-8">Tu reserva #1006 ha sido registrada exitosamente.</p>
      <div className="flex gap-4">
        <Btn onClick={() => onNav("client-reservations")}>Ver mis reservas</Btn>
        <Btn variant="outline" onClick={() => onNav("client-events")}>Explorar más eventos</Btn>
      </div>
    </div>
  );

  return (
    <>
      <button onClick={() => onNav("client-event-detail")} className="flex items-center gap-2 text-gray-500 hover:text-violet-600 text-sm font-medium mb-6 cursor-pointer transition">
        ← Volver al evento
      </button>
      <h1 className="text-4xl font-extrabold mb-6 leading-tight" style={{ fontFamily: "Outfit, sans-serif", background: `linear-gradient(135deg, #1A1B2E, ${PRIMARY})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Realizar reserva</h1>
      <div className="max-w-5xl grid grid-cols-3 gap-6 items-start">
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Resumen del evento</h2>
            <div className="flex gap-4 items-start">
              <img src={unsplash(ev.imagen, 160, 110)} alt={ev.nombre} className="rounded-xl w-32 h-20 object-cover flex-shrink-0" />
              <div className="flex-1 grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-gray-400 text-xs">Evento</p><p className="font-semibold text-gray-800">{ev.nombre}</p></div>
                <div><p className="text-gray-400 text-xs">Teatro</p><p className="font-semibold text-gray-800">{ev.teatro}</p></div>
                <div><p className="text-gray-400 text-xs">Fecha</p><p className="font-semibold text-gray-800">{fmtDate(ev.fecha)}</p></div>
                <div><p className="text-gray-400 text-xs">Hora</p><p className="font-semibold text-gray-800">{ev.horaInicio}</p></div>
                <div><p className="text-gray-400 text-xs">Ciudad</p><p className="font-semibold text-gray-800">{ev.ciudad}</p></div>
                <div><p className="text-gray-400 text-xs">Precio unitario</p><p className="font-semibold text-violet-700">{fmtPrice(ev.precio)}</p></div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Detalles de la reserva</h2>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Cantidad de entradas" value={cantidad} onChange={setCantidad} options={["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Método de entrega</label>
                <select className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white transition">
                  <option>Boletería digital (correo)</option>
                  <option>Recoger en taquilla</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Observaciones (opcional)</label>
              <textarea
                value={obs}
                onChange={e => setObs(e.target.value)}
                rows={4}
                placeholder="Preferencia de ubicación, requerimientos especiales..."
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
              />
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-5 text-xs text-gray-500 leading-relaxed">
            🔒 Tu reserva queda en estado "Reservada" hasta que se confirme el pago en taquilla o en línea. Puedes cancelarla sin costo hasta 48 horas antes del evento.
          </div>
        </div>

        <div className="sticky top-24 space-y-5">
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-6">
            <p className="text-sm text-violet-600 font-medium mb-1">Valor total a reservar</p>
            <p className="text-4xl font-extrabold text-violet-700 mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>{fmtPrice(total)}</p>
            <p className="text-xs text-violet-400 mb-5">{cantidad} entrada{parseInt(cantidad) > 1 ? "s" : ""} × {fmtPrice(ev.precio)}</p>
            <div className="space-y-2">
              <Btn full size="lg" onClick={() => setDone(true)}>Confirmar reserva</Btn>
              <Btn full variant="outline" onClick={() => onNav("client-event-detail")}>Cancelar</Btn>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-sm space-y-2">
            <p className="font-semibold text-gray-700 mb-1">Estado del evento</p>
            <Badge status={ev.estado} />
          </div>
        </div>
      </div>
    </>
  );
}

