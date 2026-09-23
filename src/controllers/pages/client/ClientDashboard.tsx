import type { Screen } from "../../../models/types";
import { fmtPrice, fmtDate } from "../../../utils/format";
import { EVENTOS, RESERVAS } from "../../../models/data/mockData";
import { Badge } from "../../../views/components/Badge";
import { EventCard } from "../../../views/components/EventCard";
import { StatCard } from "../../../views/components/StatCard";
import { PageHeader } from "../../../views/layouts/PageHeader";

// ─── CLIENT DASHBOARD ────────────────────────────────────────────────────────
export function ClientDashboard({ onNav, user }: { onNav: (s: Screen) => void; user: { nombre: string; email: string; role: string } | null }) {
  const myRes = RESERVAS.filter(r => r.cliente === "María González");
  return (
    <>
      <PageHeader title={`¡Bienvenid@, ${user?.nombre}! 👋`} subtitle="Aquí tienes un resumen de tu actividad" />
      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatCard label="Eventos disponibles" value={EVENTOS.filter(e => e.estado === "En Boletería").length} icon="🎭" color="violet" />
        <StatCard label="Mis reservas" value={myRes.length} icon="🎫" color="blue" />
        <StatCard label="Confirmadas" value={myRes.filter(r => r.estado === "Confirmada").length} icon="✅" color="emerald" />
        <StatCard label="Puntos acumulados" value="1,240" icon="⭐" color="amber" />
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="col-span-3">
          <h2 className="text-2xl font-extrabold text-gray-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Eventos destacados</h2>
          <div className="grid grid-cols-3 gap-4">
            {EVENTOS.filter(e => e.estado === "En Boletería").slice(0, 3).map(ev => (
              <EventCard key={ev.id} ev={ev} onView={() => onNav("client-event-detail")} />
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Mis últimas reservas</h2>
          <div className="space-y-3">
            {myRes.slice(0, 3).map(r => {
              const ev = EVENTOS.find(e => e.id === r.eventoId)!;
              return (
                <div key={r.id} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{ev.nombre}</p>
                    <Badge status={r.estado} />
                  </div>
                  <p className="text-xs text-gray-500">{r.entradas} entrada{r.entradas > 1 ? "s" : ""} · {fmtPrice(r.total)}</p>
                  <p className="text-xs text-gray-400 mt-1">{fmtDate(r.fechaReserva)}</p>
                </div>
              );
            })}
            <button className="text-violet-600 text-sm font-semibold hover:underline w-full text-center mt-2"
              onClick={() => onNav("client-reservations")}>
              Ver todas mis reservas →
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

