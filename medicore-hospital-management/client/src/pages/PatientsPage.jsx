import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import PatientModal from '../components/patients/PatientModal';
import PatientTable from '../components/patients/PatientTable';
import api from '../lib/api';
import './PatientsPage.css';

const getErrorMessage = (error, fallback) => error.response?.data?.message || fallback;

const cleanPatientPayload = (patient) => Object.fromEntries(
  Object.entries(patient).filter(([, value]) => value !== '')
);

function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalPatient, setModalPatient] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/patients');
      setPatients(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Patient records could not be loaded. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return patients;

    return patients.filter((patient) => [patient.name, patient.phone, patient.email]
      .some((value) => value?.toLowerCase().includes(query)));
  }, [patients, search]);

  const closeModal = () => {
    if (!saving) {
      setModalPatient(undefined);
      setFormError('');
    }
  };

  const handleSave = async (form) => {
    if (!form.name.trim() || !form.phone.trim()) {
      setFormError('Name and phone are required.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const payload = cleanPatientPayload({ ...form, name: form.name.trim(), phone: form.phone.trim() });
      const response = modalPatient
        ? await api.put(`/patients/${modalPatient._id}`, payload)
        : await api.post('/patients', payload);
      const savedPatient = response.data?.data;

      if (modalPatient) {
        setPatients((current) => current.map((patient) => patient._id === savedPatient._id ? savedPatient : patient));
        setSuccess('Patient updated successfully.');
      } else {
        setPatients((current) => [savedPatient, ...current]);
        setSuccess('Patient added successfully.');
      }

      setModalPatient(undefined);
    } catch (requestError) {
      setFormError(getErrorMessage(requestError, 'Patient could not be saved. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (patient) => {
    if (!window.confirm(`Delete ${patient.name}'s patient record? This cannot be undone.`)) return;

    setDeletingId(patient._id);
    setError('');

    try {
      await api.delete(`/patients/${patient._id}`);
      setPatients((current) => current.filter((item) => item._id !== patient._id));
      setSuccess('Patient deleted successfully.');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Patient could not be deleted. Please try again.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout activeItem="Patients" title="Patients">
      <div className="dashboard-content patients-content">
        <section className="patients-page-heading">
          <div><p className="section-label">Patient directory</p><h2>Patients</h2><p>Manage patient records and contact details in one place.</p></div>
          <button className="add-patient-button" type="button" onClick={() => { setFormError(''); setModalPatient(null); }}>+ Add Patient</button>
        </section>

        {success && <p className="patients-feedback success-feedback" role="status">{success}</p>}
        {error && <div className="patients-feedback error-feedback" role="alert"><span>{error}</span><button type="button" onClick={loadPatients}>Try again</button></div>}

        <section className="patients-card">
          <div className="patients-toolbar">
            <label className="search-field"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, phone, or email" aria-label="Search patients" /></label>
            <span className="patients-count">{loading ? 'Loading…' : `${filteredPatients.length} patient${filteredPatients.length === 1 ? '' : 's'}`}</span>
          </div>
          <PatientTable patients={filteredPatients} loading={loading} onEdit={(patient) => { setFormError(''); setModalPatient(patient); }} onDelete={handleDelete} deletingId={deletingId} />
        </section>
      </div>

      {modalPatient !== undefined && <PatientModal patient={modalPatient} onClose={closeModal} onSubmit={handleSave} saving={saving} error={formError} />}
    </DashboardLayout>
  );
}

export default PatientsPage;
