import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import QuickActions from '../components/dashboard/QuickActions';
import RecentAppointments from '../components/dashboard/RecentAppointments';
import AppointmentStatusDistribution from '../components/dashboard/AppointmentStatusDistribution';
import UpcomingAppointments from '../components/dashboard/UpcomingAppointments';
import RecentActivity from '../components/dashboard/RecentActivity';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import StatCard from '../components/dashboard/StatCard';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import './AdminDashboard.css';

const getCollection = (response) => (Array.isArray(response.data?.data) ? response.data.data : []);

const isToday = (dateValue) => {
  const date = new Date(dateValue);
  const today = new Date();

  return !Number.isNaN(date.getTime())
    && date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
};

const getReferenceId = (reference) => {
  if (!reference) return null;
  return typeof reference === 'object' ? reference._id : reference;
};

function AdminDashboard() {
  const [data, setData] = useState({ patients: [], doctors: [], appointments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hasFetched = useRef(false);
  const { user } = useAuth();

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [patientsResponse, doctorsResponse, appointmentsResponse] = await Promise.all([
        api.get('/patients'),
        api.get('/doctors'),
        api.get('/appointments'),
      ]);

      setData({
        patients: getCollection(patientsResponse),
        doctors: getCollection(doctorsResponse),
        appointments: getCollection(appointmentsResponse),
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Dashboard data could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo(() => {
    const todayAppointments = data.appointments.filter((appointment) => isToday(appointment.dateTime));
    const pendingAppointments = data.appointments.filter(
      (appointment) => appointment.status?.toLowerCase() === 'scheduled'
    );

    return [
      { label: 'Total Patients', value: loading ? '—' : data.patients.length, trend: 'Registered patients', tone: 'teal' },
      { label: 'Total Doctors', value: loading ? '—' : data.doctors.length, trend: 'Active doctor records', tone: 'blue' },
      { label: 'Today’s Appointments', value: loading ? '—' : todayAppointments.length, trend: 'Appointments dated today', tone: 'violet' },
      { label: 'Pending Appointments', value: loading ? '—' : pendingAppointments.length, trend: 'Scheduled appointments', tone: 'amber' },
    ];
  }, [data, loading]);

  const recentAppointments = useMemo(() => {
    const patientsById = new Map(data.patients.map((patient) => [String(patient._id), patient]));
    const doctorsById = new Map(data.doctors.map((doctor) => [String(doctor._id), doctor]));

    return data.appointments.slice(0, 5).map((appointment) => {
      const patientReference = getReferenceId(appointment.patient);
      const doctorReference = getReferenceId(appointment.doctor);
      const patient = typeof appointment.patient === 'object'
        ? appointment.patient
        : patientsById.get(String(patientReference));
      const doctor = typeof appointment.doctor === 'object'
        ? appointment.doctor
        : doctorsById.get(String(doctorReference));

      return {
        ...appointment,
        patientName: patient?.name || 'Unknown patient',
        doctorName: doctor?.name || 'Unknown doctor',
      };
    });
  }, [data]);

  const upcomingAppointments = useMemo(() => recentAppointments
    .filter((appointment) => new Date(appointment.dateTime).getTime() >= Date.now() && appointment.status === 'scheduled')
    .sort((first, second) => new Date(first.dateTime) - new Date(second.dateTime))
    .slice(0, 4), [recentAppointments]);

  const activityAppointments = useMemo(() => [...recentAppointments]
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt)), [recentAppointments]);

  return (
    <DashboardLayout activeItem="Dashboard" title="Dashboard">
      <div className="dashboard-content">
          <section className="welcome-banner">
            <div>
              <p className="section-label">MediCore command center</p>
              <h2>Good morning, {user.name?.split(' ')[0]}.</h2>
              <p>Here’s a concise view of today’s hospital operations.</p>
            </div>
            <span className="welcome-mark" aria-hidden="true">✚</span>
          </section>

          {error && (
            <section className="dashboard-alert" role="alert">
              <span>{error}</span>
              <button type="button" onClick={loadDashboard}>Try again</button>
            </section>
          )}

          <section className="stats-grid" aria-label="Hospital statistics">
            {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
          </section>

          <section className="dashboard-lower-grid">
            <RecentAppointments appointments={recentAppointments} loading={loading} error={Boolean(error)} />
            <AppointmentStatusDistribution appointments={data.appointments} loading={loading} />
          </section>

          <section className="dashboard-lower-grid dashboard-lower-grid-secondary">
            <UpcomingAppointments appointments={upcomingAppointments} loading={loading} />
            <QuickActions />
          </section>

          <RecentActivity appointments={activityAppointments} loading={loading} />
      </div>
    </DashboardLayout>
  );
}

export default AdminDashboard;
