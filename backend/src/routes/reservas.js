import { Router } from "express";
import { pool } from "../db.js";
import { verificarToken, exigirRol } from "../middleware/auth.js";

const router = Router();

const MAX_POR_RESERVA = 10;
const ESTADOS = ["Reservada", "Confirmada", "Cancelada"];

// Error que se responde tal cual al usuario (404, 409...), distinto de un fallo inesperado
class ErrorDeNegocio extends Error {
  constructor(codigo, mensaje) {
    super(mensaje);
    this.codigo = codigo;
  }
}

// Cada reserva sale con la forma que usa el frontend
const CONSULTA_RESERVAS = `
  SELECT r.id,
         r.evento_id AS "eventoId",
         ev.nombre AS evento,
         r.cliente_id AS "clienteId",
         pc.nombre_completo AS cliente,
         to_char(r.fecha_hora, 'YYYY-MM-DD') AS "fechaReserva",
         r.num_entradas AS entradas,
         r.total::float8 AS total,
         er.nombre AS estado,
         r.observacion AS observaciones
    FROM reserva r
    JOIN evento ev ON ev.id = r.evento_id
    JOIN persona pc ON pc.identificacion = r.cliente_id
    JOIN estado_reserva er ON er.id = r.estado_reserva_id`;

async function obtenerReserva(id) {
  const { rows } = await pool.query(`${CONSULTA_RESERVAS} WHERE r.id = $1`, [
    id,
  ]);
  return rows[0];
}

// Entradas de un evento que ya están apartadas (las canceladas no cuentan)
async function entradasOcupadas(client, eventoId) {
  const { rows } = await client.query(
    `SELECT COALESCE(SUM(r.num_entradas), 0)::int AS ocupadas
       FROM reserva r
       JOIN estado_reserva er ON er.id = r.estado_reserva_id
      WHERE r.evento_id = $1 AND er.nombre <> 'Cancelada'`,
    [eventoId],
  );
  return rows[0].ocupadas;
}

function idDeLaRuta(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) ? id : null;
}

// Convierte un error en la respuesta HTTP que corresponde
function responderError(res, error, mensajeGeneral) {
  if (error instanceof ErrorDeNegocio) {
    return res.status(error.codigo).json({ error: error.message });
  }
  console.error(error);
  return res.status(500).json({ error: mensajeGeneral });
}

// POST /api/reservas — solo clientes
router.post("/", verificarToken, exigirRol("cliente"), async (req, res) => {
  const eventoId = Number(req.body?.eventoId);
  const entradas = Number(req.body?.entradas);
  const observaciones = String(req.body?.observaciones ?? "").trim();

  if (!Number.isInteger(eventoId)) {
    return res.status(400).json({ error: "El evento no es válido" });
  }
  if (
    !Number.isInteger(entradas) ||
    entradas < 1 ||
    entradas > MAX_POR_RESERVA
  ) {
    return res
      .status(400)
      .json({
        error: `Puedes reservar entre 1 y ${MAX_POR_RESERVA} entradas por compra`,
      });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // FOR UPDATE bloquea la fila del evento hasta el COMMIT: si dos personas intentan
    // reservar a la vez, la segunda espera a que la primera termine y recién ahí cuenta
    // las entradas. Así nunca se vende más de la capacidad.
    const { rows } = await client.query(
      `SELECT e.id, e.capacidad, e.precio_base::float8 AS precio, ee.nombre AS estado
         FROM evento e
         JOIN estado_evento ee ON ee.id = e.estado_evento_id
        WHERE e.id = $1
          FOR UPDATE OF e`,
      [eventoId],
    );
    const evento = rows[0];
    if (!evento) throw new ErrorDeNegocio(404, "El evento no existe");
    if (evento.estado !== "En Boletería") {
      throw new ErrorDeNegocio(
        409,
        `El evento no está disponible para reservar (estado: ${evento.estado})`,
      );
    }

    const disponibles =
      evento.capacidad - (await entradasOcupadas(client, eventoId));
    if (disponibles <= 0) {
      throw new ErrorDeNegocio(
        409,
        "El evento está agotado: ya no quedan entradas disponibles",
      );
    }
    if (entradas > disponibles) {
      throw new ErrorDeNegocio(
        409,
        `Solo quedan ${disponibles} entradas disponibles`,
      );
    }

    // El total lo calcula el servidor, nunca se acepta el que mande el navegador
    const total = Math.round(evento.precio * entradas * 100) / 100;
    const nueva = await client.query(
      `INSERT INTO reserva (num_entradas, total, observacion, cliente_id, evento_id, estado_reserva_id)
       VALUES ($1, $2, $3, $4, $5, (SELECT id FROM estado_reserva WHERE nombre = 'Reservada'))
       RETURNING id`,
      [entradas, total, observaciones, req.usuario.id, eventoId],
    );
    await client.query("COMMIT");
    res.status(201).json(await obtenerReserva(nueva.rows[0].id));
  } catch (error) {
    await client.query("ROLLBACK");
    responderError(res, error, "No se pudo crear la reserva");
  } finally {
    client.release();
  }
});

