function MedicationList({ medicines, onChange, disabled }) {
  const updateMedicine = (index, field, value) => onChange(medicines.map((medicine, currentIndex) => currentIndex === index ? { ...medicine, [field]: value } : medicine));
  const removeMedicine = (index) => medicines.length > 1 && onChange(medicines.filter((_, currentIndex) => currentIndex !== index));

  return (
    <section className="medication-section" aria-labelledby="medicines-title">
      <div className="clinical-section-heading"><div><p className="section-label">Medication plan</p><h3 id="medicines-title">Medicines</h3></div><button type="button" className="add-medicine-button" disabled={disabled} onClick={() => onChange([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }])}>+ Add medicine</button></div>
      <div className="medicine-rows">
        {medicines.map((medicine, index) => <article className="medicine-row" key={index}><div className="medicine-row-heading"><span>Medicine {index + 1}</span>{medicines.length > 1 && <button type="button" disabled={disabled} onClick={() => removeMedicine(index)} aria-label={`Remove medicine ${index + 1}`}>Remove</button>}</div><div className="medicine-grid"><label>Medicine name <b>*</b><input value={medicine.name} disabled={disabled} onChange={(event) => updateMedicine(index, 'name', event.target.value)} required /></label><label>Dosage <b>*</b><input value={medicine.dosage} disabled={disabled} onChange={(event) => updateMedicine(index, 'dosage', event.target.value)} required /></label><label>Frequency <b>*</b><input value={medicine.frequency} disabled={disabled} onChange={(event) => updateMedicine(index, 'frequency', event.target.value)} required /></label><label>Duration <b>*</b><input value={medicine.duration} disabled={disabled} onChange={(event) => updateMedicine(index, 'duration', event.target.value)} required /></label></div><label className="medicine-instructions">Instructions<textarea rows="2" value={medicine.instructions || ''} disabled={disabled} onChange={(event) => updateMedicine(index, 'instructions', event.target.value)} /></label></article>)}
      </div>
    </section>
  );
}

export default MedicationList;
