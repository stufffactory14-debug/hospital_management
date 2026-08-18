import InvoiceForm from './InvoiceForm';
import './InvoiceForm.css';

function InvoiceModal({ invoice, patients, doctors, appointments, onClose, onSubmit, saving, error }) {
  return <div className="billing-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}><section className="invoice-form-modal" role="dialog" aria-modal="true" aria-labelledby="invoice-form-title"><div className="invoice-drawer-header"><div><p className="section-label">Billing workspace</p><h2 id="invoice-form-title">{invoice ? 'Edit invoice' : 'Create invoice'}</h2></div><button className="billing-close" type="button" aria-label="Close invoice form" onClick={onClose} disabled={saving}>×</button></div><InvoiceForm invoice={invoice} patients={patients} doctors={doctors} appointments={appointments} onSubmit={onSubmit} saving={saving} error={error} /></section></div>;
}

export default InvoiceModal;
