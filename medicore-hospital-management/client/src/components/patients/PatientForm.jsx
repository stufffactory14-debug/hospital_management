import { useEffect, useState } from 'react';

const emptyPatient = {
  name: '',
  phone: '',
  email: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  address: '',
  emergencyContact: '',
  medicalHistory: '',
};

const getDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

function PatientForm({ patient, onSubmit, saving, error }) {
  const [form, setForm] = useState(emptyPatient);

  useEffect(() => {
    setForm(patient ? { ...emptyPatient, ...patient, dateOfBirth: getDateInputValue(patient.dateOfBirth) } : emptyPatient);
  }, [patient]);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="patient-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>Name <span>*</span><input name="name" value={form.name} onChange={updateField} required /></label>
        <label>Phone <span>*</span><input name="phone" type="tel" value={form.phone} onChange={updateField} required /></label>
        <label>Email<input name="email" type="email" value={form.email} onChange={updateField} /></label>
        <label>Date of Birth<input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateField} /></label>
        <label>Gender<select name="gender" value={form.gender} onChange={updateField}><option value="">Select gender</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></label>
        <label>Blood Group<select name="bloodGroup" value={form.bloodGroup} onChange={updateField}><option value="">Select blood group</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option></select></label>
        <label>Emergency Contact<input name="emergencyContact" type="tel" value={form.emergencyContact} onChange={updateField} /></label>
        <label>Address<input name="address" value={form.address} onChange={updateField} /></label>
      </div>
      <label>Medical History<textarea name="medicalHistory" rows="3" value={form.medicalHistory} onChange={updateField} /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-action" type="submit" disabled={saving}>{saving ? 'Saving…' : patient ? 'Update Patient' : 'Add Patient'}</button>
    </form>
  );
}

export default PatientForm;
