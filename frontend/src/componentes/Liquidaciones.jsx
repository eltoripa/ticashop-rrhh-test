import { useState, useEffect } from "react";
import axios from "axios";

export default function Liquidaciones({ usuario }) {
  const [empleados, setEmpleados] = useState([]);
  const [empleadoId, setEmpleadoId] = useState("");
  const [sueldo, setSueldo] = useState("");
  const [bono, setBono] = useState("");
  const [horasExtra, setHorasExtra] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [liquidaciones, setLiquidaciones] = useState([]);

  // Cargar empleados
  const cargarEmpleados = async () => {
    try {
      const res = await axios.get("http://localhost:3001/rrhh/empleados");
      setEmpleados(res.data);
    } catch (error) {
      console.error("Error al cargar empleados:", error);
    }
  };

  // Cargar todas las liquidaciones
  const cargarLiquidaciones = async () => {
    try {
      const res = await axios.get("http://localhost:3001/rrhh/liquidaciones");
      setLiquidaciones(res.data);
    } catch (error) {
      console.error("Error al cargar liquidaciones:", error);
    }
  };

  // Generar liquidación manual
  const generarLiquidacion = async () => {
    try {
      const empData = empleados.find(e => e.id === parseInt(empleadoId));

      await axios.post("http://localhost:3001/rrhh/liquidaciones", {
        usuario_id: empleadoId,           // obligatorio
        empleado: empData?.nombre,        // nombre del empleado
        sueldo_base: parseFloat(sueldo),
        bono: parseFloat(bono),
        horas_extra: parseInt(horasExtra),
      });

      setMensaje(" Liquidación generada correctamente");
      cargarLiquidaciones();
    } catch (error) {
      console.error(error);
      setMensaje(" Error al generar liquidación");
    }
  };

  useEffect(() => {
    cargarEmpleados();
    cargarLiquidaciones();
  }, []);

  return (
    <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "10px" }}>

      <h3> Generar Liquidaciones</h3>

      {usuario.rol === "rrhh" && (
        <div style={{ marginBottom: "20px" }}>
          <label>Empleado:</label>
          <select
            value={empleadoId}
            onChange={(e) => setEmpleadoId(e.target.value)}
            style={{ marginLeft: "10px" }}
          >
            <option value="">-- Seleccione --</option>
            {empleados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre} ({e.rol})
              </option>
            ))}
          </select>

          <div style={{ marginTop: "10px" }}>
            <input
              type="number"
              placeholder="Sueldo base"
              value={sueldo}
              onChange={(e) => setSueldo(e.target.value)}
            />
            <input
              type="number"
              placeholder="Bono"
              value={bono}
              onChange={(e) => setBono(e.target.value)}
            />
            <input
              type="number"
              placeholder="Horas extra"
              value={horasExtra}
              onChange={(e) => setHorasExtra(e.target.value)}
            />
          </div>

          <button onClick={generarLiquidacion} style={{ marginTop: "10px" }}>
            Generar Liquidación
          </button>

          <p>{mensaje}</p>
        </div>
      )}

      {/* Mostrar historial */}
      <div style={{ marginTop: "20px" }}>
        <h4> Historial de Liquidaciones</h4>

        <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Empleado</th>
              <th>Sueldo Base</th>
              <th>Asignación Familiar</th>
              <th>Descuento Caja</th>
              <th>Total Bruto</th>
              <th>Total Descuentos</th>
              <th>Total Líquido</th>
              <th>Fecha</th>
              <th>Firma Empleador</th>
            </tr>
          </thead>

          <tbody>
            {liquidaciones.map((l) => (
              <tr key={l.id}>
                <td>{l.id}</td>
                <td>{l.empleado}</td>
                <td>${l.sueldo_base}</td>
                <td>${l.asignacion_familiar}</td>
                <td>${l.descuento_caja}</td>
                <td>${l.total_bruto}</td>
                <td>${l.total_descuentos}</td>
                <td>${l.total_liquido}</td>
                <td>{new Date(l.fecha).toLocaleDateString("es-CL")}</td>
                <td>{l.firma_empleador ? "SI" : "NO"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

