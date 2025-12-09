import { useState, useEffect } from "react";
import axios from "axios";

export default function Asistencia({ empleado, rol }) {
  const [mensaje, setMensaje] = useState("");
  const [asistencias, setAsistencias] = useState([]);

  // ==========================
  // EMPLEADO: MARCAR ASISTENCIA
  // ==========================
  const registrarAsistencia = async () => {
    try {
      const usuario = JSON.parse(localStorage.getItem("usuario"));

      await axios.post("http://localhost:3001/rrhh/asistencia/marcar", {
        usuario_id: usuario.id,
      });

      setMensaje(`Asistencia registrada correctamente para ${usuario.nombre}`);
      cargarAsistencias();
    } catch (error) {
      console.error(error);
      setMensaje("Error al registrar asistencia");
    }
  };

  // ==========================
  // RRHH: CARGAR TODA LA ASISTENCIA
  // ==========================
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
  <div
    style={{
      padding: "20px",
      background: "#f8fafc",
      borderRadius: "10px",
    }}
  >
    <h3>Registro de Asistencia</h3>

    {/* SOLO empleados pueden marcar su asistencia */}
    {rol !== "rrhh" && (
      <>
        <p>
          <b>Empleado:</b> {empleado}
        </p>
        <button onClick={registrarAsistencia}>Marcar asistencia</button>
        <p>{mensaje}</p>
      </>
    )}

    {/* SOLO RRHH debe ver la tabla completa */}
    {rol === "rrhh" && (
      <div style={{ marginTop: "20px" }}>
        <h4>Historial de Asistencias (Todos los empleados)</h4>

        {/* CONTENEDOR CON SCROLL */}
        <div
          style={{
            maxHeight: "350px",
            overflowY: "auto",
            marginTop: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            background: "white",
            padding: "10px",
          }}
        >
          <table
            border="1"
            cellPadding="6"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>Empleado</th>
                <th>Email</th>
                <th>Fecha</th>
                <th>Hora</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>{a.empleado}</td>
                  <td>{a.email}</td>
                  <td>{new Date(a.fecha).toLocaleDateString("es-CL")}</td>
                  <td>{a.hora}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);

}
