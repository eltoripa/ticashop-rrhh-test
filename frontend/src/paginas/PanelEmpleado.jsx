import { useEffect, useState } from "react";
import axios from "axios";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import BotonAsistencia from "../componentes/BotonAsistencia";
import MisAsistencias from "../componentes/MisAsistencias";



export default function PanelEmpleado({ usuario }) {
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [vacaciones, setVacaciones] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [mes, setMes] = useState("");
  const [anio, setAnio] = useState("");

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
//sueldo en formato chileno
  const formatCLP = (num) => {
  return num !== null && num !== undefined
    ? num.toLocaleString("es-CL", { style: "currency", currency: "CLP" })
    : "$0";
};


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

  const solicitarLiquidacion = async () => {
  try {
    await axios.post(`http://localhost:3001/rrhh/empleado/${usuario.id}/solicitar-liquidacion`, {
      mes,
      anio
    });

    alert("Solicitud enviada correctamente");
    setMes("");
    setAnio("");
  } catch (error) {
    alert("Error al enviar solicitud");
  }
};

const descargarPDF = (liq) => {
  const elemento = document.getElementById(`pdf-${liq.id}`);

  // Mostrar temporalmente el contenido
  elemento.style.display = "block";

  html2canvas(elemento, { scale: 2 }).then((canvas) => {
    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/jpeg", 1.0);

    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "JPEG", 10, 10, imgWidth, imgHeight);
    pdf.save(`Liquidacion_${liq.id}.pdf`);

    // Volver a ocultar después
    elemento.style.display = "none";
  });
};



  return (
    <div style={{ padding: "30px" }}>
      <p>Bienvenido, <b>{usuario.nombre}</b> ({usuario.email})</p>
      <h1>Portal del Empleado</h1>
      <section style={{ marginTop: "20px", background: "#f1f5f9", padding: "20px", borderRadius: "10px" }}>
  <h2>Mi Asistencia</h2>

  <BotonAsistencia usuario={usuario} />

  <MisAsistencias usuario={usuario} />
</section>


      

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
          <tr id={`liq-${liq.id}`} key={liq.id}>

            <td>{liq.id}</td>

            {/* Fecha corta y en formato chileno */}
            <td>{new Date(liq.fecha).toLocaleDateString("es-CL")}</td>

            {/* Formato CLP */}
            <td>{formatCLP(liq.total_liquido)}</td>

            {/* Firma */}
            <td>{liq.firma_empleado ? "✅ Firmada" : "❌ Pendiente"}</td>

            <td>
              {!liq.firma_empleado && (
                <button onClick={() => firmarLiquidacion(liq.id)}>Firmar</button>
              )}
              <button 
              onClick={() => descargarPDF(liq)} 
              style={{ marginLeft: "10px", background: "#2C3E50", color: "white" }}
            >
              Descargar PDF
            </button>

            </td>
            
          </tr>
          
        ))}
      </tbody>
    </table>
    
  )}
  {liquidaciones.map((liq) => (
  <div
    key={`pdf-${liq.id}`}
    id={`pdf-${liq.id}`}
    style={{
      padding: "20px",
      width: "600px",
      background: "white",
      display: "none" // oculto
    }}
  >
    <img
      src="/ticashop.png"
      alt="logo"
      style={{ width: "160px", marginBottom: "10px" }}
    />

    <h2>Liquidación de Sueldo</h2>

    <p><b>Empleado:</b> {usuario.nombre}</p>
    <p><b>Fecha:</b> {new Date(liq.fecha).toLocaleDateString("es-CL")}</p>

    <hr />

    <h3>Haberes</h3>
    <p><b>Sueldo Base (Contractual):</b> ${liq.sueldo_base}</p>
    <p><b>Descuento por Ausencias:</b> ${liq.descuento_ausencias}</p>
    <p><b>Sueldo Ajustado:</b> ${liq.sueldo_ajustado}</p>

    <p><b>Gratificación:</b> ${liq.gratificacion}</p>
    <p><b>Bono:</b> ${liq.bono}</p>
    <p><b>Horas Extra:</b> {liq.horas_extra}</p>
    <p><b>Comisión:</b> ${liq.comision}</p>
    <p><b>Asignación Familiar:</b> ${liq.asignacion_familiar}</p>

    <hr />

    <h3>Descuentos</h3>
    <p><b>AFP:</b> ${liq.afp}</p>
    <p><b>Salud:</b> ${liq.salud}</p>
    <p><b>Cesantía:</b> ${liq.cesantia}</p>
    <p><b>Caja Compensación:</b> ${liq.descuento_caja}</p>

    <hr />

    <h2>Total Líquido: ${liq.total_liquido}</h2>

    <p><b>Firma Empleador:</b> {liq.firma_empleador ? "✔" : "✘"}</p>
    <p><b>Firma Empleado:</b> {liq.firma_empleado ? "✔" : "✘"}</p>
  </div>
))}


</section>
<section style={{ marginTop: "20px" }}>
  <h2> Solicitar Liquidación </h2>

  <label>Mes:</label>
  <select
    value={mes}
    onChange={(e) => setMes(e.target.value)}
  >
    <option value="">Seleccione mes...</option>
    <option value="1">Enero</option>
    <option value="2">Febrero</option>
    <option value="3">Marzo</option>
    <option value="4">Abril</option>
    <option value="5">Mayo</option>
    <option value="6">Junio</option>
    <option value="7">Julio</option>
    <option value="8">Agosto</option>
    <option value="9">Septiembre</option>
    <option value="10">Octubre</option>
    <option value="11">Noviembre</option>
    <option value="12">Diciembre</option>
  </select>

  <label style={{ marginLeft: "10px" }}>Año:</label>
  <input
    type="number"
    value={anio}
    onChange={(e) => setAnio(e.target.value)}
    min="2020"
    max="2030"
    style={{ width: "120px" }}
  />

  <button onClick={solicitarLiquidacion} style={{ marginLeft: "10px" }}>
    Enviar solicitud
  </button>
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

            {/* FECHA DE INICIO FORMATEADA */}
            <td>{new Date(v.fecha_inicio).toLocaleDateString("es-CL")}</td>

            {/* FECHA DE FIN FORMATEADA */}
            <td>{new Date(v.fecha_fin).toLocaleDateString("es-CL")}</td>

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
