import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ReportEmergency from './pages/reportEmergency';
// import HospitalDashboard from "./pages/HospitalDashboard";
// import Heatmap from "./pages/Heatmap";

function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<Dashboard />} />
         <Route path="/report" element={<ReportEmergency />} />
        {/* <Route path="/hospital" element={<HospitalDashboard />} />
        <Route path="/heatmap" element={<Heatmap />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
