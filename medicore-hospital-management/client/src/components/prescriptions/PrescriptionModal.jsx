import PrescriptionForm from './PrescriptionForm';

function PrescriptionModal(props) {
  const { prescription, onClose } = props;
  return <div className="prescription-modal-backdrop" role="presentation" onMouseDown={onClose}><section className="prescription-modal" role="dialog" aria-modal="true" aria-labelledby="prescription-modal-title" onMouseDown={(event) => event.stopPropagation()}><div className="prescription-modal-header"><div><p className="section-label">Clinical prescription</p><h2 id="prescription-modal-title">{prescription ? 'Edit Prescription' : 'Create Prescription'}</h2></div><button type="button" className="prescription-modal-close" aria-label="Close prescription form" onClick={onClose}>×</button></div><PrescriptionForm {...props} /></section></div>;
}

export default PrescriptionModal;
