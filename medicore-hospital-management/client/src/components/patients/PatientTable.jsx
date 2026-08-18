const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};

function PatientTable({ patients, loading, onEdit, onDelete, deletingId }) {
  if (loading) return <p className="patients-state">Loading patient records…</p>;
  if (!patients.length) return <p className="patients-state">No patients match your search.</p>;

  return (
    <div className="patients-table-wrap">
      <table className="patients-table">
        <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Gender</th><th>Blood Group</th><th>Date of Birth</th><th>Actions</th></tr></thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient._id}>
              <td><strong>{patient.name}</strong></td>
              <td>{patient.phone}</td>
              <td>{patient.email || '—'}</td>
              <td className="capitalize">{patient.gender || '—'}</td>
              <td>{patient.bloodGroup || '—'}</td>
              <td>{formatDate(patient.dateOfBirth)}</td>
              <td className="patient-actions">
                <button type="button" onClick={() => onEdit(patient)}>Edit</button>
                <button className="delete-action" type="button" disabled={deletingId === patient._id} onClick={() => onDelete(patient)}>{deletingId === patient._id ? 'Deleting…' : 'Delete'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PatientTable;
