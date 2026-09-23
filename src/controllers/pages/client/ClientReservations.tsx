import { fmtPrice, fmtDate, unsplash } from "../../../utils/format";
import { EVENTOS, RESERVAS } from "../../../models/data/mockData";
import { Badge } from "../../../views/components/Badge";
import { StatCard } from "../../../views/components/StatCard";
import { PageHeader } from "../../../views/layouts/PageHeader";

// ─── CLIENT RESERVATIONS ──────────────────────────────────────────────────────
export function ClientReservations() {
  const myRes = RESERVAS.filter(r => r.cliente === "María González");
  return (
    <>
      <PageHeader title="Mis Reservas" subtitle="Historial completo de tus reservas" />
      <div className="grid grid-cols-4 gap-5 mb-8">
        <StatCard label="Total reservas" value={myRes.length} icon="🎫" color="violet" />
        <StatCard label="Confirmadas" value={myRes.filter(r => r.estado === "Confirmada").length} icon="✅" color="emerald" />
        <StatCard label="Pendientes" value={myRes.filter(r => r.estado === "Reservada").length} icon="⏳" color="amber" />
        <StatCard label="Total invertido" value={fmtPrice(myRes.filter(r => r.estado !== "Cancelada").reduce((s, r) => s + r.total, 0))} icon="💳" color="blue" />
      </div>
      <div className="space-y-4">
        {myRes.map(r => {
          const ev = EVENTOS.find(e => e.id === r.eventoId)!;
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-5 items-center hover:shadow-md transition">
              <img src={unsplash(ev.imagen, 100, 70)} alt={ev.nombre} className="rounded-xl w-20 h-14 object-cover flex-shrink-0" />
              <div className="flex-1 grid grid-cols-5 gap-3 items-center">
                <div className="col-span-2">
                  <p className="font-semibold text-gray-800 text-sm">{ev.nombre}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">#{r.id}</p>
                  <p className="text-xs text-gray-500 mt-1">📅 {fmtDate(ev.fecha)} · {ev.ciudad}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Reserva</p>
                  <p className="text-sm font-medium text-gray-700">{fmtDate(r.fechaReserva)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Entradas</p>
                  <p className="text-sm font-bold text-gray-800">{r.entradas}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">Total</p>
                  <p className="font-bold text-violet-700 text-sm">{fmtPrice(r.total)}</p>
                  <div className="mt-1"><Badge status={r.estado} /></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

