import { useState } from "react";
import type { Reserva, Evento } from "../../../models/types";
import { fmtPrice, fmtDate, unsplash } from "../../../utils/format";
import { Badge } from "../../../views/components/Badge";
import {
  CancelarModal,
  EditarModal,
} from "../../../views/components/ReservaModales";
import { StatCard } from "../../../views/components/StatCard";
import { PageHeader } from "../../../views/layouts/PageHeader";

// ─── CLIENT RESERVATIONS ──────────────────────────────────────────────────────
export function ClientReservations({
  user,
  reservas,
  eventos,
  cancelarReserva,
  editarReserva,
}: {
  user: { nombre: string } | null;
  reservas: Reserva[];
  eventos: Evento[];
  cancelarReserva: (id: number, causa: string) => Promise<void>;
  editarReserva: (
    id: number,
    entradas: number,
    observaciones: string,
  ) => Promise<void>;
}) {
  const [cancelando, setCancelando] = useState<Reserva | null>(null);
  const [editando, setEditando] = useState<Reserva | null>(null);
  const myRes = reservas
    .filter((r) => r.cliente === user?.nombre)
    .filter((r) => eventos.some((e) => e.id === r.eventoId));
  const eventoDe = (r: Reserva) => eventos.find((e) => e.id === r.eventoId)!;

  return (
    <>
      <PageHeader
        title="Mis Reservas"
        subtitle="Historial completo de tus reservas"
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Total reservas"
          value={myRes.length}
          icon="🎫"
          color="violet"
        />
        <StatCard
          label="Confirmadas"
          value={myRes.filter((r) => r.estado === "Confirmada").length}
          icon="✅"
          color="emerald"
        />
        <StatCard
          label="Pendientes"
          value={myRes.filter((r) => r.estado === "Reservada").length}
          icon="⏳"
          color="amber"
        />
        <StatCard
          label="Total invertido"
          value={fmtPrice(
            myRes
              .filter((r) => r.estado !== "Cancelada")
              .reduce((s, r) => s + r.total, 0),
          )}
          icon="💳"
          color="blue"
        />
      </div>
      {myRes.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-500">
          Todavía no tienes reservas. Explora el catálogo y reserva tu primer
          evento.
        </div>
      )}
      <div className="space-y-4">
        {myRes.map((r) => {
          const ev = eventoDe(r);
          return (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 sm:items-center hover:shadow-md transition"
            >
              <img
                src={unsplash(ev.imagen, 100, 70)}
                alt={ev.nombre}
                className="rounded-xl w-full h-32 sm:w-20 sm:h-14 object-cover flex-shrink-0"
              />
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-3 items-center">
                <div className="col-span-2">
                  <p className="font-semibold text-gray-800 text-sm">
                    {ev.nombre}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">
                    #{r.id}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    📅 {fmtDate(ev.fecha)} · {ev.ciudad}
                  </p>
                  {r.observaciones && (
                    <p className="text-xs text-gray-400 mt-1">
                      📝 {r.observaciones}
                    </p>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Reserva</p>
                  <p className="text-sm font-medium text-gray-700">
                    {fmtDate(r.fechaReserva)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Entradas</p>
                  <p className="text-sm font-bold text-gray-800">
                    {r.entradas}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">Total</p>
                  <p className="font-bold text-violet-700 text-sm">
                    {fmtPrice(r.total)}
                  </p>
                  <div className="mt-1">
                    <Badge status={r.estado} />
                  </div>
                  <div className="mt-1.5 flex justify-end gap-3">
                    {r.estado === "Reservada" && (
                      <button
                        onClick={() => setEditando(r)}
                        className="text-xs text-violet-600 hover:underline cursor-pointer"
                      >
                        Editar
                      </button>
                    )}
                    {r.estado !== "Cancelada" && (
                      <button
                        onClick={() => setCancelando(r)}
                        className="text-xs text-red-500 hover:underline cursor-pointer"
                      >
                        Cancelar reserva
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {cancelando && (
        <CancelarModal
          reserva={cancelando}
          evento={eventoDe(cancelando)}
          onClose={() => setCancelando(null)}
          cancelarReserva={cancelarReserva}
        />
      )}
      {editando && (
        <EditarModal
          reserva={editando}
          evento={eventoDe(editando)}
          onClose={() => setEditando(null)}
          editarReserva={editarReserva}
        />
      )}
    </>
  );
}
