import axios from "axios";
import { useState } from "react";

export default function BotonAsistencia({ usuario }) {
  const [mensaje, setMensaje] = useState("");

  const marcar = async () => {
    try {
      await axios.post("http://localhost:3001/rrhh/asistencia/marcar", {
  usuario_id: usuario.id
});

      setMensaje("Asistencia registrada");
    } catch (err) {
      setMensaje("Error al registrar asistencia");
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <button onClick={marcar} style={{ padding: "10px" }}>
        Marcar asistencia
      </button>
      <p>{mensaje}</p>
    </div>
  );
}
