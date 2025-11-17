import { useEffect, useState } from "react";
import axios from "axios";
import MarcarAsistencia from "../componentes/MarcarAsistencia";

export default function PanelEmpleado({ usuario }) {
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [vacaciones, setVacaciones] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [solicitud, setSolicitud] = useState({
    fecha_inicio: "",
    fecha_fin: ""
  });

  //  Cargar datos personales, liquidaciones y vacaciones
  useEffect(() => {
    if (!usuario) return;

    const cargarDatos = async () => {
      try {
        const resLiq = await axios.get(`http://localhost:3001/rrhh/empleado/${usuario.id}/liquidaciones`);
        const resVac = await axios.get(`http://localhost:3001/rrhh/empleado/${usuario.id}/vacaciones`);
        setLiquidaciones(resLiq.data);
        setVacaciones(resVac.data);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    cargarDatos();
  }, [usuario]);

  //  Firmar digitalmente una liquidación
  const firmarLiquidacion = async (idLiquidacion) => {
    try {
      const res = await axios.put(`http://localhost:3001/rrhh/firmar/${idLiquidacion}`, {
        empleadoEmail: usuario.email
      });
      alert(res.data.mensaje);
      window.location.reload();
    } catch (error) {
      alert("Error al firmar liquidación");
    }
  };

  //  Enviar solicitud de vacaciones
  const enviarVacaciones = async () => {
    try {
      await axios.post(`http://localhost:3001/rrhh/empleado/${usuario.id}/vacaciones`, {
        fecha_inicio: solicitud.fecha_inicio,
        fecha_fin: solicitud.fecha_fin
      });
      alert("Solicitud enviada correctamente");
      setSolicitud({ fecha_inicio: "", fecha_fin: "" });
    } catch (error) {
      alert("Error al enviar solicitud");
    }
  };


  return (
    <div style={{ padding: "30px" }}>
      <h1>Portal del Empleado</h1>
      <section>
  <MarcarAsistencia usuario={usuario} />
</section>

      <p>Bienvenido, <b>{usuario.nombre}</b> ({usuario.email})</p>

      <section style={{ marginTop: "20px" }}>
        <h2> Mis Liquidaciones</h2>
        {liquidaciones.length === 0 ? (
          <p>No tienes liquidaciones registradas.</p>
        ) : (
          <table border="1" cellPadding="6">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Total líquido</th>
                <th>Firma Empleado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {liquidaciones.map((liq) => (
                <tr key={liq.id}>
                  <td>{liq.id}</td>
                  <td>{liq.fecha}</td>
                  <td>${liq.total_liquido}</td>
                  <td>{liq.firma_empleado ? "✅ Firmada" : "❌ Pendiente"}</td>
                  <td>
                    {!liq.firma_empleado && (
                      <button onClick={() => firmarLiquidacion(liq.id)}>Firmar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <hr />

      <section>
        <h2> Solicitar Vacaciones</h2>
        <label>Desde: </label>
        <input
          type="date"
          value={solicitud.fecha_inicio}
          onChange={(e) => setSolicitud({ ...solicitud, fecha_inicio: e.target.value })}
        />
        <label> Hasta: </label>
        <input
          type="date"
          value={solicitud.fecha_fin}
          onChange={(e) => setSolicitud({ ...solicitud, fecha_fin: e.target.value })}
        />
        <button onClick={enviarVacaciones}>Enviar solicitud</button>
      </section>

      <hr />

      <section>
        <h2> Mis Vacaciones</h2>
        {vacaciones.length === 0 ? (
          <p>No tienes solicitudes.</p>
        ) : (
          <table border="1" cellPadding="6">
            <thead>
              <tr>
                <th>ID</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {vacaciones.map((v) => (
                <tr key={v.id}>
                  <td>{v.id}</td>
                  <td>{v.fecha_inicio}</td>
                  <td>{v.fecha_fin}</td>
                  <td>{v.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p style={{ color: "green" }}>{mensaje}</p>
    </div>
  );
}
