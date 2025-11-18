import { useEffect, useState } from "react";
import axios from "axios";

export default function RegistroAsistenciaRRHH() {
  const [empleados, setEmpleados] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [idEmpleado, setIdEmpleado] = useState("");
  const [fecha, setFecha] = useState("");
  const [horasExtras, setHorasExtras] = useState("");
  const [feriado, setFeriado] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // Cargar empleados
  const cargarEmpleados = async () => {
    const res = await axios.get("http://localhost:3001/rrhh/empleados");
    setEmpleados(res.data);
  };

  // Cargar registros
  const cargarRegistros = async () => {
    const res = await axios.get("http://localhost:3001/rrhh/registro-asistencia");
    setRegistros(res.data);
  };

  // Guardar
  const guardarRegistro = async () => {
    if (!idEmpleado || !fecha) {
      setMensaje("Debe seleccionar empleado y fecha.");
      return;
    }

    try {
      await axios.post("http://localhost:3001/rrhh/registro-asistencia", {
        id_empleado: idEmpleado,
        fecha,
        horas_extras: horasExtras,
        feriado_no_renunciable: feriado
      });

      setMensaje("Registro ingresado correctamente.");
      setHorasExtras("");
      setFeriado(false);
      cargarRegistros();
    } catch (error) {
      console.error(error);
      setMensaje("Error al ingresar el registro.");
    }
  };

  useEffect(() => {
    cargarEmpleados();
    cargarRegistros();
  }, []);

  return (
    <div style={{ padding: "20px", background: "#eef2ff", borderRadius: "10px" }}>
      <h2>📘 Registro Oficial de Asistencia RRHH</h2>

      <h3>Registrar Horas Extras / Feriado</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", maxWidth: "600px" }}>
        
        <select value={idEmpleado} onChange={(e) => setIdEmpleado(e.target.value)}>
          <option value="">Seleccione empleado</option>
          {empleados.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre}
            </option>
          ))}
        </select>

        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />

        <input
          type="number"
          placeholder="Horas extras"
          value={horasExtras}
          onChange={(e) => setHorasExtras(e.target.value)}
        />

        <label>
          <input
            type="checkbox"
            checked={feriado}
            onChange={(e) => setFeriado(e.target.checked)}
          />{" "}
          ¿Feriado no renunciable?
        </label>
      </div>

      <button onClick={guardarRegistro} style={{ marginTop: "10px" }}>
        Guardar registro
      </button>

      <p>{mensaje}</p>

      <hr />

      {/* Tabla con los registros */}
      <h3>Historial de registros</h3>

      <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Empleado</th>
            <th>Horas extras</th>
            <th>Feriado NR</th>
          </tr>
        </thead>

        <tbody>
          {registros.map((r) => (
            <tr key={r.id_registro}>
              <td>{new Date(r.fecha).toLocaleDateString("es-CL")}</td>
              <td>{r.empleado}</td>
              <td>{r.horas_extras}</td>
              <td>{r.feriado_no_renunciable ? "✔️" : "❌"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
