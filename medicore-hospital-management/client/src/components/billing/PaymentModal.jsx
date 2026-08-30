import { useMemo, useState } from 'react';
import { formatMoney } from './InvoiceTable';
import './PaymentModal.css';

const methods = ['cash', 'card', 'online', 'bank_transfer', 'other'];

function PaymentModal({ invoice, onClose, onSubmit, saving, error }) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const balance = Math.max((Number(invoice.total) || 0) - (Number(invoice.paidAmount) || 0), 0);
  const amountNumber = Number(amount);
  const validAmount = Number.isFinite(amountNumber) && amountNumber > 0 && amountNumber <= balance;
  const validationMessage = useMemo(() => {
    if (!amount) return '';
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) return 'Enter a payment amount greater than zero.';
    if (amountNumber > balance) return 'Payment cannot exceed the remaining balance.';
    return '';
  }, [amount, amountNumber, balance]);
  const submit = (event) => {
    event.preventDefault();
    if (!validAmount) return;
    onSubmit({ invoice: invoice._id, amount: amountNumber, paymentMethod, reference: reference.trim() || undefined, notes: notes.trim() || undefined });
  };
  return <div className="billing-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
    <section className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
      <div className="invoice-drawer-header"><div><p className="section-label">Payment workspace</p><h2 id="payment-modal-title">Record payment</h2><p className="payment-invoice-reference">{invoice.invoiceNumber}</p></div><button className="billing-close" type="button" aria-label="Close payment form" onClick={onClose} disabled={saving}>×</button></div>
      <div className="payment-balance-card"><span>Remaining balance</span><strong>{formatMoney(balance)}</strong></div>
      <form className="payment-form" onSubmit={submit}>
        <label>Amount <span>*</span><input type="number" min="0.01" max={balance} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required autoFocus /></label>
        <label>Payment method <span>*</span><select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} required>{methods.map((method) => <option key={method} value={method}>{method.replace('_', ' ')}</option>)}</select></label>
        <label>Reference (optional)<input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Receipt or transaction reference" /></label>
        <label>Notes (optional)<textarea rows="3" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add a note for the payment record" /></label>
        {(validationMessage || error) && <p className="invoice-form-error" role="alert">{validationMessage || error}</p>}
        <div className="payment-form-actions"><button type="button" className="billing-secondary-action" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="billing-primary-action" disabled={saving || !validAmount}>{saving ? 'Recording…' : 'Record payment'}</button></div>
      </form>
    </section>
  </div>;
}

export default PaymentModal;
