const express = require("express");
const router = express.Router();
const db = require("./db");

// Registrar venta
router.post("/", (req, res) => {
  const { id_empleado, monto } = req.body;

  if (!id_empleado || !monto) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  const sql = `INSERT INTO ventas (id_empleado, monto, fecha) VALUES (?, ?, CURDATE())`;

  db.query(sql, [id_empleado, monto], (err, result) => {
    if (err) {
      console.error("Error registrando venta:", err);
      return res.status(500).json({ error: "Error al registrar venta" });
    }

    res.json({ mensaje: "Venta registrada correctamente", id: result.insertId });
  });
});

// Obtener ventas (para mostrar listado simple)
router.get("/", (req, res) => {
  const sql = `
    SELECT v.id_venta, u.nombre AS vendedor, v.monto, v.fecha
    FROM ventas v
    JOIN empleados e ON v.id_empleado = e.id_empleado
    JOIN usuarios u ON e.usuario_id = u.id
    ORDER BY v.fecha DESC
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

module.exports = router;
