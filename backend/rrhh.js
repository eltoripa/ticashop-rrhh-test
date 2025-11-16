const express = require("express");
const router = express.Router();
const db = require("./db");
const crypto = require("crypto");

// Función para generar firma digital (Ley 19.799)
const generarFirma = (texto) => {
  return crypto.createHash("sha256").update(texto).digest("hex");
};

//
// 🕒 Registrar asistencia (vinculada al usuario)
router.post("/asistencia", (req, res) => {
  const { usuario_id } = req.body; // recibimos el ID del usuario logueado

  db.query(
    "SELECT nombre FROM usuarios WHERE id = ?",
    [usuario_id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0)
        return res.status(404).json({ error: "Usuario no encontrado" });

      const empleado = results[0].nombre;

      db.query(
        "INSERT INTO asistencia (usuario_id, empleado, fecha) VALUES (?, ?, CURDATE())",
        [usuario_id, empleado],
        (err2, result) => {
          if (err2) return res.status(500).json(err2);
          res.json({
            mensaje: `✅ Asistencia registrada correctamente para ${empleado}`,
            id: result.insertId,
          });
        }
      );
    }
  );
});
//
// 📋 1.2️⃣ Obtener todas las asistencias (solo RRHH)
//
router.get("/asistencia", (req, res) => {
  db.query(
    `SELECT a.id, u.nombre AS empleado, u.email, u.rol, a.fecha
     FROM asistencia a
     JOIN usuarios u ON a.usuario_id = u.id
     ORDER BY a.fecha DESC`,
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

//
// 🌴 2️⃣ Solicitar vacaciones (empleado)
//
router.post("/vacaciones", (req, res) => {
  const { usuario_id, fecha_inicio, fecha_fin } = req.body;

  db.query(
    "INSERT INTO vacaciones (usuario_id, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, 'pendiente')",
    [usuario_id, fecha_inicio, fecha_fin],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ mensaje: "✅ Solicitud enviada y en revisión", id: result.insertId });
    }
  );
});

//
// 👀 2.1️⃣ Ver todas las solicitudes (solo RRHH)
//
router.get("/vacaciones", (req, res) => {
  db.query(
    `SELECT v.id, u.nombre AS empleado, v.fecha_inicio, v.fecha_fin, v.estado
     FROM vacaciones v
     JOIN usuarios u ON v.usuario_id = u.id
     ORDER BY v.fecha_inicio DESC`,
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});
//
// 🌴 2.3️⃣ Ver mis propias solicitudes (empleado)
//
router.get("/vacaciones/usuario/:id", (req, res) => {
  db.query(
    `SELECT id, fecha_inicio, fecha_fin, estado
     FROM vacaciones
     WHERE usuario_id = ?
     ORDER BY fecha_inicio DESC`,
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

//
// ✅ 2.2️⃣ Aprobar o rechazar vacaciones (acción RRHH)
//
router.put("/vacaciones/:id", (req, res) => {
  const { estado } = req.body; // 'aprobada' o 'rechazada'

  db.query(
    "UPDATE vacaciones SET estado = ? WHERE id = ?",
    [estado, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.affectedRows === 0)
        return res.status(404).json({ mensaje: "Solicitud no encontrada" });

      res.json({ mensaje: `✅ Solicitud marcada como ${estado}` });
    }
  );
});

// 🌴 Solicitar vacaciones desde el panel del empleado
router.post("/empleado/:id/vacaciones", (req, res) => {
  const usuario_id = req.params.id;
  const { fecha_inicio, fecha_fin } = req.body;

  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: "Faltan fechas de inicio o fin" });
  }

  db.query(
    "INSERT INTO vacaciones (usuario_id, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, 'pendiente')",
    [usuario_id, fecha_inicio, fecha_fin],
    (err, result) => {
      if (err) {
        console.error("❌ Error al registrar vacaciones:", err);
        return res.status(500).json(err);
      }
      res.json({
        mensaje: "✅ Solicitud de vacaciones enviada correctamente",
        id: result.insertId,
      });
    }
  );
});

