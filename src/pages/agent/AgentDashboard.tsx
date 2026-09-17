import type { Screen } from "../../types";
import { fmtPrice, fmtDate, unsplash } from "../../utils/format";
import { EVENTOS, RESERVAS } from "../../data/mockData";
import { Btn } from "../../components/Btn";
import { Badge } from "../../components/Badge";
import { StatCard } from "../../components/StatCard";
import { PageHeader } from "../../layouts/PageHeader";

// ─── AGENT DASHBOARD ─────────────────────────────────────────────────────────
export function AgentDashboard({ onNav }: { onNav: (s: Screen) => void }) {
  return (
    <>
      <PageHeader title="Dashboard Agente" subtitle="Gestiona tus eventos y reservas"
        actions={<Btn onClick={() => onNav("agent-register-event")}>➕ Nuevo evento</Btn>} />
      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatCard label="Eventos registrados" value={EVENTOS.length} icon="🎭" color="violet" />
        <StatCard label="Eventos activos" value={EVENTOS.filter(e => e.estado === "En Boletería").length} icon="✅" color="emerald" />
        <StatCard label="Reservas recibidas" value={RESERVAS.length} icon="🎫" color="blue" />
        <StatCard label="Reservas pendientes" value={RESERVAS.filter(r => r.estado === "Reservada").length} icon="⏳" color="amber" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xl font-extrabold text-gray-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Mis eventos recientes</h3>
          <div className="space-y-3">
            {EVENTOS.slice(0, 4).map(ev => (
              <div key={ev.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <img src={unsplash(ev.imagen, 60, 40)} alt={ev.nombre} className="rounded-lg w-12 h-8 object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{ev.nombre}</p>
                  <p className="text-xs text-gray-400">{ev.ciudad} · {fmtDate(ev.fecha)}</p>
                </div>
                <Badge status={ev.estado} />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xl font-extrabold text-gray-800 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Últimas reservas</h3>
          <div className="space-y-3">
            {RESERVAS.slice(0, 4).map(r => {
              const ev = EVENTOS.find(e => e.id === r.eventoId)!;
              return (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{r.cliente}</p>
                    <p className="text-xs text-gray-400">{ev.nombre}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-violet-700">{fmtPrice(r.total)}</p>
                    <Badge status={r.estado} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

