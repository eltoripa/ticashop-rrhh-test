import { useState, useEffect } from "react";
import axios from "axios";

export default function Liquidaciones({ usuario }) {
  const [empleados, setEmpleados] = useState([]);
  const [empleadoId, setEmpleadoId] = useState("");
  const [sueldo, setSueldo] = useState("");
  const [bono, setBono] = useState("");
  const [horasExtra, setHorasExtra] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [liquidaciones, setLiquidaciones] = useState([]);
  // Formatear números a moneda chilena
  const formatCLP = (num) => {
    return num !== null && num !== undefined
      ? num.toLocaleString("es-CL", { style: "currency", currency: "CLP" })
      : "$0";
  };



  // Cargar empleados
  const cargarEmpleados = async () => {
    try {
      const res = await axios.get("http://localhost:3001/rrhh/empleados");
      setEmpleados(res.data);
    } catch (error) {
      console.error("Error al cargar empleados:", error);
    }
  };

  // Cargar todas las liquidaciones
  const cargarLiquidaciones = async () => {
    try {
      const res = await axios.get("http://localhost:3001/rrhh/liquidaciones");
      setLiquidaciones(res.data);
    } catch (error) {
      console.error("Error al cargar liquidaciones:", error);
    }
  };

  // Generar liquidación manual
  const generarLiquidacion = async () => {
    try {
      const empData = empleados.find(e => e.id_empleado === parseInt(empleadoId));

      // ==== DEBUG =====
      console.log("DEBUG → Enviando datos al backend:", {
        usuario_id: empData?.id,
        id_empleado: empData?.id_empleado,
        empleado: empData?.nombre,
        sueldo_base: parseFloat(sueldo) || 0,
        bono: parseFloat(bono) || 0,
        horas_extra: parseInt(horasExtra) || 0,
      });
      // ================

      await axios.post("http://localhost:3001/rrhh/liquidaciones", {
        usuario_id: empData.id,
        id_empleado: empData.id_empleado,
        empleado: empData.nombre,
        sueldo_base: parseFloat(sueldo) || 0,
        bono: parseFloat(bono) || 0,
        horas_extra: parseInt(horasExtra) || 0,
      });

      setMensaje(" Liquidación generada correctamente");
      cargarLiquidaciones();
    } catch (error) {
      console.error(error);
      setMensaje(" Error al generar liquidación");
    }
  };


  useEffect(() => {
    cargarEmpleados();
    cargarLiquidaciones();
  }, []);

  return (
    <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "10px" }}>

      <h3> Generar Liquidaciones</h3>

{usuario.rol === "rrhh" && (
  <div style={{ marginBottom: "20px" }}>

    {/* Selección de empleado */}
    <label>Empleado:</label>
    <select
      value={empleadoId}
      onChange={(e) => {
        const id = e.target.value;
        setEmpleadoId(id);

        // Buscar empleado seleccionado desde la respuesta del backend
        const empSel = empleados.find(emp => emp.id_empleado === parseInt(id));

        if (empSel) {
          setSueldo(empSel.sueldo_base);   // ← Autocompletar sueldo
        }
      }}
      style={{ marginLeft: "10px" }}
    >
      <option value="">-- Seleccione --</option>
      {empleados.map((e) => (
        <option key={e.id_empleado} value={e.id_empleado}>
          {e.nombre} ({e.rol})
        </option>
      ))}
    </select>

    {/* Mostramos sueldo base autocompletado */}
    {empleadoId && (
      <div style={{ marginTop: "10px", fontWeight: "bold" }}>
        Sueldo Base: {formatCLP(sueldo)}
      </div>
    )}

    {/* Inputs que sí se pueden editar */}
    <div style={{ marginTop: "10px" }}>
      <input
        type="number"
        placeholder="Bono"
        value={bono}
        onChange={(e) => setBono(e.target.value)}
      />
      <input
        type="number"
        placeholder="Horas extra"
        value={horasExtra}
        onChange={(e) => setHorasExtra(e.target.value)}
      />
    </div>

    <button onClick={generarLiquidacion} style={{ marginTop: "10px" }}>
      Generar Liquidación
    </button>

    <p>{mensaje}</p>
  </div>
)}


      {/* Mostrar historial */}
      <div style={{ marginTop: "20px" }}>
        <h4> Historial de Liquidaciones</h4>

        <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Empleado</th>
              <th>Sueldo Base</th>
              <th>Total Ventas</th>
              <th>Comisión</th>
              <th>Bono</th>
              <th>Horas Extra</th>
              <th>Gratificación</th>
              <th>Asignación Familiar</th>
              <th>Descuento Caja</th>
              <th>Total Bruto</th>
              <th>Total Descuentos</th>
              <th>Total Líquido</th>
              <th>Fecha</th>
              <th>Firma Empleador</th>
            </tr>
          </thead>

          <tbody>
            {liquidaciones.map((l) => (
              <tr key={l.id}>
                <td>{l.id}</td>
                <td>{l.empleado}</td>
                <td>${l.sueldo_base}</td>
                <td>${l.total_ventas}</td>
                <td>${l.comision}</td>
                <td>${l.bono}</td>
                <td>{l.horas_extra}</td>
                <td>${l.gratificacion}</td>
                <td>${l.asignacion_familiar}</td>
                <td>${l.descuento_caja}</td>
                <td>${l.total_bruto}</td>
                <td>${l.total_descuentos}</td>
                <td>${l.total_liquido}</td>
                <td>{new Date(l.fecha).toLocaleDateString("es-CL")}</td>
                <td>{l.firma_empleador ? "SI" : "NO"}</td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}

