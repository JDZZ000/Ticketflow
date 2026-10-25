import { Router } from "express";
import Stripe from "stripe";
import { pool } from "../db.js";
import { verificarToken, exigirRol } from "../middleware/auth.js";

const router = Router();

// Los precios de TicketFlow están en pesos colombianos. Stripe recibe el monto en la
// unidad menor de la moneda (centavos), por eso más abajo se multiplica por 100.
const MONEDA = "cop";
// Cuánto tiempo queda abierta la página de pago. Stripe exige entre 30 minutos y 24 horas.
const MINUTOS_PARA_PAGAR = 35;

// Error que se responde tal cual al usuario (404, 409...), distinto de un fallo inesperado
class ErrorDeNegocio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}

function responderError(res, error, mensajeGeneral) {
  if (error instanceof ErrorDeNegocio) {
    return res.status(error.codigo).json({ error: error.message });
  }
  console.error(error);
  return res.status(500).json({ error: mensajeGeneral });
}

// El cliente de Stripe se crea la primera vez que se necesita. Así, quien todavía no
// tiene las claves en su .env puede correr el resto de la API sin que se caiga.
let clienteStripe = null;
function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new ErrorDeNegocio(
      503,
      "Los pagos no están configurados en el servidor",
    );
  }
  clienteStripe ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return clienteStripe;
}

// Pasa la reserva de «Reservada» a «Confirmada» cuando Stripe dice que el pago se hizo.
// La usan el webhook y /confirmar, así que puede correr dos veces para el mismo pago:
// la segunda vez no cambia nada. Devuelve true si la reserva quedó confirmada por este pago.
async function confirmarReservaPagada(sesion) {
  const reservaId = Number(sesion.metadata?.reserva_id);
  if (sesion.payment_status !== "paid" || !Number.isInteger(reservaId)) {
    return false;
  }

  // Además del estado, se exige que lo cobrado sea el total actual de la reserva: si el
  // cliente la editó mientras pagaba, el monto ya no coincide y no se confirma sola.
  const { rows } = await pool.query(
    `UPDATE reserva
        SET estado_reserva_id = (SELECT id FROM estado_reserva WHERE nombre = 'Confirmada'),
            stripe_session_id = $2,
            fecha_pago = NOW()
      WHERE id = $1
        AND estado_reserva_id = (SELECT id FROM estado_reserva WHERE nombre = 'Reservada')
        AND ROUND(total * 100) = $3
    RETURNING id`,
    [reservaId, sesion.id, sesion.amount_total],
  );
  if (rows[0]) return true;

  // No se pudo confirmar: o ya estaba confirmada con este mismo pago (no pasa nada), o
  // hay algo que revisar a mano
  const { rows: actual } = await pool.query(
    `SELECT er.nombre AS estado,
            r.stripe_session_id AS sesion,
            ROUND(r.total * 100)::float8 AS centavos
       FROM reserva r
       JOIN estado_reserva er ON er.id = r.estado_reserva_id
      WHERE r.id = $1`,
    [reservaId],
  );
  const reserva = actual[0];
  if (reserva?.estado === "Confirmada" && reserva.sesion === sesion.id) {
    return true;
  }
  console.warn(
    `PAGO SIN CONFIRMAR: Stripe cobró ${sesion.amount_total} centavos (sesión ${sesion.id}) ` +
      `por la reserva ${reservaId}, pero ${
        reserva
          ? `está "${reserva.estado}" y vale ${reserva.centavos} centavos`
          : "ya no existe"
      }. Hay que revisarla y, si corresponde, reembolsar desde el Dashboard de Stripe.`,
  );
  return false;
}

