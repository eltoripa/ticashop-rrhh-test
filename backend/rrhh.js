const express = require("express");
const router = express.Router();
const db = require("./db");
const crypto = require("crypto");
const axios = require("axios");


// ===============================
// Utilidad: firma digital
// ===============================
const generarFirma = (texto) => {
  return crypto.createHash("sha256").update(texto).digest("hex");
};

// ======================================================
// 1) ASISTENCIA (empleado marca asistencia)
// ======================================================

// Helper para registrar asistencia
function registrarAsistencia(usuario_id, res) {
  if (!usuario_id) {
    return res.status(400).json({ error: "Falta usuario_id" });
  }

  db.query(
    "SELECT nombre FROM usuarios WHERE id = ?",
    [usuario_id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const empleado = results[0].nombre;

      db.query(
        "INSERT INTO asistencia (usuario_id, empleado, fecha, hora) VALUES (?, ?, CURDATE(), CURTIME())",
        [usuario_id, empleado],
        (err2, result) => {
          if (err2) return res.status(500).json(err2);

          res.json({
            mensaje: "Asistencia registrada correctamente",
            empleado,
            id: result.insertId,
          });
        }
      );
    }
  );
}

// POST /rrhh/asistencia/marcar
router.post("/asistencia/marcar", (req, res) => {
  const { usuario_id } = req.body;
  registrarAsistencia(usuario_id, res);
});

// Alias compatible: POST /rrhh/asistencia
router.post("/asistencia", (req, res) => {
  const { usuario_id } = req.body;
  registrarAsistencia(usuario_id, res);
});

// GET /rrhh/asistencia  → listado para RRHH
router.get("/asistencia", (req, res) => {
  const sql = `
    SELECT 
      a.id,
      u.nombre AS empleado,
      u.email,
      a.fecha,
      a.hora
    FROM asistencia a
    JOIN usuarios u ON a.usuario_id = u.id
    ORDER BY a.fecha DESC, a.hora DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// ======================================================
// 2) REGISTRO ASISTENCIA RRHH (horas extra + feriado NR)
// ======================================================

// POST /rrhh/registro-asistencia
// OJO: aquí el frontend envía id_empleado = usuario_id.
// Buscamos el id_empleado real en la tabla empleados.
router.post("/registro-asistencia", (req, res) => {
  const { id_empleado, fecha, horas_extras, feriado_no_renunciable } = req.body;

  if (!id_empleado || !fecha) {
    return res.status(400).json({ error: "Faltan datos obligatorios." });
  }

  // Interpretamos id_empleado como usuario_id para no romper el front
  db.query(
    "SELECT id_empleado FROM empleados WHERE usuario_id = ?",
    [id_empleado],
    (err, rows) => {
      if (err) return res.status(500).json(err);
      if (rows.length === 0) {
        return res
          .status(404)
          .json({ error: "No existe ficha de empleado para ese usuario." });
      }

      const idEmpleadoReal = rows[0].id_empleado;

      const sql = `
        INSERT INTO registro_asistencia (id_empleado, fecha, horas_extras, feriado_no_renunciable)
        VALUES (?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          idEmpleadoReal,
          fecha,
          horas_extras || 0,
          feriado_no_renunciable ? 1 : 0,
        ],
        (err2) => {
          if (err2) {
            console.error("Error registrando horas extras:", err2);
            return res
              .status(500)
              .json({ error: "Error al registrar información." });
          }

          res.json({ mensaje: "Registro ingresado correctamente." });
        }
      );
    }
  );
});

