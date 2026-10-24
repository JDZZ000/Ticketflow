import { useState } from "react";
import type { Screen, Role, Evento, Reserva } from "../../../models/types";
import { PRIMARY } from "../../../utils/theme";
import { fmtPrice, fmtDate, unsplash } from "../../../utils/format";
import {
  entradasDisponibles,
  quedanPocas,
  MAX_POR_RESERVA,
} from "../../../utils/cupo";
import { Btn } from "../../../views/components/Btn";
import { Select } from "../../../views/components/Select";
import { Badge } from "../../../views/components/Badge";
import { mensajeDeError } from "../../../models/api/cliente";

// ─── RESERVE ──────────────────────────────────────────────────────────────────
export function ReservePage(props: {
  onNav: (s: Screen, r?: Role, eventId?: number) => void;
  eventoId: number | null;
  eventos: Evento[];
  reservas: Reserva[];
  crearReserva: (
    eventoId: number,
    entradas: number,
    observaciones: string,
  ) => Promise<Reserva>;
}) {
  const ev = props.eventos.find((e) => e.id === props.eventoId);
  // Si el evento ya no existe (por ejemplo, lo eliminó un agente), no hay nada que reservar
  if (!ev) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <p className="text-gray-600 mb-5">Este evento ya no está disponible.</p>
        <Btn onClick={() => props.onNav("client-events")}>
          ← Volver a eventos
        </Btn>
      </div>
    );
  }
  return (
    <ReservarEvento
      onNav={props.onNav}
      ev={ev}
      reservas={props.reservas}
      crearReserva={props.crearReserva}
    />
  );
}