// POST /api/pagos/checkout — solo clientes
// Body: { reservaId }. Devuelve { url }: la página de pago de Stripe a la que hay que ir.
router.post(
  "/checkout",
  verificarToken,
  exigirRol("cliente"),
  async (req, res) => {
    const reservaId = Number(req.body?.reservaId);
    if (!Number.isInteger(reservaId)) {
      return res.status(400).json({ error: "La reserva no es válida" });
    }

    try {
      // El monto sale de la base de datos, nunca del navegador. Y solo se puede pagar
      // una reserva propia: la de otra persona responde como si no existiera.
      const { rows } = await pool.query(
        `SELECT r.id,
                r.num_entradas,
                r.total::float8 AS total,
                er.nombre AS estado,
                ev.nombre AS evento,
                ee.nombre AS "estadoEvento"
           FROM reserva r
           JOIN estado_reserva er ON er.id = r.estado_reserva_id
           JOIN evento ev ON ev.id = r.evento_id
           JOIN estado_evento ee ON ee.id = ev.estado_evento_id
          WHERE r.id = $1 AND r.cliente_id = $2`,
        [reservaId, req.usuario.id],
      );
      const reserva = rows[0];
      if (!reserva) throw new ErrorDeNegocio(404, "La reserva no existe");
      if (reserva.estado === "Confirmada") {
        throw new ErrorDeNegocio(409, "Esta reserva ya está confirmada");
      }
      if (reserva.estado === "Cancelada") {
        throw new ErrorDeNegocio(
          409,
          "No se puede pagar una reserva cancelada",
        );
      }
      if (["Cancelado", "Finalizado"].includes(reserva.estadoEvento)) {
        throw new ErrorDeNegocio(
          409,
          `No se puede pagar: el evento está ${reserva.estadoEvento.toLowerCase()}`,
        );
      }
      if (!(reserva.total > 0)) {
        // Stripe no cobra montos en cero (por ejemplo, un evento gratuito)
        throw new ErrorDeNegocio(
          400,
          "Esta reserva no tiene costo, así que no necesita pago",
        );
      }

      const urlBase = process.env.FRONTEND_URL || "http://localhost:8443";
      const sesion = await stripe().checkout.sessions.create({
        mode: "payment",
        locale: "es-419",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: MONEDA,
              unit_amount: Math.round(reserva.total * 100),
              product_data: {
                name: `${reserva.evento} (${reserva.num_entradas} ${
                  reserva.num_entradas === 1 ? "entrada" : "entradas"
                })`,
              },
            },
          },
        ],
        client_reference_id: String(reserva.id),
        metadata: { reserva_id: String(reserva.id) },
        expires_at: Math.floor(Date.now() / 1000) + MINUTOS_PARA_PAGAR * 60,
        // Stripe reemplaza {CHECKOUT_SESSION_ID} por el id real al volver a la página
        success_url: `${urlBase}/cliente/reservas?pago=exito&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${urlBase}/cliente/reservas?pago=cancelado`,
      });

      await pool.query(
        "UPDATE reserva SET stripe_session_id = $1 WHERE id = $2",
        [sesion.id, reserva.id],
      );
      res.json({ url: sesion.url });
    } catch (error) {
      responderError(res, error, "No se pudo iniciar el pago");
    }
  },
);

// POST /api/pagos/confirmar — solo clientes
// Body: { sessionId }. Al volver de Stripe, la página llama aquí: el servidor le pregunta
// a Stripe si ese pago se hizo de verdad y, si es así, confirma la reserva. Así la reserva
// queda confirmada al instante, sin esperar al webhook (que hace lo mismo).
router.post(
  "/confirmar",
  verificarToken,
  exigirRol("cliente"),
  async (req, res) => {
    const sessionId = String(req.body?.sessionId ?? "");
    if (!/^cs_(test|live)_\w+$/.test(sessionId)) {
      return res.status(400).json({ error: "La sesión de pago no es válida" });
    }

    try {
      let sesion;
      try {
        sesion = await stripe().checkout.sessions.retrieve(sessionId);
      } catch (error) {
        if (error?.statusCode === 404) {
          throw new ErrorDeNegocio(404, "No se encontró ese pago");
        }
        throw error;
      }

      // Solo se puede confirmar el pago de una reserva propia
      const reservaId = Number(sesion.metadata?.reserva_id);
      const propia = Number.isInteger(reservaId)
        ? await pool.query(
            "SELECT 1 FROM reserva WHERE id = $1 AND cliente_id = $2",
            [reservaId, req.usuario.id],
          )
        : { rows: [] };
      if (!propia.rows[0]) throw new ErrorDeNegocio(404, "No se encontró ese pago");

      const confirmada = await confirmarReservaPagada(sesion);
      res.json({ pagado: sesion.payment_status === "paid", confirmada });
    } catch (error) {
      responderError(res, error, "No se pudo confirmar el pago");
    }
  },
);

// Webhook de Stripe: el aviso que Stripe manda por su cuenta cuando se paga, aunque la
// persona cierre la pestaña. Se registra en index.js ANTES de express.json(), porque la
// firma solo se puede comprobar con el cuerpo sin procesar (req.body es un Buffer).
export async function webhookStripe(req, res) {
  let evento;
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("falta STRIPE_WEBHOOK_SECRET en backend/.env");
    }
    evento = stripe().webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    return res.status(400).send(`Webhook no válido: ${error.message}`);
  }

  if (
    evento.type === "checkout.session.completed" ||
    evento.type === "checkout.session.async_payment_succeeded"
  ) {
    try {
      await confirmarReservaPagada(evento.data.object);
    } catch (error) {
      console.error(error);
      // Un 500 hace que Stripe vuelva a mandar el aviso más tarde
      return res.status(500).send("No se pudo confirmar la reserva");
    }
  }
  res.json({ received: true });
}

export default router;