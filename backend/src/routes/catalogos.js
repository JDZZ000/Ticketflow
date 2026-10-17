import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Ciudades con su departamento y país (para los formularios del frontend)
router.get("/ciudades", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.nombre AS ciudad, d.nombre AS departamento, p.nombre AS pais
         FROM ciudad c
         JOIN departamento d ON d.id = c.departamento_id
         JOIN pais p ON p.id = d.pais_id
        ORDER BY p.nombre, d.nombre, c.nombre`,
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudieron consultar las ciudades" });
  }
});

export default router;
