import DoctorForm from './DoctorForm';

function DoctorModal({ doctor, onClose, onSubmit, saving, error }) {
  return (
    <div className="doctor-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="doctor-modal" role="dialog" aria-modal="true" aria-labelledby="doctor-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="doctor-modal-header">
          <div><p className="section-label">Doctor record</p><h2 id="doctor-modal-title">{doctor ? 'Edit Doctor' : 'Add Doctor'}</h2></div>
          <button className="doctor-modal-close" type="button" aria-label="Close doctor form" onClick={onClose}>×</button>
        </div>
        <DoctorForm doctor={doctor} onSubmit={onSubmit} saving={saving} error={error} />
      </section>
    </div>
  );
}

export default DoctorModal;