// 💼 Obtener todos los empleados (para mostrar en select)
router.get("/empleados", (req, res) => {
  db.query(
    "SELECT id, nombre, email, rol FROM usuarios WHERE rol != 'admin'",
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

//
// 💵 3️⃣ Registrar liquidación con firma digital del empleador
//
router.post("/liquidaciones", (req, res) => {
  const { empleado, sueldo_base, bono = 0, horas_extra = 0 } = req.body;

  const sueldo = parseFloat(sueldo_base);
  const bonoExtra = parseFloat(bono);
  const horas = parseFloat(horas_extra);

  // --- Cálculos legales chilenos ---
  const gratificacion = sueldo * 0.25; // 25% del sueldo base
  const valorHora = sueldo / 30 / 8;
  const pagoHorasExtra = valorHora * 1.5 * horas;

  const totalBruto = sueldo + bonoExtra + gratificacion + pagoHorasExtra;

  // Descuentos legales
  const afp = totalBruto * 0.10;
  const salud = totalBruto * 0.07;
  const cesantia = totalBruto * 0.006;

  const totalDescuentos = afp + salud + cesantia;
  const totalLiquido = totalBruto - totalDescuentos;

  // --- Firma digital del empleador (automática al generar) ---
  const firmaEmpleador = generarFirma(`${empleado}-${Date.now()}-TICASHOP-EMPRESA`);

  db.query(
    `INSERT INTO liquidaciones 
      (empleado, sueldo_base, bono, horas_extra, gratificacion, afp, salud, cesantia,
       total_bruto, total_descuentos, total_liquido, fecha, firma_empleador)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?)`,
    [
      empleado,
      sueldo,
      bonoExtra,
      horas,
      gratificacion,
      afp,
      salud,
      cesantia,
      totalBruto,
      totalDescuentos,
      totalLiquido,
      firmaEmpleador,
    ],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({
        mensaje: "✅ Liquidación generada con firma del empleador",
        id: result.insertId,
        empleado,
        totalLiquido,
        firmaEmpleador,
      });
    }
  );
});

//
// ✍️ 4️⃣ Firma digital del empleado (acción manual)
//
router.put("/firmar/:id", (req, res) => {
  const { empleadoEmail } = req.body;

  const firmaEmpleado = generarFirma(`${empleadoEmail}-${Date.now()}-FIRMA-TRABAJADOR`);

  db.query(
    "UPDATE liquidaciones SET firma_empleado = ?, fecha_firma = NOW() WHERE id = ?",
    [firmaEmpleado, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.affectedRows === 0)
        return res.status(404).json({ mensaje: "Liquidación no encontrada" });

      res.json({
        mensaje: "✅ Liquidación firmada digitalmente por el empleado",
        firmaEmpleado,
        fecha: new Date(),
      });
    }
  );
});
//
// 📋 Obtener liquidaciones de un empleado
//
router.get("/empleado/:id/liquidaciones", (req, res) => {
  db.query(
    "SELECT * FROM liquidaciones WHERE usuario_id = ? ORDER BY fecha DESC",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

//
// 🌴 Obtener solicitudes de vacaciones del empleado
//
router.get("/empleado/:id/vacaciones", (req, res) => {
  db.query(
    "SELECT * FROM vacaciones WHERE usuario_id = ? ORDER BY fecha_inicio DESC",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

//
// 🌴 Enviar nueva solicitud de vacaciones (desde empleado)
//
router.post("/empleado/:id/vacaciones", (req, res) => {
  const { fecha_inicio, fecha_fin } = req.body;
  db.query(
    "INSERT INTO vacaciones (usuario_id, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, 'Pendiente')",
    [req.params.id, fecha_inicio, fecha_fin],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ mensaje: "Solicitud de vacaciones enviada", id: result.insertId });
    }
  );
});



// 📋 Obtener todas las liquidaciones (solo RRHH o para ver histórico)
router.get("/liquidaciones", (req, res) => {
  db.query(
    `SELECT id, empleado, sueldo_base, total_liquido, fecha, firma_empleador, firma_empleado
     FROM liquidaciones
     ORDER BY fecha DESC`,
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

// 📋 Obtener las vacaciones de un empleado específico
router.get("/empleado/:id/vacaciones", (req, res) => {
  const usuarioId = req.params.id;
  db.query(
    `SELECT v.id, u.nombre AS empleado, v.fecha_inicio, v.fecha_fin, v.estado
     FROM vacaciones v
     JOIN usuarios u ON v.usuario_id = u.id
     WHERE v.usuario_id = ?`,
    [usuarioId],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});



// ===============================================
// GENERAR LIQUIDACIONES AUTOMÁTICAS DESDE VENTAS
// ===============================================

router.post("/generar-liquidaciones", (req, res) => {

  const sql = `
    INSERT INTO liquidaciones (
        id_empleado, 
        empleado, 
        sueldo_base, 
        total_ventas, 
        comision, 
        total_bruto, 
        total_liquido, 
        tipo_liquidacion, 
        fecha
    )
    SELECT 
        e.id_empleado,
        u.nombre AS empleado,
        e.sueldo_base,
        SUM(v.monto) AS total_ventas,
        CASE 
            WHEN SUM(v.monto) <= (
                SELECT rango_max FROM reglas_comision WHERE id_regla = 1
            ) THEN SUM(v.monto) * (
                SELECT porcentaje / 100 FROM reglas_comision WHERE id_regla = 1
            )
            ELSE SUM(v.monto) * (
                SELECT porcentaje / 100 FROM reglas_comision WHERE id_regla = 2
            )
        END AS comision,
        e.sueldo_base +
            CASE 
                WHEN SUM(v.monto) <= (
                    SELECT rango_max FROM reglas_comision WHERE id_regla = 1
                ) THEN SUM(v.monto) * (
                    SELECT porcentaje / 100 FROM reglas_comision WHERE id_regla = 1
                )
                ELSE SUM(v.monto) * (
                    SELECT porcentaje / 100 FROM reglas_comision WHERE id_regla = 2
                )
            END AS total_bruto,
        e.sueldo_base +
            CASE 
                WHEN SUM(v.monto) <= (
                    SELECT rango_max FROM reglas_comision WHERE id_regla = 1
                ) THEN SUM(v.monto) * (
                    SELECT porcentaje / 100 FROM reglas_comision WHERE id_regla = 1
                )
                ELSE SUM(v.monto) * (
                    SELECT porcentaje / 100 FROM reglas_comision WHERE id_regla = 2
                )
            END AS total_liquido,
        'vendedor',
        CURDATE()
    FROM empleados e
    JOIN usuarios u ON u.id = e.usuario_id
    JOIN ventas v ON e.id_empleado = v.id_empleado
    WHERE e.tipo_vendedor IS NOT NULL
    GROUP BY e.id_empleado;
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error generando liquidaciones:", err);
      return res.status(500).json({ error: "Ocurrió un error al generar las liquidaciones." });
    }

    return res.status(200).json({
      message: "Liquidaciones generadas correctamente desde ventas."
    });
  });
});


// ===========================================
// OBTENER TODAS LAS LIQUIDACIONES
// ===========================================

router.get("/liquidaciones", (req, res) => {

  const sql = `
    SELECT 
      id, 
      empleado, 
      tipo_liquidacion, 
      sueldo_base, 
      total_ventas, 
      comision, 
      total_liquido, 
      fecha
    FROM liquidaciones
    ORDER BY fecha DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error obteniendo liquidaciones:", err);
      return res.status(500).json(err);
    }

    res.json(results);
  });
});



module.exports = router;
