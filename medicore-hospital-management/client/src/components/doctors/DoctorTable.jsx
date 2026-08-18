function DoctorTable({ doctors, loading, isAdmin, onEdit, onDelete, deletingId }) {
  if (loading) return <p className="doctors-state">Loading doctor records…</p>;
  if (!doctors.length) return <p className="doctors-state">No doctors match your search.</p>;

  return (
    <div className="doctors-table-wrap">
      <table className="doctors-table">
        <thead><tr><th>Name</th><th>Specialization</th><th>Department</th><th>Phone</th><th>Email</th><th>Qualification</th><th>Experience</th>{isAdmin && <th>Actions</th>}</tr></thead>
        <tbody>
          {doctors.map((doctor) => (
            <tr key={doctor._id}>
              <td><strong>{doctor.name}</strong></td>
              <td>{doctor.specialization}</td>
              <td>{doctor.department || '—'}</td>
              <td>{doctor.phone}</td>
              <td>{doctor.email || '—'}</td>
              <td>{doctor.qualification || '—'}</td>
              <td>{doctor.experience ?? '—'}</td>
              {isAdmin && <td className="doctor-actions"><button type="button" onClick={() => onEdit(doctor)}>Edit</button><button className="doctor-delete-action" type="button" disabled={deletingId === doctor._id} onClick={() => onDelete(doctor)}>{deletingId === doctor._id ? 'Deleting…' : 'Delete'}</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DoctorTable;
