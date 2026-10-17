import { Router } from "express";
import { pool } from "../db.js";
import { verificarToken, exigirRol } from "../middleware/auth.js";

const router = Router();

// Consultar es público (los formularios lo necesitan); crear, editar y eliminar es del administrador
const soloAdmin = [verificarToken, exigirRol("administrador")];

function idDeLaRuta(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) ? id : null;
}

// Nombre válido: texto no vacío de máximo 80 caracteres (o null si no lo es)
function nombreValido(valor) {
  const nombre = String(valor ?? "").trim();
  return nombre && nombre.length <= 80 ? nombre : null;
}

// Traduce los errores de la base de datos a respuestas claras:
//  23505 = el nombre ya existe · 23503 = apunta a algo que no existe (o tiene registros asociados)
function responderError(res, error, mensajes, borrando = false) {
  if (error.code === "23505")
    return res.status(409).json({ error: mensajes.duplicado });
  if (error.code === "23503") {
    return borrando
      ? res.status(409).json({ error: mensajes.enUso })
      : res.status(400).json({ error: mensajes.noExisteElPadre });
  }
  console.error(error);
  return res.status(500).json({ error: "No se pudo completar la operación" });
}

// ───────────────────────────── PAÍSES ─────────────────────────────
const MENSAJES_PAIS = {
  duplicado: "Ya existe un país con ese nombre",
  enUso: "No se puede eliminar: el país tiene departamentos asociados",
};

router.get("/paises", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, nombre FROM pais ORDER BY nombre",
    );
    res.json(rows);
  } catch (error) {
    responderError(res, error, MENSAJES_PAIS);
  }
});

router.post("/paises", ...soloAdmin, async (req, res) => {
  const nombre = nombreValido(req.body?.nombre);
  if (!nombre)
    return res
      .status(400)
      .json({ error: "El nombre es obligatorio (máximo 80 caracteres)" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO pais (nombre) VALUES ($1) RETURNING id, nombre",
      [nombre],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    responderError(res, error, MENSAJES_PAIS);
  }
});

router.put("/paises/:id", ...soloAdmin, async (req, res) => {
  const id = idDeLaRuta(req);
  const nombre = nombreValido(req.body?.nombre);
  if (id === null) return res.status(400).json({ error: "El id no es válido" });
  if (!nombre)
    return res
      .status(400)
      .json({ error: "El nombre es obligatorio (máximo 80 caracteres)" });
  try {
    const { rows } = await pool.query(
      "UPDATE pais SET nombre = $1 WHERE id = $2 RETURNING id, nombre",
      [nombre, id],
    );
    if (!rows[0]) return res.status(404).json({ error: "El país no existe" });
    res.json(rows[0]);
  } catch (error) {
    responderError(res, error, MENSAJES_PAIS);
  }
});

router.delete("/paises/:id", ...soloAdmin, async (req, res) => {
  const id = idDeLaRuta(req);
  if (id === null) return res.status(400).json({ error: "El id no es válido" });
  try {
    const { rows } = await pool.query(
      "DELETE FROM pais WHERE id = $1 RETURNING id",
      [id],
    );
    if (!rows[0]) return res.status(404).json({ error: "El país no existe" });
    res.json({ mensaje: "País eliminado" });
  } catch (error) {
    responderError(res, error, MENSAJES_PAIS, true);
  }
});

// ───────────────────────── DEPARTAMENTOS ─────────────────────────
const MENSAJES_DEPARTAMENTO = {
  duplicado: "Ya existe un departamento con ese nombre en ese país",
  noExisteElPadre: "El país indicado no existe",
  enUso: "No se puede eliminar: el departamento tiene ciudades asociadas",
};

const CONSULTA_DEPARTAMENTOS = `
  SELECT d.id, d.nombre, p.id AS "paisId", p.nombre AS pais
    FROM departamento d
    JOIN pais p ON p.id = d.pais_id`;

async function obtenerDepartamento(id) {
  const { rows } = await pool.query(
    `${CONSULTA_DEPARTAMENTOS} WHERE d.id = $1`,
    [id],
  );
  return rows[0];
}

// ?paisId=1 filtra los departamentos de un país
router.get("/departamentos", async (req, res) => {
  const paisId =
    req.query?.paisId === undefined ? null : Number(req.query.paisId);
  if (paisId !== null && !Number.isInteger(paisId))
    return res.status(400).json({ error: "El país no es válido" });
  try {
    const { rows } = await pool.query(
      `${CONSULTA_DEPARTAMENTOS} WHERE ($1::int IS NULL OR d.pais_id = $1::int) ORDER BY p.nombre, d.nombre`,
      [paisId],
    );
    res.json(rows);
  } catch (error) {
    responderError(res, error, MENSAJES_DEPARTAMENTO);
  }
});

router.post("/departamentos", ...soloAdmin, async (req, res) => {
  const nombre = nombreValido(req.body?.nombre);
  const paisId = Number(req.body?.paisId);
  if (!nombre)
    return res
      .status(400)
      .json({ error: "El nombre es obligatorio (máximo 80 caracteres)" });
  if (!Number.isInteger(paisId))
    return res.status(400).json({ error: "El país no es válido" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO departamento (nombre, pais_id) VALUES ($1, $2) RETURNING id",
      [nombre, paisId],
    );
    res.status(201).json(await obtenerDepartamento(rows[0].id));
  } catch (error) {
    responderError(res, error, MENSAJES_DEPARTAMENTO);
  }
});

router.put("/departamentos/:id", ...soloAdmin, async (req, res) => {
  const id = idDeLaRuta(req);
  const nombre = nombreValido(req.body?.nombre);
  const paisId =
    req.body?.paisId === undefined ? null : Number(req.body.paisId);
  if (id === null) return res.status(400).json({ error: "El id no es válido" });
  if (!nombre)
    return res
      .status(400)
      .json({ error: "El nombre es obligatorio (máximo 80 caracteres)" });
  if (paisId !== null && !Number.isInteger(paisId))
    return res.status(400).json({ error: "El país no es válido" });
  try {
    const { rows } = await pool.query(
      "UPDATE departamento SET nombre = $1, pais_id = COALESCE($2, pais_id) WHERE id = $3 RETURNING id",
      [nombre, paisId, id],
    );
    if (!rows[0])
      return res.status(404).json({ error: "El departamento no existe" });
    res.json(await obtenerDepartamento(id));
  } catch (error) {
    responderError(res, error, MENSAJES_DEPARTAMENTO);
  }
});

router.delete("/departamentos/:id", ...soloAdmin, async (req, res) => {
  const id = idDeLaRuta(req);
  if (id === null) return res.status(400).json({ error: "El id no es válido" });
  try {
    const { rows } = await pool.query(
      "DELETE FROM departamento WHERE id = $1 RETURNING id",
      [id],
    );
    if (!rows[0])
      return res.status(404).json({ error: "El departamento no existe" });
    res.json({ mensaje: "Departamento eliminado" });
  } catch (error) {
    responderError(res, error, MENSAJES_DEPARTAMENTO, true);
  }
});

// ───────────────────────────── CIUDADES ─────────────────────────────
const MENSAJES_CIUDAD = {
  duplicado: "Ya existe una ciudad con ese nombre en ese departamento",
  noExisteElPadre: "El departamento indicado no existe",
  enUso: "No se puede eliminar: la ciudad tiene personas o eventos asociados",
};

const CONSULTA_CIUDADES = `
  SELECT c.id, c.nombre AS ciudad, d.id AS "departamentoId", d.nombre AS departamento,
         p.id AS "paisId", p.nombre AS pais
    FROM ciudad c
    JOIN departamento d ON d.id = c.departamento_id
    JOIN pais p ON p.id = d.pais_id`;

async function obtenerCiudad(id) {
  const { rows } = await pool.query(`${CONSULTA_CIUDADES} WHERE c.id = $1`, [
    id,
  ]);
  return rows[0];
}

// Ciudades con su departamento y país (para los formularios del frontend)
router.get("/ciudades", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `${CONSULTA_CIUDADES} ORDER BY p.nombre, d.nombre, c.nombre`,
    );
    res.json(rows);
  } catch (error) {
    responderError(res, error, MENSAJES_CIUDAD);
  }
});

