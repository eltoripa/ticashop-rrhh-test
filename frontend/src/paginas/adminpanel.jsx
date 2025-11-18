import { useState, useEffect } from "react";
import axios from "axios";
import Ventas from "../componentes/Ventas";

export default function AdminPanel({ usuario }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [rol, setRol] = useState("empleado");
  const [cargo, setCargo] = useState("");
  const [sueldo, setSueldo] = useState("");
  const [tipoContrato, setTipoContrato] = useState("");
  const [tipoVendedor, setTipoVendedor] = useState("");
  const [zona, setZona] = useState("");
  const [tieneCarga, setTieneCarga] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const crearEmpleado = async () => {
    try {
      await axios.post("http://localhost:3001/admin/crear-empleado", {
        nombre,
        email,
        contraseña,
        rol,
        cargo,
        sueldo_base: parseFloat(sueldo),
        tipo_contrato: tipoContrato,
        tipo_vendedor: rol === "vendedor" ? tipoVendedor : null,
        zona: rol === "vendedor" ? zona : null,
        tiene_carga: tieneCarga,
        id_caja_compensacion: 1 // Caja Los Andes fija
      });

      setMensaje("Empleado creado correctamente");

      // Limpiar campos
      setNombre("");
      setEmail("");
      setContraseña("");
      setCargo("");
      setSueldo("");
      setTipoContrato("");
      setTipoVendedor("");
      setZona("");
      setTieneCarga(false);

    } catch (error) {
      console.error(error);
      setMensaje("Error al crear empleado");
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>Panel de Administración</h1>

      <h2>Registrar Empleado</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", maxWidth: "600px" }}>
        
        <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />

        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <input
          placeholder="Contraseña"
          type="password"
          value={contraseña}
          onChange={(e) => setContraseña(e.target.value)}
        />

        <select value={rol} onChange={(e) => setRol(e.target.value)}>
            <option value="cliente">Empleado</option>
            <option value="rrhh">RRHH</option>
            <option value="vendedor">Vendedor</option>
            <option value="admin">Admin</option>
        </select>

        <input placeholder="Cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} />

        <input
          type="number"
          placeholder="Sueldo Base"
          value={sueldo}
          onChange={(e) => setSueldo(e.target.value)}
        />

        <select value={tipoContrato} onChange={(e) => setTipoContrato(e.target.value)}>
          <option value="">Tipo de contrato</option>
          <option value="fijo">Fijo</option>
          <option value="indefinido">Indefinido</option>
          <option value="por_horas">Part-time</option>
        </select>

        {rol === "vendedor" && (
          <>
            <select value={tipoVendedor} onChange={(e) => setTipoVendedor(e.target.value)}>
              <option value="">Tipo de vendedor</option>
              <option value="interno">Interno</option>
              <option value="externo">Externo</option>
            </select>

            <input
              placeholder="Zona"
              value={zona}
              onChange={(e) => setZona(e.target.value)}
            />
          </>
        )}

        <label>
          <input
            type="checkbox"
            checked={tieneCarga}
            onChange={(e) => setTieneCarga(e.target.checked)}
          />
          ¿Tiene carga familiar?
        </label>
      </div>

      <button onClick={crearEmpleado} style={{ marginTop: "10px" }}>
        Registrar Empleado
      </button>

      <p>{mensaje}</p>
      {/* ======================================= */}
      {/*        SECCIÓN PARA REGISTRAR VENTAS     */}
      {/* ======================================= */}

      <h2 style={{ marginTop: "40px" }}>Registrar Ventas</h2>

      <Ventas />  {/* ← AQUÍ SE MUESTRA EL FORMULARIO DE VENTAS */}
    </div>
  );
}
