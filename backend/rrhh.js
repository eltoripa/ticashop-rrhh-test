const express = require("express");
const router = express.Router();
const db = require("./db");
const crypto = require("crypto");
const axios = require("axios");


// ===============================
//  firma digital
// ===============================
const generarFirma = (texto) => {
  return crypto.createHash("sha256").update(texto).digest("hex");
};

// ======================================================
// 1) ASISTENCIA (empleado marca asistencia)
// ======================================================

function registrarAsistencia(usuario_id, res) {
  if (!usuario_id) {
    return res.status(400).json({ error: "Falta usuario_id" });
  }

  //  1. Verificar si el usuario está activo
  db.query(
    "SELECT nombre, activo FROM usuarios WHERE id = ?",
    [usuario_id],
    (err, results) => {
      if (err) return res.status(500).json(err);

      if (results.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      if (results[0].activo === 0) {
        return res
          .status(403)
          .json({ error: "Usuario desactivado — no puede registrar asistencia." });
      }

      const empleado = results[0].nombre;

      //  2. Registrar asistencia (solo si está activo)
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

  // 🚨 1. Verificar si el usuario está activo
  db.query(
    "SELECT activo FROM usuarios WHERE id = ?",
    [usuario_id],
    (err, rows) => {
      if (err) return res.status(500).json(err);

      if (rows.length === 0) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      if (rows[0].activo === 0) {
        return res
          .status(403)
          .json({ error: "Usuario desactivado — no puede solicitar vacaciones." });
      }

      // 🚀 2. Insert de vacaciones (solo si está activo)
      db.query(
        "INSERT INTO vacaciones (usuario_id, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, 'pendiente')",
        [usuario_id, fecha_inicio, fecha_fin],
        (err2, result) => {
          if (err2) {
            console.error("Error al registrar vacaciones:", err2);
            return res.status(500).json(err2);
          }

          res.json({
            mensaje: "Solicitud de vacaciones enviada correctamente",
            id: result.insertId,
          });
        }
      );
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



// ======================================================
// 5) LIQUIDACIONES MANUALES (con ausencias y comisiones)
// ======================================================

router.post("/liquidaciones", (req, res) => {
  const {
    usuario_id,
    empleado,
    sueldo_base,    // ya no lo usamos como fuente de verdad, solo de apoyo
    bono = 0,
    horas_extra = 0,
  } = req.body;

  if (!usuario_id || !empleado) {
    return res.status(400).json({
      error: "Faltan datos obligatorios: usuario_id o empleado.",
    });
  }

  // ===============================
  // 0) MES Y AÑO ACTUAL DE CÁLCULO
  // ===============================
  const mesActual = parseInt(req.body.mes);
const añoActual = parseInt(req.body.anio);

if (!mesActual || !añoActual) {
  return res.status(400).json({ error: "Mes y año son obligatorios." });
}


  // ===============================
  // 1) FUNCIÓN PARA DÍAS HÁBILES
  // ===============================
  function diasHabilesDelMes(year, month) {
    // month: 1-12
    let count = 0;
    const date = new Date(year, month - 1, 1); // JS usa 0-11

    while (date.getMonth() === month - 1) {
      const dow = date.getDay(); // 0 domingo, 6 sábado
      if (dow !== 0 && dow !== 6) {
        count++;
      }
      date.setDate(date.getDate() + 1);
    }
    return count;
  }

  const diasHabiles = diasHabilesDelMes(añoActual, mesActual);

  // ===============================
  // 2) CONTAR DÍAS ASISTIDOS
  // ===============================
  const sqlAsistencia = `
    SELECT COUNT(DISTINCT fecha) AS dias_asistidos
    FROM asistencia
    WHERE usuario_id = ?
      AND MONTH(fecha) = ?
      AND YEAR(fecha) = ?
  `;

  db.query(sqlAsistencia, [usuario_id, mesActual, añoActual], (errAsis, rowsAsis) => {
    if (errAsis) {
      console.error("Error obteniendo asistencia:", errAsis);
      return res.status(500).json({ error: "Error obteniendo asistencia." });
    }

    const diasAsistidos = rowsAsis[0]?.dias_asistidos || 0;
    let ausencias = diasHabiles - diasAsistidos;
    if (ausencias < 0) ausencias = 0; // por si hay más registros de los esperados

    // ===============================
    // 3) OBTENER FICHA DEL EMPLEADO
    // ===============================
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

    db.query(sqlEmpleado, [usuario_id], (errEmp, rowsEmp) => {
      if (errEmp) {
        console.error("Error consultando empleado:", errEmp);
        return res.status(500).json({ error: "Error consultando empleado." });
      }

      if (rowsEmp.length === 0) {
        return res
          .status(404)
          .json({ error: "No existe ficha laboral para ese usuario." });
      }

      const emp = rowsEmp[0];

      // Sueldo base REAL desde la ficha
      const sueldoBaseOriginal = parseFloat(emp.sueldo_base) || 0;

      // ===============================
      // 4) DESCUENTO POR AUSENCIAS
      // ===============================
      const valorDia = sueldoBaseOriginal / 30;
      const descuentoAusencias = valorDia * ausencias;
      const sueldoAjustado = Math.max(sueldoBaseOriginal - descuentoAusencias, 0);

      // ===============================
      // 5) OBTENER TOTAL DE VENTAS
      // ===============================
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

        // ===============================
        // 6) OBTENER REGLA DE COMISIÓN
        // ===============================
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

          // ===============================
          // 7) CÁLCULOS DE LIQUIDACIÓN
          // ===============================

          const bonoExtra = parseFloat(bono) || 0;
          const horas = parseFloat(horas_extra) || 0;

          // Gratificación sobre sueldo ajustado (descontado por ausencias)
          const gratificacion = sueldoAjustado * 0.25;

          // Horas extra
          const valorHora = sueldoAjustado / 30 / 8;
          const pagoHorasExtra = valorHora * 1.5 * horas;

          // Imponible
          const imponible =
            sueldoAjustado + gratificacion + pagoHorasExtra + comisionCalculada;

          // Asignación familiar
          let asignacionFamiliar = 0;
          if (emp.tiene_carga === 1) asignacionFamiliar = 22007;

          // Descuento caja compensación
          let descuentoCaja = 0;
          const porcentajeCaja = emp.porcentaje_caja
            ? parseFloat(emp.porcentaje_caja)
            : 0;

          if (porcentajeCaja > 0) {
            descuentoCaja =
              (sueldoAjustado + gratificacion) * (porcentajeCaja / 100);
          }

          // Total haberes
          const totalHaberes = imponible + bonoExtra + asignacionFamiliar;

          // Descuentos legales
          const afp = imponible * 0.1;
          const salud = imponible * 0.07;
          const cesantia = imponible * 0.006;

          const totalDescuentos = afp + salud + cesantia + descuentoCaja;
          const totalLiquido = totalHaberes - totalDescuentos;

          // Firma empleador (tu helper existente)
          const firmaEmpleador = generarFirma(
            `${empleado}-${Date.now()}-TICASHOP-EMPRESA`
          );

          // ===============================
          // 8) INSERT EN TABLA LIQUIDACIONES
          // ===============================

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
    id_empleado,
    sueldo_ajustado,
    descuento_ausencias
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?)
`;

const valores = [
  usuario_id,
  empleado,
  "vendedor",
  sueldoBaseOriginal,  // ← sueldo real
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
  sueldoAjustado,        // ← nuevo
  descuentoAusencias     // ← nuevo
];


          db.query(sqlInsert, valores, (err2, result) => {
            if (err2) {
              console.error("Error al generar liquidación:", err2);
              return res
                .status(500)
                .json({ error: "Error al generar la liquidación." });
            }

            res.json({
              mensaje:
                "Liquidación generada correctamente con ajuste por ausencias.",
              id: result.insertId,
              resumen_asistencia: {
                dias_habiles: diasHabiles,
                dias_asistidos: diasAsistidos,
                ausencias,
                descuento_ausencias: descuentoAusencias,
              },
            });
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

// ======================================================
// LISTAR LIQUIDACIONES (incluye sueldo_ajustado + descuento_ausencias)
// ======================================================
router.get("/liquidaciones", (req, res) => {
  const sql = `
    SELECT 
      id,
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
      id_empleado,
      sueldo_ajustado,        -- NUEVO
      descuento_ausencias     -- NUEVO
    FROM liquidaciones
    ORDER BY fecha DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});


module.exports = router;

