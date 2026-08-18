import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

function DashboardLayout({ activeItem, title, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleNavigation = (item) => {
    setIsSidebarOpen(false);

    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <div className="dashboard-shell">
      <Sidebar activeItem={activeItem} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onSelect={handleNavigation} userRole={user?.role} />
      <main className="dashboard-main">
        <Topbar title={title} user={user} onLogout={handleLogout} onMenuToggle={() => setIsSidebarOpen(true)} />
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;