// GET /api/reservas/mias — las reservas del cliente que inició sesión
router.get("/mias", verificarToken, exigirRol("cliente"), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `${CONSULTA_RESERVAS} WHERE r.cliente_id = $1 ORDER BY r.fecha_hora DESC, r.id DESC`,
      [req.usuario.id],
    );
    res.json(rows);
  } catch (error) {
    responderError(res, error, "No se pudieron consultar tus reservas");
  }
});

// GET /api/reservas — todas las reservas, para el agente
router.get("/", verificarToken, exigirRol("agente"), async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `${CONSULTA_RESERVAS} ORDER BY r.fecha_hora DESC, r.id DESC`,
    );
    res.json(rows);
  } catch (error) {
    responderError(res, error, "No se pudieron consultar las reservas");
  }
});

// PATCH /api/reservas/:id/estado
//  - El agente puede poner cualquier estado.
//  - El cliente solo puede cancelar sus propias reservas.
//  - Reactivar una cancelada solo se puede si el evento todavía tiene cupo para ella.
router.patch(
  "/:id/estado",
  verificarToken,
  exigirRol("cliente", "agente"),
  async (req, res) => {
    const id = idDeLaRuta(req);
    const estado = req.body?.estado;
    const causa = String(req.body?.causa ?? "").trim();

    if (id === null)
      return res
        .status(400)
        .json({ error: "El id de la reserva no es válido" });
    if (!ESTADOS.includes(estado)) {
      return res
        .status(400)
        .json({ error: `El estado debe ser uno de: ${ESTADOS.join(", ")}` });
    }
    if (req.usuario.rol === "cliente" && estado !== "Cancelada") {
      return res
        .status(403)
        .json({ error: "Solo puedes cancelar tus reservas" });
    }
    if (causa && estado !== "Cancelada") {
      return res
        .status(400)
        .json({ error: "La causa solo se indica al cancelar" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Primero se bloquea el evento (igual que al crear una reserva), así todo lo que
      // cambia las entradas ocupadas se hace de una en una
      const inicial = await client.query(
        "SELECT evento_id FROM reserva WHERE id = $1",
        [id],
      );
      if (!inicial.rows[0])
        throw new ErrorDeNegocio(404, "La reserva no existe");
      const eventoId = inicial.rows[0].evento_id;
      const evento = await client.query(
        "SELECT id, capacidad FROM evento WHERE id = $1 FOR UPDATE",
        [eventoId],
      );

      const { rows } = await client.query(
        `SELECT r.id, r.num_entradas, r.cliente_id, er.nombre AS estado
         FROM reserva r
         JOIN estado_reserva er ON er.id = r.estado_reserva_id
        WHERE r.id = $1`,
        [id],
      );
      const reserva = rows[0];
      // Un cliente no puede ver ni tocar las reservas de otra persona
      if (
        !reserva ||
        (req.usuario.rol === "cliente" && reserva.cliente_id !== req.usuario.id)
      ) {
        throw new ErrorDeNegocio(404, "La reserva no existe");
      }

      if (reserva.estado !== estado) {
        if (reserva.estado === "Cancelada") {
          const disponibles =
            evento.rows[0].capacidad -
            (await entradasOcupadas(client, eventoId));
          if (reserva.num_entradas > disponibles) {
            throw new ErrorDeNegocio(
              409,
              `No se puede reactivar: la reserva es de ${reserva.num_entradas} entradas y el evento tiene ${disponibles} disponibles`,
            );
          }
        }
        // La causa de cancelación se guarda al final de las observaciones
        const nota = causa ? `Causa de cancelación: ${causa}` : "";
        await client.query(
          `UPDATE reserva
            SET estado_reserva_id = (SELECT id FROM estado_reserva WHERE nombre = $1),
                observacion = CASE WHEN $2 = '' THEN observacion
                                   WHEN COALESCE(observacion, '') = '' THEN $2
                                   ELSE observacion || ' — ' || $2 END
          WHERE id = $3`,
          [estado, nota, id],
        );
      }
      await client.query("COMMIT");
      res.json(await obtenerReserva(id));
    } catch (error) {
      await client.query("ROLLBACK");
      responderError(res, error, "No se pudo actualizar la reserva");
    } finally {
      client.release();
    }
  },
);

export default router;
