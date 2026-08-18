import AppointmentForm from './AppointmentForm';

function AppointmentModal({ appointment, patients, doctors, optionsLoading, onClose, onSubmit, saving, error }) {
  return (
    <div className="appointment-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="appointment-modal" role="dialog" aria-modal="true" aria-labelledby="appointment-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="appointment-modal-header">
          <div><p className="section-label">Appointment record</p><h2 id="appointment-modal-title">{appointment ? 'Edit Appointment' : 'Create Appointment'}</h2></div>
          <button className="appointment-modal-close" type="button" aria-label="Close appointment form" onClick={onClose}>×</button>
        </div>
        <AppointmentForm appointment={appointment} patients={patients} doctors={doctors} optionsLoading={optionsLoading} onSubmit={onSubmit} saving={saving} error={error} />
      </section>
    </div>
  );
}

export default AppointmentModal;
