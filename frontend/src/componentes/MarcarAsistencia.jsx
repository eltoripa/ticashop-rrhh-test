import { useState } from "react";
import axios from "axios";

export default function MarcarAsistencia({ usuario }) {
  const [mensaje, setMensaje] = useState("");

  const marcar = async () => {
    try {
      const res = await axios.post("http://localhost:3001/rrhh/asistencia/marcar", {
        usuario_id: usuario.id
      });
      setMensaje(res.data.mensaje);
    } catch (error) {
      console.error(error);
      setMensaje("Error al marcar asistencia");
    }
  };

  return (
    <div style={{ marginTop: "20px", padding: "10px" }}>
      <h2>Mi Asistencia</h2>
      <button onClick={marcar}>Marcar Asistencia</button>
      <p>{mensaje}</p>
    </div>
  );
}
