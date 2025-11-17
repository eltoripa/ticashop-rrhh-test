import { useState, useEffect } from "react";
import axios from "axios";

export default function Ventas() {
  const [vendedores, setVendedores] = useState([]);
  const [idEmpleado, setIdEmpleado] = useState("");
  const [monto, setMonto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    cargarVendedores();
    cargarVentas();
  }, []);

  // Cargar vendedores (solo los que tienen tipo_vendedor)
  const cargarVendedores = async () => {
    const res = await axios.get("http://localhost:3001/rrhh/empleados");
    const soloVendedores = res.data.filter(e => e.rol === "vendedor");
    setVendedores(soloVendedores);
  };

  const cargarVentas = async () => {
    const res = await axios.get("http://localhost:3001/ventas");
    setVentas(res.data);
  };

  const registrarVenta = async () => {
    try {
      await axios.post("http://localhost:3001/ventas", {
        id_empleado: idEmpleado,
        monto: parseFloat(monto)
      });

      setMensaje("Venta registrada correctamente");
      setMonto("");
      cargarVentas();
    } catch (err) {
      console.error(err);
      setMensaje("Error al registrar venta");
    }
  };

  return (
    <div style={{ padding: "20px", borderRadius: "8px", background: "#eef2ff" }}>
      <h3> Registrar Venta</h3>

      <div>
        <label>Vendedor: </label>
        <select value={idEmpleado} onChange={(e) => setIdEmpleado(e.target.value)}>
          <option value="">-- Seleccione --</option>
          {vendedores.map(v => (
            <option key={v.id} value={v.id}>
              {v.nombre}
            </option>
          ))}
        </select>
      </div>

      <div>
        <input
          type="number"
          placeholder="Monto venta"
          value={monto}
          onChange={e => setMonto(e.target.value)}
        />
      </div>

      <button onClick={registrarVenta}>Registrar Venta</button>
      <p>{mensaje}</p>

      {/* Tabla simple de ventas */}
      <h4> Ventas Registradas</h4>

      <table border="1" width="100%" cellPadding="6">
        <thead>
          <tr>
            <th>ID</th>
            <th>Vendedor</th>
            <th>Monto</th>
            <th>Fecha</th>
          </tr>
        </thead>

        <tbody>
          {ventas.map(v => (
            <tr key={v.id_venta}>
              <td>{v.id_venta}</td>
              <td>{v.vendedor}</td>
              <td>${v.monto.toLocaleString()}</td>
              <td>{new Date(v.fecha).toLocaleDateString("es-CL")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
