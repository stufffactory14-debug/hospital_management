const formatDate = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date); };

function PrescriptionTable({ prescriptions, loading, canEdit, canDelete, onView, onEdit, onDelete, deletingId }) {
  if (loading) return <p className="prescriptions-state">Loading prescriptions…</p>;
  if (!prescriptions.length) return <p className="prescriptions-state">No prescriptions match your search or filters.</p>;
  return <div className="prescriptions-table-wrap"><table className="prescriptions-table"><thead><tr><th>Patient</th><th>Doctor</th><th>Appointment / Date</th><th>Diagnosis</th><th>Medicines</th><th>Created</th><th>Actions</th></tr></thead><tbody>{prescriptions.map((prescription) => <tr key={prescription._id}><td><strong>{prescription.patient?.name || 'Unknown patient'}</strong></td><td>{prescription.doctor?.name || 'Unknown doctor'}</td><td>{prescription.appointment ? formatDate(prescription.appointment.dateTime) : 'Not linked'}</td><td>{prescription.diagnosis || '—'}</td><td>{prescription.medicines.length}</td><td>{formatDate(prescription.createdAt)}</td><td className="prescription-actions"><button type="button" onClick={() => onView(prescription)}>View</button>{canEdit && <button type="button" onClick={() => onEdit(prescription)}>Edit</button>}{canDelete && <button className="prescription-delete-action" type="button" disabled={deletingId === prescription._id} onClick={() => onDelete(prescription)}>{deletingId === prescription._id ? 'Deleting…' : 'Delete'}</button>}</td></tr>)}</tbody></table></div>;
}

export default PrescriptionTable;
