import { useState } from "react";
import Login from "./paginas/login";
import AdminPanel from "./paginas/adminpanel";
import PanelRRHH from "./paginas/PanelRRHH";
import PanelEmpleado from "./paginas/PanelEmpleado";
import "./App.css";


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
      <header
  style={{
    background: "#2C3E50",       // azul corporativo TicaShop
    color: "white",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
  }}
>
  <div>
    <h1 style={{ margin: 0 }}>TiCaShop LATAM ERP</h1>
    <p style={{ margin: 0 }}>
      Sesión activa: <b>{usuario.nombre}</b> ({usuario.rol})
    </p>
  </div>

  <button
    onClick={cerrarSesion}
    style={{
      background: "#F28B1C",          // naranja corporativo
      color: "white",
      border: "none",
      padding: "8px 16px",
      fontWeight: "bold",
      borderRadius: "6px",
      cursor: "pointer",
      transition: "0.2s"
    }}
    onMouseOver={(e) => (e.target.style.background = "#d97a18")}
    onMouseOut={(e) => (e.target.style.background = "#F28B1C")}
  >
    Cerrar sesión
  </button>
</header>



      <main style={{ padding: "20px" }}>{renderizarVistaPorRol()}</main>
    </div>
  );
}
