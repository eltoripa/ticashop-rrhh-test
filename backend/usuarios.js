const express = require("express");
const router = express.Router();
const db = require("./db");
const bcrypt = require("bcrypt");

// Crear usuario (con cifrado bcrypt)
router.post("/", async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)",
      [nombre, email, hash, rol || "cliente"],
      (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ id: result.insertId, nombre, email, rol });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

// Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM usuarios WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0)
        return res.status(401).json({ error: "Usuario no encontrado" });

      const usuario = results[0];
      let esValido = false;

      if (usuario.password && usuario.password.startsWith("$2b$")) {
        esValido = await bcrypt.compare(password, usuario.password);
      } else {
        esValido = password === usuario.password;
      }

      if (!esValido)
        return res.status(401).json({ error: "Contraseña incorrecta" });

      res.json({
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      });
    }
  );
});


router.put("/:id/estado", (req, res) => {
  const { activo } = req.body;

  const sql = `UPDATE usuarios SET activo = ? WHERE id = ?`;

  db.query(sql, [activo, req.params.id], (err) => {
    if (err) return res.status(500).json(err);

    res.json({ mensaje: "Estado de usuario actualizado" });
  });
});


// ==========================================
//  OBTENER TODOS LOS USUARIOS
// ==========================================
router.get("/", (req, res) => {
  const sql = "SELECT id, nombre, email, rol, activo FROM usuarios";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener usuarios:", err);
      return res.status(500).json(err);
    }

    res.json(results);
  });
});

module.exports = router;
