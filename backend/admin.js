const express = require("express");
const router = express.Router();
const db = require("./db");
const bcrypt = require("bcrypt");

router.post("/crear-empleado", (req, res) => {
  const {
    nombre,
    email,
    contraseña,
    rol,
    cargo,
    sueldo_base,
    tipo_contrato,
    tipo_vendedor,
    zona,
    tiene_carga,
    id_caja_compensacion
  } = req.body;

  if (!nombre || !email || !contraseña || !rol) {
    return res.status(400).json({ error: "Faltan datos obligatorios." });
  }

  // ======================================
  // VALIDACIÓN REAL DE SUELDO BASE
  // ======================================
  const sueldoNum = Number(sueldo_base);

  if (isNaN(sueldoNum)) {
    return res.status(400).json({ error: "El sueldo base debe ser un número válido." });
  }

  if (sueldoNum <= 0) {
    return res.status(400).json({
      error: "El sueldo base debe ser mayor a 0. No se permiten sueldos negativos."
    });
  }

  // 1. ENCRIPTAR CONTRASEÑA
  bcrypt.hash(contraseña, 10, (errHash, hash) => {
    if (errHash) {
      console.error("Error al encriptar contraseña:", errHash);
      return res.status(500).json({ error: "Error al procesar contraseña." });
    }

    // 2. INSERTAR USUARIO
    const sqlUsuario = `
      INSERT INTO usuarios (nombre, email, password, rol)
      VALUES (?, ?, ?, ?)
    `;

    db.query(sqlUsuario, [nombre, email, hash, rol], (err, resultUsuario) => {
      if (err) {
        console.error("Error creando usuario:", err);
        return res.status(500).json({ error: "Error al crear usuario." });
      }

      const usuario_id = resultUsuario.insertId;

      // 3. INSERTAR FICHA DEL EMPLEADO
      const sqlEmpleado = `
        INSERT INTO empleados (
          usuario_id, cargo, tipo_contrato, tipo_vendedor,
          zona, sueldo_base, tiene_carga, id_caja_compensacion
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sqlEmpleado,
        [
          usuario_id,
          cargo || null,
          tipo_contrato || null,
          tipo_vendedor || null,
          zona || null,
          sueldoNum,                 // ← VALIDADO Y SEGURO
          tiene_carga ? 1 : 0,
          id_caja_compensacion || null
        ],
        (err2) => {
          if (err2) {
            console.error("Error creando empleado:", err2);
            return res.status(500).json({ error: "Error al crear empleado." });
          }

          res.json({
            mensaje: "Empleado creado correctamente",
            usuario_id
          });
        }
      );
    });
  });
});


module.exports = router;


