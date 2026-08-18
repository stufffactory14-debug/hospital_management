const roleLabel = { admin: 'Admin', doctor: 'Doctor', receptionist: 'Receptionist' };
const formatDate = (value) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date); };

function UserTable({ users, loading, onEdit, onToggle, togglingId }) {
  if (loading) return <p className="users-state">Loading staff accounts…</p>;
  if (!users.length) return <p className="users-state">No users match the current filters.</p>;
  return <div className="users-table-wrap"><table className="users-table"><thead><tr><th>User</th><th>Role</th><th>Linked Doctor</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>{users.map((user) => <tr key={user.id || user._id}><td><strong>{user.name}</strong><small>{user.email}</small></td><td><span className={`user-role user-role-${user.role}`}>{roleLabel[user.role] || user.role}</span></td><td>{user.doctor ? <><strong>{user.doctor.name}</strong><small>{user.doctor.specialization || 'Specialization unavailable'}</small></> : user.role === 'doctor' ? <span className="user-unlinked">Doctor profile not linked</span> : <span className="user-muted">Not linked</span>}</td><td><span className={`user-status ${user.active === false ? 'user-status-inactive' : 'user-status-active'}`}>{user.active === false ? 'Inactive' : 'Active'}</span></td><td>{formatDate(user.createdAt)}</td><td><div className="user-actions"><button type="button" onClick={() => onEdit(user)}>Edit</button><button className={user.active === false ? 'user-activate' : 'user-deactivate'} type="button" disabled={togglingId === (user.id || user._id)} onClick={() => onToggle(user)}>{togglingId === (user.id || user._id) ? 'Saving…' : user.active === false ? 'Activate' : 'Deactivate'}</button></div></td></tr>)}</tbody></table></div>;
}

export default UserTable;
