import { useState, useEffect } from "react";
import axios from "axios";

export default function Asistencia({ empleado, rol }) {
  const [mensaje, setMensaje] = useState("");
  const [asistencias, setAsistencias] = useState([]);

  //  Registrar asistencia personal
const registrarAsistencia = async () => {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    await axios.post("http://localhost:3001/rrhh/asistencia", {
      usuario_id: usuario.id,
    });
    setMensaje(` Asistencia registrada correctamente para ${usuario.nombre}`);
    cargarAsistencias();
  } catch (error) {
    console.error(error);
    setMensaje(" Error al registrar asistencia");
  }
};


  // 🔹 Cargar todas las asistencias (solo visible si RRHH)
  const cargarAsistencias = async () => {
    try {
      const res = await axios.get("http://localhost:3001/rrhh/asistencia");
      setAsistencias(res.data);
    } catch (error) {
      console.error("Error al cargar asistencias:", error);
    }
  };

  useEffect(() => {
    if (rol === "rrhh") {
      cargarAsistencias();
    }
  }, [rol]);

  return (
    <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "10px" }}>
      <h3> Registro de Asistencia</h3>

      {/* RRHH y empleados pueden marcar su asistencia */}
      <p><b>Empleado:</b> {empleado}</p>
      <button onClick={registrarAsistencia}>Marcar asistencia</button>
      <p>{mensaje}</p>

      {/* Solo RRHH ve la tabla completa */}
      {rol === "rrhh" && (
        <div style={{ marginTop: "20px" }}>
          <h4> Historial de Asistencias (Todos los empleados)</h4>
          <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Empleado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.empleado}</td>
                  <td>{new Date(a.fecha).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
