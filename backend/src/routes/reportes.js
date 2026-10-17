import { Router } from "express";
import { pool } from "../db.js";
import { verificarToken, exigirRol } from "../middleware/auth.js";

const router = Router();

// Todos los reportes son solo para el administrador
const soloAdmin = [verificarToken, exigirRol("administrador")];

// Reglas de los reportes (acordadas):
//  - Los ingresos cuentan solo las reservas CONFIRMADAS.
//  - Los meses se agrupan por la FECHA DE LA RESERVA.
//  - Los conteos de reservas incluyen todas, sin importar su estado.
const MESES = Array.from({ length: 12 }, (_, i) => i + 1);

// ?anio=2026 (por defecto 2026, como pide el enunciado)
function anioDeLaConsulta(req) {
  const anio = req.query?.anio === undefined ? 2026 : Number(req.query.anio);
  return Number.isInteger(anio) && anio >= 2000 && anio <= 2100 ? anio : null;
}

// El año como rango de fechas: del 1 de enero al 1 de enero del siguiente
const rangoDelAnio = (anio) => [`${anio}-01-01`, `${anio + 1}-01-01`];

const redondear = (n) => Math.round(n * 100) / 100;

function responderError(res, error) {
  console.error(error);
  res.status(500).json({ error: "No se pudo generar el reporte" });
}

