import Asistencia from "../componentes/Asistencia";
import Vacaciones from "../componentes/Vacaciones";
import Liquidaciones from "../componentes/Liquidaciones";
import RegistroAsistenciaRRHH from "../componentes/RegistroAsistencia";
import SolicitudesLiquidaciones from "../componentes/SolicitudesLiquidaciones";

export default function PanelRRHH({ usuario }) {
  return (
    <div style={{ padding: "30px" }}>
      <h1>Módulo de Recursos Humanos</h1>
      
      <section>
        <h2> Registro de Asistencia</h2>
        <Asistencia empleado={usuario.nombre} rol={usuario.rol} />
      </section>

      <hr />

      <section>
        <h2> Solicitudes de Liquidación</h2>
        <SolicitudesLiquidaciones /> {/* 👈 NUEVA SECCIÓN */}
      </section>
      <hr />

      <section>
        <h2> Solicitud de Vacaciones</h2>
        <Vacaciones usuario={usuario} /> {/* 👈 agregado */}
      </section>

      <hr />

      <section>
        <h2> Liquidaciones de Sueldo</h2>
        <Liquidaciones usuario={usuario} /> {/* 👈 agregado */}
      </section>

      <section>
        <h2>📘 Registro Asistencia Legal</h2>
        <RegistroAsistenciaRRHH />
      </section>

    </div>
  );
}

