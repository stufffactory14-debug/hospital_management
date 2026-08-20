import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import AppointmentModal from '../components/appointments/AppointmentModal';
import AppointmentTable from '../components/appointments/AppointmentTable';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import './AppointmentsPage.css';
import './AppointmentsPagination.css';

const getCollection = (response) => (Array.isArray(response.data?.data) ? response.data.data : []);
const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;
const getReferenceId = (reference) => (typeof reference === 'object' ? reference?._id : reference);

function AppointmentsPage() {
  const [data, setData] = useState({ appointments: [], patients: [], doctors: [] });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalAppointment, setModalAppointment] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const { user } = useAuth();
  const canEdit = ['admin', 'doctor', 'receptionist'].includes(user?.role);
  const canDelete = user?.role === 'admin';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [appointmentsResponse, patientsResponse, doctorsResponse] = await Promise.all([
        api.get('/appointments', { params: { page, limit: pageSize, search: search.trim() || undefined, status: statusFilter || undefined, date: dateFilter || undefined } }),
        api.get('/patients'),
        api.get('/doctors'),
      ]);
      setData({
        appointments: getCollection(appointmentsResponse),
        patients: getCollection(patientsResponse),
        doctors: getCollection(doctorsResponse),
      });
      setPagination({ page: appointmentsResponse.data?.page || page, limit: appointmentsResponse.data?.limit || pageSize, total: appointmentsResponse.data?.total || 0, pages: appointmentsResponse.data?.pages || 1 });
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Appointment data could not be loaded. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, dateFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resolvedAppointments = useMemo(() => {
    const patientsById = new Map(data.patients.map((patient) => [String(patient._id), patient]));
    const doctorsById = new Map(data.doctors.map((doctor) => [String(doctor._id), doctor]));

    return data.appointments.map((appointment) => {
      const patientId = getReferenceId(appointment.patient);
      const doctorId = getReferenceId(appointment.doctor);
      const patient = typeof appointment.patient === 'object' ? appointment.patient : patientsById.get(String(patientId));
      const doctor = typeof appointment.doctor === 'object' ? appointment.doctor : doctorsById.get(String(doctorId));

      return {
        ...appointment,
        patientName: patient?.name || 'Unknown patient',
        doctorName: doctor?.name || 'Unknown doctor',
      };
    });
  }, [data]);

  const filteredAppointments = useMemo(() => resolvedAppointments, [resolvedAppointments]);

  const closeModal = () => {
    if (!saving) {
      setModalAppointment(undefined);
      setFormError('');
    }
  };

  const handleSave = async (form) => {
    if (!form.patient || !form.doctor || !form.dateTime || !form.reason.trim()) {
      setFormError('Patient, doctor, date and time, and reason are required.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const payload = { ...form, reason: form.reason.trim() };
      const response = modalAppointment
        ? await api.put(`/appointments/${modalAppointment._id}`, payload)
        : await api.post('/appointments', payload);
      const savedAppointment = response.data?.data;

      if (modalAppointment) {
        setData((current) => ({ ...current, appointments: current.appointments.map((appointment) => appointment._id === savedAppointment._id ? savedAppointment : appointment) }));
        setSuccess('Appointment updated successfully.');
      } else {
        setData((current) => ({ ...current, appointments: [savedAppointment, ...current.appointments] }));
        setSuccess('Appointment created successfully.');
      }
      setModalAppointment(undefined);
    } catch (requestError) {
      setFormError(getErrorMessage(requestError, 'Appointment could not be saved. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (appointment) => {
    if (!window.confirm('Delete this appointment? This cannot be undone.')) return;
    setDeletingId(appointment._id);
    setError('');

    try {
      await api.delete(`/appointments/${appointment._id}`);
      setData((current) => ({ ...current, appointments: current.appointments.filter((item) => item._id !== appointment._id) }));
      setSuccess('Appointment deleted successfully.');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Appointment could not be deleted. Please try again.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout activeItem="Appointments" title="Appointments">
      <div className="dashboard-content appointments-content">
        <section className="appointments-page-heading">
          <div><p className="section-label">Schedule management</p><h2>Appointments</h2><p>Coordinate patient visits, care teams, and appointment status.</p></div>
          {canEdit && <button className="create-appointment-button" type="button" onClick={() => { setFormError(''); setModalAppointment(null); }}>+ Create Appointment</button>}
        </section>

        {success && <p className="appointments-feedback appointment-success-feedback" role="status">{success}</p>}
        {error && <div className="appointments-feedback appointment-error-feedback" role="alert"><span>{error}</span><button type="button" onClick={loadData}>Try again</button></div>}

        <section className="appointments-management-card">
          <div className="appointments-toolbar">
            <label className="appointment-search-field"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by patient or doctor" aria-label="Search appointments" /></label>
            <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Filter by status"><option value="">All statuses</option><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no_show">No-show</option></select>
            <input className="appointment-date-filter" type="date" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1); }} aria-label="Filter by date" />
            <span className="appointments-count">{loading ? 'Loading…' : `${pagination.total} appointment${pagination.total === 1 ? '' : 's'}`}</span>
          </div>
          <AppointmentTable appointments={filteredAppointments} loading={loading} canEdit={canEdit} canDelete={canDelete} onEdit={(appointment) => { setFormError(''); setModalAppointment(appointment); }} onDelete={handleDelete} deletingId={deletingId} />
          {!loading && <div className="appointment-pagination"><label>Rows per page<select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} aria-label="Appointments per page"><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></label><span>Page {pagination.page} of {pagination.pages}</span><div><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><button type="button" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)}>Next</button></div></div>}
        </section>
      </div>

      {canEdit && modalAppointment !== undefined && <AppointmentModal appointment={modalAppointment} patients={data.patients} doctors={data.doctors} optionsLoading={loading} onClose={closeModal} onSubmit={handleSave} saving={saving} error={formError} />}
    </DashboardLayout>
  );
}

export default AppointmentsPage;