// ── Reporte general: cuántos registros hay de cada cosa ──
router.get("/resumen", ...soloAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT (SELECT COUNT(*) FROM cliente)::int AS clientes,
              (SELECT COUNT(*) FROM agente)::int AS agentes,
              (SELECT COUNT(*) FROM administrador)::int AS administradores,
              (SELECT COUNT(*) FROM reserva)::int AS reservas,
              (SELECT COUNT(*) FROM evento)::int AS eventos`,
    );
    res.json(rows[0]);
  } catch (error) {
    responderError(res, error);
  }
});

// ── Ingresos totales y reservas de cada mes del año ──
router.get("/ingresos-por-mes", ...soloAdmin, async (req, res) => {
  const anio = anioDeLaConsulta(req);
  if (anio === null)
    return res.status(400).json({ error: "El año no es válido" });
  try {
    const { rows } = await pool.query(
      `SELECT EXTRACT(MONTH FROM r.fecha_hora)::int AS mes,
              COALESCE(SUM(CASE WHEN er.nombre = 'Confirmada' THEN r.total END), 0)::float8 AS ingresos,
              COUNT(*)::int AS reservas
         FROM reserva r
         JOIN estado_reserva er ON er.id = r.estado_reserva_id
        WHERE r.fecha_hora >= $1 AND r.fecha_hora < $2
        GROUP BY mes`,
      rangoDelAnio(anio),
    );
    // Los meses sin reservas no salen de la consulta: se completan en cero
    const porMes = new Map(rows.map((f) => [f.mes, f]));
    res.json(
      MESES.map((mes) => ({
        mes,
        ingresos: porMes.get(mes)?.ingresos ?? 0,
        reservas: porMes.get(mes)?.reservas ?? 0,
      })),
    );
  } catch (error) {
    responderError(res, error);
  }
});

// ── Reservas de cada evento: total del año y desglose por mes ──
router.get("/reservas-por-evento", ...soloAdmin, async (req, res) => {
  const anio = anioDeLaConsulta(req);
  if (anio === null)
    return res.status(400).json({ error: "El año no es válido" });
  try {
    const { rows } = await pool.query(
      `SELECT e.id AS "eventoId", e.nombre AS evento,
              EXTRACT(MONTH FROM r.fecha_hora)::int AS mes,
              COUNT(r.id)::int AS reservas
         FROM evento e
         LEFT JOIN reserva r ON r.evento_id = e.id
                            AND r.fecha_hora >= $1 AND r.fecha_hora < $2
        GROUP BY e.id, e.nombre, mes
        ORDER BY e.id`,
      rangoDelAnio(anio),
    );
    const eventos = new Map();
    for (const f of rows) {
      if (!eventos.has(f.eventoId)) {
        eventos.set(f.eventoId, {
          eventoId: f.eventoId,
          evento: f.evento,
          total: 0,
          meses: MESES.map(() => 0),
        });
      }
      if (f.mes !== null) {
        const e = eventos.get(f.eventoId);
        e.meses[f.mes - 1] = f.reservas;
        e.total += f.reservas;
      }
    }
    res.json([...eventos.values()]);
  } catch (error) {
    responderError(res, error);
  }
});

// ── Eventos creados por cada agente, y por agente y ciudad ──
router.get("/eventos-por-agente", ...soloAdmin, async (_req, res) => {
  try {
    const porAgente = await pool.query(
      `SELECT pa.nombre_completo AS agente, COUNT(e.id)::int AS eventos
         FROM agente a
         JOIN persona pa ON pa.identificacion = a.persona_id
         LEFT JOIN evento e ON e.agente_id = a.persona_id
        GROUP BY pa.identificacion, pa.nombre_completo
        ORDER BY pa.nombre_completo`,
    );
    const porAgenteYCiudad = await pool.query(
      `SELECT pa.nombre_completo AS agente, c.nombre AS ciudad, COUNT(e.id)::int AS eventos
         FROM evento e
         JOIN persona pa ON pa.identificacion = e.agente_id
         JOIN ciudad c ON c.id = e.ciudad_id
        GROUP BY pa.nombre_completo, c.nombre
        ORDER BY pa.nombre_completo, c.nombre`,
    );
    res.json({
      porAgente: porAgente.rows,
      porAgenteYCiudad: porAgenteYCiudad.rows,
    });
  } catch (error) {
    responderError(res, error);
  }
});

// ── Promedio de ingresos por agente ──
// Se entregan las dos lecturas del enunciado: por reserva confirmada y por evento creado.
router.get("/ingresos-promedio-agente", ...soloAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT pa.identificacion AS id, pa.nombre_completo AS agente,
              COUNT(DISTINCT e.id)::int AS eventos,
              COUNT(CASE WHEN er.nombre = 'Confirmada' THEN 1 END)::int AS "reservasConfirmadas",
              COALESCE(SUM(CASE WHEN er.nombre = 'Confirmada' THEN r.total END), 0)::float8 AS "ingresosTotales",
              COALESCE(AVG(CASE WHEN er.nombre = 'Confirmada' THEN r.total END), 0)::float8 AS "promedioPorReserva"
         FROM agente a
         JOIN persona pa ON pa.identificacion = a.persona_id
         LEFT JOIN evento e ON e.agente_id = a.persona_id
         LEFT JOIN reserva r ON r.evento_id = e.id
         LEFT JOIN estado_reserva er ON er.id = r.estado_reserva_id
        GROUP BY pa.identificacion, pa.nombre_completo
        ORDER BY pa.nombre_completo`,
    );
    res.json(
      rows.map((f) => ({
        ...f,
        promedioPorReserva: redondear(f.promedioPorReserva),
        promedioPorEvento: f.eventos
          ? redondear(f.ingresosTotales / f.eventos)
          : 0,
      })),
    );
  } catch (error) {
    responderError(res, error);
  }
});

