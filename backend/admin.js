const express = require("express");
const router = express.Router();
const db = require("./db");
const bcrypt = require("bcrypt");

// Crear usuario + empleado
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
          sueldo_base || 0,
          tiene_carga ? 1 : 0,
          id_caja_compensacion || null
        ],
        (err2) => {
          if (err2) {
            console.error("Error creando empleado:", err2);
            return res.status(500).json({ error: "Error al crear empleado." });
          }

          // TODO OK
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


