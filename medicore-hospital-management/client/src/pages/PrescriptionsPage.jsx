import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import PrescriptionDetails from '../components/prescriptions/PrescriptionDetails';
import PrescriptionModal from '../components/prescriptions/PrescriptionModal';
import PrescriptionTable from '../components/prescriptions/PrescriptionTable';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import './PrescriptionsPage.css';
import './PrescriptionsPagination.css';

const getCollection = (response) => Array.isArray(response.data?.data) ? response.data.data : [];
const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;
const referenceId = (reference) => typeof reference === 'object' ? reference?._id : reference;
const formatDateTime = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' }).format(date); };

function PrescriptionsPage() {
  const [data, setData] = useState({ prescriptions: [], patients: [], doctors: [], appointments: [] });
  const [search, setSearch] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalPrescription, setModalPrescription] = useState(undefined);
  const [detailsPrescription, setDetailsPrescription] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const { user } = useAuth();
  const canEdit = ['admin', 'doctor'].includes(user?.role);
  const canDelete = user?.role === 'admin';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [prescriptionsResponse, patientsResponse, doctorsResponse, appointmentsResponse] = await Promise.all([api.get('/prescriptions', { params: { page, limit: pageSize, search: search.trim() || undefined, doctor: doctorFilter || undefined, date: dateFilter || undefined } }), api.get('/patients'), api.get('/doctors'), api.get('/appointments')]);
      const patients = getCollection(patientsResponse);
      const doctors = getCollection(doctorsResponse);
      const appointments = getCollection(appointmentsResponse);
      const patientsById = new Map(patients.map((patient) => [String(patient._id), patient]));
      const doctorsById = new Map(doctors.map((doctor) => [String(doctor._id), doctor]));
      setData({ prescriptions: getCollection(prescriptionsResponse), patients, doctors, appointments: appointments.map((appointment) => ({ ...appointment, patientName: patientsById.get(String(referenceId(appointment.patient)))?.name || 'Unknown patient', doctorName: doctorsById.get(String(referenceId(appointment.doctor)))?.name || 'Unknown doctor', dateTimeLabel: formatDateTime(appointment.dateTime) })) });
      setPagination({ page: prescriptionsResponse.data?.page || page, limit: prescriptionsResponse.data?.limit || pageSize, total: prescriptionsResponse.data?.total || 0, pages: prescriptionsResponse.data?.pages || 1 });
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Prescription records could not be loaded. Please try again.'));
    } finally { setLoading(false); }
  }, [page, pageSize, search, doctorFilter, dateFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredPrescriptions = useMemo(() => {
    return data.prescriptions.filter((prescription) => {
      const matchesStatus = !appointmentStatusFilter || prescription.appointment?.status === appointmentStatusFilter;
      return matchesStatus;
    });
  }, [data.prescriptions, appointmentStatusFilter]);

  const closeModal = () => { if (!saving) { setModalPrescription(undefined); setFormError(''); } };
  const handleSave = async (form) => {
    if (!form.patient || !form.doctor || !form.medicines.length || form.medicines.some((medicine) => !medicine.name.trim() || !medicine.dosage.trim() || !medicine.frequency.trim() || !medicine.duration.trim())) { setFormError('Select a patient and doctor, then complete all required medication fields.'); return; }
    setSaving(true); setFormError('');
    try {
      const payload = { ...form, diagnosis: form.diagnosis.trim(), notes: form.notes.trim(), appointment: form.appointment || null, medicines: form.medicines.map((medicine) => ({ ...medicine, name: medicine.name.trim(), dosage: medicine.dosage.trim(), frequency: medicine.frequency.trim(), duration: medicine.duration.trim(), instructions: medicine.instructions?.trim() || undefined })) };
      const response = modalPrescription ? await api.put(`/prescriptions/${modalPrescription._id}`, payload) : await api.post('/prescriptions', payload);
      const saved = response.data?.data;
      setData((current) => ({ ...current, prescriptions: modalPrescription ? current.prescriptions.map((prescription) => prescription._id === saved._id ? saved : prescription) : [saved, ...current.prescriptions] }));
      await loadData();
      setSuccess(modalPrescription ? 'Prescription updated successfully.' : 'Prescription created successfully.');
      setModalPrescription(undefined);
    } catch (requestError) { setFormError(getErrorMessage(requestError, 'Prescription could not be saved. Please try again.')); } finally { setSaving(false); }
  };

  const handleDelete = async (prescription) => {
    if (!window.confirm('Delete this prescription? This cannot be undone.')) return;
    setDeletingId(prescription._id); setError('');
    try { await api.delete(`/prescriptions/${prescription._id}`); setData((current) => ({ ...current, prescriptions: current.prescriptions.filter((item) => item._id !== prescription._id) })); setSuccess('Prescription deleted successfully.'); }
    catch (requestError) { setError(getErrorMessage(requestError, 'Prescription could not be deleted. Please try again.')); } finally { setDeletingId(null); }
  };

  return <DashboardLayout activeItem="Prescriptions" title="Prescriptions"><div className="dashboard-content prescriptions-content"><section className="prescriptions-page-heading"><div><p className="section-label">Clinical prescribing</p><h2>Prescriptions</h2><p>Review medication plans and maintain clear clinical prescription records.</p></div>{canEdit && <button className="create-prescription-button" type="button" onClick={() => { setFormError(''); setModalPrescription(null); }}>+ Create Prescription</button>}</section>{success && <p className="prescriptions-feedback prescription-success-feedback" role="status">{success}</p>}{error && <div className="prescriptions-feedback prescription-error-feedback" role="alert"><span>{error}</span><button type="button" onClick={loadData}>Try again</button></div>}<section className="prescriptions-card"><div className="prescriptions-toolbar"><label className="prescription-search-field"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by patient or doctor" aria-label="Search prescriptions" /></label><select value={doctorFilter} onChange={(event) => { setDoctorFilter(event.target.value); setPage(1); }} aria-label="Filter by doctor"><option value="">All doctors</option>{data.doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.name}</option>)}</select><select value={appointmentStatusFilter} onChange={(event) => setAppointmentStatusFilter(event.target.value)} aria-label="Filter by appointment status"><option value="">All appointment statuses</option><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select><input type="date" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1); }} aria-label="Filter by created date" /><span className="prescriptions-count">{loading ? 'Loading…' : `${pagination.total} prescription${pagination.total === 1 ? '' : 's'}`}</span></div><PrescriptionTable prescriptions={filteredPrescriptions} loading={loading} canEdit={canEdit} canDelete={canDelete} onView={setDetailsPrescription} onEdit={(prescription) => { setFormError(''); setModalPrescription(prescription); }} onDelete={handleDelete} deletingId={deletingId} />{!loading && <div className="prescription-pagination"><label>Rows per page<select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} aria-label="Prescriptions per page"><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></label><span>Page {pagination.page} of {pagination.pages}</span><div><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><button type="button" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)}>Next</button></div></div>}</section></div>{canEdit && modalPrescription !== undefined && <PrescriptionModal prescription={modalPrescription} patients={data.patients} doctors={data.doctors} appointments={data.appointments} loadingOptions={loading} onClose={closeModal} onSubmit={handleSave} saving={saving} error={formError} />}{detailsPrescription && <PrescriptionDetails prescription={detailsPrescription} onClose={() => setDetailsPrescription(null)} />}</DashboardLayout>;
}

export default PrescriptionsPage;
