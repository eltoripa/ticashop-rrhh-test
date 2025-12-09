import { useState, useEffect } from "react";
import axios from "axios";


export default function Liquidaciones({ usuario }) {
  const [empleados, setEmpleados] = useState([]);
  const [empleadoId, setEmpleadoId] = useState("");
  const [sueldo, setSueldo] = useState("");
  const [bono, setBono] = useState("");
  
  const [mensaje, setMensaje] = useState("");
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [mes, setMes] = useState("");
  const [anio, setAnio] = useState("");


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
      if (!empleadoId) {
        setMensaje("Debe seleccionar un empleado");
        return;
      }

      const empData = empleados.find(
        (e) => e.id_empleado === parseInt(empleadoId)
      );

      if (!empData) {
        setMensaje("Empleado no encontrado");
        return;
      }

      // Usamos SIEMPRE el sueldo de la BD, no el del estado
      await axios.post("http://localhost:3001/rrhh/liquidaciones", {
  usuario_id: empData.id,
  id_empleado: empData.id_empleado,
  empleado: empData.nombre,
  sueldo_base: parseFloat(sueldo) || 0,
  bono: parseFloat(bono) || 0,
  
  mes: parseInt(mes),
  anio: parseInt(anio),
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
    // Ver si venimos desde el módulo de solicitud
  const predata = JSON.parse(localStorage.getItem("liq_predata"));
  if (predata) {
    setEmpleadoId(predata.id_empleado);
    setSueldo(predata.sueldo_base);  // Ojo: cargarás desde empleados
    setMes(predata.mes);
    setAnio(predata.anio);

    // Para forzar que el sueldo se autollenara correctamente:
    const emp = empleados.find(e => e.id_empleado === predata.id_empleado);
    if (emp) setSueldo(emp.sueldo_base);

    // Una vez cargado, limpiamos para evitar que se repita
    localStorage.removeItem("liq_predata");
  }
}, []);
  

  return (
    <div
      style={{ padding: "20px", background: "#f8fafc", borderRadius: "10px" }}
    >
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

        const empSel = empleados.find(emp => emp.id_empleado === parseInt(id));

        if (empSel) {
          setSueldo(empSel.sueldo_base); // Autocompletar sueldo
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

    {/* Selección de mes */}
    <div style={{ marginTop: "10px" }}>
      <label>Mes:</label>
      <select
        value={mes}
        onChange={(e) => setMes(e.target.value)}
        style={{ marginLeft: "10px" }}
      >
        <option value="">-- Seleccione --</option>
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
    </div>

    {/* Selección de año */}
    <div style={{ marginTop: "10px" }}>
      <label>Año:</label>
      <select
        value={anio}
        onChange={(e) => setAnio(e.target.value)}
        style={{ marginLeft: "10px" }}
      >
        <option value="">-- Seleccione --</option>
        <option value="2024">2024</option>
        <option value="2025">2025</option>
      </select>
    </div>

    {/* Sueldo base mostrado automáticamente */}
    {empleadoId && (
      <div style={{ marginTop: "10px", fontWeight: "bold" }}>
        Sueldo Base: {formatCLP(sueldo)}
      </div>
    )}

    {/* Bono */}
    <div style={{ marginTop: "10px" }}>
      <input
        type="number"
        placeholder="Bono"
        value={bono}
        onChange={(e) => setBono(e.target.value)}
      />
    </div>

    {/* Botón generar */}
    <button onClick={generarLiquidacion} style={{ marginTop: "10px" }}>
      Generar Liquidación
    </button>

    <p>{mensaje}</p>
  </div>
)}


      {/* Mostrar historial */}
      <div style={{ marginTop: "20px" }}>
        <h4> Historial de Liquidaciones</h4>

        <table
          border="1"
          cellPadding="6"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead>
  <tr>
    <th>ID</th>
    <th>Empleado</th>
    <th>Sueldo Base</th>              {/* Sueldo contrato */}
    <th>Descuento Ausencias</th>      {/* Nuevo */}
    <th>Sueldo Ajustado</th>          {/* Nuevo */}
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

      {/* Sueldo contractual */}
      <td>{formatCLP(l.sueldo_base)}</td>

      {/* Nuevos campos recién agregados a BD */}
      <td>{formatCLP(l.descuento_ausencias)}</td>
      <td>{formatCLP(l.sueldo_ajustado)}</td>

      {/* Cálculos normales */}
      <td>{formatCLP(l.total_ventas)}</td>
      <td>{formatCLP(l.comision)}</td>
      <td>{formatCLP(l.bono)}</td>
      <td>{l.horas_extra}</td>
      <td>{formatCLP(l.gratificacion)}</td>
      <td>{formatCLP(l.asignacion_familiar)}</td>
      <td>{formatCLP(l.descuento_caja)}</td>
      <td>{formatCLP(l.total_bruto)}</td>
      <td>{formatCLP(l.total_descuentos)}</td>
      <td>{formatCLP(l.total_liquido)}</td>

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


