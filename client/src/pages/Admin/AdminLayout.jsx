import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-group-title">Resumen</div>
        <NavLink to="/panel" end>
          Overview
        </NavLink>

        <div className="sidebar-group-title">Modelo</div>
        <NavLink to="/panel/factores">Factores &amp; Subfactores</NavLink>
        <NavLink to="/panel/preguntas">Banco de preguntas</NavLink>
        <NavLink to="/panel/indicadores">Indicadores &amp; planes</NavLink>
        <NavLink to="/panel/decisiones">Decisiones (DM)</NavLink>

        <div className="sidebar-group-title">Cierre</div>
        <NavLink to="/panel/gobernanza">Gobernanza &amp; dictamen</NavLink>

        <div className="sidebar-group-title">Base de conocimiento</div>
        <NavLink to="/panel/explorador">Explorador (110 hojas)</NavLink>

        <div className="sidebar-group-title">Encuesta</div>
        <NavLink to="/panel/respuestas">Respuestas recibidas</NavLink>
      </aside>
      <div className="admin-body">
        <div className="page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
