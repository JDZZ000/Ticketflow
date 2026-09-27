import type {
  ReservaStatus,
  Reserva,
  Evento,
  Screen,
  Role,
} from "../../../models/types";
import { fmtPrice, fmtDate } from "../../../utils/format";
import { Badge } from "../../../views/components/Badge";
import { PageHeader } from "../../../views/layouts/PageHeader";

// ─── AGENT RESERVATIONS ───────────────────────────────────────────────────────
export function AgentReservations({
  onNav,
  reservas,
  eventos,
  actualizarEstadoReserva,
}: {
  onNav: (s: Screen, r?: Role, eventId?: number | null) => void;
  reservas: Reserva[];
  eventos: Evento[];
  actualizarEstadoReserva: (id: number, estado: ReservaStatus) => void;
}) {
  return (
    <>
      <PageHeader
        title="Gestión de Reservas"
        subtitle="Administra las reservas recibidas en tus eventos"
      />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr style={{ background: "#F5F6FA" }}>
                {[
                  "ID",
                  "Cliente",
                  "Evento",
                  "Fecha reserva",
                  "Entradas",
                  "Total",
                  "Estado",
                  "Observaciones",
                  "Acción",
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
              {reservas
                .filter((r) => eventos.some((e) => e.id === r.eventoId))
                .map((r) => {
                  const ev = eventos.find((e) => e.id === r.eventoId)!;
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-gray-50 hover:bg-violet-50/30 transition"
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-gray-500">
                        #{r.id}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-gray-800">
                        {r.cliente}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 max-w-36 truncate">
                        {ev.nombre}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {fmtDate(r.fechaReserva)}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-center font-bold text-gray-800">
                        {r.entradas}
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-violet-700">
                        {fmtPrice(r.total)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge status={r.estado} />
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 max-w-32 truncate">
                        {r.observaciones || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          value={r.estado}
                          onChange={(e) =>
                            actualizarEstadoReserva(
                              r.id,
                              e.target.value as ReservaStatus,
                            )
                          }
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                        >
                          {["Reservada", "Confirmada", "Cancelada"].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
