import { useState } from "react";
import Login from "./paginas/login";
import AdminPanel from "./paginas/adminpanel";
import PanelRRHH from "./paginas/PanelRRHH";
import PanelEmpleado from "./paginas/PanelEmpleado";

export default function App() {
  const [usuario, setUsuario] = useState(
    JSON.parse(localStorage.getItem("usuario")) || null
  );

  if (!usuario) {
    return <Login onLogin={setUsuario} />;
  }

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    setUsuario(null);
  };

  //  Determina qué vista mostrar según el rol
const renderizarVistaPorRol = () => {
  switch (usuario.rol) {
    case "admin":
      return <AdminPanel usuario={usuario} />;
    case "rrhh":
      return <PanelRRHH usuario={usuario} />;
    case "logistica":
      return (
        <div>
          <h2>Módulo de Logística</h2>
          <p>Aquí irán las opciones de inventario.</p>
        </div>
      );
    case "cliente":
      return (
        <div>
          <h1>Portal del Cliente</h1>
          <p>Bienvenido, {usuario.nombre}. Aquí podrás ver tus cotizaciones y pedidos.</p>
        </div>
      );
    default:
      //  Todos los otros roles (vendedor, soporte, etc.) se tratan como empleados normales
      return <PanelEmpleado usuario={usuario} />;
  }
};

  return (
    <div>
      <header style={{ background: "#1976d2", color: "white", padding: "10px" }}>
        <h1>TiCaShop LATAM ERP</h1>
        <p>
          Sesión activa: <b>{usuario.nombre}</b> ({usuario.rol})
        </p>
        <button onClick={cerrarSesion} style={{ background: "white", color: "#1976d2" }}>
          Cerrar sesión
        </button>
      </header>

      <main style={{ padding: "20px" }}>{renderizarVistaPorRol()}</main>
    </div>
  );
}