// GET /rrhh/registro-asistencia  → listado para RRHH
router.get("/registro-asistencia", (req, res) => {
  const sql = `
    SELECT 
      r.id_registro,
      e.id_empleado,
      u.nombre AS empleado,
      r.fecha,
      r.horas_extras,
      r.feriado_no_renunciable
    FROM registro_asistencia r
    JOIN empleados e ON r.id_empleado = e.id_empleado
    JOIN usuarios u ON e.usuario_id = u.id
    ORDER BY r.fecha DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error obteniendo registros:", err);
      return res.status(500).json(err);
    }

    res.json(results);
  });
});

// ======================================================
// 3) VACACIONES
// ======================================================

// POST /rrhh/vacaciones  → empleado solicita vacaciones
router.post("/vacaciones", (req, res) => {
  const { usuario_id, fecha_inicio, fecha_fin } = req.body;

  if (!usuario_id || !fecha_inicio || !fecha_fin) {
    return res
      .status(400)
      .json({ error: "Faltan usuario_id, fecha_inicio o fecha_fin" });
  }

  db.query(
    "INSERT INTO vacaciones (usuario_id, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, 'pendiente')",
    [usuario_id, fecha_inicio, fecha_fin],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({
        mensaje: "Solicitud de vacaciones enviada y en revisión",
        id: result.insertId,
      });
    }
  );
});

// Alias: POST /rrhh/empleado/:id/vacaciones
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
        console.error("Error al registrar vacaciones:", err);
        return res.status(500).json(err);
      }
      res.json({
        mensaje: "Solicitud de vacaciones enviada correctamente",
        id: result.insertId,
      });
    }
  );
});

router.post("/empleado/:id/solicitar-liquidacion", (req, res) => {
  const { mes, anio } = req.body;

  const sql = `
    INSERT INTO solicitudes_liquidaciones (usuario_id, mes, anio)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [req.params.id, mes, anio], (err) => {
    if (err) return res.status(500).json({ error: "Error al solicitar liquidación." });
    res.json({ mensaje: "Solicitud enviada correctamente." });
  });
});


// GET /rrhh/vacaciones  → todas las solicitudes (RRHH)
router.get("/vacaciones", (req, res) => {
  const sql = `
    SELECT v.id, u.nombre AS empleado, v.fecha_inicio, v.fecha_fin, v.estado
    FROM vacaciones v
    JOIN usuarios u ON v.usuario_id = u.id
    ORDER BY v.fecha_inicio DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// GET /rrhh/vacaciones/usuario/:id → vacaciones de un usuario (panel empleado)
router.get("/vacaciones/usuario/:id", (req, res) => {
  db.query(
    "SELECT id, fecha_inicio, fecha_fin, estado FROM vacaciones WHERE usuario_id = ? ORDER BY fecha_inicio DESC",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

// Alias: GET /rrhh/empleado/:id/vacaciones
router.get("/empleado/:id/vacaciones", (req, res) => {
  const usuarioId = req.params.id;
  const sql = `
    SELECT v.id, u.nombre AS empleado, v.fecha_inicio, v.fecha_fin, v.estado
    FROM vacaciones v
    JOIN usuarios u ON v.usuario_id = u.id
    WHERE v.usuario_id = ?
    ORDER BY v.fecha_inicio DESC
  `;
  db.query(sql, [usuarioId], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// PUT /rrhh/vacaciones/:id → aprobar / rechazar
router.put("/vacaciones/:id", (req, res) => {
  const { estado } = req.body; // 'aprobada' o 'rechazada'

  db.query(
    "UPDATE vacaciones SET estado = ? WHERE id = ?",
    [estado, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.affectedRows === 0) {
        return res.status(404).json({ mensaje: "Solicitud no encontrada" });
      }
      res.json({ mensaje: `Solicitud marcada como ${estado}` });
    }
  );
});

//======================================================
// Aprobar solicitudes de liquidacion
//======================================================
// GET /rrhh/solicitudes-liquidaciones
router.get("/solicitudes-liquidaciones", (req, res) => {
  const sql = `
    SELECT s.*, u.nombre, u.email
    FROM solicitudes_liquidaciones s
    JOIN usuarios u ON u.id = s.usuario_id
    ORDER BY s.fecha_solicitud DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

router.put("/solicitudes-liquidaciones/:id/estado", (req, res) => {
  const { estado } = req.body;

  const sql = `UPDATE solicitudes_liquidaciones SET estado = ? WHERE id = ?`;

  db.query(sql, [estado, req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "Estado actualizado" });
  });
});






