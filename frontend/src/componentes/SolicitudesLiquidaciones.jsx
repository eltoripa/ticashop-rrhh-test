import { useEffect, useState } from "react";
import axios from "axios";

export default function SolicitudesLiquidaciones() {
  const [solicitudes, setSolicitudes] = useState([]);

  const cargarSolicitudes = async () => {
    const res = await axios.get("http://localhost:3001/rrhh/solicitudes-liquidaciones");
    setSolicitudes(res.data);
  };

  const aprobar = async (id) => {
    await axios.put(`http://localhost:3001/rrhh/solicitudes-liquidaciones/${id}/estado`, {
      estado: "aprobada"
    });
    alert("Solicitud aprobada");
    cargarSolicitudes();
  };

  const rechazar = async (id) => {
    await axios.put(`http://localhost:3001/rrhh/solicitudes-liquidaciones/${id}/estado`, {
      estado: "rechazada"
    });
    alert("Solicitud rechazada");
    cargarSolicitudes();
  };

  const generarLiquidacion = async (id) => {
  await axios.put(
    `http://localhost:3001/rrhh/solicitudes-liquidaciones/${id}/estado`,
    { estado: "aprobada" }
  );

  alert("Solicitud marcada como aprobada. RRHH debe generar la liquidación manualmente.");
  cargarSolicitudes();
};


  useEffect(() => {
    cargarSolicitudes();
  }, []);

  return (
    <section>
      <h2>Solicitudes de Liquidación</h2>

      <table border="1" cellPadding="6">
        <thead>
          <tr>
            <th>ID</th>
            <th>Empleado</th>
            <th>Mes</th>
            <th>Año</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>

        <tbody>
          {solicitudes.map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.nombre}</td>
              <td>{s.mes}</td>
              <td>{s.anio}</td>
              <td>
                {s.estado === "pendiente" && " Pendiente"}
                {s.estado === "aprobada" && " Aprobada"}
                {s.estado === "rechazada" && " Rechazada"}
              </td>

              <td>
                {s.estado === "pendiente" && (
                  <>
                    <button onClick={() => generarLiquidacion(s.id)}>Generar</button>
                    <button
                      onClick={() => rechazar(s.id)}
                      style={{ marginLeft: "5px", background: "red" }}
                    >
                      Rechazar
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
