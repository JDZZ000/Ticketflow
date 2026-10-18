import { useState } from "react";
import type { Reserva, Evento } from "../../../models/types";
import { fmtPrice, fmtDate, unsplash } from "../../../utils/format";
import { entradasDisponibles, MAX_POR_RESERVA } from "../../../utils/cupo";
import { mensajeDeError } from "../../../models/api/cliente";
import { Badge } from "../../../views/components/Badge";
import { Btn } from "../../../views/components/Btn";
import { Select } from "../../../views/components/Select";
import { Modal } from "../../../views/components/Modal";
import { StatCard } from "../../../views/components/StatCard";
import { PageHeader } from "../../../views/layouts/PageHeader";

// ─── VENTANA: CANCELAR UNA RESERVA ────────────────────────────────────────────
// La causa queda guardada y aparece en el reporte de reservas canceladas.
function CancelarModal({
  reserva,
  evento,
  onClose,
  cancelarReserva,
}: {
  reserva: Reserva;
  evento: Evento;
  onClose: () => void;
  cancelarReserva: (id: number, causa: string) => Promise<void>;
}) {
  const [causa, setCausa] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function confirmar() {
    if (causa.trim().length < 3) {
      setError("Cuéntanos brevemente por qué cancelas tu reserva.");
      return;
    }
    setError("");
    setEnviando(true);
    try {
      await cancelarReserva(reserva.id, causa.trim());
      onClose();
    } catch (e) {
      setError(mensajeDeError(e));
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`Cancelar reserva #${reserva.id}`} onClose={onClose}>
      <p className="text-sm text-gray-600 mb-4">
        {evento.nombre} · {reserva.entradas} entrada
        {reserva.entradas > 1 ? "s" : ""} · {fmtPrice(reserva.total)}. Las
        entradas quedarán libres para otras personas.
      </p>
      <label
        htmlFor="causa-cancelacion"
        className="text-sm font-medium text-gray-700"
      >
        Motivo de la cancelación <span className="text-red-500">*</span>
      </label>
      <textarea
        id="causa-cancelacion"
        value={causa}
        onChange={(e) => {
          setCausa(e.target.value);
          setError("");
        }}
        rows={3}
        maxLength={200}
        placeholder="Ej.: Cambio de planes"
        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
      />
      {error && (
        <p role="alert" className="text-red-500 text-sm mt-2">
          {error}
        </p>
      )}
      <div className="flex gap-3 mt-5">
        <Btn variant="danger" disabled={enviando} onClick={confirmar}>
          {enviando ? "Cancelando…" : "Cancelar reserva"}
        </Btn>
        <Btn variant="ghost" disabled={enviando} onClick={onClose}>
          Volver
        </Btn>
      </div>
    </Modal>
  );
}

// ─── VENTANA: EDITAR UNA RESERVA ──────────────────────────────────────────────
// Solo se puede mientras la reserva está «Reservada». El servidor recalcula el
// total y comprueba que haya cupo si se suben las entradas.
function EditarModal({
  reserva,
  evento,
  onClose,
  editarReserva,
}: {
  reserva: Reserva;
  evento: Evento;
  onClose: () => void;
  editarReserva: (
    id: number,
    entradas: number,
    observaciones: string,
  ) => Promise<void>;
}) {
  // Lo máximo que puede tener: las que ya tiene más las que todavía quedan libres
  const maxima = Math.max(
    reserva.entradas,
    Math.min(
      MAX_POR_RESERVA,
      entradasDisponibles(evento, []) + reserva.entradas,
    ),
  );
  const [entradas, setEntradas] = useState(String(reserva.entradas));
  const [obs, setObs] = useState(reserva.observaciones);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const cantidad = parseInt(entradas) || reserva.entradas;

  async function guardar() {
    setError("");
    setEnviando(true);
    try {
      await editarReserva(reserva.id, cantidad, obs);
      onClose();
    } catch (e) {
      setError(mensajeDeError(e));
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={`Editar reserva #${reserva.id}`} onClose={onClose}>
      <p className="text-sm text-gray-600 mb-4">{evento.nombre}</p>
      <div className="space-y-4">
        <Select
          label="Cantidad de entradas"
          value={entradas}
          onChange={(v) => {
            setEntradas(v);
            setError("");
          }}
          options={Array.from({ length: maxima }, (_, i) => String(i + 1))}
        />
        <div className="flex flex-col gap-1">
          <label
            htmlFor="obs-reserva"
            className="text-sm font-medium text-gray-700"
          >
            Observaciones
          </label>
          <textarea
            id="obs-reserva"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            rows={3}
            placeholder="Preferencia de ubicación, requerimientos especiales..."
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
          />
        </div>
        <p className="text-sm text-gray-600">
          Total:{" "}
          <span className="font-bold text-violet-700">
            {fmtPrice(evento.precio * cantidad)}
          </span>{" "}
          ({cantidad} × {fmtPrice(evento.precio)})
        </p>
        {maxima === reserva.entradas && (
          <p className="text-xs text-gray-500">
            No hay más entradas libres para aumentar esta reserva.
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="text-red-500 text-sm mt-3">
          {error}
        </p>
      )}
      <div className="flex gap-3 mt-5">
        <Btn disabled={enviando} onClick={guardar}>
          {enviando ? "Guardando…" : "Guardar cambios"}
        </Btn>
        <Btn variant="ghost" disabled={enviando} onClick={onClose}>
          Cerrar
        </Btn>
      </div>
    </Modal>
  );
}

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
