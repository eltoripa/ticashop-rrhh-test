const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

// Importar rutas
const productosRoutes = require("./productos");
const usuariosRoutes = require("./usuarios");
const cotizacionesRoutes = require("./cotizaciones");
const rrhhRoutes = require("./rrhh");
const ticketsRoutes = require("./tickets");
const ventasRoutes = require("./ventas");
const adminRoutes = require("./admin");
app.use("/tickets", ticketsRoutes);

app.use("/cotizaciones", cotizacionesRoutes);
app.use("/productos", productosRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/rrhh", rrhhRoutes);
app.use("/ventas", ventasRoutes);
app.use("/admin", adminRoutes);


app.listen(3001, () => {
  console.log("Servidor backend corriendo en http://localhost:3001");
});
