import { useEffect, useState } from "react";
import axios from "axios";

export default function MisAsistencias({ usuario }) {
  const [asistencias, setAsistencias] = useState([]);
  const [error, setError] = useState("");

  const cargar = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/rrhh/asistencia/usuario/${usuario.id}`
      );
      setAsistencias(response.data);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la asistencia.");
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h3>Mi Asistencia</h3>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
          </tr>
        </thead>

        <tbody>
          {asistencias.map((a) => (
            <tr key={a.id}>
              <td>{new Date(a.fecha).toLocaleDateString("es-CL")}</td>
              <td>{a.hora}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
