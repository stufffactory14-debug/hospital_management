import PatientForm from './PatientForm';

function PatientModal({ patient, onClose, onSubmit, saving, error }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="patient-modal" role="dialog" aria-modal="true" aria-labelledby="patient-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="section-label">Patient record</p>
            <h2 id="patient-modal-title">{patient ? 'Edit Patient' : 'Add Patient'}</h2>
          </div>
          <button className="modal-close" type="button" aria-label="Close patient form" onClick={onClose}>×</button>
        </div>
        <PatientForm patient={patient} onSubmit={onSubmit} saving={saving} error={error} />
      </section>
    </div>
  );
}

export default PatientModal;
