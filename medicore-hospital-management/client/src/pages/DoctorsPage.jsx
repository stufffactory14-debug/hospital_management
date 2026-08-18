import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import DoctorModal from '../components/doctors/DoctorModal';
import DoctorTable from '../components/doctors/DoctorTable';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import './DoctorsPage.css';

const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;
const cleanDoctorPayload = (doctor) => Object.fromEntries(
  Object.entries(doctor).filter(([, value]) => value !== '')
);

function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalDoctor, setModalDoctor] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/doctors');
      setDoctors(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Doctor records could not be loaded. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const filteredDoctors = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return doctors;

    return doctors.filter((doctor) => [doctor.name, doctor.phone, doctor.email, doctor.specialization, doctor.department]
      .some((value) => value?.toLowerCase().includes(query)));
  }, [doctors, search]);

  const closeModal = () => {
    if (!saving) {
      setModalDoctor(undefined);
      setFormError('');
    }
  };

  const handleSave = async (form) => {
    if (!form.name.trim() || !form.phone.trim() || !form.specialization.trim()) {
      setFormError('Name, phone, and specialization are required.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const payload = cleanDoctorPayload({
        ...form,
        name: form.name.trim(),
        phone: form.phone.trim(),
        specialization: form.specialization.trim(),
        experience: form.experience === '' ? '' : Number(form.experience),
      });
      const response = modalDoctor
        ? await api.put(`/doctors/${modalDoctor._id}`, payload)
        : await api.post('/doctors', payload);
      const savedDoctor = response.data?.data;

      if (modalDoctor) {
        setDoctors((current) => current.map((doctor) => doctor._id === savedDoctor._id ? savedDoctor : doctor));
        setSuccess('Doctor updated successfully.');
      } else {
        setDoctors((current) => [savedDoctor, ...current]);
        setSuccess('Doctor added successfully.');
      }

      setModalDoctor(undefined);
    } catch (requestError) {
      setFormError(getErrorMessage(requestError, 'Doctor could not be saved. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doctor) => {
    if (!window.confirm(`Delete Dr. ${doctor.name}'s record? This cannot be undone.`)) return;

    setDeletingId(doctor._id);
    setError('');

    try {
      await api.delete(`/doctors/${doctor._id}`);
      setDoctors((current) => current.filter((item) => item._id !== doctor._id));
      setSuccess('Doctor deleted successfully.');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Doctor could not be deleted. Please try again.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout activeItem="Doctors" title="Doctors">
      <div className="dashboard-content doctors-content">
        <section className="doctors-page-heading">
          <div><p className="section-label">Clinical team directory</p><h2>Doctors</h2><p>View and manage hospital doctor records and specialties.</p></div>
          {isAdmin && <button className="add-doctor-button" type="button" onClick={() => { setFormError(''); setModalDoctor(null); }}>+ Add Doctor</button>}
        </section>

        {success && <p className="doctors-feedback doctor-success-feedback" role="status">{success}</p>}
        {error && <div className="doctors-feedback doctor-error-feedback" role="alert"><span>{error}</span><button type="button" onClick={loadDoctors}>Try again</button></div>}

        <section className="doctors-card">
          <div className="doctors-toolbar">
            <label className="doctor-search-field"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, contact, specialty, or department" aria-label="Search doctors" /></label>
            <span className="doctors-count">{loading ? 'Loading…' : `${filteredDoctors.length} doctor${filteredDoctors.length === 1 ? '' : 's'}`}</span>
          </div>
          <DoctorTable doctors={filteredDoctors} loading={loading} isAdmin={isAdmin} onEdit={(doctor) => { setFormError(''); setModalDoctor(doctor); }} onDelete={handleDelete} deletingId={deletingId} />
        </section>
      </div>

      {isAdmin && modalDoctor !== undefined && <DoctorModal doctor={modalDoctor} onClose={closeModal} onSubmit={handleSave} saving={saving} error={formError} />}
    </DashboardLayout>
  );
}

export default DoctorsPage;