// ======================================================
// 4) EMPLEADOS (para selects en RRHH)
// ======================================================

// GET /rrhh/empleados
// Devuelve solo usuarios que tienen ficha en empleados.
router.get("/empleados", (req, res) => {
  const sql = `
    SELECT 
      u.id,                
      e.id_empleado,
      u.nombre,
      u.email,
      u.rol,
      e.cargo,
      e.sueldo_base,
      e.id_caja_compensacion,
      e.tiene_carga
    FROM empleados e
    JOIN usuarios u ON e.usuario_id = u.id
    ORDER BY u.nombre ASC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});



// POST /rrhh/liquidaciones
// ======================================================
// 5) LIQUIDACIONES MANUALES (con caja, cargas y comisión)
// ======================================================

router.post("/liquidaciones", (req, res) => {
  const {
    usuario_id,
    empleado,
    sueldo_base,
    bono = 0,
    horas_extra = 0,
  } = req.body;

  if (!usuario_id || !empleado || !sueldo_base) {
    return res.status(400).json({
      error: "Faltan datos obligatorios: usuario_id, empleado o sueldo_base.",
    });
  }

  // ===============================================
  // 1) Obtener datos del empleado
  // ===============================================
  const sqlEmpleado = `
    SELECT 
      e.id_empleado,
      e.tiene_carga,
      e.sueldo_base,
      c.porcentaje_descuento AS porcentaje_caja
    FROM empleados e
    LEFT JOIN cajas_compensacion c 
      ON e.id_caja_compensacion = c.id_caja
    WHERE e.usuario_id = ?
    LIMIT 1
  `;

  db.query(sqlEmpleado, [usuario_id], (err, rows) => {
    if (err) {
      console.error("Error consultando empleado:", err);
      return res.status(500).json({ error: "Error consultando empleado." });
    }

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No existe ficha laboral para ese usuario." });
    }

    const emp = rows[0];

    // ===============================================
    // 2) Calcular total de ventas del empleado
    // ===============================================
    const sqlVentas = `
      SELECT SUM(monto) AS total_ventas
      FROM ventas
      WHERE id_empleado = ?
    `;

    db.query(sqlVentas, [emp.id_empleado], (errVentas, resultVentas) => {
      if (errVentas) {
        console.error("Error obteniendo ventas:", errVentas);
        return res.status(500).json({ error: "Error obteniendo ventas." });
      }

      const totalVentas = resultVentas[0].total_ventas || 0;

      // ===============================================
      // 3) Obtener regla de comisión según las ventas
      // ===============================================
      const sqlRegla = `
        SELECT porcentaje
        FROM reglas_comision
        WHERE ? BETWEEN rango_min AND rango_max
        LIMIT 1
      `;

      db.query(sqlRegla, [totalVentas], (errRegla, reglaRows) => {
        if (errRegla) {
          console.error("Error leyendo regla de comisión:", errRegla);
          return res
            .status(500)
            .json({ error: "Error leyendo regla de comisión." });
        }

        const porcentajeComision =
          reglaRows.length > 0 ? reglaRows[0].porcentaje : 0;

        const comisionCalculada = totalVentas * porcentajeComision;

        // ===============================================
        // 4) Cálculos de liquidación
        // ===============================================
        const sueldo = parseFloat(sueldo_base) || 0;
        const bonoExtra = parseFloat(bono) || 0;
        const horas = parseFloat(horas_extra) || 0;

        const gratificacion = sueldo * 0.25;
        const valorHora = sueldo / 30 / 8;
        const pagoHorasExtra = valorHora * 1.5 * horas;

        const imponible =
          sueldo + gratificacion + pagoHorasExtra + comisionCalculada;

        let asignacionFamiliar = 0;
        if (emp.tiene_carga === 1) asignacionFamiliar = 22007;

        let descuentoCaja = 0;
        const porcentajeCaja = emp.porcentaje_caja
          ? parseFloat(emp.porcentaje_caja)
          : 0;

        if (porcentajeCaja > 0) {
          descuentoCaja = (sueldo + gratificacion) * (porcentajeCaja / 100);
        }

        const totalHaberes = imponible + bonoExtra + asignacionFamiliar;

        const afp = imponible * 0.1;
        const salud = imponible * 0.07;
        const cesantia = imponible * 0.006;

        const totalDescuentos = afp + salud + cesantia + descuentoCaja;
        const totalLiquido = totalHaberes - totalDescuentos;

        const firmaEmpleador = generarFirma(
          `${empleado}-${Date.now()}-TICASHOP-EMPRESA`
        );

        // ===============================================
        // 5) INSERT COMPLETO alineado a tu tabla
        // ===============================================
        const sqlInsert = `
          INSERT INTO liquidaciones (
            usuario_id,
            empleado,
            tipo_liquidacion,
            sueldo_base,
            total_ventas,
            comision,
            bono,
            horas_extra,
            gratificacion,
            afp,
            salud,
            cesantia,
            total_bruto,
            total_descuentos,
            total_liquido,
            asignacion_familiar,
            descuento_caja,
            fecha,
            firma_empleador,
            id_empleado
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?)
        `;

        const valores = [
          usuario_id,
          empleado,
          "vendedor", // tipo_liquidacion
          sueldo,
          totalVentas,
          comisionCalculada,
          bonoExtra,
          horas,
          gratificacion,
          afp,
          salud,
          cesantia,
          totalHaberes,
          totalDescuentos,
          totalLiquido,
          asignacionFamiliar,
          descuentoCaja,
          firmaEmpleador,
          emp.id_empleado,
        ];

        db.query(sqlInsert, valores, (err2, result) => {
          if (err2) {
            console.error("Error al generar liquidación:", err2);
            return res
              .status(500)
              .json({ error: "Error al generar la liquidación." });
          }

          res.json({
            mensaje: "Liquidación generada correctamente.",
            id: result.insertId,
          });
        });
      });
    });
  });
});


// ======================================================
// 6) FIRMAR LIQUIDACIÓN (empleado)
// ======================================================

// PUT /rrhh/firmar/:id
router.put("/firmar/:id", (req, res) => {
  const { empleadoEmail } = req.body;

  if (!empleadoEmail) {
    return res.status(400).json({ error: "Falta empleadoEmail" });
  }

  const firmaEmpleado = generarFirma(
    `${empleadoEmail}-${Date.now()}-FIRMA-TRABAJADOR`
  );

  db.query(
    "UPDATE liquidaciones SET firma_empleado = ?, fecha_firma = NOW() WHERE id = ?",
    [firmaEmpleado, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.affectedRows === 0) {
        return res.status(404).json({ mensaje: "Liquidación no encontrada" });
      }

      res.json({
        mensaje: "Liquidación firmada digitalmente por el empleado",
        firmaEmpleado,
        fecha: new Date(),
      });
    }
  );
});

// ======================================================
// 7) HISTORIALES DE LIQUIDACIONES
// ======================================================

// GET /rrhh/empleado/:id/liquidaciones
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

// GET /rrhh/liquidaciones  → todas (para RRHH)
router.get("/liquidaciones", (req, res) => {
  const sql = `
    SELECT
      id,
      empleado,
      sueldo_base,
      total_ventas,
      comision,
      bono,
      horas_extra,
      gratificacion,
      total_bruto,
      total_descuentos,
      total_liquido,
      asignacion_familiar,
      descuento_caja,
      fecha,
      firma_empleador
    FROM liquidaciones
    ORDER BY fecha DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

module.exports = router;

