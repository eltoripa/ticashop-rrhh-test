import { useState } from "react";

export default function RegistroEmpleado() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("rrhh");
  const [mensaje, setMensaje] = useState("");

  const registrar = async () => {
    try {
      const res = await fetch("http://localhost:3001/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password, rol }),
      });

      if (res.ok) {
        setMensaje(" Usuario creado correctamente (cifrado con bcrypt)");
        setNombre("");
        setEmail("");
        setPassword("");
      } else {
        setMensaje(" Error al crear usuario");
      }
    } catch (error) {
      setMensaje(" Error de conexión con el servidor");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Registrar Empleado</h2>
      <input
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      <input
        placeholder="Correo"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        placeholder="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <select value={rol} onChange={(e) => setRol(e.target.value)}>
        <option value="rrhh">RRHH</option>
        <option value="logistica">Logística</option>
        <option value="vendedor">Vendedor</option>
        <option value="admin">Administrador</option>
      </select>
      <button onClick={registrar}>Registrar</button>
      <p>{mensaje}</p>
    </div>
  );
}
