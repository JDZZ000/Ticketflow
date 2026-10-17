import { Router } from "express";
import { pool } from "../db.js";
import { verificarToken, exigirRol } from "../middleware/auth.js";

const router = Router();

// Cualquier persona con sesión iniciada puede ver y editar SU propio perfil
const conSesion = [
  verificarToken,
  exigirRol("cliente", "agente", "administrador"),
];

const MAX_TELEFONOS = 5;

// Arma el perfil de una persona: datos comunes + lo propio de su rol.
// Nunca incluye la contraseña.
async function obtenerPerfil(identificacion) {
  const { rows } = await pool.query(
    `SELECT p.identificacion, p.nombre_completo AS nombre, p.correo, p.direccion,
            p.ciudad_id AS "ciudadId", c.nombre AS ciudad, d.nombre AS departamento,
            pa.nombre AS pais,
            CASE WHEN a.persona_id IS NOT NULL THEN 'administrador'
                 WHEN g.persona_id IS NOT NULL THEN 'agente'
                 WHEN cl.persona_id IS NOT NULL THEN 'cliente' END AS rol,
            cl.puntos, cl.publicidad,
            g.comision::float8 AS comision, g.experiencia,
            a.salario::float8 AS salario, a.horario
       FROM persona p
       JOIN ciudad c ON c.id = p.ciudad_id
       JOIN departamento d ON d.id = c.departamento_id
       JOIN pais pa ON pa.id = d.pais_id
       LEFT JOIN administrador a ON a.persona_id = p.identificacion
       LEFT JOIN agente g ON g.persona_id = p.identificacion
       LEFT JOIN cliente cl ON cl.persona_id = p.identificacion
      WHERE p.identificacion = $1`,
    [identificacion],
  );
  const f = rows[0];
  if (!f) return null;

  const telefonos = await pool.query(
    "SELECT telefono FROM telefono_persona WHERE persona_id = $1 ORDER BY id",
    [identificacion],
  );
  const perfil = {
    identificacion: f.identificacion,
    nombre: f.nombre,
    correo: f.correo,
    direccion: f.direccion,
    ciudadId: f.ciudadId,
    ciudad: f.ciudad,
    departamento: f.departamento,
    pais: f.pais,
    telefonos: telefonos.rows.map((t) => t.telefono),
    rol: f.rol,
  };

  if (f.rol === "cliente") {
    const { rows: cuentas } = await pool.query(
      `SELECT COUNT(*)::int AS "reservasTotales",
              COUNT(CASE WHEN er.nombre = 'Confirmada' THEN 1 END)::int AS "eventosAsistidos"
         FROM reserva r
         JOIN estado_reserva er ON er.id = r.estado_reserva_id
        WHERE r.cliente_id = $1`,
      [identificacion],
    );
    Object.assign(perfil, {
      puntos: f.puntos,
      publicidad: Boolean(f.publicidad),
      ...cuentas[0],
    });
  } else if (f.rol === "agente") {
    const { rows: cuentas } = await pool.query(
      `SELECT COUNT(*)::int AS "eventosCreados" FROM evento WHERE agente_id = $1`,
      [identificacion],
    );
    Object.assign(perfil, {
      comision: f.comision,
      experiencia: f.experiencia,
      ...cuentas[0],
    });
  } else {
    Object.assign(perfil, { salario: f.salario, horario: f.horario });
  }
  return perfil;
}

// GET /api/perfil
router.get("/", ...conSesion, async (req, res) => {
  try {
    const perfil = await obtenerPerfil(req.usuario.id);
    if (!perfil)
      return res.status(404).json({ error: "La cuenta ya no existe" });
    res.json(perfil);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo consultar el perfil" });
  }
});

// PUT /api/perfil — solo cambia lo que se envíe: direccion, ciudadId y telefonos.
// La identificación, el correo y el nombre no se editan desde aquí.
router.put("/", ...conSesion, async (req, res) => {
  const { direccion, ciudadId, telefonos } = req.body ?? {};

  if (
    direccion !== undefined &&
    (typeof direccion !== "string" || direccion.trim().length > 160)
  ) {
    return res
      .status(400)
      .json({
        error: "La dirección debe ser un texto de máximo 160 caracteres",
      });
  }
  if (ciudadId !== undefined && !Number.isInteger(Number(ciudadId))) {
    return res.status(400).json({ error: "La ciudad no es válida" });
  }
  let listaTelefonos = null;
  if (telefonos !== undefined) {
    if (
      !Array.isArray(telefonos) ||
      telefonos.some((t) => typeof t !== "string")
    ) {
      return res
        .status(400)
        .json({
          error: "Los teléfonos deben enviarse como una lista de textos",
        });
    }
    // Se quitan los vacíos y los repetidos
    listaTelefonos = [
      ...new Set(telefonos.map((t) => t.trim()).filter(Boolean)),
    ];
    if (listaTelefonos.length > MAX_TELEFONOS) {
      return res
        .status(400)
        .json({ error: `Puedes guardar hasta ${MAX_TELEFONOS} teléfonos` });
    }
    if (listaTelefonos.some((t) => t.length > 25)) {
      return res
        .status(400)
        .json({ error: "Cada teléfono admite máximo 25 caracteres" });
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE persona
          SET direccion = COALESCE($1, direccion),
              ciudad_id = COALESCE($2, ciudad_id)
        WHERE identificacion = $3`,
      [
        direccion === undefined ? null : direccion.trim(),
        ciudadId === undefined ? null : Number(ciudadId),
        req.usuario.id,
      ],
    );
    if (listaTelefonos !== null) {
      // La lista nueva reemplaza a la anterior
      await client.query("DELETE FROM telefono_persona WHERE persona_id = $1", [
        req.usuario.id,
      ]);
      for (const telefono of listaTelefonos) {
        await client.query(
          "INSERT INTO telefono_persona (persona_id, telefono) VALUES ($1, $2)",
          [req.usuario.id, telefono],
        );
      }
    }
    await client.query("COMMIT");
    res.json(await obtenerPerfil(req.usuario.id));
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23503")
      return res.status(400).json({ error: "La ciudad indicada no existe" });
    console.error(error);
    res.status(500).json({ error: "No se pudo actualizar el perfil" });
  } finally {
    client.release();
  }
});

export default router;
