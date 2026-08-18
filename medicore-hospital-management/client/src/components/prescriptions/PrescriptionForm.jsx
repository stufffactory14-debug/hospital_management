import { useEffect, useMemo, useState } from 'react';
import MedicationList from './MedicationList';

const blankMedicine = { name: '', dosage: '', frequency: '', duration: '', instructions: '' };
const referenceId = (reference) => typeof reference === 'object' ? reference?._id || '' : reference || '';
const defaultForm = { patient: '', doctor: '', appointment: '', diagnosis: '', notes: '', medicines: [blankMedicine] };

function PrescriptionForm({ prescription, patients, doctors, appointments, loadingOptions, onSubmit, saving, error }) {
  const [form, setForm] = useState(defaultForm);
  const hasOptions = patients.length > 0 && doctors.length > 0;

  useEffect(() => {
    setForm(prescription ? { patient: referenceId(prescription.patient), doctor: referenceId(prescription.doctor), appointment: referenceId(prescription.appointment), diagnosis: prescription.diagnosis || '', notes: prescription.notes || '', medicines: prescription.medicines?.length ? prescription.medicines : [blankMedicine] } : defaultForm);
  }, [prescription]);

  const availableAppointments = useMemo(() => appointments.filter((appointment) => {
    const patientMatch = !form.patient || referenceId(appointment.patient) === form.patient;
    const doctorMatch = !form.doctor || referenceId(appointment.doctor) === form.doctor;
    return patientMatch && doctorMatch;
  }), [appointments, form.patient, form.doctor]);

  const appointmentLabel = (appointment) => `${appointment.patientName} · ${appointment.doctorName} · ${appointment.dateTimeLabel}${appointment.reason ? ` · ${appointment.reason}` : ''}`;
  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  return <form className="prescription-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
    {loadingOptions && <p className="prescription-form-state">Loading clinical records…</p>}
    {!loadingOptions && !hasOptions && <p className="prescription-form-state">A patient and a doctor are required before a prescription can be created.</p>}
    <section className="clinical-form-section"><div className="clinical-section-heading"><div><p className="section-label">Care context</p><h3>Patient & Appointment</h3></div></div><div className="clinical-form-grid"><label>Patient <b>*</b><select name="patient" value={form.patient} onChange={updateField} disabled={loadingOptions} required><option value="">Select patient</option>{patients.map((patient) => <option key={patient._id} value={patient._id}>{patient.name}{patient.phone ? ` — ${patient.phone}` : ''}</option>)}</select></label><label>Doctor <b>*</b><select name="doctor" value={form.doctor} onChange={updateField} disabled={loadingOptions} required><option value="">Select doctor</option>{doctors.map((doctor) => <option key={doctor._id} value={doctor._id}>{doctor.name}{doctor.specialization ? ` — ${doctor.specialization}` : ''}</option>)}</select></label><label className="form-full">Linked appointment <select name="appointment" value={form.appointment} onChange={updateField} disabled={loadingOptions}><option value="">No linked appointment</option>{availableAppointments.map((appointment) => <option key={appointment._id} value={appointment._id}>{appointmentLabel(appointment)}</option>)}</select></label></div></section>
    <section className="clinical-form-section"><div className="clinical-section-heading"><div><p className="section-label">Clinical notes</p><h3>Clinical Information</h3></div></div><div className="clinical-form-grid"><label className="form-full">Diagnosis<input name="diagnosis" value={form.diagnosis} onChange={updateField} /></label><label className="form-full">Notes<textarea name="notes" rows="3" value={form.notes} onChange={updateField} /></label></div></section>
    <MedicationList medicines={form.medicines} onChange={(medicines) => setForm((current) => ({ ...current, medicines }))} disabled={saving} />
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="prescription-primary-action" type="submit" disabled={saving || loadingOptions || !hasOptions}>{saving ? 'Saving…' : prescription ? 'Update Prescription' : 'Create Prescription'}</button>
  </form>;
}

export default PrescriptionForm;
