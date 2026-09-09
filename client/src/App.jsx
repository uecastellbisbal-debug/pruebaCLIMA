import { Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Survey from "./pages/Survey.jsx";
import Results from "./pages/Results.jsx";
import AdminLayout from "./pages/Admin/AdminLayout.jsx";
import Overview from "./pages/Admin/Overview.jsx";
import Factors from "./pages/Admin/Factors.jsx";
import Questions from "./pages/Admin/Questions.jsx";
import Indicators from "./pages/Admin/Indicators.jsx";
import Decisions from "./pages/Admin/Decisions.jsx";
import Governance from "./pages/Admin/Governance.jsx";
import Explorer from "./pages/Admin/Explorer.jsx";
import Responses from "./pages/Admin/Responses.jsx";

export default function App() {
  return (
    <div>
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="brand-dot" />
          WellnessMETER
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/" end>
            Inicio
          </NavLink>
          <NavLink to="/encuesta">Encuesta</NavLink>
          <NavLink to="/panel">Panel de gestión</NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/encuesta" element={<Survey />} />
        <Route path="/resultados/:id" element={<Results />} />

        <Route path="/panel" element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="factores" element={<Factors />} />
          <Route path="preguntas" element={<Questions />} />
          <Route path="indicadores" element={<Indicators />} />
          <Route path="decisiones" element={<Decisions />} />
          <Route path="gobernanza" element={<Governance />} />
          <Route path="explorador" element={<Explorer />} />
          <Route path="explorador/:file" element={<Explorer />} />
          <Route path="respuestas" element={<Responses />} />
          <Route path="respuestas/:id" element={<Responses />} />
        </Route>
      </Routes>
    </div>
  );
}
