import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import LoginPage from './pages/LoginPage';
import DoctorsPage from './pages/DoctorsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import PatientsPage from './pages/PatientsPage';
import PrescriptionsPage from './pages/PrescriptionsPage';
import AdminDashboard from './pages/AdminDashboard';
import RegisterPage from './pages/RegisterPage';
import BillingPage from './pages/BillingPage';
import ReportsPage from './pages/ReportsPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/app" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      <Route path="/app/patients" element={<ProtectedRoute><PatientsPage /></ProtectedRoute>} />
      <Route path="/app/doctors" element={<ProtectedRoute><DoctorsPage /></ProtectedRoute>} />
      <Route path="/app/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
      <Route path="/app/prescriptions" element={<ProtectedRoute><PrescriptionsPage /></ProtectedRoute>} />
      <Route path="/app/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
      <Route path="/app/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

export default App;
