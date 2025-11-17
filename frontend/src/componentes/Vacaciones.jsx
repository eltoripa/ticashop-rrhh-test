import { useState, useEffect } from "react";
import axios from "axios";
import {  useCallback } from "react";


export default function Vacaciones({ usuario }) {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [solicitudes, setSolicitudes] = useState([]);

  // 🔹 Enviar solicitud de vacaciones (empleado)
  const solicitarVacaciones = async () => {
    try {
      await axios.post("http://localhost:3001/rrhh/vacaciones", {
        usuario_id: usuario.id,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });
      setMensaje(" Solicitud enviada correctamente");
      setFechaInicio("");
      setFechaFin("");
      cargarSolicitudes();
    } catch (error) {
      console.error(error);
      setMensaje(" Error al enviar solicitud");
    }
  };

  // 🔹 Cargar solicitudes según rol
const cargarSolicitudes = useCallback(async () => {
  try {
    let res;
    if (usuario.rol === "rrhh") {
      res = await axios.get("http://localhost:3001/rrhh/vacaciones");
    } else {
      res = await axios.get(`http://localhost:3001/rrhh/vacaciones/usuario/${usuario.id}`);
    }
    setSolicitudes(res.data);
  } catch (error) {
    console.error("Error al cargar solicitudes:", error);
  }
}, [usuario.rol, usuario.id]); //  dependencias reales


  // 🔹 Cambiar estado (solo RRHH)
  const actualizarEstado = async (id, estado) => {
    try {
      await axios.put(`http://localhost:3001/rrhh/vacaciones/${id}`, { estado });
      cargarSolicitudes();
    } catch (error) {
      console.error("Error al actualizar estado:", error);
    }
  };
useEffect(() => {
  cargarSolicitudes();
}, [cargarSolicitudes]);



  return (
    <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "10px" }}>
      <h3> Solicitud de Vacaciones</h3>

      {/* Empleado solicita vacaciones */}
      {usuario.rol !== "rrhh" && (
        <div>
          <label>Inicio:</label>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          <label>Fin:</label>
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          <button onClick={solicitarVacaciones}>Enviar solicitud</button>
          <p>{mensaje}</p>

          {/* Historial personal */}
          <h4>📋 Mis solicitudes</h4>
          <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{new Date(s.fecha_inicio).toLocaleDateString()}</td>
                  <td>{new Date(s.fecha_fin).toLocaleDateString()}</td>
                  <td
                    style={{
                      color:
                        s.estado === "aprobada"
                          ? "green"
                          : s.estado === "rechazada"
                          ? "red"
                          : "orange",
                      fontWeight: "bold",
                    }}
                  >
                    {s.estado.toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RRHH ve todas las solicitudes */}
      {usuario.rol === "rrhh" && (
        <div>
          <h4> Todas las solicitudes</h4>
          <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Empleado</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.empleado}</td>
                  <td>{new Date(s.fecha_inicio).toLocaleDateString()}</td>
                  <td>{new Date(s.fecha_fin).toLocaleDateString()}</td>
                  <td>{s.estado}</td>
                  <td>
                    <button onClick={() => actualizarEstado(s.id, "aprobada")}>Aprobar</button>
                    <button onClick={() => actualizarEstado(s.id, "rechazada")}>Rechazar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
