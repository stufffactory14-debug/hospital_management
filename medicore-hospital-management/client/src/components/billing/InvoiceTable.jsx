function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function InvoiceTable({ invoices, loading, canEdit, canDelete, onView, onEdit, onDelete, editDisabled }) {
  if (loading) return <p className="billing-state">Loading invoices…</p>;
  if (!invoices.length) return <p className="billing-state">No invoices match the current search or filters.</p>;

  return (
    <div className="invoice-table-wrap">
      <table className="invoice-table">
        <thead><tr><th>Invoice #</th><th>Patient</th><th>Doctor</th><th>Appointment</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>{invoices.map((invoice) => {
          const balance = Math.max((Number(invoice.total) || 0) - (Number(invoice.paidAmount) || 0), 0);
          const status = invoice.paymentStatus || 'unpaid';
          return <tr key={invoice._id}>
            <td><button className="invoice-number" type="button" onClick={() => onView(invoice)}>{invoice.invoiceNumber || 'Unnumbered'}</button></td>
            <td><strong>{invoice.patient?.name || 'Unknown patient'}</strong><small>{invoice.patient?.phone || invoice.patient?.email || '—'}</small></td>
            <td>{invoice.doctor?.name || '—'}</td>
            <td>{invoice.appointment?.reason || '—'}</td>
            <td className="money-cell">{formatMoney(invoice.total)}</td><td className="money-cell">{formatMoney(invoice.paidAmount)}</td><td className="money-cell">{formatMoney(balance)}</td>
            <td><span className={`invoice-status invoice-status-${status}`}>{status}</span></td><td>{formatDate(invoice.createdAt)}</td>
            <td><div className="invoice-actions"><button type="button" onClick={() => onView(invoice)}>View</button>{canEdit && <button type="button" disabled={editDisabled} title={editDisabled ? 'Editing will be available in the next billing phase' : undefined} onClick={() => onEdit(invoice)}>Edit</button>}{canDelete && <button className="invoice-delete" type="button" onClick={() => onDelete(invoice)}>Delete</button>}</div></td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  );
}

export { formatMoney, formatDate };
export default InvoiceTable;