router.post("/ciudades", ...soloAdmin, async (req, res) => {
  const nombre = nombreValido(req.body?.nombre);
  const departamentoId = Number(req.body?.departamentoId);
  if (!nombre)
    return res
      .status(400)
      .json({ error: "El nombre es obligatorio (máximo 80 caracteres)" });
  if (!Number.isInteger(departamentoId))
    return res.status(400).json({ error: "El departamento no es válido" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO ciudad (nombre, departamento_id) VALUES ($1, $2) RETURNING id",
      [nombre, departamentoId],
    );
    res.status(201).json(await obtenerCiudad(rows[0].id));
  } catch (error) {
    responderError(res, error, MENSAJES_CIUDAD);
  }
});

router.put("/ciudades/:id", ...soloAdmin, async (req, res) => {
  const id = idDeLaRuta(req);
  const nombre = nombreValido(req.body?.nombre);
  const departamentoId =
    req.body?.departamentoId === undefined
      ? null
      : Number(req.body.departamentoId);
  if (id === null) return res.status(400).json({ error: "El id no es válido" });
  if (!nombre)
    return res
      .status(400)
      .json({ error: "El nombre es obligatorio (máximo 80 caracteres)" });
  if (departamentoId !== null && !Number.isInteger(departamentoId)) {
    return res.status(400).json({ error: "El departamento no es válido" });
  }
  try {
    const { rows } = await pool.query(
      "UPDATE ciudad SET nombre = $1, departamento_id = COALESCE($2, departamento_id) WHERE id = $3 RETURNING id",
      [nombre, departamentoId, id],
    );
    if (!rows[0]) return res.status(404).json({ error: "La ciudad no existe" });
    res.json(await obtenerCiudad(id));
  } catch (error) {
    responderError(res, error, MENSAJES_CIUDAD);
  }
});

router.delete("/ciudades/:id", ...soloAdmin, async (req, res) => {
  const id = idDeLaRuta(req);
  if (id === null) return res.status(400).json({ error: "El id no es válido" });
  try {
    const { rows } = await pool.query(
      "DELETE FROM ciudad WHERE id = $1 RETURNING id",
      [id],
    );
    if (!rows[0]) return res.status(404).json({ error: "La ciudad no existe" });
    res.json({ mensaje: "Ciudad eliminada" });
  } catch (error) {
    responderError(res, error, MENSAJES_CIUDAD, true);
  }
});

export default router;
