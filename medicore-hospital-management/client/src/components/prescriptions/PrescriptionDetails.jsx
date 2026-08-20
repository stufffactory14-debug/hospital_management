const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unavailable' : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
};
const formatDateTime = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unavailable' : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
};

function PrescriptionDetails({ prescription, onClose }) {
  const { patient, doctor, appointment } = prescription;
  const medicines = Array.isArray(prescription.medicines) ? prescription.medicines : null;
  const hasDiagnosis = Object.hasOwn(prescription, 'diagnosis');
  const hasNotes = Object.hasOwn(prescription, 'notes');
  return <div className="prescription-details-backdrop" role="presentation" onMouseDown={onClose}><article className="prescription-details" role="dialog" aria-modal="true" aria-labelledby="prescription-document-title" onMouseDown={(event) => event.stopPropagation()}><header className="prescription-document-header"><div><p className="document-brand">MediCore</p><h2 id="prescription-document-title">Prescription</h2><small>Issued {formatDate(prescription.createdAt)}</small></div><div className="document-actions"><button type="button" onClick={() => window.print()}>Print Prescription</button><button type="button" className="prescription-modal-close" aria-label="Close prescription details" onClick={onClose}>×</button></div></header><div className="document-patient-grid"><section><p>Patient</p><b>{patient?.name || 'Unknown patient'}</b><small>{patient?.phone || 'Phone unavailable'}</small><small>{patient?.email || 'Email unavailable'}</small></section><section><p>Prescribing doctor</p><b>{doctor?.name || 'Unknown doctor'}</b><small>{doctor?.specialization || 'Specialization unavailable'}</small><small>{doctor?.email || 'Email unavailable'}</small></section></div>{appointment && <section className="document-appointment"><p>Linked appointment</p><b>{formatDateTime(appointment.dateTime)}</b><span>{appointment.reason || 'No appointment reason provided'}</span><em className={`appointment-status status-${appointment.status}`}>{appointment.status}</em></section>}{(hasDiagnosis || hasNotes) && <section className="document-clinical">{hasDiagnosis && <div><p>Diagnosis</p><b>{prescription.diagnosis || 'Not recorded'}</b></div>}{hasNotes && <div><p>Notes</p><span>{prescription.notes || 'No additional notes.'}</span></div>}</section>}<section><h3>Medication plan</h3>{medicines ? <div className="prescription-medicine-table"><div className="prescription-medicine-head"><span>Medicine</span><span>Dosage</span><span>Frequency</span><span>Duration</span><span>Instructions</span></div>{medicines.map((medicine, index) => <div className="prescription-medicine-row" key={`${medicine.name || 'medicine'}-${index}`}><b>{medicine.name}</b><span>{medicine.dosage}</span><span>{medicine.frequency}</span><span>{medicine.duration}</span><span>{medicine.instructions || '—'}</span></div>)}</div> : <p className="prescription-details-restricted">Medication details are not available for your role.</p>}</section></article></div>;
}

export default PrescriptionDetails;