function ReservarEvento({
  onNav,
  ev,
  reservas,
  crearReserva,
}: {
  onNav: (s: Screen, r?: Role, eventId?: number) => void;
  ev: Evento;
  reservas: Reserva[];
  // Crea la reserva en el servidor. Si no hay cupo, falla con el mensaje del servidor.
  crearReserva: (
    eventoId: number,
    entradas: number,
    observaciones: string,
  ) => Promise<Reserva>;
}) {
  const [cantidad, setCantidad] = useState("1");
  const [obs, setObs] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [reservaId, setReservaId] = useState<number | null>(null);

  // ── Cupo ──
  const disponibles = entradasDisponibles(ev, reservas);
  const maxCompra = Math.min(MAX_POR_RESERVA, disponibles);
  const reservable = ev.estado === "En Boletería" && maxCompra > 0;
  const entradas = Math.min(parseInt(cantidad) || 0, maxCompra);
  const total = ev.precio * entradas;
  const pctVendido = Math.round((1 - disponibles / ev.capacidad) * 100);

  async function confirmar() {
    if (!reservable || entradas < 1) {
      setError("Selecciona al menos una entrada.");
      return;
    }
    setError("");
    setEnviando(true);
    try {
      // El total lo calcula el servidor (precio × entradas) y él decide si hay cupo
      const nueva = await crearReserva(ev.id, entradas, obs);
      setReservaId(nueva.id);
      setDone(true);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setEnviando(false);
    }
  }

  if (done)
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-4xl mb-6">
          ✅
        </div>
        <h2
          className="text-2xl font-bold text-gray-800 mb-2"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          ¡Reserva realizada!
        </h2>
        <p className="text-gray-500 mb-8">
          Tu reserva #{reservaId} ha sido registrada exitosamente.
        </p>
        <div className="flex gap-4">
          <Btn onClick={() => onNav("client-reservations")}>
            Ver mis reservas
          </Btn>
          <Btn variant="outline" onClick={() => onNav("client-events")}>
            Explorar más eventos
          </Btn>
        </div>
      </div>
    );

  return (
    <>
      <button
        onClick={() => onNav("client-event-detail")}
        className="flex items-center gap-2 text-gray-500 hover:text-violet-600 text-sm font-medium mb-6 cursor-pointer transition"
      >
        ← Volver al evento
      </button>
      <h1
        className="text-4xl font-extrabold mb-6 leading-tight"
        style={{
          fontFamily: "Outfit, sans-serif",
          background: `linear-gradient(135deg, #1A1B2E, ${PRIMARY})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Realizar reserva
      </h1>
      <div className="max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Resumen del evento
            </h2>
            <div className="flex gap-4 items-start">
              <img
                src={unsplash(ev.imagen, 160, 110)}
                alt={ev.nombre}
                className="rounded-xl w-32 h-20 object-cover flex-shrink-0"
              />
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Evento</p>
                  <p className="font-semibold text-gray-800">{ev.nombre}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Teatro</p>
                  <p className="font-semibold text-gray-800">{ev.teatro}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Fecha</p>
                  <p className="font-semibold text-gray-800">
                    {fmtDate(ev.fecha)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Hora</p>
                  <p className="font-semibold text-gray-800">{ev.horaInicio}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Ciudad</p>
                  <p className="font-semibold text-gray-800">{ev.ciudad}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Precio unitario</p>
                  <p className="font-semibold text-violet-700">
                    {fmtPrice(ev.precio)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Detalles de la reserva
            </h2>
            {reservable ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Cantidad de entradas"
                  value={String(entradas)}
                  onChange={(v) => {
                    setCantidad(v);
                    setError("");
                  }}
                  options={Array.from({ length: maxCompra }, (_, i) =>
                    String(i + 1),
                  )}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    Método de entrega
                  </label>
                  <select className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white transition">
                    <option>Boletería digital (correo)</option>
                    <option>Recoger en taquilla</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
                {disponibles === 0
                  ? "Este evento está agotado: ya no quedan entradas disponibles."
                  : `Este evento no está disponible para reservar (estado: ${ev.estado}).`}
              </div>
            )}
            {reservable && entradas === maxCompra && (
              <p className="text-xs text-gray-500">
                {maxCompra === MAX_POR_RESERVA
                  ? `Puedes reservar hasta ${MAX_POR_RESERVA} entradas por compra.`
                  : `Solo quedan ${disponibles} entradas disponibles.`}
              </p>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Observaciones (opcional)
              </label>
              <textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                rows={4}
                placeholder="Preferencia de ubicación, requerimientos especiales..."
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none"
              />
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-5 text-xs text-gray-500 leading-relaxed">
            🔒 Tu reserva queda en estado "Reservada" hasta que se confirme el
            pago en taquilla o en línea. Puedes cancelarla sin costo hasta 48
            horas antes del evento.
          </div>
        </div>

        <div className="sticky top-24 space-y-5">
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-6">
            <p className="text-sm text-violet-600 font-medium mb-1">
              Valor total a reservar
            </p>
            <p
              className="text-4xl font-extrabold text-violet-700 mb-1"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {fmtPrice(total)}
            </p>
            <p className="text-xs text-violet-400 mb-5">
              {entradas} entrada{entradas > 1 ? "s" : ""} ×{" "}
              {fmtPrice(ev.precio)}
            </p>
            {error && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4"
              >
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Btn
                full
                size="lg"
                disabled={!reservable || entradas < 1 || enviando}
                onClick={confirmar}
              >
                {enviando
                  ? "Reservando…"
                  : disponibles === 0
                    ? "Agotado"
                    : "Confirmar reserva"}
              </Btn>
              <Btn
                full
                variant="outline"
                onClick={() => onNav("client-event-detail")}
              >
                Cancelar
              </Btn>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-sm space-y-2">
            <p className="font-semibold text-gray-700 mb-1">Disponibilidad</p>
            {disponibles === 0 ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                Agotado
              </span>
            ) : (
              <>
                <p className="text-gray-600">
                  <span className="font-bold text-gray-800">
                    {disponibles.toLocaleString("es-CO")}
                  </span>{" "}
                  de {ev.capacidad.toLocaleString("es-CO")} entradas disponibles
                </p>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${quedanPocas(ev, reservas) ? "bg-amber-500" : "bg-violet-500"}`}
                    style={{ width: `${pctVendido}%` }}
                  />
                </div>
                {quedanPocas(ev, reservas) && (
                  <p className="text-xs font-semibold text-amber-600">
                    ¡Últimas entradas!
                  </p>
                )}
              </>
            )}
            <p className="font-semibold text-gray-700 pt-2">
              Estado del evento
            </p>
            <Badge status={ev.estado} />
          </div>
        </div>
      </div>
    </>
  );
}
