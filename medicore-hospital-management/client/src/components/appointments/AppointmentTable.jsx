const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
};

function AppointmentTable({ appointments, loading, canEdit, canDelete, onEdit, onDelete, deletingId }) {
  if (loading) return <p className="appointments-state">Loading appointment records…</p>;
  if (!appointments.length) return <p className="appointments-state">No appointments match your search or filters.</p>;

  return (
    <div className="appointments-management-table-wrap">
      <table className="appointments-management-table">
        <thead><tr><th>Patient</th><th>Doctor</th><th>Date & Time</th><th>Reason</th><th>Status</th>{(canEdit || canDelete) && <th>Actions</th>}</tr></thead>
        <tbody>
          {appointments.map((appointment) => (
            <tr key={appointment._id}>
              <td><strong>{appointment.patientName}</strong></td>
              <td>{appointment.doctorName}</td>
              <td>{formatDateTime(appointment.dateTime)}</td>
              <td>{appointment.reason}</td>
              <td><span className={`appointment-status-pill status-${(appointment.status || 'unavailable').toLowerCase()}`}>{appointment.status || 'Unavailable'}</span></td>
              {(canEdit || canDelete) && <td className="appointment-actions">{canEdit && <button type="button" onClick={() => onEdit(appointment)}>Edit</button>}{canDelete && <button className="appointment-delete-action" type="button" disabled={deletingId === appointment._id} onClick={() => onDelete(appointment)}>{deletingId === appointment._id ? 'Deleting…' : 'Delete'}</button>}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AppointmentTable;
