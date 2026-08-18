function InvoiceLineItems({ items, onChange, error }) {
  const updateItem = (index, field, value) => onChange(items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  const addItem = () => onChange([...items, { description: '', quantity: '1', unitAmount: '' }]);
  const removeItem = (index) => onChange(items.filter((_, itemIndex) => itemIndex !== index));

  return (
    <section className="invoice-form-section">
      <div className="invoice-form-section-heading"><div><p className="section-label">Charges</p><h3>Line items</h3></div><button className="billing-add-item" type="button" onClick={addItem}>+ Add item</button></div>
      <div className="invoice-items-list">
        {items.map((item, index) => <div className="invoice-item-editor" key={`invoice-item-${index}`}>
          <div className="invoice-item-heading"><strong>Item {index + 1}</strong>{items.length > 1 && <button type="button" onClick={() => removeItem(index)}>Remove</button>}</div>
          <label>Description <span>*</span><input value={item.description} onChange={(event) => updateItem(index, 'description', event.target.value)} placeholder="Consultation, room charge, medication…" /></label>
          <label>Quantity <span>*</span><input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} /></label>
          <label>Unit amount <span>*</span><input type="number" min="0" step="0.01" value={item.unitAmount} onChange={(event) => updateItem(index, 'unitAmount', event.target.value)} placeholder="0.00" /></label>
          <strong className="invoice-item-amount">Amount: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((Number(item.quantity) || 0) * (Number(item.unitAmount) || 0))}</strong>
        </div>)}
      </div>
      {error && <p className="invoice-form-error" role="alert">{error}</p>}
    </section>
  );
}

export default InvoiceLineItems;
