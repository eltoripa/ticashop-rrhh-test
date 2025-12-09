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

  const [usuariosListado, setUsuariosListado] = useState([]);

  // ================================
  //   Cambiar estado (activar/desactivar)
  // ================================
  const cambiarEstadoUsuario = async (id, nuevoEstado) => {
    try {
      await axios.put(`http://localhost:3001/usuarios/${id}/estado`, {
        activo: nuevoEstado,
      });

      alert("Estado actualizado");
      cargarUsuarios();
    } catch (error) {
      console.error(error);
      alert("No se pudo actualizar el estado");
    }
  };

  // ================================
  //   Cargar usuarios
  // ================================
  const cargarUsuarios = async () => {
    try {
      const res = await axios.get("http://localhost:3001/usuarios");
      setUsuariosListado(res.data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // ================================
  //   Crear empleado
  // ================================
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
        id_caja_compensacion: 1,
      });

      setMensaje("Empleado creado correctamente");

      setNombre("");
      setEmail("");
      setContraseña("");
      setCargo("");
      setSueldo("");
      setTipoContrato("");
      setTipoVendedor("");
      setZona("");
      setTieneCarga(false);

      cargarUsuarios();
    } catch (error) {
      console.error(error);
      setMensaje("Error al crear empleado");
    }
  };

  // ================================
  //   RENDER
  // ================================
  return (
    <div style={{ padding: "30px" }}>
      <h1>Panel de Administración</h1>

      {/* ======================================= */}
      {/*        REGISTRO DE EMPLEADOS            */}
      {/* ======================================= */}

      <h2>Registrar Empleado</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          maxWidth: "600px",
        }}
      >
        <input
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="Contraseña"
          type="password"
          value={contraseña}
          onChange={(e) => setContraseña(e.target.value)}
        />

        <select value={rol} onChange={(e) => setRol(e.target.value)}>
          <option value="empleado">Empleado</option>
          <option value="rrhh">RRHH</option>
          <option value="vendedor">Vendedor</option>
          <option value="admin">Admin</option>
        </select>

        <input
          placeholder="Cargo"
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
        />

        <input
          type="number"
          placeholder="Sueldo Base"
          value={sueldo}
          onChange={(e) => setSueldo(e.target.value)}
        />

        <select
          value={tipoContrato}
          onChange={(e) => setTipoContrato(e.target.value)}
        >
          <option value="">Tipo de contrato</option>
          <option value="fijo">Fijo</option>
          <option value="indefinido">Indefinido</option>
          <option value="por_horas">Part-time</option>
        </select>

        {rol === "vendedor" && (
          <>
            <select
              value={tipoVendedor}
              onChange={(e) => setTipoVendedor(e.target.value)}
            >
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
      {/*        REGISTRO DE VENTAS               */}
      {/* ======================================= */}

      <h2 style={{ marginTop: "40px" }}>Registrar Ventas</h2>
      <Ventas />

      {/* ======================================= */}
      {/*        GESTIÓN DE USUARIOS              */}
      {/* ======================================= */}

      <section style={{ marginTop: "40px" }}>
        <h2>Gestionar Usuarios</h2>

        <table border="1" width="100%" cellPadding="6">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {usuariosListado.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>{u.rol}</td>
                <td>{u.activo === 1 ? "Activo" : "Inactivo"}</td>

                <td>
                  {u.activo === 1 ? (
                    <button
                      style={{ background: "red", color: "white" }}
                      onClick={() => cambiarEstadoUsuario(u.id, 0)}
                    >
                      Desactivar
                    </button>
                  ) : (
                    <button
                      style={{ background: "green", color: "white" }}
                      onClick={() => cambiarEstadoUsuario(u.id, 1)}
                    >
                      Activar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
