import { useState } from "react";
import type { Reserva, Evento } from "../../models/types";
import { fmtPrice } from "../../utils/format";
import { entradasDisponibles, MAX_POR_RESERVA } from "../../utils/cupo";
import { mensajeDeError } from "../../models/api/cliente";
import { Btn } from "./Btn";
import { Select } from "./Select";
import { Modal } from "./Modal";

// ─── VENTANA: CANCELAR UNA RESERVA ────────────────────────────────────────────
// La causa queda guardada y aparece en el reporte de reservas canceladas.
export function CancelarModal({
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
export function EditarModal({
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
