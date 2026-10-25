import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Reserva, Evento } from "../../../models/types";
import { fmtPrice, fmtDate, unsplash } from "../../../utils/format";
import { mensajeDeError } from "../../../models/api/cliente";
import type { ResultadoPago } from "../../../models/api/pagos";
import { Badge } from "../../../views/components/Badge";
import { Btn } from "../../../views/components/Btn";
import {
  CancelarModal,
  EditarModal,
} from "../../../views/components/ReservaModales";
import { StatCard } from "../../../views/components/StatCard";
import { PageHeader } from "../../../views/layouts/PageHeader";

// Mensaje que se muestra arriba al pagar o al volver de Stripe
type Aviso = { tipo: "ok" | "info" | "error"; texto: string };
const ESTILO_AVISO: Record<Aviso["tipo"], string> = {
  ok: "bg-emerald-50 border-emerald-200 text-emerald-700",
  info: "bg-violet-50 border-violet-200 text-violet-700",
  error: "bg-red-50 border-red-200 text-red-700",
};

// ─── CLIENT RESERVATIONS ──────────────────────────────────────────────────────
export function ClientReservations({
  user,
  reservas,
  eventos,
  cancelarReserva,
  editarReserva,
  pagarReserva,
  confirmarPago,
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
  // Lleva a la página de pago de Stripe (la página se va de aquí)
  pagarReserva: (id: number) => Promise<void>;
  // Al volver de Stripe: comprueba el pago y confirma la reserva
  confirmarPago: (sessionId: string) => Promise<ResultadoPago>;
}) {
  const [cancelando, setCancelando] = useState<Reserva | null>(null);
  const [editando, setEditando] = useState<Reserva | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [pagando, setPagando] = useState<number | null>(null);

  // Stripe devuelve a esta pantalla con ?pago=exito&session_id=... o ?pago=cancelado.
  // Se atiende una sola vez y se limpia la URL, para que recargar no repita el aviso.
  const [params, setParams] = useSearchParams();
  const yaAtendido = useRef(false);
  useEffect(() => {
    const pago = params.get("pago");
    if (!pago || yaAtendido.current) return;
    yaAtendido.current = true;
    const sessionId = params.get("session_id");
    setParams({}, { replace: true });
    if (pago === "cancelado") {
      setAviso({
        tipo: "info",
        texto:
          "Cancelaste el pago. Tu reserva sigue en «Reservada» y puedes pagarla cuando quieras.",
      });
    } else if (pago === "exito" && sessionId) {
      setAviso({ tipo: "info", texto: "Confirmando tu pago…" });
      confirmarPago(sessionId)
        .then(({ pagado, confirmada }) =>
          setAviso(
            confirmada
              ? { tipo: "ok", texto: "¡Pago recibido! Tu reserva quedó confirmada." }
              : pagado
                ? {
                    tipo: "error",
                    texto:
                      "Recibimos tu pago, pero la reserva no se pudo confirmar sola (quizás cambió mientras pagabas). Contacta a un agente con el número de tu reserva.",
                  }
                : {
                    tipo: "info",
                    texto:
                      "Todavía no vemos el pago. Si ya pagaste, espera unos segundos y recarga la página.",
                  },
          ),
        )
        .catch((e: unknown) =>
          setAviso({ tipo: "error", texto: mensajeDeError(e) }),
        );
    }
  }, []);

  // Si la persona vuelve atrás desde Stripe, el navegador puede mostrar esta pantalla
  // tal como estaba, con el botón de pagar bloqueado: se libera.
  useEffect(() => {
    const liberar = (e: PageTransitionEvent) => {
      if (e.persisted) setPagando(null);
    };
    window.addEventListener("pageshow", liberar);
    return () => window.removeEventListener("pageshow", liberar);
  }, []);

  async function pagar(r: Reserva) {
    setAviso(null);
    setPagando(r.id);
    try {
      await pagarReserva(r.id); // si todo sale bien, la página se va a Stripe
    } catch (e) {
      setAviso({ tipo: "error", texto: mensajeDeError(e) });
      setPagando(null);
    }
  }

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
      {aviso && (
        <div
          role={aviso.tipo === "error" ? "alert" : "status"}
          className={`border text-sm rounded-xl p-4 mb-6 ${ESTILO_AVISO[aviso.tipo]}`}
        >
          {aviso.texto}
        </div>
      )}
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
                  {/* Las reservas gratuitas (total 0) no pasan por Stripe */}
                  {r.estado === "Reservada" && r.total > 0 && (
                    <div className="mt-2">
                      <Btn
                        size="sm"
                        disabled={pagando !== null}
                        onClick={() => pagar(r)}
                      >
                        {pagando === r.id ? "Redirigiendo…" : "💳 Pagar ahora"}
                      </Btn>
                    </div>
                  )}
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