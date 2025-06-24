// In your Navigation component (e.g., src/components/ui/Navbar.jsx)
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="flex space-x-4">
        <NavLink to="/" className="nav-link">
          Dashboard
        </NavLink>
        <NavLink to="/emergency-report" className="nav-link">
          Report Emergency
        </NavLink>
        {/* Other nav links */}
      </div>
    </nav>
  );
};