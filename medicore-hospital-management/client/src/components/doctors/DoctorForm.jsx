import { useEffect, useState } from 'react';

const emptyDoctor = {
  name: '',
  phone: '',
  specialization: '',
  email: '',
  department: '',
  qualification: '',
  experience: '',
};

function DoctorForm({ doctor, onSubmit, saving, error }) {
  const [form, setForm] = useState(emptyDoctor);

  useEffect(() => {
    setForm(doctor ? { ...emptyDoctor, ...doctor, experience: doctor.experience ?? '' } : emptyDoctor);
  }, [doctor]);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form className="doctor-form" onSubmit={handleSubmit}>
      <div className="doctor-form-grid">
        <label>Name <span>*</span><input name="name" value={form.name} onChange={updateField} required /></label>
        <label>Phone <span>*</span><input name="phone" type="tel" value={form.phone} onChange={updateField} required /></label>
        <label>Specialization <span>*</span><input name="specialization" value={form.specialization} onChange={updateField} required /></label>
        <label>Email<input name="email" type="email" value={form.email} onChange={updateField} /></label>
        <label>Department<input name="department" value={form.department} onChange={updateField} /></label>
        <label>Qualification<input name="qualification" value={form.qualification} onChange={updateField} /></label>
        <label>Experience (years)<input name="experience" type="number" min="0" value={form.experience} onChange={updateField} /></label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="doctor-primary-action" type="submit" disabled={saving}>{saving ? 'Saving…' : doctor ? 'Update Doctor' : 'Add Doctor'}</button>
    </form>
  );
}

export default DoctorForm;
