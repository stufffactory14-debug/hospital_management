import { useEffect, useState } from 'react';

const statusOptions = ['scheduled', 'completed', 'cancelled'];

const getReferenceId = (reference) => {
  if (!reference) return '';
  return typeof reference === 'object' ? reference._id : reference;
};

const formatDateTimeInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const emptyAppointment = {
  patient: '',
  doctor: '',
  dateTime: '',
  reason: '',
  status: 'scheduled',
};

function AppointmentForm({ appointment, patients, doctors, optionsLoading, onSubmit, saving, error }) {
  const [form, setForm] = useState(emptyAppointment);
  const hasOptions = patients.length > 0 && doctors.length > 0;

  useEffect(() => {
    setForm(appointment
      ? {
        patient: getReferenceId(appointment.patient),
        doctor: getReferenceId(appointment.doctor),
        dateTime: formatDateTimeInput(appointment.dateTime),
        reason: appointment.reason || '',
        status: appointment.status || 'scheduled',
      }
      : emptyAppointment);
  }, [appointment]);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  return (
    <form className="appointment-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      {optionsLoading && <p className="appointment-form-state">Loading patients and doctors…</p>}
      {!optionsLoading && !hasOptions && <p className="appointment-form-state">A patient and a doctor must be available before an appointment can be created.</p>}
      <div className="appointment-form-grid">
        <label>Patient <span>*</span><select name="patient" value={form.patient} onChange={updateField} disabled={optionsLoading} required><option value="">Select patient</option>{patients.map((patient) => <option key={patient._id} value={patient._id}>{patient.name}</option>)}</select></label>
        <label>Doctor <span>*</span><select name="doctor" value={form.doctor} onChange={updateField} disabled={optionsLoading} required><option value="">Select doctor</option>{doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.name}{doctor.specialization ? ` — ${doctor.specialization}` : ''}</option>)}</select></label>
        <label>Date & Time <span>*</span><input name="dateTime" type="datetime-local" value={form.dateTime} onChange={updateField} required /></label>
        <label>Status<select name="status" value={form.status} onChange={updateField}>{statusOptions.map((status) => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}</select></label>
      </div>
      <label>Reason <span>*</span><textarea name="reason" rows="3" value={form.reason} onChange={updateField} required /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="appointment-primary-action" type="submit" disabled={saving || optionsLoading || !hasOptions}>{saving ? 'Saving…' : appointment ? 'Update Appointment' : 'Create Appointment'}</button>
    </form>
  );
}

export default AppointmentForm;