// ── Promedio de ingresos por cliente (por reserva confirmada) ──
router.get("/ingresos-promedio-cliente", ...soloAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT pc.identificacion AS id, pc.nombre_completo AS cliente,
              COUNT(CASE WHEN er.nombre = 'Confirmada' THEN 1 END)::int AS "reservasConfirmadas",
              COALESCE(SUM(CASE WHEN er.nombre = 'Confirmada' THEN r.total END), 0)::float8 AS "ingresosTotales",
              COALESCE(AVG(CASE WHEN er.nombre = 'Confirmada' THEN r.total END), 0)::float8 AS "promedioPorReserva"
         FROM cliente c
         JOIN persona pc ON pc.identificacion = c.persona_id
         LEFT JOIN reserva r ON r.cliente_id = c.persona_id
         LEFT JOIN estado_reserva er ON er.id = r.estado_reserva_id
        GROUP BY pc.identificacion, pc.nombre_completo
        ORDER BY pc.nombre_completo`,
    );
    res.json(
      rows.map((f) => ({
        ...f,
        promedioPorReserva: redondear(f.promedioPorReserva),
      })),
    );
  } catch (error) {
    responderError(res, error);
  }
});

// ── Cobertura: eventos por país, departamento y ciudad, más el listado ──
router.get("/cobertura", ...soloAdmin, async (_req, res) => {
  const agrupar = (columna) =>
    pool.query(
      `SELECT ${columna} AS nombre, COUNT(e.id)::int AS eventos
         FROM evento e
         JOIN ciudad c ON c.id = e.ciudad_id
         JOIN departamento d ON d.id = c.departamento_id
         JOIN pais p ON p.id = d.pais_id
        GROUP BY ${columna}
        ORDER BY eventos DESC, ${columna}`,
    );
  try {
    const [paises, departamentos, ciudades, listado] = await Promise.all([
      agrupar("p.nombre"),
      agrupar("d.nombre"),
      agrupar("c.nombre"),
      pool.query(
        `SELECT e.id, e.codigo, e.nombre, p.nombre AS pais, d.nombre AS departamento,
                c.nombre AS ciudad, ee.nombre AS estado
           FROM evento e
           JOIN ciudad c ON c.id = e.ciudad_id
           JOIN departamento d ON d.id = c.departamento_id
           JOIN pais p ON p.id = d.pais_id
           JOIN estado_evento ee ON ee.id = e.estado_evento_id
          ORDER BY p.nombre, d.nombre, c.nombre, e.nombre`,
      ),
    ]);
    res.json({
      paises: paises.rows,
      departamentos: departamentos.rows,
      ciudades: ciudades.rows,
      listado: listado.rows,
    });
  } catch (error) {
    responderError(res, error);
  }
});

// ── Historial de reservas, ordenado por cliente ──
router.get("/historial-clientes", ...soloAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.id, pc.nombre_completo AS cliente, ev.nombre AS evento,
              to_char(r.fecha_hora, 'YYYY-MM-DD') AS "fechaReserva",
              r.num_entradas AS entradas, r.total::float8 AS total,
              er.nombre AS estado, r.observacion AS observaciones
         FROM reserva r
         JOIN persona pc ON pc.identificacion = r.cliente_id
         JOIN evento ev ON ev.id = r.evento_id
         JOIN estado_reserva er ON er.id = r.estado_reserva_id
        ORDER BY pc.nombre_completo, r.fecha_hora DESC, r.id DESC`,
    );
    res.json(rows);
  } catch (error) {
    responderError(res, error);
  }
});

// ── Reservas y eventos cancelados, con su causa ──
// La causa se guarda en las observaciones.
router.get("/cancelaciones", ...soloAdmin, async (_req, res) => {
  try {
    const reservas = await pool.query(
      `SELECT r.id, pc.nombre_completo AS cliente, ev.nombre AS evento,
              to_char(r.fecha_hora, 'YYYY-MM-DD') AS "fechaReserva",
              r.num_entradas AS entradas, r.total::float8 AS total,
              r.observacion AS causa
         FROM reserva r
         JOIN persona pc ON pc.identificacion = r.cliente_id
         JOIN evento ev ON ev.id = r.evento_id
         JOIN estado_reserva er ON er.id = r.estado_reserva_id
        WHERE er.nombre = 'Cancelada'
        ORDER BY r.fecha_hora DESC, r.id DESC`,
    );
    const eventos = await pool.query(
      `SELECT e.id, e.codigo, e.nombre,
              to_char(e.fecha_hora_inicio, 'YYYY-MM-DD') AS fecha,
              c.nombre AS ciudad, pa.nombre_completo AS agente,
              e.observacion AS causa
         FROM evento e
         JOIN ciudad c ON c.id = e.ciudad_id
         JOIN persona pa ON pa.identificacion = e.agente_id
         JOIN estado_evento ee ON ee.id = e.estado_evento_id
        WHERE ee.nombre = 'Cancelado'
        ORDER BY e.fecha_hora_inicio, e.id`,
    );
    res.json({ reservas: reservas.rows, eventos: eventos.rows });
  } catch (error) {
    responderError(res, error);
  }
});

export default router;
